---
topic: T20260416081252
slug: work-review-collapse
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

- **결정 3 (리뷰어 단순화)**: `rule-reviewer`, `quality-reviewer`, `security-reviewer`, `performance-reviewer`, `architecture-reviewer` 5 에이전트 삭제. 신규 `code-reviewer` 1명이 모듈화 / 최적화 / 시간복잡도 / 패턴 + lint 통과 + test 통과를 검사. (단, design-doc 전용 `design-doc-*-reviewer` 3종은 존속.)
- **결정 3 (호출 시점)**: `task.md`의 모든 체크박스 완료 후 1회. 라운드별 매번 호출하지 않음.
- **결정 4 (`code-reviews/` 폴더)**: 토픽 디렉토리 하위에 `code-reviews/` 단일 폴더를 두고 다음 두 종류 파일을 보관:
  - `code-reviews/code-review-r{N}.md` — 라운드 N의 raw 리뷰 결과 (PASS/FAIL + 발견 사항)
  - `code-reviews/task-r{N}.md` — FAIL일 때 다음 라운드의 fix task 체크박스
- **흐름**: 라운드 N FAIL → `task-r{N+1}.md` 생성 → `/work` 또는 `/work-tdd`이 이를 읽고 r{N+1} 진행 → 모두 체크 후 다시 `code-reviewer` → r{N+1} 결과 기록.
- **호환성 정리**: 기존 `internal-review` 스킬, `aggregator` 등 5-reviewer 잔재 제거. `plugin.json`의 agents 배열 정리.

## 의존 관계

- **선행**: `T20260416081244_work-task-tracking` (task.md 완료 게이트 = code-reviewer 호출 트리거).
- **후속**: 없음.

## 참조 규칙

- meeting의 내용을 복사해 design-doc에 붙여넣지 않는다.
- meeting의 슬러그가 바뀌어도 코드는 불변이므로 참조가 깨지지 않는다.
