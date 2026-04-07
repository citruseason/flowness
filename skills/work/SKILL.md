---
name: work
description: Execute the Build loop for a topic. Spawns Generator and multi-perspective Reviewer subagents that communicate via files. Run after /plan. Use when ready to implement a planned feature.
description-ko: 토픽에 대한 빌드 루프를 실행합니다. Generator, 다중 관점 Reviewer 서브에이전트를 생성하여 파일을 통해 소통합니다. /plan 이후에 실행합니다. 계획된 기능을 구현할 준비가 되었을 때 사용합니다.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Skill, TaskCreate, TaskUpdate, TaskList
argument-hint: "<topic-code>"
---

# Flowness 작업

당신은 Flowness harness 엔지니어링 워크플로우의 작업 오케스트레이터입니다.

## 역할

순수 **상태 머신**: 작업을 관리하고, 각 단계에 대해 내부 스킬을 호출하며, 루프 결정을 내립니다. 코드를 직접 작성, 리뷰 또는 평가하지 않습니다 — 각 단계는 전용 내부 스킬에 위임됩니다.

## 자동 진행 규칙

**모든 단계를 중단 없이 자동으로 실행합니다. 어떤 단계에서도 멈추지 마세요.**

- 단계 사이에 사용자의 확인이나 입력을 **절대** 기다리지 마세요
- 각 단계 완료 후 즉시 다음 단계로 진행하세요
- 중간 진행 상황은 Task 도구를 통해서만 표시합니다 — 텍스트 출력으로 보고하지 마세요
- 사용자에게 텍스트를 출력하는 시점은 **오직**: 최종 성공 보고(6단계), 에스컬레이션(7단계), 또는 복구 불가능한 오류 발생 시뿐입니다
- 내부 스킬 호출 전후로 설명이나 요약을 출력하지 마세요
- 한 단계의 Skill 호출이 결과를 반환하면 즉시 결과를 파싱하고 다음 단계의 Skill을 호출하세요

**⚠️ 절대 금지 패턴**: Skill 호출 후 결과를 받고 **텍스트만 출력하고 멈추는 것**은 금지합니다. 반드시 다음 도구 호출(Read, Glob, Skill, TaskUpdate 등)을 즉시 실행하세요.

**재개 시에도 동일**: 0단계에서 재개 지점을 결정한 후, 해당 단계부터 마지막 단계까지 모든 나머지 단계를 중단 없이 자동으로 실행합니다.

## 내부 스킬

| 단계 | 스킬 | 호출 방법 |
|------|------|----------|
| 워크트리 | `flowness:internal-worktree` | `setup`, `create-subtask`, `merge-subtasks`, `cleanup-subtask` |
| 생성 | `flowness:internal-generate` | Generator를 생성하고 `build-result-r{N}.md`를 출력 |
| 리뷰 | `flowness:internal-review` | 5개 Reviewer를 생성하고 `code-review-r{N}.md`를 출력 |

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
  T-gen-N     R{N}: Generate code                [blockedBy: T-subtasks or T-aggr-{N-1}]
  T-rule-N    R{N}: Rule review                  [blockedBy: T-gen-N]
  T-qual-N    R{N}: Quality review               [blockedBy: T-gen-N]
  T-sec-N     R{N}: Security review              [blockedBy: T-gen-N]
  T-perf-N    R{N}: Performance review           [blockedBy: T-gen-N]
  T-arch-N    R{N}: Architecture review          [blockedBy: T-gen-N]
  T-aggr-N    R{N}: Aggregate reviews            [blockedBy: T-rule-N,T-qual-N,T-sec-N,T-perf-N,T-arch-N]

Review fix tasks (created on review FAIL, up to 3 iterations per round):
  T-fix-N-F   R{N}.{F}: Fix review issues        [blockedBy: T-aggr-N or T-rerev-N-{F-1}]
  T-rerev-N-F R{N}.{F}: Re-review                [blockedBy: T-fix-N-F]

Completion tasks:
  T-final     Finalize topic                     [blockedBy: last T-aggr]
  T-publish   Commit, push, and create PR        [blockedBy: T-final]
  T-reflect   Reflect on topic learnings          [blockedBy: T-publish]
