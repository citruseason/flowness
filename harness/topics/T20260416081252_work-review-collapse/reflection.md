---
topic: T20260416081252
slug: work-review-collapse
status: completed
completed_at: 2026-04-16
mode: direct-from-meeting
source_meeting: M20260416071814
---

# Reflection — work-review-collapse

## 개요

M20260416071814 회의 **결정 3**(리뷰어 단순화) 및 **결정 4**(`code-reviews/` 폴더 레이아웃)를 구현했다. 시간 제약으로 design-doc 단계를 생략하고 meeting.md 확정 사항을 직접 코드로 반영했다.

## 변경 사항

### 삭제
- `agents/rule-reviewer.md`
- `agents/quality-reviewer.md`
- `agents/security-reviewer.md`
- `agents/performance-reviewer.md`
- `agents/architecture-reviewer.md`
- `skills/internal-review/` (5-reviewer 병렬 파이프라인)
- `skills/internal-generate/` (TaskUpdate 기반 Generator 호출 래퍼)

### 신규
- `agents/code-reviewer.md` — 모듈화 / 최적화·시간복잡도 / 패턴 / lint / test + (work-tdd 한정) TDD 커버리지의 6축 리뷰를 단일 에이전트로 수행. `Status: PASS|FAIL` 라인을 파일 끝에 남김.

### 수정
- `skills/work/SKILL.md`, `skills/work-tdd/SKILL.md`: 4단계에서 `code-reviewer`를 **딱 1회** Agent 도구로 호출. 과거 "라운드마다 5 리뷰어 병렬" 구조 제거.
- `agents/generator.md`: 리뷰어 관련 재시도 지침을 `code-review-r{N-1}.md`로 일원화.
- `.claude-plugin/plugin.json`: 삭제된 5 에이전트 레퍼런스 제거, `code-reviewer` 추가, 버전 `0.1.20 → 0.1.21`.

## 결정의 검증

| 의도 | 실제 |
|---|---|
| 토큰 낭비 제거 | 달성 — 에이전트 호출 수 5 → 1, 라운드 호출 횟수 N → 1 |
| 파일 누적 완화 | 달성 — `code-review-r{N}.md` 1개 / 라운드 |
| FAIL 재작업 경로 명시 | 달성 — `task-r{N+1}.md` 생성 + 동일 루프 재진입 |
| 관점 분리 손실 완화 | 부분 달성 — 단일 리뷰어에 6축 섹션 강제; 깊은 security/perf 심사는 `/maintain`으로 이관 |

## 배운 점 / 주의 사항

- 5 에이전트를 병렬로 돌리던 시절의 속도 이득은 크지 않았다 (Agent 호출 오버헤드가 병렬화 이득과 상쇄). 단일 호출이 실질적으로 더 빠르고 저렴하다.
- `Status:` 파싱을 위해 리뷰어 출력 형식을 강제할 필요가 있다 (프롬프트에 명시).
- 기존 토픽들이 남긴 `code-review-r{N}[.{F}].md`, `aggregate-r{N}.md` 레거시 파일은 본 토픽 범위 밖이며, `/maintain` 단계에서 청소 후보로 남긴다.

## 남은 항목

- 실제 `/work` / `/work-tdd` 실행에서 `code-reviewer`가 놓치는 축이 있는지 모니터링.
- 필요하면 `harness/rules/` 쪽에 security/perf 전용 규칙을 보강해 패턴 축의 커버리지를 끌어올린다.
- 과거 토픽의 레거시 리뷰 파일 정리 (별도 `/maintain` 작업).
