---
topic: T20260416081244
slug: work-task-tracking
status: completed
completed_at: 2026-04-16
mode: direct-from-meeting
source_meeting: M20260416071814
---

# Reflection — work-task-tracking

## 개요

M20260416071814 회의 **결정 1**(파일 기반 task.md 채택) 및 **결정 4**(라운드 파일 레이아웃)를 구현했다. 시간 제약으로 design-doc 단계를 생략하고 meeting.md에서 직접 구현으로 넘어갔다.

## 변경 사항

`skills/work/SKILL.md` 전체 재작성:

- 세션 메모리 기반 `TaskCreate` / `TaskUpdate` / `TaskList` 사용 제거
- `task.md`를 진실의 원천으로 도입:
  - frontmatter: `topic`, `round`, `mode: work`, `steps: [GENERATE, REVIEW, COMMIT]`
  - d-NNN × 3 체크박스 행
- 0단계 재개 로직을 파일 존재/체크박스 상태로 재작성
- 2단계: `plan.md`의 `d-NNN`에서 `task.md` 자동 파생
- 3단계: 체크박스를 "위에서 아래로" 직렬 처리, step 완료 직후 원자적 Edit
- `code-reviews/` 폴더 도입:
  - `code-review-r{N}.md` — 리뷰 결과
  - `task-r{N}.md` — FAIL 시 다음 라운드 fix task
- worktree 호출 제거 (결정 5에 따라 orthogonal)

## 결정의 검증

| 의도 | 실제 |
|---|---|
| 세션 재개 결정론성 | 달성 — `task.md` + 파일 존재 조건으로 분기 지점 판정 |
| `plan.md`의 d-NNN과 직접 연결 | 달성 — task.md가 d-NNN을 그대로 헤딩으로 사용 |
| 라운드별 상태를 로컬에 보관 | 달성 — `code-reviews/code-review-r{N}.md` + `task-r{N}.md` |
| 병렬 sub-task 제거 | 달성 — 결정을 직렬 처리 |

## 배운 점 / 주의 사항

- `task.md`가 수동 편집되어 있을 수도 있어, 2단계에서는 기존 파일을 **덮어쓰지 않는다** 규칙을 명시했다.
- 체크박스 업데이트는 **각 step 완료 직후** 원자적으로 Edit해야 재개 지점이 명확하다.

## 남은 항목

- 실제 `/work` 실행 경험을 누적한 뒤 `task.md` 포맷 튜닝.
- `scripts/topic-state.mjs`가 `code-reviews/code-review-r{N}.md`의 PASS/FAIL을 보도록 확장 (별도 토픽).
