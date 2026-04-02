---
name: work
description: Execute the Build loop for a topic. Spawns Generator, multi-perspective Reviewers, and Evaluator subagents that communicate via files. Run after /plan. Use when ready to implement a planned feature.
description-ko: 토픽에 대한 빌드 루프를 실행합니다. Generator, 다중 관점 Reviewer, Evaluator 서브에이전트를 생성하여 파일을 통해 소통합니다. /plan 이후에 실행합니다. 계획된 기능을 구현할 준비가 되었을 때 사용합니다.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Skill, TaskCreate, TaskUpdate, TaskList
argument-hint: "<topic-code>"
---

# Flowness 작업

당신은 Flowness harness 엔지니어링 워크플로우의 작업 오케스트레이터입니다.

## 역할

순수 **상태 머신**: 작업을 관리하고, 각 단계에 대해 내부 스킬을 호출하며, 루프 결정을 내립니다. 코드를 직접 작성, 리뷰 또는 평가하지 않습니다 — 각 단계는 전용 내부 스킬에 위임됩니다.

## 자동 진행 규칙

**모든 단계를 중단 없이 자동으로 실행합니다.**

- 단계 사이에 사용자의 확인이나 입력을 **절대** 기다리지 마세요
- 각 단계 완료 후 즉시 다음 단계로 진행하세요
- 중간 진행 상황은 Task 도구를 통해서만 표시합니다 — 텍스트 출력으로 보고하지 마세요
- 사용자에게 텍스트를 출력하는 시점은 **오직**: 최종 성공 보고(6단계), 에스컬레이션(7단계), 또는 복구 불가능한 오류 발생 시뿐입니다
- 내부 스킬 호출 전후로 설명이나 요약을 출력하지 마세요
- 한 단계의 Skill 호출이 결과를 반환하면 즉시 결과를 파싱하고 다음 단계의 Skill을 호출하세요

## 내부 스킬

| 단계 | 스킬 | 호출 방법 |
|------|------|----------|
| 워크트리 | `flowness:internal-worktree` | `setup`, `create-subtask`, `merge-subtasks`, `cleanup-subtask` |
| 생성 | `flowness:internal-generate` | Generator를 생성하고 `build-result-r{N}.md`를 출력 |
| 리뷰 | `flowness:internal-review` | 5개 Reviewer를 생성하고 `code-review-r{N}.md`를 출력 |
| 평가 | `flowness:internal-evaluate` | Evaluator를 생성하고 `eval-result-r{N}.md`를 출력 |

## 작업 추적

### 규칙

- **작업 ID를 추적합니다** — 의존성과 내부 스킬에 전달하기 위해 필요합니다
- 시작 전에 `in_progress`로, 완료 시 `completed`로 표시합니다
- 스피너 텍스트에 `activeForm`을 사용합니다 (현재 진행형)
- 라운드 작업은 `R{N}:` 접두사를 사용합니다
- 서브에이전트 작업에는 `owner`를 서브에이전트 유형으로 설정합니다
- 라운드별 작업은 **각 라운드 시작 시** 생성합니다
- 작업이 건너뛰어지면 (예: 리뷰 FAIL 후 eval) 상태를 `deleted`로 설정합니다

### 라운드별 작업 구조

```
Phase tasks (created once):
  T-setup     Setup worktree and load context
  T-contract  Create build contract              [blockedBy: T-setup]
  T-subtasks  Plan sub-tasks                     [blockedBy: T-contract]

Round tasks (created per round):
  T-gen-N     R{N}: Generate code                [blockedBy: T-subtasks or T-eval-{N-1}]
  T-rule-N    R{N}: Rule review                  [blockedBy: T-gen-N]
  T-qual-N    R{N}: Quality review               [blockedBy: T-gen-N]
  T-sec-N     R{N}: Security review              [blockedBy: T-gen-N]
  T-perf-N    R{N}: Performance review           [blockedBy: T-gen-N]
  T-arch-N    R{N}: Architecture review          [blockedBy: T-gen-N]
  T-aggr-N    R{N}: Aggregate reviews            [blockedBy: T-rule-N,T-qual-N,T-sec-N,T-perf-N,T-arch-N]
  T-eval-N    R{N}: Evaluate                     [blockedBy: T-aggr-N]

Completion task:
  T-final     Finalize topic                     [blockedBy: last T-eval]
```

