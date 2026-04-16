---
name: work
description: Execute a topic's build loop without TDD. Uses task.md (d-NNN × step checkboxes) as the persistent tracker. Runs 3 steps per decision (GENERATE → REVIEW → COMMIT), then calls a single code-reviewer after all checkboxes are ticked. For TDD-driven builds, use /work-tdd instead.
description-ko: 토픽의 빌드 루프를 TDD 없이 실행합니다. `task.md`(d-NNN × step 체크박스)를 영속 트래커로 사용합니다. 결정마다 3단계(GENERATE → REVIEW → COMMIT)를 수행하고, 모든 체크박스가 완료되면 `code-reviewer`를 1회 호출합니다. TDD 기반 빌드는 `/work-tdd`를 사용하세요.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Skill, Agent
argument-hint: "<topic-code>"
---

# /work — 비-TDD 빌드 루프

당신은 Flowness harness 엔지니어링 워크플로우의 **빌드 오케스트레이터**입니다 (비-TDD 모드).

## 설계 원칙 (M20260416071814 결정 1~4)

- **task.md가 진실** — 세션 메모리 (`TaskCreate`/`TaskUpdate`)에 의존하지 않습니다. d-NNN × step 체크박스가 파일에 박혀 있어 어느 시점에 세션을 재개해도 결정론적으로 이어갈 수 있습니다.
- **Worktree 직교** — 본 스킬은 worktree를 만들지 않습니다. 격리가 필요하면 사용자가 `/using-worktree`로 먼저 생성한 뒤 그 디렉토리에서 `/work`를 호출합니다.
- **단일 code-reviewer** — `task.md` 완료 후 1회만 `code-reviewer` 에이전트를 호출합니다. 라운드별 다관점 리뷰어는 사용하지 않습니다.
- **재작업은 `code-reviews/task-r{N}.md`에** — FAIL 시 fix task 체크박스 파일을 다음 라운드 번호로 생성하고 동일 루프를 다시 탑니다.

## 자동 진행 규칙

**중단 없이 모든 단계를 순차 실행합니다.** 단계 사이에 확인을 요구하지 마세요. Skill 호출 후에는 결과를 파싱하고 즉시 다음 단계로 진행합니다.

사용자에게 텍스트를 출력하는 시점은 **오직**: 최종 성공 보고 (8단계), 에스컬레이션 (9단계), 복구 불가능한 오류.

## 입력

토픽 코드: `$ARGUMENTS` (예: `T20260416081244` 또는 `H…`).

## 프로세스

### 0단계: 전제 조건 확인 + 재개 감지

1. `git rev-parse --show-toplevel` → `PROJECT_ROOT`.
2. 토픽 디렉토리 찾기:
   ```
   Glob: {PROJECT_ROOT}/harness/topics/{$ARGUMENTS}_*/
   ```
   없으면 사용자에게 `/meeting` → `/design-doc`을 먼저 실행하도록 안내하고 종료.
3. 토픽 디렉토리를 `TOPIC_DIR`로 캡처.
4. 필수 파일 확인:
   - `{TOPIC_DIR}/plan.md` 존재해야 함 (없으면 `/design-doc` 요구).
   - `{TOPIC_DIR}/spec.md` 존재 권장.
5. **재개 감지**: 다음 파일들의 존재/내용으로 재개 지점을 판정.
   - `{TOPIC_DIR}/task.md` 없음 → 2단계부터 진행.
   - `{TOPIC_DIR}/task.md` 존재 + 체크되지 않은 `- [ ]` 있음 → 3단계부터 진행 (첫 번째 미완료 체크박스의 d-NNN/step에서 이어감).
   - `{TOPIC_DIR}/task.md` 모두 체크됨 + `{TOPIC_DIR}/code-reviews/code-review-r{N}.md` 없음 → 4단계부터 진행 (code-reviewer 호출).
   - `{TOPIC_DIR}/code-reviews/code-review-r{N}.md` 존재 (PASS) + `{TOPIC_DIR}/reflection.md` 없음 → 7단계부터 진행.
   - `{TOPIC_DIR}/code-reviews/code-review-r{N}.md` 존재 (FAIL) + `{TOPIC_DIR}/code-reviews/task-r{N+1}.md` 없음 → 5단계부터 진행 (fix task 생성).
   - `{TOPIC_DIR}/code-reviews/task-r{N+1}.md` 존재 + 미완료 체크박스 있음 → 3단계로 진입하되 대상 파일을 `task-r{N+1}.md`로 설정.
6. 재개 지점으로 즉시 분기.

### 1단계: 컨텍스트 로드

