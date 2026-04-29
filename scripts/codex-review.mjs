#!/usr/bin/env node
// Codex CLI wrapper for design-doc technical reviews.
//
// Two modes:
//
//   1. Generic: --prompt/--prompt-file/stdin → codex exec → stdout/--output
//   2. Review:  --review → reads proposal+context, assembles prompt,
//               calls codex, writes r{N}-codex.md, returns verdict
//
// Usage:
//   node scripts/codex-review.mjs --check [--json]
//   node scripts/codex-review.mjs --prompt "..." [--output f] [--json]
//   node scripts/codex-review.mjs --review --topic-dir <dir> --decision <id> \
//     --round <N> --cycle <spec|plan> [--project-root <dir>] [--json]
//
// Exit codes: 0=ok, 1=not ready/bad args, 2=exec fail, 3=timeout, 4=empty response

import { execFile, execSync } from "node:child_process";
import {
  readFileSync, writeFileSync, mkdirSync, unlinkSync, existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

const DEFAULT_MODEL = "gpt-5.5";
const DEFAULT_REASONING_EFFORT = "high";

// ── Arg parsing ─────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const o = { timeout: 300_000, retries: 1 };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case "--prompt":       o.prompt = argv[++i]; break;
      case "--prompt-file":  o.promptFile = argv[++i]; break;
      case "--cwd":          o.cwd = argv[++i]; break;
      case "--output":       o.output = argv[++i]; break;
      case "--model":        o.model = argv[++i]; break;
      case "--timeout":      o.timeout = Number(argv[++i]); break;
      case "--retries":      o.retries = Number(argv[++i]); break;
      case "--json":         o.json = true; break;
      case "--check":        o.check = true; break;
      // Review mode
      case "--review":       o.review = true; break;
      case "--topic-dir":    o.topicDir = argv[++i]; break;
      case "--decision":     o.decision = argv[++i]; break;
      case "--round":        o.round = Number(argv[++i]); break;
      case "--cycle":        o.cycle = argv[++i]; break;
      case "--project-root": o.projectRoot = argv[++i]; break;
      default: break;
    }
  }
  return o;
}

// ── Resolve prompt (generic mode) ───────────────────────────────────────────

function resolvePrompt(opts) {
  if (opts.prompt) return opts.prompt;
  if (opts.promptFile) return readFileSync(opts.promptFile, "utf-8");
  if (!process.stdin.isTTY) return readFileSync(0, "utf-8");
  return null;
}

// ── Find codex binary ───────────────────────────────────────────────────────

function findCodex() {
  for (const p of ["/opt/homebrew/bin/codex", "/usr/local/bin/codex"]) {
    if (existsSync(p)) return p;
  }
  return "codex";
}

// ── Preflight: binary + login ───────────────────────────────────────────────

function preflight(codexBin, jsonMode) {
  try {
    execSync(`"${codexBin}" --version 2>&1`, { timeout: 10_000 });
  } catch {
    const msg = `Codex binary not found or not executable: ${codexBin}`;
    if (jsonMode) console.log(JSON.stringify({ ok: false, error: "not_found", message: msg }));
    else console.error(`Error: ${msg}`);
    process.exit(1);
  }

  let statusOut = "", statusExit = 0;
  try {
    statusOut = execSync(`"${codexBin}" login status 2>&1`, { timeout: 15_000 }).toString().trim();
  } catch (err) {
    statusExit = err.status ?? 1;
    statusOut = ((err.stdout?.toString() || "") + " " + (err.stderr?.toString() || "")).trim();
  }

  if (statusExit !== 0 || !/logged in/i.test(statusOut)) {
    const detail = statusOut || `(exit code ${statusExit})`;
    const msg = `Codex is not logged in. Run \`codex login\` first. Status: ${detail}`;
    if (jsonMode) console.log(JSON.stringify({ ok: false, error: "not_logged_in", message: msg }));
    else console.error(`Error: ${msg}`);
    process.exit(1);
  }
}

// ── Review mode: assemble prompt from topic files ───────────────────────────

function readSafe(filePath) {
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, "utf-8");
}

