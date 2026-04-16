---
topic: T20260416081248
slug: work-tdd-split
status: completed
completed_at: 2026-04-16
mode: direct-from-meeting
source_meeting: M20260416071814
---

# Reflection — work-tdd-split

## 개요

M20260416071814 회의 **결정 2**(TDD를 별도 스킬로 분리)를 구현했다. 시간 제약으로 design-doc 단계를 건너뛰고 meeting.md 기반으로 직접 개발했다.

## 변경 사항

- 신규 스킬 `skills/work-tdd/SKILL.md` 작성:
  - 5-step 사이클: RED → GREEN → REFACTOR → REVIEW → COMMIT (각 d-NNN당)
  - task.md frontmatter: `mode: work-tdd`, `steps: [RED, GREEN, REFACTOR, REVIEW, COMMIT]`
  - 각 step마다 Generator를 **재호출**하며 단계별 프롬프트에 Iron Law를 명시
  - 나머지 구조(0단계 재개, 2단계 자동 파생, 4단계 code-reviewer, 5단계 판정, 6단계 push, 7단계 reflection)는 `/work`와 동일 골격 공유
- `/work`의 description에 "TDD 기반 빌드는 `/work-tdd`를 사용하세요" 상호 안내 삽입
- `agents/generator.md` 재작성으로 Mode/Step 파라미터 지원:
  - 단일 단계만 실행하고 stdout 요약을 반환
  - 체크박스/커밋은 건드리지 않음 (오케스트레이터 소유)

## 결정의 검증

| 의도 | 실제 |
|---|---|
| TDD를 선택 사항으로 유지 | 달성 — `/work`는 비-TDD, `/work-tdd`가 TDD |
| TDD 단계를 강제 | 달성 — `/work-tdd`가 RED/GREEN/REFACTOR를 각각 Generator 호출로 분리 |
| Iron Law 준수 | 달성 — Generator의 RED 프롬프트가 "구현 코드 작성 금지"를 명시 |
| 두 스킬의 중복 감수 | 수용 — 결정 2의 "DRY보다 명시성" 기조 반영 |

## 배운 점 / 주의 사항

- 5-step 중 REFACTOR는 "변경 없음" 빈도가 높아 "No refactor needed" 즉시 종료 경로를 명시했다.
- Generator가 단계별로 재호출되므로, **상태 공유는 토픽 디렉토리/파일을 통해서만** 이루어진다. 세션 메모리 의존을 완전히 제거했다.
- 두 스킬이 구조적으로 거의 같아 향후 공통 블록을 `flowness:internal-*`로 재추출할 여지가 있지만, 현재는 섣부른 추상화를 피한다.

## 남은 항목

- 실제 프로젝트에서 `/work-tdd` 실행 경험 누적.
- 필요 시 Round > 1에서도 5-step을 그대로 유지할지, 아니면 fix task는 3-step으로 축약할지 검토 (현재는 5-step 유지).
