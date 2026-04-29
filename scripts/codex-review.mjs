#!/usr/bin/env node
// Codex CLI wrapper for design-doc technical reviews.
// Calls `codex exec` non-interactively with read-only sandbox.
//
// Usage:
//   node scripts/codex-review.mjs --prompt "Review this..." --cwd /path/to/project
//   node scripts/codex-review.mjs --prompt-file /tmp/prompt.txt --cwd /path/to/project
//   node scripts/codex-review.mjs --prompt-file /tmp/prompt.txt --cwd /path/to/project --output /tmp/result.md
//   echo "Review this..." | node scripts/codex-review.mjs --cwd /path/to/project
//   node scripts/codex-review.mjs --check            # login/readiness preflight only
//
// Options:
//   --prompt <text>      Inline prompt text
//   --prompt-file <path> Read prompt from file
//   --cwd <dir>          Working directory for codex (default: cwd)
//   --output <path>      Write codex last message to this file (also printed to stdout)
//   --model <model>      Model override (default: codex CLI default)
//   --timeout <ms>       Timeout in milliseconds (default: 300000 = 5min)
//   --json               Output structured JSON instead of plain text
//   --check              Preflight only: verify codex binary + login. Exit 0 if ready.
//   --retries <N>        Retry on empty response (default: 1, i.e. one retry)
//
// Exit codes:
//   0  success (or --check passed)
//   1  codex not found, not logged in, or prompt missing
//   2  codex execution failed
//   3  timeout
//   4  empty response after retries exhausted

