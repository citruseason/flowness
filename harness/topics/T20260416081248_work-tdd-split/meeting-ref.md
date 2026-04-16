---
topic: T20260416081248
slug: work-tdd-split
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

- **결정 2 (TDD 분기)**: `/work` (3-step: GENERATE → REVIEW → COMMIT) vs `/work-tdd` (5-step: RED → GREEN → REFACTOR → REVIEW → COMMIT) 별도 스킬 파일로 분리.
- **결정 2 (공유 로직)**: 두 스킬 파일을 복사 유지. DRY 위반 수용 (LLM 컨텍스트 친화).
- **internal-tdd 통합**: 기존 `skills/internal-tdd/SKILL.md`의 RED/GREEN/REFACTOR/COMMIT 정의를 `/work-tdd`의 정식 루프로 흡수. Generator 에이전트에게 step 지시를 명시.
- **step 칼럼**: 선행 토픽 `T20260416081244_work-task-tracking`에서 확정한 `task.md`의 step 칼럼 스펙을 따른다.

## 의존 관계

- **선행**: `T20260416081244_work-task-tracking` (task.md step 칼럼).
- **후속**: 없음 (독립).

## 참조 규칙

- meeting의 내용을 복사해 design-doc에 붙여넣지 않는다.
- meeting의 슬러그가 바뀌어도 코드는 불변이므로 참조가 깨지지 않는다.
