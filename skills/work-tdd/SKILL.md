---
name: work-tdd
description: Execute a topic's build loop with Test-Driven Development. Uses task.md (d-NNN × step checkboxes) as the persistent tracker. Runs 5 steps per decision (RED → GREEN → REFACTOR → REVIEW → COMMIT), then calls a single code-reviewer after all checkboxes are ticked. For non-TDD builds, use /work instead.
description-ko: 토픽의 빌드 루프를 TDD(테스트 주도 개발)로 실행합니다. `task.md`(d-NNN × step 체크박스)를 영속 트래커로 사용합니다. 결정마다 5단계(RED → GREEN → REFACTOR → REVIEW → COMMIT)를 수행하고, 모든 체크박스 완료 후 `code-reviewer`를 1회 호출합니다. 비-TDD 빌드는 `/work`를 사용하세요.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Skill, Agent
argument-hint: "<topic-code>"
---

# /work-tdd — TDD 빌드 루프

당신은 Flowness harness 엔지니어링 워크플로우의 **빌드 오케스트레이터**입니다 (TDD 모드).

## 설계 원칙 (M20260416071814 결정 1~4)

- **task.md가 진실** — 세션 메모리에 의존하지 않습니다. d-NNN × step 체크박스가 파일에 박혀 있어 어느 시점에 세션을 재개해도 결정론적으로 이어갈 수 있습니다.
- **Worktree 직교** — 본 스킬은 worktree를 만들지 않습니다. 격리가 필요하면 `/using-worktree`로 먼저 생성하세요.
- **단일 code-reviewer** — `task.md` 완료 후 1회만 `code-reviewer` 에이전트를 호출합니다.
- **재작업은 `code-reviews/task-r{N}.md`에** — FAIL 시 fix task 체크박스 파일을 다음 라운드 번호로 생성하고 동일 루프를 다시 탑니다.
- **TDD 강제** — RED 단계 없이 구현 코드를 작성하지 않습니다 (`flowness:internal-tdd` 스킬의 Iron Law 준수).

## 자동 진행 규칙

**중단 없이 모든 단계를 순차 실행합니다.** 단계 사이에 확인을 요구하지 마세요. Skill 호출 후 결과를 파싱하고 즉시 다음 단계로.

사용자에게 텍스트를 출력하는 시점은 **오직**: 최종 성공 보고 (8단계), 에스컬레이션 (9단계), 복구 불가능한 오류.

## 입력

토픽 코드: `$ARGUMENTS`.

## 프로세스

### 0단계: 전제 조건 확인 + 재개 감지

1. `git rev-parse --show-toplevel` → `PROJECT_ROOT`.
2. 토픽 디렉토리 찾기:
   ```
   Glob: {PROJECT_ROOT}/harness/topics/{$ARGUMENTS}_*/
   ```
   없으면 `/meeting` → `/design-doc`을 먼저 실행하도록 안내하고 종료.
3. 토픽 디렉토리를 `TOPIC_DIR`로 캡처.
4. 필수 파일: `{TOPIC_DIR}/plan.md`.
5. **재개 감지**: (`/work`와 동일 로직, 단계 차이는 step 집합만)
   - `{TOPIC_DIR}/task.md` 없음 → 2단계.
   - `task.md` 존재 + 미완료 체크박스 → 3단계 (첫 미완료 d-NNN/step에서 이어감).
   - `task.md` 모두 체크됨 + `code-reviews/code-review-r{N}.md` 없음 → 4단계.
   - `code-review-r{N}.md` PASS + `reflection.md` 없음 → 7단계.
   - `code-review-r{N}.md` FAIL + `code-reviews/task-r{N+1}.md` 없음 → 5단계.
   - `code-reviews/task-r{N+1}.md` 존재 + 미완료 → 3단계 (대상을 `task-r{N+1}.md`로).

### 1단계: 컨텍스트 로드

- `{PROJECT_ROOT}/CLAUDE.md`
- `{PROJECT_ROOT}/ARCHITECTURE.md`
- `{TOPIC_DIR}/spec.md` / `plan.md` / `decisions.md` / `plan-config.md`
- `{PROJECT_ROOT}/harness/rules/*/SKILL.md` (적용 가능한 것)
- `flowness:internal-tdd` 스킬 정의 (RED/GREEN/REFACTOR 참조)

### 2단계: `task.md` 자동 파생

없으면 다음 형식으로 생성:

```markdown
---
topic: {topic-code}
round: 1
mode: work-tdd
steps: [RED, GREEN, REFACTOR, REVIEW, COMMIT]
---

# Task — {topic-slug} (round 1, TDD)

plan.md에서 자동 파생. 기존 파일이 있으면 덮어쓰지 않습니다 (수동 편집 보호).

## d-001: {plan.md의 d-001 제목}
- [ ] RED       (실패하는 테스트 작성)
- [ ] GREEN     (테스트 통과 최소 구현)
- [ ] REFACTOR  (중복 제거 / 가독성 개선)
- [ ] REVIEW    (셀프 lint/test 검증)
- [ ] COMMIT

## d-002: ...
```

`plan.md`에 `d-NNN`이 없으면 에러 후 종료.

### 3단계: Task 루프

현재 대상 체크박스 파일 `TASK_FILE`:
- 라운드 1: `{TOPIC_DIR}/task.md`
- 라운드 N (N > 1): `{TOPIC_DIR}/code-reviews/task-r{N}.md`

각 d-NNN 블록에 대해 미완료 step을 위→아래 순서로 처리합니다.

#### 3a. RED (실패 테스트 작성)

Agent 도구로 Generator를 호출합니다 (`subagent_type: flowness:generator`):

