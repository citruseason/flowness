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

### Required Plugin: superpowers

`/plan`의 브레인스토밍 단계에서 [superpowers](https://github.com/obra/superpowers) 플러그인의 `brainstorming` 스킬을 사용합니다.

```bash
claude plugins install obra/superpowers
```

### Optional Plugin: Codex

`/plan`의 리뷰 단계에서 Codex 기반 기술 타당성 리뷰를 추가로 수행할 수 있습니다. 없어도 동작하지만, 설치하면 Plan Reviewer와 병렬로 Codex 리뷰가 실행됩니다.

```bash
claude plugins install anthropic/codex
```

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
| `/plan <feature-description>` | Brainstorm, then produce validated plan document and product spec through dual write-review cycles |
| `/work <topic-code>` | Execute the Build loop — creates a git worktree, spawns Generator with parallel sub-tasks and multi-perspective Reviewers |
| `/evaluate <topic-code>` | Evaluate the latest build — spawns Evaluator agent to test application and grade against criteria |
| `/maintain [lint\|doc-garden\|gc\|all]` | Run linters, doc-gardening, and garbage collection on the harness and codebase |
| `/rule <rule-description>` | Add or update rules in `harness/rules/` (Vercel agent-skills pattern, auto-linked to `.claude/skills/`) |

## Agents

| Agent | Role |
|-------|------|
| Planner | Generates plan document (Plan mode) and product spec (Spec mode) |
| Plan Reviewer | Reviews plan documents (5 criteria) and product specs (8 criteria) |
| Codex Plan Reviewer | Technical feasibility review via Codex for both plan and spec documents (requires Codex plugin) |
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
/setup  →  /plan  →  /work  →  /evaluate  →  /maintain
  ↑          |          |          |              |
  |    Brainstorm    Worktree   Test app          |
  |    Plan Doc    + Parallel   + Grade           |
  |    + Review      Sub-tasks                    |
  |    Spec Doc    Build Loop                     |
  |    + Review    (TDD+Review)                   |
  +-----------------------------------------------+
```

1. **Setup** — Scaffold the knowledge base and initialize `.gitignore` for worktrees
2. **Plan** — Brainstorm → write & review plan document → write & review product spec (dual cycle)
3. **Work** — Implement in an isolated git worktree; Generator enforces rules file-by-file
4. **Evaluate** — Test the running application against eval criteria (standalone, run when ready)
5. **Maintain** — Keep the codebase and documentation healthy

## Plan Documents

`/plan`은 두 종류의 문서를 각각 독립된 **작성 → 리뷰** 사이클로 생성합니다:

### Plan Document (`plan-doc.md`)

**기술 계획서** — *어떻게* 접근할 것인가에 대한 기술적 결정을 담습니다.

| Section | Content |
|---------|---------|
| Approach | 구현 접근 방식 개요 |
| Architecture Decisions | 기술 결정 + 검토한 대안 + 선택 근거 |
| Component Boundaries | 관여하는 도메인/모듈과 각각의 책임 범위 |
| Dependencies & Integration | 기존 시스템과의 통합 지점, 새 의존성 |
| Risks & Mitigations | 기술적 리스크와 대응 방안 |
| Out of Scope | 이 계획에서 명시적으로 제외하는 것 |

**Review criteria (5):** 아키텍처 정합성, 기술 타당성, 경계 명확성, 리스크 식별, 범위 적정성

### Product Spec (`product-spec.md`)

**제품 명세서** — *무엇을* 만들 것인가에 대한 기능과 요구사항을 담습니다. 승인된 plan-doc을 기반으로 작성됩니다.

| Section | Content |
|---------|---------|
| Overview | 제품 설명, 목적, 대상 사용자 |
| Features | 기능별 상세 설명 + 사용자 스토리 + 데이터 모델 |
| Non-Goals | 명시적으로 범위에서 제외하는 것 |
| Success Criteria | Evaluator가 기계적으로 검증 가능한 성공 기준 |

**Review criteria (8):** 완전성, 측정 가능성, 구현 누출 없음, 야심찬 범위, 일관성, 명확성, Plan 정합성, 기능 완전성

## Key Design Decisions

### Git Worktrees for Isolation

`/work` creates an isolated worktree at `.flowness-worktrees/{topic-code}` on branch `topic/{topic-code}`. The main working directory is never touched during a build. After the build passes, open a PR from the branch and run `git worktree remove` to clean up.

### Parallel Sub-tasks

The orchestrator analyzes the build contract and splits work into sub-tasks with **non-overlapping file ownership**. Each sub-task gets its own worktree and Generator instance running in parallel. Merge is conflict-free by design. Round 2+ always uses a single Generator for focused fixes.

### Topic Codes

Topics are identified by timestamp-based codes (`H20260402143022`) to avoid collisions in parallel team development.

### Rule Skills (Vercel Agent-Skills Pattern)

Rules follow the [Vercel agent-skills](https://github.com/vercel-labs/agent-skills) pattern:

```
harness/rules/{prefix}-{name}/
├── SKILL.md              # Quick Reference index (no code)
└── rules/
    ├── _sections.md      # Category → priority metadata
    └── {cat}-{name}.md   # Individual rules with Incorrect/Correct examples
```

`/rule` creates a symlink in `.claude/skills/` so Claude Code auto-triggers rules based on their `description`. The Generator reads `SKILL.md` to identify applicable rules, then reads detail files from `rules/` for full patterns.

## License

MIT
