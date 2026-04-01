# Flowness

Structured engineering workflow plugin for Claude Code. Guides development through **Setup > Plan > Work (Build-Eval) > Maintain** phases.

## Installation

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI installed and authenticated

### Install the plugin

```bash
claude plugin add /path/to/flowness
```

Or, install directly from GitHub:

```bash
claude plugin add https://github.com/citruseason/flowness
```

### Verify installation

```bash
claude /setup --help
```

If the `/setup` skill is recognized, the plugin is active.

## Skills (Slash Commands)

| Command | Description |
|---------|-------------|
| `/setup [project-description]` | Analyze project and scaffold the harness knowledge base (`CLAUDE.md`, `ARCHITECTURE.md`, `harness/`) |
| `/plan <feature-description>` | Expand a short prompt into a full product specification with topic code and execution plan |
| `/work <topic-code>` | Execute the Build loop — spawns Generator, multi-perspective Reviewers, and Evaluator |
| `/maintain [lint\|doc-garden\|gc\|all]` | Run linters, doc-gardening, and garbage collection on the harness and codebase |
| `/rule <rule-description>` | Add or update rules in `harness/rules/` |

## Agents

| Agent | Role |
|-------|------|
| Planner | Generates product spec and execution plan |
| Plan Reviewer | Reviews and refines plans for completeness |
| Generator | Implements features following TDD (RED-GREEN-REFACTOR) |
| Architecture Reviewer | Checks layer dependencies, design patterns, structural consistency |
| Security Reviewer | Detects injection risks, sensitive data exposure, unsafe patterns |
| Performance Reviewer | Detects N+1 queries, memory leaks, computational inefficiencies |
| Quality Reviewer | Detects code smells, readability issues, error handling gaps |
| Rule Reviewer | Checks code against `harness/rules/` for pattern violations |
| Evaluator | Aggregates review results and decides pass/fail |
| Rule Writer | Creates and updates rule definitions |
| Librarian | Manages harness documentation |
| Explorer | Analyzes and explores codebase structure |

## Workflow

```
/setup  →  /plan  →  /work  →  /maintain
  ↑                     |          |
  |                     ↓          |
  |              Build-Eval Loop   |
  |              (TDD + Review)    |
  +--------------------------------+
```

1. **Setup** — Scaffold the knowledge base for your project
2. **Plan** — Turn a feature idea into a detailed spec and execution plan
3. **Work** — Implement via TDD with automated multi-perspective code review
4. **Maintain** — Keep the codebase and documentation healthy

## License

MIT
