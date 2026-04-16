---
topic: H20260416065800
slug: work-path-integration
date: 2026-04-16
status: done
---

# Reflection: /work 및 내부 스킬 경로 통합

## 1. 요약

직전 토픽 `H20260416152940_design-doc-split`이 도입한 새 하네스 구조(`harness/topics/`, `harness/meetings/`)에 맞춰 `/work` 및 내부 스킬 전체를 한 번에 경로 마이그레이션했다. design-doc의 d-001 ~ d-010을 순차 실행했고, 검증 grep이 모두 0건으로 통과.

## 2. 변경된 파일

| 파일 | 변경 요지 |
|------|----------|
| `skills/setup/SKILL.md` | 스캐폴딩 트리를 `topics/` + `meetings/` 중심으로 교체, 완료 마커 정책 문서화 |
| `skills/work/SKILL.md` | `exec-plans/active/` → `topics/`, spec 경로를 topic 내부로, active→completed 이동 단계 제거 |
| `skills/internal-generate/SKILL.md` | 모든 경로 교체 + `spec` 파라미터 제거 (topic 디렉토리로부터 유도) |
| `skills/internal-review/SKILL.md` | 모든 경로 교체 |
| `skills/internal-reflect/SKILL.md` | 읽기/쓰기 대상을 `topics/{topic}/`로 통일, 별도 이동 없음 |
| `skills/internal-learn/SKILL.md` | 스캔 대상: `topics/*/reflection.md`, reflection.md = 완료 마커 |
| `skills/evaluate/SKILL.md` | `active|completed` 분기 제거, 단일 topic 경로 |
| `skills/maintain/SKILL.md` | doc-garden 대상을 `meetings/` + `topics/`로 갱신, tech-debt-tracker 경로 조정 |
| `.claude-plugin/plugin.json` | `0.1.18` → `0.1.19` |
| `CLAUDE.md` | "알려진 통합 공백" 섹션 제거, 활성 토픽에 본 토픽 추가 |

## 3. 검증 결과

| 항목 | 결과 |
|------|------|
| `grep -r "harness/exec-plans" skills/` | 0건 ✓ |
| `grep -r "harness/product-specs" skills/` | 0건 ✓ |
| `scripts/list-topics.mjs` 실행 | 본 토픽이 출력됨 (state=initialized: design-doc 단일 파일 구조 때문) |
| `scripts/topic-state.mjs H20260416065800` | 에러 없이 실행, Meeting/Artifacts 정상 표시 |
| `.claude-plugin/plugin.json` | `0.1.19` 확인 |
| 벤치마크 미수정 | 확인 |

## 4. 학습 후보

### 4.1 아키텍처 발견

- **design-doc 단일 파일 토픽을 state 분류가 인식하지 못함**  
  `scripts/lib/harness-fs.mjs`의 `classifyTopicState`가 `spec.md` + `plan.md`를 기준으로 상태를 판정한다. 본 토픽처럼 `design-doc.md` 하나로 WHAT+HOW를 합친 경우는 `initialized`로 떨어진다. 두 가지 선택지:
  1. `classifyTopicState`에 "design-doc 단일 파일" 케이스를 추가 (design-doc.md 존재 && reflection.md 부재 → working, reflection.md 존재 → done).
  2. design-doc 단일 파일 패턴을 지양하고 spec.md + plan.md를 강제.

  **권장**: 옵션 1. 순수 내부 refactor 토픽에 spec.md를 강제하는 것은 과도한 형식주의.

### 4.2 반복된 위반

- 없음 (단일 목적 refactor).

### 4.3 평가 기준 격차

- `eval-criteria/`가 직접적으로 적용되지 않는 "하네스 자체 수정" 토픽에 대한 가이드라인 부재. 본 토픽 같은 경우 `/evaluate`를 실행할 대상이 없다 (UI도 없고 서버도 없음). 향후 harness-self-modification 전용 eval-criteria를 고려할 수 있으나, 현재는 design-doc의 "검증 기준" 섹션이 그 역할을 대신한다.

### 4.4 품질 패턴

- **File-Truth 기반 path refactor는 `replace_all: true`를 쓰지 않고 문단 단위 Edit을 사용해야 의미 보존이 쉽다** — 동일한 경로 토큰이 다른 맥락(읽기용/쓰기용/하위경로)에서 등장하므로, 전역 치환은 의도치 않게 의미를 뒤섞을 위험이 있었다. 실제로 본 refactor 전체를 문단 단위 Edit으로 수행했고 결과가 깔끔했다.

### 4.5 잘 작동한 점

- design-doc의 d-001 ~ d-010 단위가 그대로 실행 순서가 되어 "브레인스토밍 없이 바로 적용" 가능했다. 후속 정리 작업(clean-up topic) 패턴은 design-doc를 가볍게 써도 충분히 돌아간다.
- `scripts/*.mjs`가 새 구조를 곧바로 읽어냈다 — 본 토픽 자체가 새 구조의 dogfooding 사례.
- `grep` 기반 검증 단계가 경로 누락 zero를 보장했다.

## 5. 남은 과제

- `scripts/lib/harness-fs.mjs::classifyTopicState`에 design-doc 단일 파일 케이스 추가 (위 4.1 참조). → 별도 토픽 또는 `/maintain` 세션에서 처리.
- 기존 `harness/exec-plans/` 및 `harness/product-specs/` 데이터(플러그인 자체 리포에 존재한다면)는 수동 확인 필요. 현재는 존재하지 않는 것으로 확인됨.

## 6. 상태

**처리 대기 중** — `/maintain learn`으로 교차 토픽 집계 대상에 포함.
