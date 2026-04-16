---
topic: H20260416065800
slug: work-path-integration
title: "/work 및 내부 스킬의 harness 경로 참조 통합"
status: draft
source_meetings:
  - M20260416065800
created: 2026-04-16T06:58:00Z
updated: 2026-04-16T06:58:00Z
---

# Design Doc: /work 및 내부 스킬 경로 통합

직전 토픽 `H20260416152940_design-doc-split`이 남긴 **알려진 통합 공백**을 닫는다. 본 토픽은 UX가 변하지 않는 순수 내부 refactor이므로 `spec.md`(WHAT)를 생략하고 이 design-doc 하나에 WHAT(=문제)과 HOW(=변경 상세)를 함께 기술한다.

## 1. 목적 및 비목표

### 목적

`/meeting` → `/design-doc` → `/work` 흐름이 새 하네스 구조(`harness/topics/`, `harness/meetings/`)에서 끊김 없이 동작하도록 경로 참조를 통합한다.

### 비목표

- `/work` 루프 구조, Generator/Reviewer/Evaluator/Reflector 책임 변경
- 학습 시스템 알고리즘 변경
- 기존 `harness/exec-plans/*` 데이터 자동 이관
- 벤치마크 프로젝트 데이터 이관

## 2. 경로 매핑

| 이전 | 신규 |
|------|------|
| `harness/exec-plans/active/{topic}/` | `harness/topics/{topic}/` |
| `harness/exec-plans/completed/{topic}/` | `harness/topics/{topic}/` (reflection.md 존재로 구분) |
| `harness/product-specs/{spec}.md` | `harness/topics/{topic}/spec.md` |

## 3. 변경 단위 (Decision Units)

### d-001 — `/setup` 스캐폴딩 교체

`skills/setup/SKILL.md` 4단계의 디렉토리 트리와 언급에서 `product-specs/`, `exec-plans/active/`, `exec-plans/completed/`를 제거하고 `topics/`, `meetings/`를 추가한다. 관련 문서(README 문구, Index 링크)도 조정.

### d-002 — `/work` 경로 교체 + 이동 단계 제거

`skills/work/SKILL.md`:

- `harness/exec-plans/active/{topic}/` → `harness/topics/{topic}/`
- `harness/product-specs/{spec}` 참조 → `harness/topics/{topic}/spec.md`
- 6단계의 "active/에서 completed/로 이동" 로직 제거. reflection.md 생성이 완료 마커이므로 이동 불필요.
- 0단계 재개 로직의 `completed/` 존재 확인 → `reflection.md` 존재 확인으로 대체.

### d-003 — `/internal-generate` 경로 교체

`skills/internal-generate/SKILL.md`의 모든 path 토큰 교체. 스킬 로직 불변. product-spec 참조는 `{topic-dir}/spec.md`로.

### d-004 — `/internal-review` 경로 교체

`skills/internal-review/SKILL.md`의 모든 path 토큰 교체.

### d-005 — `/internal-reflect` 경로 교체 + 위치 조정

`skills/internal-reflect/SKILL.md`:

- 읽기 대상: `harness/exec-plans/completed/{topic}/` → `harness/topics/{topic}/`
- 쓰기 대상: 동일 디렉토리의 `reflection.md`. 별도 이동 단계 없음.

### d-006 — `/internal-learn` 스캔 대상 교체

`skills/internal-learn/SKILL.md`: `harness/exec-plans/completed/*/reflection.md` → `harness/topics/*/reflection.md`로 스캔 대상 변경. reflection.md 존재만으로 완료 여부를 판단한다.

### d-007 — `/evaluate` 경로 교체

`skills/evaluate/SKILL.md`의 `exec-plans/active/`, `exec-plans/completed/` 참조를 `harness/topics/`로 통합.

### d-008 — `/maintain` 경로 표현 정돈

`skills/maintain/SKILL.md`에서 `product-specs/` 관련 언급을 `harness/topics/*/spec.md`로 수정. 큰 로직 변경은 없음.

### d-009 — `plugin.json` 버전 증가

`0.1.18` → `0.1.19`.

### d-010 — CLAUDE.md "알려진 통합 공백" 섹션 제거

공백이 해소되었으므로 해당 섹션을 삭제한다. 활성 토픽 섹션에 본 토픽을 추가.

## 4. 검증 기준

1. `grep -r "harness/exec-plans" skills/`의 결과가 0건.
2. `grep -r "harness/product-specs" skills/`의 결과가 0건.
3. `scripts/list-topics.mjs` 실행 후 본 토픽이 `working` 또는 완료 시 `done`으로 정확히 표시.
4. `scripts/topic-state.mjs H20260416065800` 실행이 에러 없이 작동.
5. 벤치마크 디렉토리(`benchmark/`)는 수정되지 않음.
6. `.claude-plugin/plugin.json`이 `0.1.19`.

## 5. 리스크

| 리스크 | 완화 |
|--------|------|
| 경로 치환 누락 | grep 기반 검증 단계 필수 |
| `active/` → `completed/` 이동 제거로 인한 재개 로직 오작동 | 재개 지점 판단을 `reflection.md` 존재로 단순화 |
| `product-specs/`를 참조하는 외부 파일 발견 | skills/ 외부는 수정하지 않음 (benchmark 등 데이터는 별도) |

## 6. 실행 순서

1. d-001 ~ d-008 파일별 수정
2. 검증 기준 1~2 실행 (grep)
3. d-009 (plugin.json 버전)
4. d-010 (CLAUDE.md)
5. reflection.md 작성 → 토픽 완료
