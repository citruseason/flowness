---
topic: T20260416081244
slug: work-task-tracking
source_meetings:
  - M20260416071814
---

# Meeting Reference

이 토픽은 다음 회의의 확정 사항을 입력으로 사용한다.

## Source meetings

| Meeting code | Slug | Role |
|--------------|------|------|
| M20260416071814 | work-loop-redesign | primary |

## Paths

- `harness/meetings/M20260416071814_work-loop-redesign/meeting.md`
- `harness/meetings/M20260416071814_work-loop-redesign/brainstorms/2026-04-16-r1.md`

## 이 토픽이 다루는 결정 사항

- **결정 1 (`task.md` 도입)**: 토픽 디렉토리에 `task.md`를 두고 `plan.md`의 d-NNN × step (또는 일반 step)을 markdown 체크박스로 추적. `TaskCreate`/`TaskUpdate`(세션 메모리) 의존 제거.
- **결정 1 (자동 파생)**: `/work` 0단계에서 `plan.md`를 읽고 `task.md`가 없으면 자동 생성, 있으면 보존(수동 편집 보호).
- **plan.md ↔ task.md 매핑**: d-NNN 단위, step 칼럼 정의 (이 토픽이 step 칼럼 스펙을 확정 → `work-tdd-split`/`work-review-collapse`의 선행).
- **재개 모델**: 세션 종료 후 재개 시 `task.md`만으로 어디까지 진행했는지 결정론적 파악 가능.

## 의존 관계

- **선행**: 없음.
- **후속**: `T20260416081248_work-tdd-split`(step 칼럼 매핑), `T20260416081252_work-review-collapse`(task.md 완료를 code-reviewer 호출 게이트로 사용).

## 참조 규칙

- meeting의 내용을 복사해 design-doc에 붙여넣지 않는다.
- meeting의 슬러그가 바뀌어도 코드는 불변이므로 참조가 깨지지 않는다.
