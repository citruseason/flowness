---
name: evaluate
description: Evaluate the latest build for a topic. Spawns Evaluator agent to test the application and grade against eval criteria. Returns PASS or FAIL. Run after /work completes.
description-ko: 토픽의 최신 빌드를 평가합니다. Evaluator 에이전트를 생성하여 애플리케이션을 테스트하고 평가 기준에 따라 등급을 매깁니다. PASS 또는 FAIL을 반환합니다. /work 완료 후 실행합니다.
user-invocable: true
allowed-tools: Read, Write, Agent, Grep, Glob, Bash
argument-hint: "<topic-code>"
---

# 평가

토픽의 최신 빌드를 비판적으로 평가하기 위한 Evaluator 서브에이전트를 생성합니다.

## 입력

$ARGUMENTS에서 토픽 코드를 파싱합니다 (예: `H20260402143022`).

## 프로세스

### 1단계: 컨텍스트 자동 감지

1. **프로젝트 루트 확인**: `git rev-parse --show-toplevel` → PROJECT_ROOT
2. **워크트리 경로 계산**: `{PROJECT_ROOT}/.flowness-worktrees/{topic-code}` → WORKTREE_PATH
3. **워크트리 존재 확인**: WORKTREE_PATH가 없으면 사용자에게 `/work`를 먼저 실행하라고 안내합니다
4. **토픽 디렉토리 찾기**: `Glob: {WORKTREE_PATH}/harness/exec-plans/active/$ARGUMENTS_*/` 또는 `{WORKTREE_PATH}/harness/exec-plans/completed/$ARGUMENTS_*/`
5. **CLAUDE.md에서 eval_tool 읽기**: `{WORKTREE_PATH}/CLAUDE.md`에서 `eval_tool` 설정을 추출합니다
6. **최신 라운드 감지**: 토픽 디렉토리에서 `build-result-r*.md` 파일을 Glob하여 가장 큰 라운드 번호 N을 찾습니다
   - build-result가 없으면 사용자에게 `/work`를 먼저 실행하라고 안내합니다

### 2단계: Evaluator 생성

Agent 도구를 `subagent_type: flowness:evaluator`로 사용합니다:

```
Round: {N}
Project root: {WORKTREE_PATH}
Topic directory: {WORKTREE_PATH}/harness/exec-plans/{active|completed}/{topic}/
Eval tool: {eval-tool}

Files to read:
- {WORKTREE_PATH}/harness/exec-plans/{active|completed}/{topic}/build-contract.md
- {WORKTREE_PATH}/harness/exec-plans/{active|completed}/{topic}/build-result-r{N}.md
- Relevant eval-criteria/ files listed in build-contract.md
{If round > 1: - {WORKTREE_PATH}/harness/exec-plans/{active|completed}/{topic}/eval-result-r{N-1}.md}

Write your output to: {WORKTREE_PATH}/harness/exec-plans/{active|completed}/{topic}/eval-result-r{N}.md
```

완료될 때까지 대기합니다.

### 3단계: 검증 및 결과 보고

1. `evaluation.json`을 읽고 `dev_server.started`와 `browser_sessions`이 채워졌는지 확인합니다
2. `eval-result-r{N}.md`를 읽고 상태를 추출합니다
3. 사용자에게 결과를 보고합니다:
   - 상태 (PASS / FAIL)
   - 평가 기준별 결과 요약
   - 발견된 이슈 목록 (FAIL인 경우)

## 규칙

- 에이전트 동작은 `agents/evaluator.md`에 정의되어 있습니다 — 여기서는 동적 컨텍스트만 전달합니다
- 모든 파일 경로는 worktree 하위의 절대 경로여야 합니다
- 재시도 라운드(round > 1)의 경우: 이전 eval-result를 반드시 읽을 파일에 포함합니다
- `active/`와 `completed/` 양쪽 모두에서 토픽 디렉토리를 탐색합니다 (이미 완료된 토픽도 평가 가능)
