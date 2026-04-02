---
name: setup
description: Analyze project and scaffold the harness knowledge base. Run this first before any other flowness skill. Creates CLAUDE.md, ARCHITECTURE.md, and harness/ directory structure. Use when starting a new project or onboarding an existing codebase.
description-ko: 프로젝트를 분석하고 harness 지식 베이스를 구축합니다. 다른 flowness 스킬보다 먼저 실행하세요. CLAUDE.md, ARCHITECTURE.md 및 harness/ 디렉토리 구조를 생성합니다. 새 프로젝트를 시작하거나 기존 코드베이스를 온보딩할 때 사용합니다.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
argument-hint: "[project-description]"
---

# Flowness 셋업

당신은 Flowness harness 엔지니어링 워크플로우의 셋업 에이전트입니다.

## 역할

현재 프로젝트를 분석하고 harness 지식 베이스 구조를 생성합니다. 이것은 다른 모든 Flowness 스킬이 의존하는 기반입니다.

## 프로세스

### 1단계: 프로젝트 상태 분석

어떤 시나리오에 해당하는지 판단합니다:

**시나리오 A: 코드가 있는 기존 프로젝트**
- 코드베이스를 스캔합니다: 기술 스택, 디렉토리 구조, 패턴, 의존성
- 도메인, 레이어 및 아키텍처 패턴을 식별합니다
- 네이밍 컨벤션과 코딩 스타일을 추출합니다

**시나리오 B: 목표가 있는 빈 프로젝트**
- 사용자가 $ARGUMENTS를 통해 프로젝트 설명을 제공했습니다
- 이를 사용하여 초기 CLAUDE.md와 eval-criteria를 구성합니다

**시나리오 C: 목표가 없는 빈 프로젝트**
- 최소 기본값으로 harness 구조를 생성합니다
- /plan 실행 시 내용이 채워집니다

### 2단계: CLAUDE.md 생성 (프로젝트 루트)

프로젝트 루트에 `CLAUDE.md`를 생성합니다. 이것은 **지도**이지 백과사전이 아닙니다.
100줄 이하로 유지하세요. harness/ 내의 상세 문서를 가리켜야 합니다.

다음 템플릿 구조를 사용합니다:

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

시나리오 A(기존 프로젝트)의 경우, 분석에서 발견한 실제 내용으로 채웁니다.
시나리오 B/C의 경우, 플레이스홀더 설명을 사용합니다.

### 3단계: ARCHITECTURE.md 생성 (프로젝트 루트)

시나리오 A의 경우: 코드베이스에서 발견한 실제 도메인/레이어 구조를 문서화합니다.
시나리오 B/C의 경우: /plan이 나중에 채울 최소 템플릿을 생성합니다.

```markdown
# Architecture

## Domains
[List of business domains]

## Layer Structure
[Types → Config → Repo → Service → Runtime → UI or equivalent]

## Dependency Rules
[Which layers can depend on which]
```

### 4단계: harness/ 디렉토리 스캐폴딩

다음 구조와 초기 파일을 생성합니다:

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
├── learning-log.md           # Learning history (append-only)
├── learning-history/         # Archived improvement proposals
├── DESIGN.md                 # Design principles
├── QUALITY_SCORE.md          # Quality grades
├── RELIABILITY.md            # Reliability requirements
└── SECURITY.md               # Security guidelines
```

### 4a단계: 학습 인프라 초기화

`harness/learning-log.md`를 생성합니다:

```markdown
# 학습 로그

자기 학습 시스템의 추가 전용 기록입니다. /work 완료 후 자동으로 업데이트됩니다.
```

`harness/learning-history/` 디렉토리를 생성합니다 (빈 디렉토리).

### 5단계: core-beliefs 초기화

다음의 기본 원칙으로 `harness/design-docs/core-beliefs.md`를 생성합니다:

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

### 6단계: .gitignore 업데이트

프로젝트의 `.gitignore`에 `.flowness-worktrees/`를 추가합니다 (파일이 없으면 생성합니다):

```
# Flowness worktrees
.flowness-worktrees/
```

### 7단계: rules 디렉토리 초기화

`harness/rules/` 디렉토리는 비어있는 상태로 시작합니다. `/rule`을 사용하여 프로젝트별 규칙(conv-, pattern-, lib-)을 추가하세요. TDD는 내부 `flowness:tdd` 스킬이 처리하며, 규칙으로 관리하지 않습니다.

여기에 RULES-GUIDE.md를 복사하지 마세요 — 에이전트는 `templates/rules/RULES-GUIDE.md`에서 직접 읽습니다.

### 8단계: eval-criteria 기본값 초기화

모든 프로젝트에 적용되는 두 개의 기본 평가 기준 파일을 생성합니다:

**functionality.md:**
- 기능이 명세대로 동작하는가?
- 엣지 케이스가 처리되었는가?
- 기존 기능과 올바르게 통합되는가?

**code-quality.md:**
- 코드가 프로젝트 컨벤션을 따르는가?
- 테스트 커버리지가 적절한가?
- 명백한 버그나 안티패턴이 없는가?

### 9단계: 요약

모든 파일을 생성한 후 요약을 출력합니다:
- 감지된 시나리오 (A/B/C)
- 생성된 파일 목록
- 권장 다음 단계 (/plan 실행)

## 중요 규칙

- 절대로 방대한 CLAUDE.md를 만들지 마세요. 지도 수준으로 유지합니다 (~100줄 이하)
- 기존 프로젝트의 경우, 생성하기 전에 먼저 분석하세요 — 가정하지 마세요
- eval-criteria/ 파일은 간결하고 실행 가능해야 하며, 모든 것을 나열하지 마세요
- 모든 파일은 에이전트에게 유용해야 합니다 — 에이전트가 활용할 수 없다면 만들지 마세요