읽을 파일:
- `{PROJECT_ROOT}/CLAUDE.md`
- `{PROJECT_ROOT}/ARCHITECTURE.md` (있으면)
- `{TOPIC_DIR}/spec.md`
- `{TOPIC_DIR}/plan.md`
- `{TOPIC_DIR}/plan-config.md` (있으면)
- `{TOPIC_DIR}/decisions.md` (있으면)
- 적용 가능한 `{PROJECT_ROOT}/harness/rules/*/SKILL.md`

### 2단계: `task.md` 자동 파생

`{TOPIC_DIR}/task.md`가 없으면 `plan.md`의 `d-NNN` 결정을 스캔하여 다음 형식으로 생성합니다:

```markdown
---
topic: {topic-code}
round: 1
mode: work
steps: [GENERATE, REVIEW, COMMIT]
---

# Task — {topic-slug} (round 1)

plan.md에서 자동 파생. 기존 파일이 있으면 덮어쓰지 않습니다 (수동 편집 보호).

## d-001: {plan.md의 d-001 제목}
- [ ] GENERATE
- [ ] REVIEW
- [ ] COMMIT

## d-002: {plan.md의 d-002 제목}
- [ ] GENERATE
- [ ] REVIEW
- [ ] COMMIT

...
```

`plan.md`에 `d-NNN` 결정이 없으면 에러 출력 후 종료 (사용자에게 `/design-doc`를 완료하도록 안내).

### 3단계: Task 루프

현재 대상 체크박스 파일 `TASK_FILE`:
- 라운드 1: `{TOPIC_DIR}/task.md`
- 라운드 N (N > 1): `{TOPIC_DIR}/code-reviews/task-r{N}.md`

`TASK_FILE`의 미완료 `- [ ]` 항목을 위에서 아래 순서로 처리합니다. 각 d-NNN 블록에 대해:

#### 3a. GENERATE

Agent 도구로 Generator를 호출합니다 (`subagent_type: flowness:generator`):

```
Mode: work (non-TDD)
Round: {N}
Project root: {PROJECT_ROOT}
Topic directory: {TOPIC_DIR}
Current decision: d-{NNN} — {decision title from plan.md}
Current step: GENERATE

Files to read:
- {TOPIC_DIR}/plan.md   ← d-{NNN} 블록 정독
- {TOPIC_DIR}/spec.md
- {TOPIC_DIR}/decisions.md (있으면)
- {TOPIC_DIR}/plan-config.md (있으면)
- {PROJECT_ROOT}/ARCHITECTURE.md
- Applicable rule folders listed in plan-config.md / CLAUDE.md

Your task: d-{NNN}의 요구 사항을 코드베이스에 구현합니다.
- 이번 단계는 비-TDD입니다 (테스트 우선 작성 강제 없음). 단, 관련 단위/통합 테스트가 자연스럽게 추가되어야 한다면 작성하세요.
- {If round > 1 AND TASK_FILE is code-reviews/task-r{N}.md}: {TOPIC_DIR}/code-reviews/code-review-r{N-1}.md 를 읽고 FAIL 사유를 수정합니다.

완료 후:
- 변경된 파일 경로를 stdout에 한 줄씩 출력합니다.
- 결과 파일은 만들지 마세요 (task.md가 상태 기록).
```

완료 대기.

이어서 `TASK_FILE`의 해당 d-NNN의 `- [ ] GENERATE`를 `- [x] GENERATE`로 Edit.

#### 3b. REVIEW (셀프 검증)

이 단계는 Generator가 방금 구현한 코드에 대한 **셀프 검증**입니다 (외부 code-reviewer가 아닙니다). Generator를 짧은 체크 모드로 재호출하거나, `/work` 자신이 직접 수행:

```bash
# 프로젝트 관례에 맞는 lint/test/type-check 명령 실행
# CLAUDE.md에 test_command/lint_command가 있으면 그것을 사용
```

- 프로젝트에 정의된 lint/test 명령이 있으면 실행. 통과하지 않으면 Generator를 재호출해 수정.
- 없으면 코드 diff를 스캔해 명백한 문제(문법 오류, 미사용 import 등)만 가볍게 점검.

`TASK_FILE`의 해당 d-NNN의 `- [ ] REVIEW`를 `- [x] REVIEW`로 Edit.

#### 3c. COMMIT

