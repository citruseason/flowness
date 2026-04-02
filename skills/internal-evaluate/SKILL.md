---
name: internal-evaluate
description: Spawns Evaluator agent to test the application and grade against eval criteria. Returns PASS or FAIL. Internal skill — not user-invocable.
description-ko: 애플리케이션을 테스트하고 평가 기준에 따라 등급을 매기는 Evaluator 에이전트를 생성합니다. PASS 또는 FAIL을 반환합니다. 내부 스킬 — 사용자가 직접 호출할 수 없습니다.
user-invocable: false
allowed-tools: Read, Write, Agent, Grep, Glob, TaskUpdate
argument-hint: "round={N} worktree={path} topic={dir} eval-tool={tool} [task-id={id}]"
---

# 평가 단계

빌드를 비판적으로 평가하기 위한 Evaluator 서브에이전트를 생성합니다.

## 입력

$ARGUMENTS에서 파싱합니다:

| 키 | 필수 | 설명 |
|-----|----------|-------------|
| `round` | 예 | 현재 라운드 번호 |
| `worktree` | 예 | 메인 토픽 worktree 절대 경로 |
| `topic` | 예 | 토픽 디렉토리 이름 |
| `eval-tool` | 예 | CLAUDE.md 설정의 평가 도구 (예: `playwright`, `cli`) |
| `task-id` | 선택 | 상태를 업데이트할 작업 ID |

## 프로세스

`task-id`가 제공된 경우: `TaskUpdate: task-id → in_progress`

### Evaluator 생성

Agent 도구를 `subagent_type: flowness:evaluator`로 사용합니다:

```
Round: {round}
Project root: {worktree}
Topic directory: {worktree}/harness/exec-plans/active/{topic}/
Eval tool: {eval-tool}

Files to read:
- {worktree}/harness/exec-plans/active/{topic}/build-contract.md
- {worktree}/harness/exec-plans/active/{topic}/build-result-r{round}.md
- Relevant eval-criteria/ files listed in build-contract.md
{If round > 1: - {worktree}/harness/exec-plans/active/{topic}/eval-result-r{round-1}.md}

Write your output to: {worktree}/harness/exec-plans/active/{topic}/eval-result-r{round}.md
```

완료될 때까지 대기합니다.

### 검증

`{worktree}/harness/exec-plans/active/{topic}/eval-result-r{round}.md`를 읽고 상태를 추출합니다.

`task-id`가 제공된 경우: `TaskUpdate: task-id → completed`

호출자가 읽을 수 있도록 상태(`PASS` 또는 `FAIL`)를 일반 텍스트로 **출력**합니다.

## 규칙

- 에이전트 동작은 `agents/evaluator.md`에 정의되어 있습니다 — 여기서는 동적 컨텍스트만 전달합니다
- 모든 파일 경로는 worktree 하위의 절대 경로여야 합니다
- 재시도 라운드(round > 1)의 경우: 이전 eval-result를 반드시 읽을 파일에 포함합니다