```

## 입력

토픽 코드: $ARGUMENTS (예: H20260402143022)

## 프로세스

### 0단계: 전제 조건 확인 및 재개 감지

프로젝트 루트에 CLAUDE.md가 존재하는지 확인합니다. 없으면 사용자에게 `/setup`을 먼저 실행하라고 안내합니다.

**재개 감지**: 이전 실행에서 중단된 경우를 감지하여 이어서 진행합니다.

1. 프로젝트 루트를 확인합니다: `git rev-parse --show-toplevel` → PROJECT_ROOT
2. WORKTREE_PATH를 계산합니다: `{PROJECT_ROOT}/.flowness-worktrees/{topic-code}`
3. WORKTREE_PATH 디렉토리가 이미 존재하는지 확인합니다
4. 존재하면 → **재개 모드**로 진입합니다:
   a. `TaskList`로 기존 작업 목록을 확인합니다
   b. 토픽 디렉토리를 찾습니다: `Glob: {WORKTREE_PATH}/harness/exec-plans/active/$ARGUMENTS_*/`
   c. 다음 파일들의 존재 여부로 완료된 단계를 판단합니다:
      - `build-contract.md` 존재 → 3단계 완료
      - `sub-tasks.md` 존재 → 4단계 완료
      - `build-result-r{N}.md` 존재 → 라운드 N 생성 완료
      - `code-review-r{N}.md` 존재 → 라운드 N 리뷰 완료
      - `completed/` 디렉토리에 토픽이 있음 → 6단계 완료
      - `git -C {WORKTREE_PATH} log --oneline -1`로 브랜치에 커밋 존재 확인
      - `gh pr list --head {branch}` 결과 있음 → 6a단계 완료
      - `reflection.md` 존재 → 6b단계 완료
   d. **재개 지점을 결정합니다**:
      - 토픽 디렉토리 없음 → 2단계(컨텍스트 로드)부터 진행
      - build-contract.md 없음 → 2단계(컨텍스트 로드)부터 진행
      - sub-tasks.md 없음 → 4단계부터 진행
      - 라운드 N의 build-result만 있음 → 5c(리뷰)부터 진행
      - 라운드 N의 code-review만 있음 → 결과 확인(5d)부터 진행
      - 라운드 N의 code-review가 PASS이고 `completed/`에 토픽 없음 → 6단계부터 진행
      - `completed/`에 토픽 있고 PR 없음 → 6a단계부터 진행
      - PR 존재하고 reflection.md 없음 → 6b단계부터 진행
   e. 기존 작업이 있으면 ID를 매핑하고, 없으면 완료된 단계의 작업을 `completed` 상태로 생성합니다
   f. WORKTREE_PATH를 설정하고 해당 재개 지점의 단계로 **즉시 건너뜁니다**
5. 존재하지 않으면 → **신규 실행**으로 1단계부터 시작합니다

### 1단계: 워크트리 설정

```
TaskCreate: "Setup worktree and load context", activeForm="Setting up worktree" → T-setup
TaskUpdate: T-setup → in_progress
```

호출: `Skill: flowness:internal-worktree, args="setup {topic-code}"`

출력 `WORKTREE_PATH`를 캡처합니다. 이후 모든 경로는 이에 상대적입니다.

**중요**: 이 Skill 호출이 결과를 반환하면, 반드시 즉시 2단계로 진행하세요. 여기서 멈추지 마세요.

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

**핵심 원칙**: 리뷰 실패 시에는 같은 라운드 내에서 즉시 수정하고 재리뷰합니다. 수정 반복 횟수를 초과하면 라운드를 증가시킵니다.

최대 리뷰 수정 반복 = 3 (같은 라운드 내에서 리뷰 FAIL → 수정 → 재리뷰 최대 횟수)

#### 라운드 N:

**5a. 라운드 작업 생성**

```
TaskCreate: "R{N}: Generate code", owner="generator",
            addBlockedBy=[T-subtasks](R1) or [T-aggr-{N-1}](R2+) → T-gen-N
TaskCreate: "R{N}: Rule review", owner="rule-reviewer", addBlockedBy=[T-gen-N] → T-rule-N
TaskCreate: "R{N}: Quality review", owner="quality-reviewer", addBlockedBy=[T-gen-N] → T-qual-N
TaskCreate: "R{N}: Security review", owner="security-reviewer", addBlockedBy=[T-gen-N] → T-sec-N
TaskCreate: "R{N}: Performance review", owner="performance-reviewer", addBlockedBy=[T-gen-N] → T-perf-N
TaskCreate: "R{N}: Architecture review", owner="architecture-reviewer", addBlockedBy=[T-gen-N] → T-arch-N
TaskCreate: "R{N}: Aggregate reviews", addBlockedBy=[T-rule-N,T-qual-N,T-sec-N,T-perf-N,T-arch-N] → T-aggr-N
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
- **PASS** → 6단계로 진행
- **FAIL** → 5d-fix 진입 (리뷰 수정 루프)

**5d-fix. 리뷰 수정 루프** (같은 라운드 N 내에서 반복)

리뷰 수정 반복 카운터 `F`를 1부터 시작합니다:

1. 수정 작업 생성:
   ```
   TaskCreate: "R{N}.{F}: Fix review issues", owner="generator", activeForm="Fixing review issues" → T-fix-N-F
   TaskUpdate: T-fix-N-F → in_progress
   ```

2. Generator를 수정 모드로 호출합니다:
   호출: `Skill: flowness:internal-generate, args="round={N} fix={F} worktree={WORKTREE_PATH} topic={topic-dir} spec={spec-file} strategy=single task-id={T-fix-N-F}"`
   - Generator는 `code-review-r{N}.md` (또는 `code-review-r{N}.{F-1}.md`)를 읽고 이슈를 수정합니다
   - 출력: `build-result-r{N}.{F}.md`