```bash
cd {PROJECT_ROOT}
git add -A
git diff --cached --quiet && echo "no changes" || \
  git commit -m "feat({topic-slug}): d-{NNN} {short title}

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

변경 사항이 없으면 커밋 생략 (앞 단계가 이미 커밋한 경우).

`TASK_FILE`의 해당 d-NNN의 `- [ ] COMMIT`을 `- [x] COMMIT`으로 Edit.

다음 d-NNN으로 진행. 모든 d-NNN이 완료되면 4단계로.

### 4단계: code-reviewer 1회 호출

`{TOPIC_DIR}/code-reviews/`가 없으면 `mkdir -p`.

Agent 도구로 `code-reviewer`를 호출합니다 (`subagent_type: flowness:code-reviewer`):

```
Round: {N}
Project root: {PROJECT_ROOT}
Topic directory: {TOPIC_DIR}
Task file: {TASK_FILE}  (모든 체크박스 완료 상태)

Files to read:
- {TOPIC_DIR}/spec.md
- {TOPIC_DIR}/plan.md
- {TOPIC_DIR}/decisions.md (있으면)
- {PROJECT_ROOT}/ARCHITECTURE.md
- {PROJECT_ROOT}/CLAUDE.md
- git diff  (최근 라운드에서 본 토픽이 만든 커밋들)

Your task: 모듈화 / 최적화 / 시간복잡도 / 패턴 + lint 통과 + test 통과 기준으로 리뷰합니다.
Write your output to: {TOPIC_DIR}/code-reviews/code-review-r{N}.md
Status line: 파일 끝에 "Status: PASS" 또는 "Status: FAIL"을 넣습니다.
```

완료 대기.

### 5단계: 결과 판정

`{TOPIC_DIR}/code-reviews/code-review-r{N}.md` 파일을 읽고 마지막의 `Status:` 라인을 파싱합니다:

- **PASS** → 6단계로.
- **FAIL** → `{TOPIC_DIR}/code-reviews/task-r{N+1}.md`를 생성하고 3단계로 되돌아갑니다. `task-r{N+1}.md`는 code-review-r{N}.md의 FAIL 항목을 d-{NNN-prime} × 3-step 체크박스로 치환합니다 (새 fix decision은 `d-fix-{seq}` 형식으로 부여해도 됨).
- 라운드 상한(`plan-config.md`의 `eval_rounds` 또는 `CLAUDE.md`의 `max_eval_rounds`)을 초과하면 9단계 에스컬레이션.

### 6단계: 커밋 정리 + 푸시

3단계의 d별 커밋이 이미 있으면 추가 커밋 없이 진행. staging에 남은 변경이 있으면 `chore({topic-slug}): finalize round {N}` 메시지로 단일 커밋.

현재 브랜치를 원격에 푸시:
```bash
git push -u origin $(git branch --show-current)
```

푸시 실패 시 오류 출력 후 계속 (반성은 로컬에서 생성 가능).

### 7단계: 반성

`Skill: flowness:internal-reflect, args="topic={TOPIC_DIR}"`

내부 스킬이 `{TOPIC_DIR}/reflection.md`를 작성합니다. 이 파일 존재가 토픽 완료 마커.

### 8단계: 완료 보고

사용자에게 출력:
- 토픽 코드 + 슬러그
- 총 라운드 수
- code-review-r{N} 결과 요약
- 생성/수정된 파일 목록
- 브랜치 이름 + 푸시 결과
- 다음 행동 제안 (`/evaluate {topic-code}` 또는 `/maintain learn`).

### 9단계: 에스컬레이션

라운드 상한 초과 시:
1. 최신 `code-review-r{N}.md`의 FAIL 항목 요약.
2. 미해결 이슈 목록.
3. 사용자 선택 질문 (`AskUserQuestion`):
   - `accept`: 현재 상태로 수용 (Status: FAIL 그대로 reflection.md 작성 후 종료).
   - `manual`: 사용자가 직접 수정하고 싶음 → 현재 상태에서 종료, 사용자 복귀 후 `/work {topic}` 재실행으로 이어감.
   - `abort`: 토픽 포기 (reflection.md에 `status: aborted` 기록).

## 중요 규칙

- **직접 코드를 작성하거나 리뷰하지 마세요** — Generator 에이전트와 code-reviewer 에이전트에 위임합니다.
- **task.md / task-r{N}.md 체크박스는 반드시 원자적으로 업데이트합니다** — step 완료 직후 즉시 Edit.
- **Worktree를 만들지 마세요** — 직교 원칙. 사용자가 필요하면 `/using-worktree`로 미리 처리.
- **parallel sub-task 전략은 없습니다** — 결정들은 직렬로 처리합니다 (동시 수정 race 회피).
- **다관점 리뷰어 호출 금지** — `code-reviewer` 단일. (과거의 rule/quality/security/performance/architecture reviewer 에이전트는 삭제됨.)
- **TDD가 필요하면 `/work-tdd`를 대신 사용하세요** — 본 스킬은 비-TDD 3-step 모드.