function validateReviewOpts(opts) {
  const missing = [];
  if (!opts.topicDir) missing.push("--topic-dir");
  if (!opts.decision) missing.push("--decision");
  if (!opts.round) missing.push("--round");
  if (!opts.cycle) missing.push("--cycle");
  if (missing.length > 0) {
    const msg = `Review mode requires: ${missing.join(", ")}`;
    if (opts.json) console.log(JSON.stringify({ ok: false, error: "bad_args", message: msg }));
    else console.error(`Error: ${msg}`);
    process.exit(1);
  }
  if (!["spec", "plan"].includes(opts.cycle)) {
    const msg = `--cycle must be "spec" or "plan", got "${opts.cycle}"`;
    if (opts.json) console.log(JSON.stringify({ ok: false, error: "bad_args", message: msg }));
    else console.error(`Error: ${msg}`);
    process.exit(1);
  }
}

function assembleReviewPrompt(opts) {
  const topicDir = resolve(opts.topicDir);
  const projectRoot = resolve(opts.projectRoot || process.cwd());
  const { decision, round, cycle } = opts;
  const reviewDir = join(topicDir, "reviews", cycle, decision);

  // Read proposal
  const proposalPath = join(reviewDir, `r${round}-proposal.md`);
  const proposal = readSafe(proposalPath);
  if (!proposal) {
    const msg = `Proposal not found: ${proposalPath}`;
    if (opts.json) console.log(JSON.stringify({ ok: false, error: "file_not_found", message: msg }));
    else console.error(`Error: ${msg}`);
    process.exit(1);
  }

  // If r2+, read base proposal (r1)
  let baseProposal = null;
  if (round > 1) {
    baseProposal = readSafe(join(reviewDir, "r1-proposal.md"));
  }

  // Read context files
  const arch = readSafe(join(projectRoot, "ARCHITECTURE.md")) || "(ARCHITECTURE.md not found)";
  const context = readSafe(join(topicDir, "context-pack.md")) || "(context-pack.md not found)";

  // Plan mode: also read spec.md
  let spec = null;
  if (cycle === "plan") {
    spec = readSafe(join(topicDir, "spec.md"));
  }

  if (cycle === "spec") {
    return buildSpecPrompt({ decision, round, arch, context, proposal, baseProposal });
  } else {
    return buildPlanPrompt({ decision, round, arch, context, spec, proposal, baseProposal });
  }
}

function buildSpecPrompt({ decision, round, arch, context, proposal, baseProposal }) {
  let prompt = `You are a technical feasibility reviewer. All content is inline — do NOT use tools or read files.

<context>
<file path="ARCHITECTURE.md">
${arch}
</file>
<file path="context-pack.md">
${context}
</file>
</context>
`;

  if (baseProposal) {
    prompt += `
<base-proposal decision="${decision}" round="1">
${baseProposal}
</base-proposal>
`;
  }

  prompt += `
<proposal decision="${decision}" round="${round}">
${proposal}
</proposal>

Review this ONE feature decision (${decision}) for technical feasibility.

Evaluate:
1. Technical feasibility — can this be built with the tech stack in ARCHITECTURE.md?
2. Hidden complexity — underestimated dependencies, edge cases, integrations?
3. Acceptance verifiability — can acceptance criteria be verified mechanically?
4. Architecture alignment — respects constraints in context-pack?

OUTPUT FORMAT (follow exactly):

---
decision: ${decision}
round: ${round}
kind: codex
author: design-doc-codex-reviewer
verdict: pass OR fail
---

# r${round} Codex review for ${decision}

## Verdict: PASS or FAIL

## Criterion assessments
1. Technical feasibility: PASS|FAIL — <1-2 sentences>
2. Hidden complexity: PASS|FAIL — <1-2 sentences>
3. Acceptance verifiability: PASS|FAIL — <1-2 sentences>
4. Architecture alignment: PASS|FAIL — <1-2 sentences>

## Blocking issues
- (list only if FAIL, otherwise "None")

## Suggestions
- (max 3, non-blocking only. Omit section entirely if none.)

IMPORTANT: Be concise. For PASS verdicts, keep each criterion to one sentence.`;

  return prompt;
}

