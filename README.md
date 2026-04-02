# Flowness

Structured engineering workflow plugin for Claude Code. Guides development through **Setup > Plan > Work (Build-Eval) > Maintain** phases.

## Installation

**Prerequisite:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed and authenticated.

```bash
# 1. Add this repo as a marketplace
claude plugins marketplace add citruseason/flowness

# 2. Install the plugin
claude plugins install flowness
```

To verify, run `/setup` inside a Claude Code session — it should be recognized as a skill.

## Updating

```bash
# 1. Refresh marketplace metadata
claude plugins marketplace update flowness

# 2. Update the installed plugin
claude plugins update flowness@flowness
```

## Skills (Slash Commands)

| Command | Description |
|---------|-------------|
| `/setup [project-description]` | Analyze project and scaffold the harness knowledge base (`CLAUDE.md`, `ARCHITECTURE.md`, `harness/`) |
| `/plan <feature-description>` | Collaboratively brainstorm requirements, then expand into a full product spec with topic code and execution plan |
| `/work <topic-code>` | Execute the Build loop — creates a git worktree, spawns Generator with parallel sub-tasks, multi-perspective Reviewers, and Evaluator |
| `/maintain [lint\|doc-garden\|gc\|all]` | Run linters, doc-gardening, and garbage collection on the harness and codebase |
| `/rule <rule-description>` | Add or update rules in `harness/rules/` |

## Agents

| Agent | Role |
|-------|------|
| Planner | Generates product spec and execution plan |
| Plan Reviewer | Reviews and refines plans for completeness (8 criteria) |
| Codex Plan Reviewer | Technical feasibility review via Codex — checks implementability, hidden complexity, architectural alignment (requires Codex plugin) |
| Generator | Implements features following TDD with mandatory per-file rule compliance |
| Architecture Reviewer | Checks layer dependencies, design patterns, structural consistency |
| Security Reviewer | Detects injection risks, sensitive data exposure, unsafe patterns |
| Performance Reviewer | Detects N+1 queries, memory leaks, computational inefficiencies |
| Quality Reviewer | Detects code smells, readability issues, error handling gaps |
| Rule Reviewer | Checks code against `harness/rules/` for pattern violations |
| Evaluator | Tests the running application and decides pass/fail |
| Rule Writer | Creates and updates rule definitions |
| Librarian | Researches libraries and manages documentation |
| Explorer | Analyzes and explores codebase structure |

## Workflow

```
/setup  →  /plan  →  /work  →  /maintain
  ↑          |          |          |
  |    Brainstorm    Worktree      |
  |    + Review    + Parallel      |
  |                  Sub-tasks     |
  |              Build-Eval Loop   |
  |              (TDD + Review)    |
  +--------------------------------+
```

1. **Setup** — Scaffold the knowledge base and initialize `.gitignore` for worktrees
2. **Plan** — Brainstorm requirements interactively, then produce a validated spec (+ optional Codex technical review)
3. **Work** — Implement in an isolated git worktree; topic is split into parallel sub-tasks when possible; Generator enforces rules file-by-file
4. **Maintain** — Keep the codebase and documentation healthy

## Key Design Decisions

### Git Worktrees for Isolation

`/work` creates an isolated worktree at `.flowness-worktrees/{topic-code}` on branch `topic/{topic-code}`. The main working directory is never touched during a build. After the build passes, open a PR from the branch and run `git worktree remove` to clean up.

### Parallel Sub-tasks

The orchestrator analyzes the build contract and splits work into sub-tasks with **non-overlapping file ownership**. Each sub-task gets its own worktree and Generator instance running in parallel. Merge is conflict-free by design. Round 2+ always uses a single Generator for focused fixes.

### Topic Codes

Topics are identified by timestamp-based codes (`H20260402143022`) to avoid collisions in parallel team development.

### Rule Compliance

The Generator builds a **Rule Cheatsheet** before coding and performs a per-file rule declaration + self-check for every file it touches. Pre-existing violations can be listed in the build contract as exceptions so they don't block progress.

## License

MIT