```
Mode: work-tdd, step: RED
Round: {N}
Project root: {PROJECT_ROOT}
Topic directory: {TOPIC_DIR}
Current decision: d-{NNN} — {title}

Files to read:
- {TOPIC_DIR}/plan.md   ← d-{NNN} 블록 정독
- {TOPIC_DIR}/spec.md
- {PROJECT_ROOT}/ARCHITECTURE.md
- Applicable rule folders

Your task (Iron Law):
- d-{NNN}의 요구 사항을 검증할 **실패하는 테스트**를 작성합니다.
- 아직 구현 코드는 작성하지 않습니다.
- 테스트를 실행해 RED 상태(의도한 실패)를 확인합니다.
- 결과를 stdout에 요약 (어떤 테스트 파일에 몇 개의 실패하는 케이스를 추가했는지).
```

완료 후 `TASK_FILE`의 `- [ ] RED`를 `- [x] RED`로 Edit.

#### 3b. GREEN (최소 구현)

Generator 재호출:

```
Mode: work-tdd, step: GREEN
... (동일 컨텍스트)
Your task:
- 3a에서 작성된 실패 테스트를 **통과시키는 최소한의 구현**만 작성합니다.
- 과도한 추상화 금지, 테스트를 녹색으로 만들기 위한 최소 코드.
- 테스트를 실행해 GREEN 상태 확인.
```

완료 후 `- [ ] GREEN` → `- [x] GREEN` Edit.

#### 3c. REFACTOR

Generator 재호출:

```
Mode: work-tdd, step: REFACTOR
... (동일 컨텍스트)
Your task:
- GREEN 상태를 유지하면서 중복 제거, 명명 개선, 가독성 향상을 수행합니다.
- 공개 API / 행동은 변경하지 않습니다 (테스트가 변함없이 통과해야 함).
- 변경할 것이 없으면 "No refactor needed"로 보고 후 종료.
```

완료 후 `- [ ] REFACTOR` → `- [x] REFACTOR` Edit.

#### 3d. REVIEW (셀프 검증)

프로젝트 관례에 맞는 lint/test 명령 실행 (CLAUDE.md의 `test_command`/`lint_command`). 실패 시 Generator를 재호출해 수정. 셀프 검증이 통과하면 `- [ ] REVIEW` → `- [x] REVIEW` Edit.

#### 3e. COMMIT

```bash
cd {PROJECT_ROOT}
git add -A
git diff --cached --quiet && echo "no changes" || \
  git commit -m "feat({topic-slug}): d-{NNN} {short title} (TDD)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

`- [ ] COMMIT` → `- [x] COMMIT` Edit.

다음 d-NNN으로 진행. 모든 d-NNN 완료 시 4단계로.

### 4단계: code-reviewer 1회 호출

(`/work` 4단계와 동일. 단, 리뷰어 프롬프트에 "이 토픽은 TDD 모드로 진행되었으므로 테스트 커버리지 검증을 중점에 두세요"를 추가.)

Agent 도구로 `code-reviewer` 호출 (`subagent_type: flowness:code-reviewer`):

```
Mode: work-tdd
Round: {N}
Project root: {PROJECT_ROOT}
Topic directory: {TOPIC_DIR}
Task file: {TASK_FILE}

Files to read:
- {TOPIC_DIR}/spec.md
- {TOPIC_DIR}/plan.md
- {PROJECT_ROOT}/ARCHITECTURE.md
- {PROJECT_ROOT}/CLAUDE.md
- git diff (최근 라운드 커밋들)

Your task: 모듈화 / 최적화 / 시간복잡도 / 패턴 + lint 통과 + test 통과 + TDD 커버리지 기준으로 리뷰합니다.
Write your output to: {TOPIC_DIR}/code-reviews/code-review-r{N}.md
Status line: 파일 끝에 "Status: PASS" 또는 "Status: FAIL".
```

### 5단계: 결과 판정

(`/work` 5단계와 동일)

- **PASS** → 6단계.
- **FAIL** → `{TOPIC_DIR}/code-reviews/task-r{N+1}.md` 생성 + 3단계로 복귀.
- 라운드 상한 초과 → 9단계.

fix task 생성 시 새 d-fix 결정마다 5-step(RED/GREEN/REFACTOR/REVIEW/COMMIT) 체크박스를 유지합니다.

### 6단계: 커밋 정리 + 푸시

```bash
git push -u origin $(git branch --show-current)
```

실패 시 오류 출력 후 계속.

### 7단계: 반성

`Skill: flowness:internal-reflect, args="topic={TOPIC_DIR}"`

### 8단계: 완료 보고

토픽 코드, 라운드 수, 리뷰 결과, 파일 변경 목록, 브랜치, 푸시 상태, 다음 행동 제안.

### 9단계: 에스컬레이션

(`/work` 9단계와 동일 — `AskUserQuestion`으로 accept/manual/abort 선택.)

## 중요 규칙

- **Iron Law of TDD** — RED 없이 GREEN 단계의 구현 코드를 작성하지 마세요. Generator 프롬프트가 이를 강제합니다.
- **task.md / task-r{N}.md는 원자적으로 업데이트합니다** — step 완료 직후 즉시 Edit.
- **Worktree를 만들지 마세요** — 사용자가 `/using-worktree`로 미리 처리.
- **병렬 sub-task 전략은 없습니다** — 결정을 직렬 처리.
- **code-reviewer 단일 호출** — 과거 5 reviewer 에이전트는 삭제되었습니다.
- **비-TDD가 적절하면 `/work`를 사용하세요** — UI prototype 등.