function buildPlanPrompt({ decision, round, arch, context, spec, proposal, baseProposal }) {
  let prompt = `You are a technical feasibility reviewer. All content is inline — do NOT use tools or read files.

<context>
<file path="ARCHITECTURE.md">
${arch}
</file>
<file path="context-pack.md">
${context}
</file>
`;

  if (spec) {
    prompt += `<file path="spec.md">
${spec}
</file>
`;
  }

  prompt += `</context>
`;

  if (baseProposal) {
    prompt += `
<base-proposal decision="${decision}" round="1">
${baseProposal}
</base-proposal>
`;
  }

  prompt += `
<proposal decision="${decision}" round="${round}">
${proposal}
</proposal>

Review this ONE technical decision (${decision}) for feasibility.

Evaluate:
1. Technical feasibility — can this be realized with the tech stack?
2. Decision soundness — alternatives well-considered? Better option overlooked?
3. Hidden complexity — underestimated integration/operational cost?
4. Architectural alignment — respects ARCHITECTURE.md layer boundaries + dependency direction?
5. Spec alignment — supports the corresponding f-* decisions without contradiction?

OUTPUT FORMAT (follow exactly):

---
decision: ${decision}
round: ${round}
kind: codex
author: design-doc-codex-reviewer
verdict: pass OR fail
---

# r${round} Codex review for ${decision}

## Verdict: PASS or FAIL

## Criterion assessments
1. Technical feasibility: PASS|FAIL — <1-2 sentences>
2. Decision soundness: PASS|FAIL — <1-2 sentences>
3. Hidden complexity: PASS|FAIL — <1-2 sentences>
4. Architectural alignment: PASS|FAIL — <1-2 sentences>
5. Spec alignment: PASS|FAIL — <1-2 sentences>

## Blocking issues
- (list only if FAIL, otherwise "None")

## Suggestions
- (max 3, non-blocking only. Omit section entirely if none.)

IMPORTANT: Be concise. For PASS verdicts, keep each criterion to one sentence.`;

  return prompt;
}

// ── Verdict extraction ──────────────────────────────────────────────────────