## 입력

토픽 코드: $ARGUMENTS (예: H20260402143022)

## 프로세스

### 0단계: 전제 조건 확인

프로젝트 루트에 CLAUDE.md가 존재하는지 확인합니다. 없으면 사용자에게 `/setup`을 먼저 실행하라고 안내합니다.

### 1단계: 워크트리 설정

```
TaskCreate: "Setup worktree and load context", activeForm="Setting up worktree" → T-setup
TaskUpdate: T-setup → in_progress
```

호출: `Skill: flowness:internal-worktree, args="setup {topic-code}"`

출력 `WORKTREE_PATH`를 캡처합니다. 이후 모든 경로는 이에 상대적입니다.

### 2단계: 컨텍스트 로드

1. `{WORKTREE_PATH}/CLAUDE.md`를 읽습니다 — 프로젝트 설정 (max_eval_rounds, eval_tool)
2. `{WORKTREE_PATH}/harness/exec-plans/active/$ARGUMENTS_*/`를 Glob합니다 — 토픽 디렉토리 찾기
3. `plan-config.md`를 읽습니다 — 동적 설정 (eval_rounds, 복잡도)
4. `{WORKTREE_PATH}/harness/product-specs/`에서 제품 명세를 읽습니다
5. CLAUDE.md에서 eval-criteria/ 파일을 읽습니다
6. plan-config.md에서 적용 가능한 규칙을 식별합니다

토픽 디렉토리를 찾을 수 없으면 사용자에게 `/plan`을 먼저 실행하라고 안내합니다.

```
TaskUpdate: T-setup → completed
```

### 3단계: 빌드 계약 생성

```
TaskCreate: "Create build contract", activeForm="Creating build contract", addBlockedBy=[T-setup] → T-contract
TaskUpdate: T-contract → in_progress
```

`{WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-contract.md`를 생성합니다:

```markdown
# Build Contract: {topic-name}

## Scope
[What will be built, derived from product-spec]

## Completion Criteria
- [ ] Criterion 1: ...

## Referenced Spec
- product-specs/{topic-name}.md

## Applicable Rules
- rules/{prefix}-{name}/

## Eval Criteria Files
- eval-criteria/functionality.md
- eval-criteria/code-quality.md

## Pre-existing Exceptions
[Known violations BEFORE this topic — reviewers treat as WARN only.]
```

```
TaskUpdate: T-contract → completed
```

### 4단계: 하위 작업 계획

```
TaskCreate: "Plan sub-tasks", activeForm="Planning sub-tasks", addBlockedBy=[T-contract] → T-subtasks
TaskUpdate: T-subtasks → in_progress
```

build-contract와 ARCHITECTURE.md를 분석합니다. **분할 규칙**: 각 파일은 최대 하나의 하위 작업에만 소유됩니다.

`{WORKTREE_PATH}/harness/exec-plans/active/{topic}/sub-tasks.md`를 생성합니다:

```markdown
# Sub-tasks: {topic-name}

## Strategy: parallel | single

## Sub-task 01: {name}
- Scope: [what to implement]
- Owns: [exclusive file list]
- Criteria: [criteria covered]
```

`single`이면 하위 작업 워크트리가 필요 없습니다.

```
TaskUpdate: T-subtasks → completed
```

### 5단계: 빌드 루프

최대 라운드 = min(plan-config eval_rounds, CLAUDE.md max_eval_rounds). 라운드 1부터 루프:

#### 라운드 N:

**5a. 라운드 작업 생성**

```
TaskCreate: "R{N}: Generate code", owner="generator",
            addBlockedBy=[T-subtasks](R1) or [T-eval-{N-1}|T-aggr-{N-1}](R2+) → T-gen-N
TaskCreate: "R{N}: Rule review", owner="rule-reviewer", addBlockedBy=[T-gen-N] → T-rule-N
TaskCreate: "R{N}: Quality review", owner="quality-reviewer", addBlockedBy=[T-gen-N] → T-qual-N
TaskCreate: "R{N}: Security review", owner="security-reviewer", addBlockedBy=[T-gen-N] → T-sec-N
TaskCreate: "R{N}: Performance review", owner="performance-reviewer", addBlockedBy=[T-gen-N] → T-perf-N
TaskCreate: "R{N}: Architecture review", owner="architecture-reviewer", addBlockedBy=[T-gen-N] → T-arch-N
TaskCreate: "R{N}: Aggregate reviews", addBlockedBy=[T-rule-N,T-qual-N,T-sec-N,T-perf-N,T-arch-N] → T-aggr-N
TaskCreate: "R{N}: Evaluate", owner="evaluator", addBlockedBy=[T-aggr-N] → T-eval-N
```