import { execFile, execSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

// ---------------------------------------------------------------------------
// Arg parsing
// ---------------------------------------------------------------------------
function parseArgs(argv) {
  const opts = { timeout: 300_000, retries: 1 };
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
      case "--retries":
        opts.retries = Number(argv[++i]);
        break;
      case "--json":
        opts.json = true;
        break;
      case "--check":
        opts.check = true;
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
// Preflight: binary exists + logged in
// ---------------------------------------------------------------------------
function preflight(codexBin, jsonMode) {
  // 1) binary reachable?
  try {
    execSync(`"${codexBin}" --version 2>&1`, { timeout: 10_000 });
  } catch {
    const msg = `Codex binary not found or not executable: ${codexBin}`;
    if (jsonMode) {
      console.log(JSON.stringify({ ok: false, error: "not_found", message: msg }));
    } else {
      console.error(`Error: ${msg}`);
    }
    process.exit(1);
  }

  // 2) logged in?
  // `codex login status` writes to stderr, so we merge stdout+stderr with 2>&1.
  let statusOut = "";
  let statusExit = 0;
  try {
    statusOut = execSync(`"${codexBin}" login status 2>&1`, {
      timeout: 15_000,
    }).toString().trim();
  } catch (err) {
    statusExit = err.status ?? 1;
    statusOut = (err.stdout?.toString() || "").trim() + " " + (err.stderr?.toString() || "").trim();
    statusOut = statusOut.trim();
  }

  const loggedIn = statusExit === 0 && /logged in/i.test(statusOut);
  if (!loggedIn) {
    const detail = statusOut || `(exit code ${statusExit})`;
    const msg = `Codex is not logged in. Run \`codex login\` first. Status: ${detail}`;
    if (jsonMode) {
      console.log(JSON.stringify({ ok: false, error: "not_logged_in", message: msg }));
    } else {
      console.error(`Error: ${msg}`);
    }
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Run codex exec once, return { error, stdout, stderr, lastMessage }
// ---------------------------------------------------------------------------
function runCodexExec(codexBin, prompt, opts) {
  const tmpOut = join(tmpdir(), `codex-review-${randomUUID()}.md`);
  const args = [
    "exec",
    "--sandbox", "read-only",
    "--ephemeral",
    "-o", tmpOut,
  ];
  if (opts.cwd) {
    args.push("-C", opts.cwd);
  }
  if (opts.model) {
    args.push("-m", opts.model);
  }
  args.push("-"); // read prompt from stdin

  return new Promise((resolve) => {
    const child = execFile(codexBin, args, {
      timeout: opts.timeout,
      maxBuffer: 10 * 1024 * 1024, // 10MB
      cwd: opts.cwd || process.cwd(),
      env: { ...process.env },
    }, (error, stdout, stderr) => {
      let lastMessage = "";
      if (existsSync(tmpOut)) {
        lastMessage = readFileSync(tmpOut, "utf-8");
        unlinkSync(tmpOut);
      }
      resolve({ error, stdout, stderr, lastMessage });
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const codexBin = findCodex();

  // Preflight: always verify binary + login
  preflight(codexBin, opts.json);

  // --check mode: preflight passed, exit 0
  if (opts.check) {
    if (opts.json) {
      console.log(JSON.stringify({ ok: true, message: "Codex is ready" }));
    } else {
      console.log("Codex is ready.");
    }
    process.exit(0);
  }

  // Resolve prompt
  const prompt = resolvePrompt(opts);
  if (!prompt || prompt.trim().length === 0) {
    const msg = "No prompt provided. Use --prompt, --prompt-file, or pipe to stdin.";
    if (opts.json) {
      console.log(JSON.stringify({ ok: false, error: "no_prompt", message: msg }));
    } else {
      console.error(`Error: ${msg}`);
    }
    process.exit(1);
  }

  // Execute with retry on empty response
  const maxAttempts = 1 + Math.max(0, opts.retries);
  let lastResult = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1) {
      const label = `(attempt ${attempt}/${maxAttempts})`;
      if (!opts.json) {
        console.error(`Warning: empty response from Codex, retrying... ${label}`);
      }
    }

    const result = await runCodexExec(codexBin, prompt, opts);
    lastResult = result;

    // Handle hard errors (timeout, exec failure)
    if (result.error) {
      if (result.error.killed) {
        if (opts.json) {
          console.log(JSON.stringify({
            ok: false,
            error: "timeout",
            message: `Codex timed out after ${opts.timeout}ms`,
            attempt,
            stdout: result.stdout?.slice(0, 2000) || "",
            stderr: result.stderr?.slice(0, 2000) || "",
          }));
        } else {
          console.error(`Error: Codex timed out after ${opts.timeout}ms (attempt ${attempt})`);
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
          attempt,
          stdout: result.stdout?.slice(0, 2000) || "",
          stderr: result.stderr?.slice(0, 2000) || "",
          lastMessage: result.lastMessage,
        }));
      } else {
        console.error(`Error: Codex failed — ${result.error.message} (attempt ${attempt})`);
        if (result.stderr) console.error(result.stderr.slice(0, 2000));
        if (result.lastMessage) console.log(result.lastMessage);
      }
      process.exit(2);
    }

    // Check for empty response
    if (result.lastMessage && result.lastMessage.trim().length > 0) {
      // Success — got a non-empty response
      if (opts.output) {
        writeFileSync(opts.output, result.lastMessage, "utf-8");
      }

      if (opts.json) {
        console.log(JSON.stringify({
          ok: true,
          message: result.lastMessage,
          attempt,
        }));
      } else {
        console.log(result.lastMessage);
      }
      return; // exit 0
    }

    // Empty response — retry if attempts remain
  }

  // All attempts exhausted with empty response
  if (opts.json) {
    console.log(JSON.stringify({
      ok: false,
      error: "empty_response",
      message: `Codex returned empty response after ${maxAttempts} attempt(s)`,
      stdout: lastResult?.stdout?.slice(0, 2000) || "",
      stderr: lastResult?.stderr?.slice(0, 2000) || "",
    }));
  } else {
    console.error(`Error: Codex returned empty response after ${maxAttempts} attempt(s)`);
    if (lastResult?.stderr) console.error(lastResult.stderr.slice(0, 2000));
  }
  process.exit(4);
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