function extractVerdict(content) {
  const h = content.match(/##\s*Verdict:\s*(PASS|FAIL)/i);
  if (h) return h[1].toUpperCase();
  const fm = content.match(/verdict:\s*(pass|fail)/i);
  if (fm) return fm[1].toUpperCase();
  return "UNKNOWN";
}

function ensureFrontmatter(content, opts) {
  if (content.trimStart().startsWith("---")) return content;
  const verdict = extractVerdict(content).toLowerCase();
  const fm = [
    "---",
    `decision: ${opts.decision}`,
    `round: ${opts.round}`,
    "kind: codex",
    "author: design-doc-codex-reviewer",
    `verdict: ${verdict === "unknown" ? "fail" : verdict}`,
    "---",
    "",
  ].join("\n");
  return fm + content;
}

// ── Run codex exec ──────────────────────────────────────────────────────────

function runCodexExec(codexBin, prompt, opts) {
  const tmpOut = join(tmpdir(), `codex-review-${randomUUID()}.md`);
  const args = [
    "exec",
    "--sandbox", "read-only",
    "--ephemeral",
    "-o", tmpOut,
  ];
  if (opts.cwd) args.push("-C", opts.cwd);

  // Model: explicit --model > DEFAULT_MODEL > codex CLI default
  const model = opts.model || DEFAULT_MODEL;
  if (model) args.push("-m", model);

  // Reasoning effort
  args.push("-c", `reasoning_effort=${DEFAULT_REASONING_EFFORT}`);

  args.push("-"); // read prompt from stdin

  return new Promise((resolve) => {
    const child = execFile(codexBin, args, {
      timeout: opts.timeout,
      maxBuffer: 10 * 1024 * 1024,
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

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const codexBin = findCodex();

  // Preflight
  preflight(codexBin, opts.json);

  if (opts.check) {
    if (opts.json) console.log(JSON.stringify({ ok: true, message: "Codex is ready" }));
    else console.log("Codex is ready.");
    process.exit(0);
  }

  // ── Review mode ─────────────────────────────────────────────────────────
  if (opts.review) {
    validateReviewOpts(opts);

    const topicDir = resolve(opts.topicDir);
    const reviewDir = join(topicDir, "reviews", opts.cycle, opts.decision);
    mkdirSync(reviewDir, { recursive: true });

    const outputPath = join(reviewDir, `r${opts.round}-codex.md`);
    opts.output = outputPath;

    // Set cwd to project root for codex
    if (opts.projectRoot) opts.cwd = resolve(opts.projectRoot);

    const prompt = assembleReviewPrompt(opts);
    return await execAndOutput(codexBin, prompt, opts);
  }

  // ── Generic mode ────────────────────────────────────────────────────────
  const prompt = resolvePrompt(opts);
  if (!prompt || prompt.trim().length === 0) {
    const msg = "No prompt provided. Use --prompt, --prompt-file, or pipe to stdin.";
    if (opts.json) console.log(JSON.stringify({ ok: false, error: "no_prompt", message: msg }));
    else console.error(`Error: ${msg}`);
    process.exit(1);
  }

  return await execAndOutput(codexBin, prompt, opts);
}

async function execAndOutput(codexBin, prompt, opts) {
  const maxAttempts = 1 + Math.max(0, opts.retries);

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (attempt > 1 && !opts.json) {
      console.error(`Warning: empty response, retrying... (${attempt}/${maxAttempts})`);
    }

    const result = await runCodexExec(codexBin, prompt, opts);

    // Hard error: timeout
    if (result.error?.killed) {
      if (opts.review) writeFailureReview(opts, "timeout", `Codex timed out after ${opts.timeout}ms`);
      if (opts.json) {
        console.log(JSON.stringify({
          ok: false, error: "timeout",
          message: `Codex timed out after ${opts.timeout}ms`,
          ...(opts.review && { verdict: "FAIL", output: opts.output }),
          attempt,
        }));
      } else {
        console.error(`Error: Codex timed out after ${opts.timeout}ms`);
      }
      process.exit(3);
    }

    // Hard error: exec failure
    if (result.error) {
      if (opts.review) writeFailureReview(opts, "exec_failed", result.error.message);
      if (opts.json) {
        console.log(JSON.stringify({
          ok: false, error: "exec_failed",
          message: result.error.message,
          ...(opts.review && { verdict: "FAIL", output: opts.output }),
          attempt,
        }));
      } else {
        console.error(`Error: Codex failed — ${result.error.message}`);
        if (result.stderr) console.error(result.stderr.slice(0, 2000));
      }
      process.exit(2);
    }

    // Got non-empty response → success
    if (result.lastMessage?.trim().length > 0) {
      let content = result.lastMessage;

      if (opts.review) {
        content = ensureFrontmatter(content, opts);
        writeFileSync(opts.output, content, "utf-8");
        const verdict = extractVerdict(content);
        if (opts.json) {
          console.log(JSON.stringify({ ok: true, verdict, output: opts.output, attempt }));
        } else {
          console.log(`${verdict} ${opts.output}`);
        }
      } else {
        if (opts.output) writeFileSync(opts.output, content, "utf-8");
        if (opts.json) {
          console.log(JSON.stringify({ ok: true, message: content, attempt }));
        } else {
          console.log(content);
        }
      }
      return; // exit 0
    }

    // Empty response → retry
  }

  // All attempts exhausted
  if (opts.review) writeFailureReview(opts, "empty_response", `Empty after ${maxAttempts} attempt(s)`);
  if (opts.json) {
    console.log(JSON.stringify({
      ok: false, error: "empty_response",
      message: `Codex returned empty response after ${maxAttempts} attempt(s)`,
      ...(opts.review && { verdict: "FAIL", output: opts.output }),
    }));
  } else {
    console.error(`Error: Codex returned empty response after ${maxAttempts} attempt(s)`);
  }
  process.exit(4);
}

// Write a failure review file so the review trail is preserved
function writeFailureReview(opts, errorType, reason) {
  if (!opts.output) return;
  const content = `---
decision: ${opts.decision}
round: ${opts.round}
kind: codex
author: design-doc-codex-reviewer
verdict: fail
---

# r${opts.round} Codex review for ${opts.decision}

## Verdict: FAIL

Reason: ${errorType} — ${reason}
`;
  try {
    writeFileSync(opts.output, content, "utf-8");
  } catch { /* best-effort */ }
}

main().catch((err) => {
  console.error(`Unexpected error: ${err.message}`);
  process.exit(1);
});
