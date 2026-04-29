#!/usr/bin/env node
// Codex CLI wrapper for design-doc technical reviews.
// Calls `codex exec` non-interactively with read-only sandbox.
//
// Usage:
//   node scripts/codex-review.mjs --prompt "Review this..." --cwd /path/to/project
//   node scripts/codex-review.mjs --prompt-file /tmp/prompt.txt --cwd /path/to/project
//   node scripts/codex-review.mjs --prompt-file /tmp/prompt.txt --cwd /path/to/project --output /tmp/result.md
//   echo "Review this..." | node scripts/codex-review.mjs --cwd /path/to/project
//
// Options:
//   --prompt <text>      Inline prompt text
//   --prompt-file <path> Read prompt from file
//   --cwd <dir>          Working directory for codex (default: cwd)
//   --output <path>      Write codex last message to this file (also printed to stdout)
//   --model <model>      Model override (default: codex CLI default)
//   --timeout <ms>       Timeout in milliseconds (default: 300000 = 5min)
//   --json               Output structured JSON instead of plain text
//
// Exit codes:
//   0  success
//   1  codex not found or prompt missing
//   2  codex execution failed
//   3  timeout

import { execFile } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const opts = { timeout: 300_000 };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--prompt":
        opts.prompt = argv[++i];
        break;
      case "--prompt-file":
        opts.promptFile = argv[++i];
        break;
      case "--cwd":
        opts.cwd = argv[++i];
        break;
      case "--output":
        opts.output = argv[++i];
        break;
      case "--model":
        opts.model = argv[++i];
        break;
      case "--timeout":
        opts.timeout = Number(argv[++i]);
        break;
      case "--json":
        opts.json = true;
        break;
      default:
        break;
    }
  }
  return opts;
}

// ---------------------------------------------------------------------------
// Resolve prompt
// ---------------------------------------------------------------------------
function resolvePrompt(opts) {
  if (opts.prompt) return opts.prompt;
  if (opts.promptFile) return readFileSync(opts.promptFile, "utf-8");
  // try stdin (non-TTY only)
  if (!process.stdin.isTTY) {
    return readFileSync(0, "utf-8");
  }
  return null;
}

// ---------------------------------------------------------------------------
// Find codex binary
// ---------------------------------------------------------------------------
function findCodex() {
  const candidates = [
    "/opt/homebrew/bin/codex",
    "/usr/local/bin/codex",
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  // fallback: hope it's on PATH
  return "codex";
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const prompt = resolvePrompt(opts);

  if (!prompt || prompt.trim().length === 0) {
    console.error("Error: no prompt provided. Use --prompt, --prompt-file, or pipe to stdin.");
    process.exit(1);
  }

  const codexBin = findCodex();

  // Build args for `codex exec`
  const tmpOut = join(tmpdir(), `codex-review-${randomUUID()}.md`);
  const args = [
    "exec",
    "--sandbox", "read-only",
    "-o", tmpOut,
  ];
  if (opts.cwd) {
    args.push("-C", opts.cwd);
  }
  if (opts.model) {
    args.push("-m", opts.model);
  }
  // Pass prompt via stdin for safety (avoids shell escaping issues)
  args.push("-"); // read prompt from stdin

  const result = await new Promise((resolve) => {
    const child = execFile(codexBin, args, {
      timeout: opts.timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      cwd: opts.cwd || process.cwd(),
      env: { ...process.env },
    }, (error, stdout, stderr) => {
      resolve({ error, stdout, stderr });
    });

    // Write prompt to stdin
    child.stdin.write(prompt);
    child.stdin.end();
  });

  // Read output
  let lastMessage = "";
  if (existsSync(tmpOut)) {
    lastMessage = readFileSync(tmpOut, "utf-8");
    unlinkSync(tmpOut);
  }

  if (result.error) {
    if (result.error.killed) {
      // timeout
      if (opts.json) {
        console.log(JSON.stringify({
          ok: false,
          error: "timeout",
          message: `Codex timed out after ${opts.timeout}ms`,
          stdout: result.stdout?.slice(0, 2000) || "",
          stderr: result.stderr?.slice(0, 2000) || "",
        }));
      } else {
        console.error(`Error: Codex timed out after ${opts.timeout}ms`);
        if (result.stderr) console.error(result.stderr.slice(0, 2000));
      }
      process.exit(3);
    }

    if (opts.json) {
      console.log(JSON.stringify({
        ok: false,
        error: "exec_failed",
        message: result.error.message,
        exitCode: result.error.code,
        stdout: result.stdout?.slice(0, 2000) || "",
        stderr: result.stderr?.slice(0, 2000) || "",
        lastMessage,
      }));
    } else {
      console.error(`Error: Codex failed — ${result.error.message}`);
      if (result.stderr) console.error(result.stderr.slice(0, 2000));
      // Still output lastMessage if available (partial result)
      if (lastMessage) {
        console.log(lastMessage);
      }
    }
    process.exit(2);
  }

  // Success
  if (opts.output) {
    writeFileSync(opts.output, lastMessage, "utf-8");
  }

  if (opts.json) {
    console.log(JSON.stringify({
      ok: true,
      message: lastMessage,
    }));
  } else {
    console.log(lastMessage);
  }
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
