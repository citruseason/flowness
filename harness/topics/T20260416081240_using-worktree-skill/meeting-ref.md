---
topic: T20260416081240
slug: using-worktree-skill
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

- **결정 5 (Worktree 직교 원칙)**: `internal-worktree` → `using-worktree`로 rename, `user-invocable: true`로 변경.
- **결정 5 (브랜치 정책)**: main/master → 자동 새 브랜치 생성, 그 외 → `AskUserQuestion`으로 사용자 선택 ("현 브랜치에서 작업 vs 베이스로 새 브랜치 생성").
- **결정 5 (병렬 sub-task 제거)**: `create-subtask`, `merge-subtasks` 액션 삭제. 동시 토픽 작업이 필요하면 사용자가 `using-worktree`를 직접 여러 번 호출.
- **결정 5 (직교)**: `/work` SKILL.md에서 worktree 호출 코드를 제거 (이 토픽 범위 밖이지만 의존성 노출). 단, 본 토픽의 산출물에는 "이후 `work-task-tracking` 또는 별도 토픽에서 /work의 worktree 호출 제거" 항목을 포함.

## 참조 규칙

- meeting의 내용을 복사해 design-doc에 붙여넣지 않는다.
- meeting의 슬러그가 바뀌어도 코드는 불변이므로 참조가 깨지지 않는다.
