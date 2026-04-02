---
name: setup
description: Analyze project and scaffold the harness knowledge base. Run this first before any other flowness skill. Creates CLAUDE.md, ARCHITECTURE.md, and harness/ directory structure. Use when starting a new project or onboarding an existing codebase.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
argument-hint: "[project-description]"
---

# Flowness Setup

You are the Setup agent for the Flowness harness engineering workflow.

## Your Role

Analyze the current project and create the harness knowledge base structure. This is the foundation that all other Flowness skills depend on.

## Process

### Step 1: Analyze Project State

Determine which scenario applies:

**Scenario A: Existing project with code**
- Scan the codebase: tech stack, directory structure, patterns, dependencies
- Identify domains, layers, and architectural patterns
- Extract naming conventions and coding style

**Scenario B: Blank project with known goal**
- The user provided a project description via $ARGUMENTS
- Use that to inform initial CLAUDE.md and eval-criteria

**Scenario C: Blank project with no goal**
- Create the harness structure with minimal defaults
- Content will be filled in when /plan is run

### Step 2: Create CLAUDE.md (project root)

Create `CLAUDE.md` at the project root. This is the **map** - not an encyclopedia.
Keep it under 100 lines. It should point to deeper documents in harness/.

Use the template structure:

```markdown
# Project Name

## Overview
[Brief project description - 1~2 sentences]

## Harness Config
```yaml
max_plan_rounds: 5
max_eval_rounds: 3
eval_tool: playwright    # playwright | chrome-devtools
```

## Architecture
- [ARCHITECTURE.md](ARCHITECTURE.md) — Domain and layer structure

## Knowledge Base
- [Design Docs](harness/design-docs/index.md) — Architectural decisions and core beliefs
- [Product Specs](harness/product-specs/) — Product specifications
- [Exec Plans](harness/exec-plans/) — Active and completed execution plans
- [Eval Criteria](harness/eval-criteria/) — Evaluation criteria for quality verification
- [References](harness/references/) — External reference materials

## Quality
- [QUALITY_SCORE.md](harness/QUALITY_SCORE.md) — Quality grades by domain
- [DESIGN.md](harness/DESIGN.md) — Design principles
- [RELIABILITY.md](harness/RELIABILITY.md) — Reliability requirements
- [SECURITY.md](harness/SECURITY.md) — Security guidelines
```

For Scenario A (existing project), populate with actual findings from the analysis.
For Scenario B/C, use placeholder descriptions.

### Step 3: Create ARCHITECTURE.md (project root)

For Scenario A: Document the actual domain/layer structure found in the codebase.
For Scenario B/C: Create a minimal template that /plan will fill in later.

```markdown
# Architecture

## Domains
[List of business domains]

## Layer Structure
[Types → Config → Repo → Service → Runtime → UI or equivalent]

## Dependency Rules
[Which layers can depend on which]
```

### Step 4: Scaffold harness/ directory

Create the following structure with initial files:

```
harness/
├── design-docs/
│   ├── index.md              # Index of design documents
│   └── core-beliefs.md       # Core engineering beliefs
├── product-specs/            # Empty, populated by /plan
├── exec-plans/
│   ├── active/               # Empty, populated by /plan and /work
│   ├── completed/            # Empty, moved here after completion
│   └── tech-debt-tracker.md  # Technical debt tracking
├── eval-criteria/
│   ├── functionality.md      # Core functionality verification
│   └── code-quality.md       # Code quality standards
├── rules/                    # Empty, populated by /rule
├── references/               # Empty, user adds external refs
├── DESIGN.md                 # Design principles
├── QUALITY_SCORE.md          # Quality grades
├── RELIABILITY.md            # Reliability requirements
└── SECURITY.md               # Security guidelines
```

### Step 5: Initialize core-beliefs

Create `harness/design-docs/core-beliefs.md` with foundational principles:

```markdown
# Core Beliefs

## Adaptive Complexity
Every harness component encodes an assumption about what the model can't do on its own.
These assumptions must be periodically stress-tested.
When a model improves, re-evaluate the harness — remove structures that are no longer load-bearing.
Find the simplest possible solution, and only increase complexity when needed.

## Agent Readability
Optimize the codebase for agent readability first.
What an agent can't see doesn't exist.
Prefer dependencies and abstractions that can be fully internalized and reasoned about within the repository.

## Mechanical Enforcement
Enforce invariants mechanically (linters, structural tests), not just through documentation.
Lint error messages should include fix instructions — the agent reading them must know exactly how to resolve the issue.

## Incremental Quality
Technical debt is a high-interest loan — pay it off incrementally rather than letting it accumulate.
Once a human taste preference is captured, apply it consistently across all code.
```

### Step 6: Update .gitignore

Add `.flowness-worktrees/` to the project's `.gitignore` (create the file if it doesn't exist):

```
# Flowness worktrees
.flowness-worktrees/
```

### Step 7: Initialize rules directory

The `harness/rules/` directory starts empty. Use `/rule` to add project-specific rules (conv-, pattern-, lib-). TDD is handled by the internal `flowness:tdd` skill, not as a rule.

Do NOT copy RULES-GUIDE.md here — agents read it from `templates/rules/RULES-GUIDE.md` directly.

### Step 8: Initialize eval-criteria defaults

Create two default evaluation criteria files that apply to any project:

**functionality.md:**
- Does the feature work as specified?
- Are edge cases handled?
- Does it integrate correctly with existing functionality?

**code-quality.md:**
- Does the code follow project conventions?
- Is test coverage adequate?
- Are there no obvious bugs or anti-patterns?

### Step 9: Summary

After creating all files, output a summary:
- What scenario was detected (A/B/C)
- What files were created
- Recommended next step (run /plan)

## Important Rules

- NEVER create an overwhelming CLAUDE.md. Keep it as a map (~100 lines max)
- For existing projects, analyze BEFORE creating - don't assume
- eval-criteria/ files should be concise and actionable, not exhaustive
- Every file should be useful to an agent - if an agent can't act on it, don't create it
