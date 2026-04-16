---
code: M20260416152940
slug: design-doc-split
title: "/plan 분해 — meeting + design-doc 스킬 재설계"
status: confirmed
created: 2026-04-16T06:29:40Z
updated: 2026-04-16T06:29:40Z
participants:
  - user
  - claude (brainstormer)
outputs:
  - topic: H20260416152940_design-doc-split
    kind: design-doc
---

# 회의 요약

## 문제 정의

현재 `/plan` 스킬의 리뷰 루프가 라운드마다 리뷰어 에이전트를 새로 생성한다. 리뷰어들은 매 라운드 ARCHITECTURE.md, CLAUDE.md, plan-doc.md, product-spec.md를 **처음부터 다시 읽는다**. 라운드가 반복될수록 다음 문제가 누적된다.

1. 동일 컨텍스트의 중복 읽기로 인한 토큰 낭비
2. 라운드가 진행될수록 리뷰어의 "이전에 무엇을 합의했는지" 기억이 사라져 피상적 리뷰 반복
3. 라운드가 늘어나면 계획 문서 전체가 아니라 바뀐 부분만 검토해도 충분한데 전수 재검토 발생
4. Planner도 동일한 문제를 가진다 — 리뷰 결과 파일을 다시 통째로 읽고 처음부터 재작성

이 재설계는 `/plan` 단계에 한정한다. `/work` 및 그 하위 파이프라인은 본 설계의 범위 밖이다.

## 확정된 결정 사항

### 1. 스킬 분해: `/meeting` + `/design-doc`

기존 `/plan`은 브레인스토밍 + Plan 문서 + Spec 문서를 한 스킬에서 혼재했다. 책임을 분리한다.

| 스킬 | 역할 | 출력 |
|------|------|------|
| `/meeting` | 브레인스토밍. 아이디어/백로그 수집 및 정제. 파일 기반 지속 관리. | `harness/meetings/M{ts}_{slug}/meeting.md` + `brainstorms/*.md` |
| `/design-doc` | meeting을 입력받아 Spec → Plan 문서를 팀 대화로 생성. topic 단위로 관리. | `harness/topics/H{ts}_{slug}/spec.md` + `plan.md` + `decisions.md` + `reviews/**` |

meeting은 백로그성 산출물이다. 확정 후에도 내용이 계속 진화할 수 있으며 별도 폴더/파일로 보관한다. design-doc은 meeting 중 하나(또는 여러 개의 조합)를 입력으로 받아 구현 가능한 명세 + 계획으로 구체화한다.

### 2. 순서 반전: Spec → Plan

기존 `/plan`은 Plan(아키텍처 결정) → Spec(제품 명세) 순서였다. 이는 잘못된 순서다. **WHAT이 먼저, HOW가 나중이다.**

- Spec = 무엇을 만들 것인가 (사용자가 할 수 있는 것, 성공 기준)
- Plan = 어떻게 만들 것인가 (아키텍처 결정, 구현 전략)

`/design-doc`은 Spec 사이클을 먼저 돌리고, 승인된 Spec을 입력으로 Plan 사이클을 돈다.

### 3. 컨텍스트 재사용 전략: Agent Teams + 파일 기반 진실

Claude Code의 실험적 기능인 `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`를 사용한다. `TeamCreate` + `SendMessage`로 에이전트들을 **지속 세션**으로 유지해 재시작 비용을 제거한다.

팀 구성은 Spec 사이클과 Plan 사이클 각각 분리한다. (같은 팀으로 두 사이클을 모두 돌리면 컨텍스트가 섞여 컴팩션 압력이 커진다.)

```
Spec 팀 = Planner + ClaudeReviewer + (CodexReviewer or OpusReviewer)
Plan 팀 = Planner + ClaudeReviewer + (CodexReviewer or OpusReviewer)
```

Codex CLI를 사용할 수 없는 환경에서는 Codex 리뷰어 대신 Opus 모델 기반 리뷰어로 폴백한다. 3인 리뷰 구조를 깨지 않는다.

### 4. 컴팩션 완화 전략

긴 팀 세션은 토큰 한계로 인해 자동 컴팩션이 일어나 합의 근거가 소실될 수 있다. 이를 다음으로 막는다.

- **S1. File-Truth 프로토콜** — 에이전트 간 메시지는 내용을 싣지 않고 **파일 경로와 포인터**를 싣는다. 진실은 파일에 있다.
- **S2. Phase-bounded 팀 수명** — Spec 사이클 종료 시 Spec 팀을 죽이고, Plan 사이클에서 새 팀을 띄운다.
- **S5. Delta-only 리뷰** — 합의된 결정은 다시 검토하지 않는다. 리뷰어는 변경된 결정만 본다.

### 5. 패러다임: 합의 우선 (Consensus-first)

기존: 작성 → 리뷰 → 실패 시 재작성. 반복.
신규: **제안 → 리뷰 → 합의 → 반영**. 미합의 항목만 다음 라운드로.

Planner가 전체 문서를 매번 다시 쓰지 않는다. 결정 단위(Decision Unit)로 제안하고, 합의된 결정만 `spec.md`/`plan.md`에 반영한다.

### 6. 결정 단위 (Decision Unit) 기반 반복

