---
code: M20260416071814
slug: work-loop-redesign
title: "/work 루프 재설계 — 리뷰 / 태스크 트래킹 / TDD / Worktree 통합"
status: confirmed
created: 2026-04-16T07:18:14Z
updated: 2026-04-16T08:12:40Z
participants:
  - user
  - claude (brainstormer)
outputs:
  - topic: T20260416081240_using-worktree-skill
    kind: design-doc
  - topic: T20260416081244_work-task-tracking
    kind: design-doc
  - topic: T20260416081248_work-tdd-split
    kind: design-doc
  - topic: T20260416081252_work-review-collapse
    kind: design-doc
---

# 회의 요약

## 문제 정의

`/work` 스킬이 세 가지 비효율을 동시에 안고 있다:

1. **리뷰 사이클 비효율** — 라운드마다 5 reviewer (rule/quality/security/performance/architecture) 병렬 실행 + aggregate. 작은 변경에도 6 에이전트 호출 × N 라운드, 결과 파일(`code-review-r{N}[.{F}].md`) 누적으로 토큰 낭비.
2. **파일 기반 태스크 트래킹 부재** — 현재 `TaskCreate`/`TaskUpdate`로 세션 메모리에 추적. 세션 종료 시 소실되어 재개 시 파일에서 역추론해야 하고, design-doc의 `plan.md`(d-NNN)와 분리되어 있다.
3. **TDD / worktree 미성숙** — `internal-tdd` 정의는 있으나 `/work` 루프에 강제 통합되지 않음 (Generator 알아서 쓰기). worktree는 `.flowness-worktrees/{topic}[-NN]` 자동 관리이지만 사용 흐름이 superpowers 등 타 플러그인 대비 까다로움.

세 이슈는 얽혀 있다 — 리뷰 재설계는 태스크 트래킹 모델에 영향을 주고, 태스크 트래킹은 TDD 단계와 매핑되어야 한다. 따라서 통합 미팅으로 한 번에 다룬다.

## 확정된 결정 사항

### 1. 파일 기반 태스크 트래킹 — `task.md` 도입 (d-NNN × step 체크박스)

- 요약: 세션 메모리 `TaskUpdate` 대신 토픽 디렉토리에 `task.md`를 두고, `plan.md`의 d-NNN 결정 단위 × TDD step (또는 일반 step)을 체크박스 markdown 표로 추적.
- 근거: 세션 종료/재개 무관하게 파일이 진실 공급원. plan.md와 1:1 매핑되어 누락 검증 가능.
- 생성 시점: `/work` 0단계에서 `plan.md`를 읽고 `task.md`가 없으면 자동 파생, 있으면 보존(수동 편집 보호).

### 2. TDD 분기 — `/work` (3-step) vs `/work-tdd` (5-step) 스킬 분리

- 요약: TDD는 옵션이 아닌 명시적 의도. `/work-tdd` 슬래시 커맨드로 RED → GREEN → REFACTOR → REVIEW → COMMIT 5-step을, `/work`는 GENERATE → REVIEW → COMMIT 3-step을 강제한다.
- 근거: 사용자가 슬래시 커맨드를 칠 때 의도가 분명히 드러난다. UI prototype 등 TDD 부적절 케이스에 강제하지 않는다.
- 공유 로직: 두 스킬 파일을 별도 유지하고 공통 부분을 복사 (LLM 컨텍스트 친화 우선, DRY 위반 수용).

### 3. 리뷰어 단순화 — 5 reviewer 삭제 → `code-reviewer` 1명

- 요약: `rule-reviewer`, `quality-reviewer`, `security-reviewer`, `performance-reviewer`, `architecture-reviewer` 5 에이전트 삭제. 신규 `code-reviewer` 에이전트 1명이 모듈화 / 최적화 / 시간복잡도 / 패턴 + lint 통과 + test 통과를 검사.
- 근거: design-doc 단계에서 이미 다관점 리뷰(claude/codex/opus)가 완료되었으므로 work 단계는 단일 게이트로 충분. 토큰 사용량 ~1/6.
- 호출 시점: `task.md`의 모든 체크박스 완료 후 1회. 라운드별 매번 호출하지 않는다.
- 단, design-doc 전용 `design-doc-claude-reviewer`, `design-doc-codex-reviewer`, `design-doc-opus-reviewer` 3종은 존속.

### 4. 재작업 산출물 — `code-reviews/` 단일 폴더

- 요약: 토픽 디렉토리 하위에 `code-reviews/` 폴더를 두고 다음 두 종류 파일을 함께 보관.
  - `code-reviews/code-review-r{N}.md` — 라운드 N의 raw 리뷰 결과 (PASS/FAIL + 발견 사항)
  - `code-reviews/task-r{N}.md` — FAIL일 때 다음 라운드의 fix task 체크박스