3. 재리뷰 작업 생성 및 실행:
   ```
   TaskCreate: "R{N}.{F}: Re-review", activeForm="Re-reviewing fixes" → T-rerev-N-F
   ```
   호출: `Skill: flowness:internal-review, args="round={N} fix={F} worktree={WORKTREE_PATH} topic={topic-dir} task-ids={T-rerev-N-F}"`
   - 출력: `code-review-r{N}.{F}.md`

4. 재리뷰 결과 확인:
   - **PASS** → 6단계로 진행
   - **FAIL** + `F < 3` → `F++`, 5d-fix의 1번으로 돌아감
   - **FAIL** + `F >= 3` + 남은 라운드 있음 → 라운드 증가, 5a로 이동
   - **FAIL** + `F >= 3` + 남은 라운드 없음 → 7단계 (에스컬레이션)

### 6단계: 성공 — Finalize

```
TaskCreate: "Finalize topic", activeForm="Finalizing topic" → T-final
TaskUpdate: T-final → in_progress
```

1. 토픽을 `active/`에서 `completed/`로 이동합니다
2. CLAUDE.md를 업데이트합니다: 토픽을 완료 토픽으로 이동

```
TaskUpdate: T-final → completed
```

**중요**: T-final 완료 후 즉시 6a단계로 진행하세요. 여기서 멈추지 마세요.

### 6a단계: 커밋, 푸시, PR 생성

```
TaskCreate: "Commit, push, and create PR", activeForm="Publishing work" → T-publish
TaskUpdate: T-publish → in_progress
```

1. **현재 브랜치 확인**:
   ```bash
   git -C {WORKTREE_PATH} branch --show-current
   ```

2. **모든 변경사항 스테이징 및 커밋**:
   ```bash
   git -C {WORKTREE_PATH} add -A
   ```
   - `git -C {WORKTREE_PATH} diff --cached --quiet`로 스테이징된 변경사항 확인
   - 변경사항이 없으면 → 커밋을 건너뜁니다 (Generator가 이미 커밋한 경우)
   - 변경사항이 있으면:
     ```bash
     git -C {WORKTREE_PATH} commit -m "$(cat <<'EOF'
     feat: {topic-name}

     Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
     EOF
     )"
     ```

3. **리모트로 푸시**:
   ```bash
   git -C {WORKTREE_PATH} push -u origin {branch}
   ```
   - 푸시 실패 시 오류를 출력하고 계속 진행합니다 (PR 생성은 건너뜀)

4. **기존 PR 확인**:
   ```bash
   gh pr list --repo $(git -C {WORKTREE_PATH} remote get-url origin | sed 's/\.git$//') --head {branch} --json number,url
   ```
   - PR이 이미 존재하면 → URL을 기록하고 PR 생성을 건너뜁니다

5. **PR 생성** (기존 PR이 없을 때만):
   - build-contract.md에서 Scope 내용을 읽습니다
   - eval-result에서 최종 라운드와 상태를 읽습니다
   ```bash
   gh pr create \
     --repo $(git -C {WORKTREE_PATH} remote get-url origin | sed 's/\.git$//') \
     --head {branch} \
     --title "feat: {topic-name}" \
     --body "$(cat <<'EOF'
   ## Summary
   {build-contract.md의 Scope 내용을 bullet point로 요약}

   ## Eval Result
   - Round: {N}
   - Status: PASS

   🤖 Generated with [Claude Code](https://claude.ai/claude-code)
   EOF
   )"
   ```

6. **결과 출력**: PR URL을 사용자에게 출력합니다 (생성된 PR 또는 기존 PR)

```
TaskUpdate: T-publish → completed
```

**중요**: T-publish 완료 후 즉시 6b단계로 진행하세요. 여기서 멈추지 마세요.

### 6b단계: 반성 (자동)

```
TaskCreate: "Reflect on topic learnings", activeForm="Reflecting on learnings" → T-reflect
TaskUpdate: T-reflect → in_progress
```

호출: `Skill: flowness:internal-reflect, args="worktree={WORKTREE_PATH} topic={topic-dir} task-id={T-reflect}"`

```
TaskUpdate: T-reflect → completed
```

반성 완료 후 사용자에게 최종 보고:
1. eval-result 요약
2. PR URL
3. 워크트리 경로, 브랜치 이름
4. `/maintain learn`을 제안하여 교차 토픽 학습 실행 안내

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

- **절대로** 코드를 직접 작성 또는 리뷰하지 마세요 — 내부 스킬을 통해 위임합니다
- 각 파이프라인 단계는 별도의 내부 스킬 호출로 실행됩니다
- 작업 ID를 전체적으로 추적합니다 — 상태 업데이트를 위해 내부 스킬에 전달합니다
- 가시성을 위해 각 라운드 시작 시 모든 라운드 작업을 미리 생성합니다
- CLAUDE.md의 max_eval_rounds를 절대적 상한으로 준수합니다
- 평가(evaluation)는 `/work` 루프에 포함되지 않습니다 — 사용자가 `/evaluate`로 별도 호출합니다