**5b. 생성**

병렬 전략이고 라운드 1인 경우:
- 각 하위 작업 NN에 대해: `Skill: flowness:internal-worktree, args="create-subtask {topic-code} {NN}"`

호출: `Skill: flowness:internal-generate, args="round={N} worktree={WORKTREE_PATH} topic={topic-dir} spec={spec-file} strategy={strategy} sub-tasks={NN-list} task-id={T-gen-N}"`

병렬 전략을 사용한 경우:
- `Skill: flowness:internal-worktree, args="merge-subtasks {topic-code} {NN-list}"`
- 각 NN에 대해: `Skill: flowness:internal-worktree, args="cleanup-subtask {topic-code} {NN}"`

**5c. 리뷰**

호출: `Skill: flowness:internal-review, args="round={N} worktree={WORKTREE_PATH} topic={topic-dir} task-ids={T-rule-N},{T-qual-N},{T-sec-N},{T-perf-N},{T-arch-N},{T-aggr-N}"`

**5d. 리뷰 결과 확인**

`code-review-r{N}.md`를 읽습니다:
- **FAIL** → `TaskUpdate: T-eval-N → deleted`, 다음 라운드 (5a로 이동)
- **PASS** → 계속 진행

**5e. 평가**

호출: `Skill: flowness:internal-evaluate, args="round={N} worktree={WORKTREE_PATH} topic={topic-dir} eval-tool={eval_tool} task-id={T-eval-N}"`

**5f. 평가 결과 확인**

`eval-result-r{N}.md`를 읽습니다:
- **PASS** → 6단계
- **FAIL** + 남은 라운드 있음 → 라운드 증가, 5a로 이동
- **FAIL** + 남은 라운드 없음 → 7단계

### 6단계: 성공

```
TaskCreate: "Finalize topic", activeForm="Finalizing topic" → T-final
TaskUpdate: T-final → in_progress
```

1. 토픽을 `active/`에서 `completed/`로 이동합니다
2. CLAUDE.md를 업데이트합니다: 토픽을 완료 토픽으로 이동
3. eval-result 요약을 출력합니다

```
TaskUpdate: T-final → completed
```

### 6a단계: 반성 (자동)

```
TaskCreate: "Reflect on topic learnings", activeForm="Reflecting on learnings" → T-reflect
TaskUpdate: T-reflect → in_progress
```

호출: `Skill: flowness:internal-reflect, args="worktree={WORKTREE_PATH} topic={topic-dir} task-id={T-reflect}"`

반성이 완료되면 결과 요약을 사용자에게 출력합니다.

```
TaskUpdate: T-reflect → completed
```

4. 사용자에게 안내합니다: 워크트리 경로, 브랜치 이름, 정리 명령어
5. `/maintain learn`을 제안하여 교차 토픽 학습을 실행합니다

### 7단계: 에스컬레이션

```
TaskCreate: "Escalate: human review needed", activeForm="Preparing escalation report" → T-escalate
TaskUpdate: T-escalate → in_progress
```

1. 최신 eval-result와 code-review를 출력합니다
2. 미해결 이슈를 나열합니다
3. 사용자에게 워크트리 위치를 안내합니다
4. 진행 방법을 질문합니다: 수동 수정 후 재실행, 현재 상태로 수용, 또는 포기

```
TaskUpdate: T-escalate → completed
```

## 중요 규칙

- **절대로** 코드를 직접 작성, 리뷰 또는 평가하지 마세요 — 내부 스킬을 통해 위임합니다
- 각 파이프라인 단계는 별도의 내부 스킬 호출로 실행됩니다
- 작업 ID를 전체적으로 추적합니다 — 상태 업데이트를 위해 내부 스킬에 전달합니다
- 가시성을 위해 각 라운드 시작 시 모든 라운드 작업을 미리 생성합니다
- 코드 리뷰가 FAIL이면 해당 라운드의 eval 작업을 삭제합니다
- CLAUDE.md의 max_eval_rounds를 절대적 상한으로 준수합니다
