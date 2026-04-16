---
topic: T20260416081240
slug: using-worktree-skill
status: completed
completed_at: 2026-04-16
mode: direct-from-meeting
source_meeting: M20260416071814
---

# Reflection — using-worktree-skill

## 개요

M20260416071814 회의 **결정 5**(worktree 직교 + 사용자 호출 스킬화)를 구현했다. 시간 제약으로 `/design-doc`(spec.md/plan.md) 단계를 생략하고 meeting.md의 확정 사항을 직접 코드로 반영했다.

## 변경 사항

- `skills/internal-worktree/` → `skills/using-worktree/` 로 이름 변경 (`git mv`)
- frontmatter 재작성:
  - `user-invocable: true`
  - `allowed-tools: Bash, Read, Glob, AskUserQuestion`
  - `argument-hint: "[setup {label} | cleanup {label} | list]"`
- 본문을 3 operation(setup/cleanup/list)로 재설계:
  - 현재 브랜치가 `main`/`master`일 때는 자동으로 `work/{label}` 새 브랜치 생성
  - 그 외 브랜치에서는 `AskUserQuestion`으로 reuse vs branch 선택을 사용자에게 물음
  - setup은 멱등 — 이미 존재하면 경로만 출력
- 병렬 sub-task 관련 연산(create-subtask/merge-subtasks/cleanup-subtask) 제거 — 병렬 sub-task 개념 자체가 폐기됨 (결정 1)

## 결정의 검증

| 의도 | 실제 |
|---|---|
| `/work`가 worktree를 만들지 않게 함 | 달성 — `skills/work/SKILL.md`에 worktree 호출 없음 |
| 사용자가 원하는 시점에만 격리 | 달성 — `/using-worktree setup`을 직접 호출 |
| 자동 브랜치 정책 (main/master) | 달성 — 묻지 않고 `work/{label}` 자동 생성 |
| 다른 브랜치에서 명시적 선택 | 달성 — AskUserQuestion |

## 배운 점 / 주의 사항

- `git mv`로 스킬 파일을 이동한 직후 Write로 전체 재작성할 때는 먼저 새 경로를 Read 해야 한다 (세션 read-state 관리).
- `AskUserQuestion` 사용은 자동 진행 원칙과 충돌할 수 있어 "main/master일 때만 자동 분기"로 타협했다.

## 남은 항목

- `/setup`이나 CLAUDE.md의 worktree 가이드 문구(있으면) 업데이트 — 본 토픽 범위 밖.
- `using-worktree` 호출 예시를 harness 샘플 플로우에 포함할지 검토.
