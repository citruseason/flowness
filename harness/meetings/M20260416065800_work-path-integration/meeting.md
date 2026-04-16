---
code: M20260416065800
slug: work-path-integration
title: "/work 및 내부 스킬의 경로 참조를 신규 harness 구조로 통합"
status: confirmed
created: 2026-04-16T06:58:00Z
updated: 2026-04-16T06:58:00Z
participants:
  - user
  - claude
outputs:
  - topic: H20260416065800_work-path-integration
    kind: design-doc
---

# 회의 요약

## 문제 정의

직전 토픽 `H20260416152940_design-doc-split`에서 `/meeting`과 `/design-doc` 스킬을 도입하면서 하네스 산출물 디렉토리가 다음과 같이 바뀌었다.

| 이전 | 신규 |
|------|------|
| `harness/exec-plans/active/{topic}/` | `harness/topics/{topic}/` |
| `harness/exec-plans/completed/{topic}/` | `harness/topics/{topic}/` (reflection.md 존재로 완료 구분) |
| `harness/product-specs/{spec}.md` | `harness/topics/{topic}/spec.md` |

그러나 `/work`를 포함한 후속 파이프라인은 여전히 예전 경로를 읽는다. 결과: `/design-doc`이 만든 산출물을 `/work`가 소비하지 못한다. `/meeting → /design-doc → /work` 플로우가 끊긴 상태다.

직전 토픽의 설계 범위(§1 비목표)는 `/work` 변경을 제외했지만, 동 설계의 Success Criterion #1은 "전체 흐름이 새 디렉토리 구조에서 끊김 없이 동작"을 요구한다. 본 토픽에서 이 통합 공백을 닫는다.

## 확정된 결정 사항

### 1. 범위를 "경로 통합과 그에 따른 최소 로직 제거"로 한정

- `/work`의 루프 구조, Generator/Reviewer/Evaluator의 책임, Reflector의 분석 로직은 변경하지 않는다.
- 파일 경로 참조만 교체한다.
- 예외적 로직 변경: `/work`의 "active → completed 이동" 단계는 제거한다. 신규 구조는 reflection.md 존재가 완료 마커이므로 디렉토리 이동이 의미가 없다.

### 2. 적용 대상 파일 (8개)

| 파일 | 변경 유형 |
|------|-----------|
| `skills/setup/SKILL.md` | 스캐폴딩 대상 디렉토리 교체 (`exec-plans`, `product-specs` 제거, `topics`, `meetings` 추가) |
| `skills/work/SKILL.md` | topic dir 경로 + 사양 위치 + "이동" 단계 제거 |
| `skills/internal-generate/SKILL.md` | 경로 참조만 |
| `skills/internal-review/SKILL.md` | 경로 참조만 |
| `skills/internal-reflect/SKILL.md` | 경로 참조 + 대상 디렉토리를 `harness/topics/{topic}/`로 (이동 없음) |
| `skills/internal-learn/SKILL.md` | `harness/topics/*/reflection.md` 스캔 |
| `skills/evaluate/SKILL.md` | 경로 참조만 |
| `skills/maintain/SKILL.md` | 경로 참조만 |

### 3. 제품 사양(spec) 경로 처리

`/work`와 `internal-generate`가 `harness/product-specs/{spec}`를 읽던 곳은 모두 `harness/topics/{topic}/spec.md`로 교체한다. Generator 입장에서 파일 이름이 바뀔 뿐 형식은 마크다운으로 동일하다. 새 `spec.md`는 결정 블록(f-*)을 포함하지만 Generator는 전체를 마크다운으로 읽으므로 영향 없음.

### 4. `active/` → `completed/` 이동 단계 제거

`/work` SKILL.md 6단계의 "토픽을 active/에서 completed/로 이동"을 제거한다. 대신 6단계 완료 시 reflection.md를 `harness/topics/{topic}/reflection.md`에 작성한다 (이미 internal-reflect가 생성함). 추가 파일 이동 없음.

### 5. 기존 데이터 마이그레이션 정책

이미 완료했거나 진행 중인 `harness/exec-plans/*`는 그대로 방치. 사용자가 필요 시 수동 이관. 자동 마이그레이션 도구는 만들지 않는다.

### 6. 버전 관리

본 토픽 종료 시 `plugin.json`을 `0.1.19`로 패치 증가.

### 7. 검증 기준

1. `scripts/list-topics.mjs`가 `/work` 실행 중인 토픽을 `working` 상태로 표시한다.
2. `scripts/topic-state.mjs`가 reflection.md 생성 즉시 `done` 상태로 표시한다.
3. Grep 결과에 `harness/exec-plans/` 또는 `harness/product-specs/` 참조가 `skills/` 하위에 남아 있지 않다.
4. 벤치마크 프로젝트(`benchmark/currency-calculator/`)는 영향 받지 않는다 (별도 데이터셋).

## Open Questions

없음.

## 다음 단계

- `H20260416065800_work-path-integration` 토픽 개설 완료.
- design-doc에서 위 결정 사항을 확정 후 실제 파일 편집 진행.