문서를 통째로 돌리지 않고 결정 단위로 돌린다. 형식은 B+C 하이브리드:

- **B**: 문서는 섹션 스캐폴딩(고정된 목차)을 가진다
- **C**: 각 섹션 내 구체적 결정들이 독립 단위로 ID를 가지고 독립적으로 라운드를 돈다

ID 체계:
- Spec 결정: `f-001`, `f-002`, ... (feature)
- Plan 결정: `d-001`, `d-002`, ... (decision)

### 7. 합의 규칙 (계층적 Consensus)

두 리뷰어 모두 PASS = 합의. Planner는 즉시 반영한다.
리뷰 결과가 충돌(한 명 PASS, 한 명 FAIL)하거나 둘 다 FAIL이면 Planner가 절충안을 제시해 다음 라운드로.
결정 단위당 최대 **20회**까지 라운드를 돈다. 초과하면 사람에게 에스컬레이션한다.

### 8. 팀 대화 프로토콜

Planner, ClaudeReviewer, CodexReviewer(또는 OpusReviewer)가 직접 대화한다. 오케스트레이터가 일일이 전달하지 않는다. 단, 메시지에 **상태 태그**를 강제해 오케스트레이터가 파싱으로 진행 상태를 판단할 수 있게 한다.

```
[STATUS: proposal r{N} {d-id}]
[STATUS: review r{N} {d-id} PASS|FAIL]
[STATUS: consensus {d-id}]
[STATUS: revision r{N} {d-id}]
[STATUS: done {d-id}]
[STATUS: escalate {d-id}]
```

오케스트레이터는 가드레일로만 동작: 20회 초과 감지, 태그 없는 메시지 감지, 파일 충돌 감지.

### 9. 폴더 구조

```
harness/
├── meetings/
│   └── M{ts}_{slug}/
│       ├── meeting.md                    # 회의 요약 (백로그 단위)
│       └── brainstorms/                  # 원본 브레인스토밍 대화 로그
│           └── YYYY-MM-DD-r{N}.md
└── topics/
    └── H{ts}_{slug}/
        ├── meeting-ref.md                # 이 토픽이 기반한 meeting(들) 링크
        ├── spec.md                       # Spec 문서 (확정분만)
        ├── plan.md                       # Plan 문서 (확정분만)
        ├── decisions.md                  # 결정 원장 (f-*, d-* 테이블)
        ├── reviews/
        │   ├── spec/
        │   │   └── {d-id}/
        │   │       ├── r{N}-proposal.md
        │   │       ├── r{N}-claude.md
        │   │       └── r{N}-codex.md     # 또는 r{N}-opus.md
        │   └── plan/
        │       └── {d-id}/...
        └── reflection.md                 # /work 완료 후 생성 → 토픽 완료 마커
```

**토픽 완료 판단**: `reflection.md` 존재 = 완료. 중간 단계 마커 파일(`.done.md` 등)은 만들지 않는다.

### 10. 스크립트 자동화

작업 현황 리스트 / 완료 판단 같은 결정론적 로직은 AI가 매번 파일을 읽어 판단하지 않는다. Node.js `.mjs` 스크립트로 자동화.

최소 범위 3개 스크립트 (작업 현황 조회 전용):

| 스크립트 | 경로 | 역할 |
|----------|------|------|
| `list-meetings.mjs` | `scripts/list-meetings.mjs` | 모든 meeting 목록 + 연결된 topic |
| `list-topics.mjs` | `scripts/list-topics.mjs` | 모든 topic 상태 (meeting / design-doc / working / done) |
| `topic-state.mjs` | `scripts/topic-state.mjs` | 특정 topic의 상태 + 현재 사이클 + 미합의 결정 수 |

스크립트는 파일 존재 여부와 frontmatter만으로 판단한다. 내용 파싱은 하지 않는다.

### 11. 슬러그 가변성

meeting이나 topic의 슬러그(kebab-case 이름)는 내용 변경 시 바뀔 수 있다. 고정 ID는 `M{ts}` / `H{ts}` 타임스탬프 코드다. 참조는 항상 코드로 한다.

### 12. 세션 연속성

- `/meeting` 직후 `/design-doc` 실행 시 현재 컨텍스트에서 작업 중인 meeting을 자동 탐지해 기본값으로 설정한다.
- 새 세션에서 `/design-doc` 직접 실행 시 `list-meetings.mjs` 결과와 진행 중 design-doc 목록을 보여주고 선택하게 한다.

### 13. 재진입 정책

완료된 토픽(`reflection.md` 존재)은 기본적으로 잠금 상태. 재개하려면 사용자의 명시적 승인이 필요하다.

### 14. 마이그레이션 정책

없음. 기존 `harness/exec-plans/`, `harness/product-specs/` 사용자는 수동 이관. `/plan`, `/work`는 신규 구조 기준으로 작동. 이전 스킬 `skills/plan/`은 제거한다.

## Open Questions

없음. 모든 결정 사항은 사용자 확정.

## 다음 단계

- 토픽 `H20260416152940_design-doc-split` 생성 완료
- design-doc 작성 → 본 회의 산출물을 입력으로 사용
- design-doc에서 이 재설계 자체를 명세 + 계획으로 구체화 (dogfooding)
