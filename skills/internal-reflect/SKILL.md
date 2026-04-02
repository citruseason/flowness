---
name: internal-reflect
description: Runs post-topic reflection analysis. Extracts learnings from review and eval artifacts. Called automatically after successful /work completion. Internal skill — not user-invocable.
description-ko: 토픽 완료 후 반성 분석을 실행합니다. 리뷰 및 평가 결과물에서 학습 내용을 추출합니다. /work 성공 완료 후 자동으로 호출됩니다. 내부 스킬 — 사용자가 직접 호출할 수 없습니다.
user-invocable: false
allowed-tools: Read, Write, Agent, Grep, Glob, TaskUpdate
argument-hint: "worktree={path} topic={dir} [task-id={id}]"
---

# 반성 단계

완료된 토픽의 빌드-리뷰-평가 결과물을 분석하여 학습 후보를 추출합니다.

## 입력

$ARGUMENTS에서 파싱합니다:

| 키 | 필수 | 설명 |
|-----|------|------|
| `worktree` | 예 | 메인 토픽 worktree 절대 경로 |
| `topic` | 예 | 토픽 디렉토리 이름 |
| `task-id` | 선택 | 상태를 업데이트할 작업 ID |

## 프로세스

`task-id`가 제공된 경우: `TaskUpdate: task-id → in_progress`

### 1. 결과물 수집

토픽 디렉토리에서 모든 라운드 결과물을 식별합니다:

```bash
# 완료된 토픽 디렉토리
TOPIC_DIR="{worktree}/harness/exec-plans/completed/{topic}"

# 라운드 결과물 Glob
code-review-r*.md
eval-result-r*.md
build-result-r*.md
build-contract.md
```

### 2. Reflector 에이전트 생성

Agent 도구를 `subagent_type: flowness:reflector`로 사용합니다:

```
Project root: {worktree}
Topic directory: {worktree}/harness/exec-plans/completed/{topic}/

Files to read:
- {worktree}/harness/exec-plans/completed/{topic}/build-contract.md
- {worktree}/harness/exec-plans/completed/{topic}/code-review-r*.md (all rounds)
- {worktree}/harness/exec-plans/completed/{topic}/eval-result-r*.md (all rounds)
- {worktree}/ARCHITECTURE.md
- {worktree}/harness/rules/ (scan RULE.md in each folder for current coverage)
- {worktree}/harness/eval-criteria/ (scan for current criteria)

Write your output to: {worktree}/harness/exec-plans/completed/{topic}/reflection.md
```

완료될 때까지 대기합니다.

### 3. 반성 결과 확인

`reflection.md`가 생성되었는지 확인합니다. 읽어서 각 카테고리의 관찰 수를 집계합니다.

### 4. 학습 로그 업데이트

`{worktree}/harness/learning-log.md`에 다음 형식의 항목을 **추가**합니다:

```markdown
## 항목: {날짜} — {topic-code}

### 관찰 요약
- 반복된 위반: {개수}
- 아키텍처 발견: {개수}
- 평가 기준 격차: {개수}
- 품질 패턴: {개수}
- 잘 작동한 점: {개수}

### 주요 발견
- {발견 1}
- {발견 2}

### 상태: 처리 대기 중
```

`task-id`가 제공된 경우: `TaskUpdate: task-id → completed`

### 5. 요약 출력

호출자에게 반성 결과 요약을 출력합니다:
- 카테고리별 관찰 수
- 주요 발견 사항 (가장 중요한 2-3개)
- `/maintain learn` 실행 제안

## 규칙

- harness 파일을 직접 수정하지 마세요 — `reflection.md`와 `learning-log.md` 추가만 합니다
- `learning-log.md`가 존재하지 않으면 빈 파일을 생성합니다
- 에이전트 동작은 `agents/reflector.md`에 정의되어 있습니다 — 동적 컨텍스트만 전달합니다
- 모든 파일 경로는 worktree 하위의 절대 경로여야 합니다