- 근거: review 결과와 fix task가 같은 라운드 컨텍스트에 묶이므로 폴더 분리할 이유 없음.
- 흐름: 라운드 N FAIL → `task-r{N+1}.md` 생성 → /work이 이를 읽고 r{N+1} 진행 → 모두 체크 후 다시 code-reviewer → r{N+1} 결과 기록.

### 5. Worktree 직교 원칙 — `using-worktree` 스킬 (user-invocable)

- 요약: Worktree는 Flowness 워크플로우의 일부가 아닌, 사용자가 임의 시점에 호출하는 별도 도구. `internal-worktree` 스킬을 `using-worktree`로 rename하고 `user-invocable: true`로 변경.
- 근거: 팀 시나리오(여러 사람이 같은 토픽/다른 토픽에 동시 작업)에서 자동 worktree는 충돌 가능. 사용자 통제권이 안전. Claude Code의 worktree 체크박스 UX와 동일한 발상.
- 브랜치 정책:
  - 현재 브랜치가 `main`/`master` → 자동으로 새 브랜치 생성.
  - 그 외 → `AskUserQuestion`으로 "현 브랜치에서 작업 vs 베이스로 새 브랜치 생성" 사용자 선택.
- 병렬 sub-task 제거: `create-subtask`, `merge-subtasks` 액션 삭제. 동시 토픽 작업이 필요하면 사용자가 `using-worktree`를 직접 여러 번 호출.
- /work 영향: /work SKILL.md에서 worktree 호출 코드 제거.

### 6. 토픽 코드 prefix 정책 — H 유지 + T 신규 (점진 전환)

- 요약: 본 미팅이 분기하는 새 토픽 코드는 `T{ts}` prefix로 명명. 기존 `H{ts}` 토픽은 그대로 유지. 전체 H→T rename은 별도 후속 토픽에서 일괄 처리.
- 근거: 본 미팅 산출물에 무관한 대규모 rename(harness/topics/ 디렉토리 다수 + scripts 등)을 포함하지 않기 위함. 일시적 H/T 공존을 수용.
- 기술 전제조건 (본 미팅 confirm 시점에 적용 완료): `scripts/lib/harness-fs.mjs`의 디렉토리 필터/추출 정규식을 `H` → `[HT]` (extractCode/extractSlug) 및 `[HT]` (listTopicDirs)로 확장하여 새 T 토픽이 `scripts/list-topics.mjs`, `scripts/topic-state.mjs`에 인식되도록 함. 이는 데이터 마이그레이션이 아닌 호환성 추가이므로 R4 정신과 일관.
- 추후 H→T 일괄 rename 토픽에서 처리할 항목: 디렉토리명 변경, `meeting-ref.md`/`learning-log.md` 등 참조 갱신, 정규식에서 `H` 제거(필요 시).

## 분기 토픽 (확정)

| 코드 | 슬러그 | 범위 | 의존성 | 권장 진행 순서 |
|------|--------|------|-------|---------------|
| `T20260416081240` | `using-worktree-skill` | internal-worktree → using-worktree rename, user-invocable, AskUserQuestion 통합, sub-task 제거 | 독립 | 1 (작은 변경, 빠른 완료) |
| `T20260416081244` | `work-task-tracking` | task.md 도입, /work 0단계 자동 파생, plan.md ↔ task.md 매핑 | 독립 | 2 (3·4의 선행) |
| `T20260416081248` | `work-tdd-split` | /work-tdd 신규 스킬, /work 3-step 정리, internal-tdd 통합 | T20260416081244 (step 칼럼 매핑) | 3 |
| `T20260416081252` | `work-review-collapse` | 5 reviewer 에이전트 삭제, code-reviewer agent 신규, code-reviews/ 폴더 도입 | T20260416081244 (task.md 완료 게이트) | 4 |

## Open Questions

- 없음. (모든 축이 사용자 결정으로 확정됨. 분기 토픽 묶음 전략은 design-doc 단계에서 결정.)

## 다음 단계

1. ~~사용자 confirm~~ — 완료 (2026-04-16T08:12:40Z).
2. 4개 분기 토픽 디렉토리 scaffolding 완료 (`harness/topics/T*/meeting-ref.md`, `reviews/spec/`, `reviews/plan/`).
3. 새 세션에서 다음 순서로 `/design-doc` 호출 (각 토픽이 Agent Teams + 사용자 검토 게이트를 사용하므로 토픽당 별도 세션 권장):
   1. `/design-doc T20260416081240` — using-worktree-skill (독립, 가장 작은 변경)
   2. `/design-doc T20260416081244` — work-task-tracking (3·4의 선행)
   3. `/design-doc T20260416081248` — work-tdd-split
   4. `/design-doc T20260416081252` — work-review-collapse
4. 4개 토픽 모두 `/work` + reflection 완료 후, 별도 미팅에서 H→T 일괄 rename 토픽을 다룸 (R4 후속).
