---
name: internal-generate
description: Spawns Generator agent(s) for a build round. Handles parallel and single strategy, produces build-result file. Internal skill — not user-invocable.
description-ko: 빌드 라운드를 위한 Generator 에이전트를 생성합니다. 병렬 및 단일 전략을 처리하고, build-result 파일을 생성합니다. 내부 스킬 — 사용자가 직접 호출할 수 없습니다.
user-invocable: false
allowed-tools: Read, Write, Bash, Grep, Glob, Agent, TaskUpdate
argument-hint: "round={N} worktree={path} topic={dir} strategy={parallel|single} [sub-tasks={NN,NN}] [task-id={id}]"
---

# 생성 단계

하나의 빌드 라운드를 위한 Generator 서브에이전트를 생성합니다.

## 입력

$ARGUMENTS에서 파싱합니다:

| 키 | 필수 | 설명 |
|-----|----------|-------------|
| `round` | 예 | 현재 라운드 번호 |
| `fix` | 선택 | 리뷰 수정 반복 번호 (리뷰 FAIL 후 수정 모드) |
| `worktree` | 예 | 메인 토픽 worktree 절대 경로 |
| `topic` | 예 | 토픽 디렉토리 이름 (예: `H20260402143022_feature-name`) |
| `strategy` | 예 | `parallel` 또는 `single` |
| `sub-tasks` | 병렬 전용 | 쉼표로 구분된 하위 작업 번호 (예: `01,02`) |
| `task-id` | 선택 | 상태를 업데이트할 작업 ID |

## 프로세스

`task-id`가 제공된 경우: `TaskUpdate: task-id → in_progress`

### 단일 전략

Agent 도구를 통해 하나의 Generator를 생성합니다 (`subagent_type: flowness:generator`):

```
Round: {round}
Project root: {worktree}
Topic directory: {worktree}/harness/topics/{topic}/
Product spec: {worktree}/harness/topics/{topic}/spec.md

Files to read:
- {worktree}/harness/topics/{topic}/build-contract.md
- {worktree}/harness/topics/{topic}/spec.md
- {worktree}/ARCHITECTURE.md
- Applicable rule folders listed in build-contract.md (read RULE.md for each, detail files as needed)
{If round > 1: - {worktree}/harness/topics/{topic}/code-review-r{round-1}.md}
{If round > 1: - {worktree}/harness/topics/{topic}/eval-result-r{round-1}.md}

Write your output to: {worktree}/harness/topics/{topic}/build-result-r{round}.md
```

완료될 때까지 대기합니다.

### 병렬 전략

`{worktree}/harness/topics/{topic}/sub-tasks.md`를 읽어 하위 작업별 범위와 담당 파일을 확인합니다.

각 하위 작업 `{NN}`에 대해 (`sub-tasks` 목록):

- 하위 작업 worktree 경로를 해석합니다:
  ```bash
  PROJECT_ROOT=$(git rev-parse --show-toplevel)
  ST_PATH="${PROJECT_ROOT}/.flowness-worktrees/{topic-code}-{NN}"
  ```
  (`{topic-code}`는 `{topic}`에서 언더스코어 앞부분)

모든 Generator 서브에이전트를 **하나의 메시지에서 동시에** 생성합니다:

```
Round: {round}
Project root: {ST_PATH}
Topic directory: {ST_PATH}/harness/topics/{topic}/
Product spec: {ST_PATH}/harness/topics/{topic}/spec.md

Sub-task: {NN} — {sub-tasks.md의 하위 작업 이름}
Owned files: [sub-tasks.md의 목록 — 이 파일들만 수정]

Files to read:
- {ST_PATH}/harness/topics/{topic}/build-contract.md
- {ST_PATH}/harness/topics/{topic}/sub-tasks.md
- {ST_PATH}/harness/topics/{topic}/spec.md
- {ST_PATH}/ARCHITECTURE.md
- Applicable rule folders listed in build-contract.md

Write your output to: {ST_PATH}/harness/topics/{topic}/build-result-r{round}-{NN}.md
```

모든 에이전트가 완료될 때까지 대기합니다.

모든 `build-result-r{round}-{NN}.md`를 통합하여 `{worktree}/harness/topics/{topic}/build-result-r{round}.md`를 생성합니다.

### 수정 모드 (`fix` 파라미터가 있는 경우)

리뷰에서 발견된 이슈를 수정하기 위한 모드입니다. 병렬 전략과 무관하게 항상 단일 Generator를 생성합니다.

리뷰 파일 경로를 결정합니다:
- `fix=1`이면: `code-review-r{round}.md` (최초 리뷰 결과)
- `fix>1`이면: `code-review-r{round}.{fix-1}.md` (이전 재리뷰 결과)

Agent 도구를 통해 하나의 Generator를 생성합니다 (`subagent_type: flowness:generator`):

```
Round: {round}, Fix: {fix}
Project root: {worktree}
Topic directory: {worktree}/harness/topics/{topic}/

MODE: REVIEW FIX — 리뷰에서 발견된 이슈만 수정합니다.

Files to read:
- {worktree}/harness/topics/{topic}/build-contract.md
- {worktree}/harness/topics/{topic}/spec.md
- {review file path determined above}
- {worktree}/harness/topics/{topic}/build-result-r{round}.md (or build-result-r{round}.{fix-1}.md)
- Applicable rule folders listed in build-contract.md

Write your output to: {worktree}/harness/topics/{topic}/build-result-r{round}.{fix}.md
```

완료될 때까지 대기합니다.

### 검증

출력 파일 경로를 결정합니다:
- `fix` 파라미터가 없으면: `build-result-r{round}.md`
- `fix` 파라미터가 있으면: `build-result-r{round}.{fix}.md`

해당 파일이 존재하고 비어있지 않은지 확인합니다.

`task-id`가 제공된 경우: `TaskUpdate: task-id → completed`

## 규칙

- **자동 진행**: 모든 단계를 중단 없이 실행합니다. 사용자에게 텍스트를 출력하지 말고, 에이전트 생성 → 대기 → 검증을 즉시 수행하세요
- Generator 에이전트에 전달하는 모든 파일 경로는 해당 worktree 하위의 절대 경로여야 합니다
- 병렬 전략의 경우: 각 Generator는 담당 파일 목록에 있는 파일만 수정합니다
- 재시도 라운드(round > 1)의 경우: 이전 code-review와 eval-result를 반드시 읽을 파일에 포함합니다
- 에이전트 동작은 `agents/generator.md`에 정의되어 있습니다 — 여기서는 동적 컨텍스트만 전달합니다
