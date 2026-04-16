---
topic: H20260416152940
slug: design-doc-split
title: "/plan 분해 — /meeting + /design-doc 재설계"
status: draft
source_meetings:
  - M20260416152940
created: 2026-04-16T06:29:40Z
updated: 2026-04-16T06:29:40Z
---

# Design Doc: /meeting + /design-doc 재설계

본 문서는 Flowness 플러그인의 `/plan` 스킬을 `/meeting`(브레인스토밍·백로그) + `/design-doc`(Spec → Plan) 두 스킬로 분해하고, 리뷰어 토큰 낭비 문제를 제거하는 재설계를 기술한다. 범위는 **기획·설계 단계에 한정**한다. `/work` 및 하위 파이프라인은 본 설계의 범위 밖이며, 본 설계가 만들어 내는 산출물 경로(`harness/topics/H{ts}_{slug}/`)를 `/work`가 소비한다는 사실만 전제한다.

본 설계는 스스로에게도 적용된다(dogfooding): 본 토픽 `H20260416152940_design-doc-split`은 새 구조로 산출된 첫 번째 토픽이다.

---

## 1. 목적 및 비목표

### 목적

1. 리뷰어가 라운드마다 프로젝트 컨텍스트를 전량 재읽는 토큰 낭비를 제거한다.
2. 라운드 간 "이전 합의"가 소실되어 피상적 리뷰가 반복되는 현상을 막는다.
3. 기획 단계의 책임을 명확히 분리한다: **브레인스토밍(meeting)** ↔ **구체화(design-doc)**.
4. Spec(WHAT)을 Plan(HOW)보다 먼저 확정하도록 순서를 바로잡는다.
5. 합의된 결정은 다시 검토하지 않고, 미합의 결정만 다음 라운드로 가도록 하여 반복 비용을 하강시킨다.

### 비목표

- `/work` 루프, Generator, Evaluator, Reflector, 학습 시스템 변경.
- 기존 `harness/exec-plans/`, `harness/product-specs/` 데이터 마이그레이션 도구.
- 여러 동시 토픽 병렬화 (본 설계는 직렬 실행 기준).
- TDD, 규칙 검사 등 도메인 스킬 변경.

---

## 2. 현재 구조 문제 진단

| 문제 | 현상 | 근본 원인 |
|------|------|-----------|
| 토큰 소모 누적 | 라운드마다 Plan Reviewer + Codex Reviewer가 ARCHITECTURE.md / CLAUDE.md / plan-doc.md 전량 재읽 | 리뷰어 에이전트가 라운드마다 새로 생성됨 (휘발성) |
| 합의 기억 소실 | 라운드 3에서 라운드 1의 합의를 잊고 동일 질문 반복 | 에이전트에 지속 세션이 없음. 리뷰 결과 파일을 "읽는" 비용이 또 발생 |
| 전수 재검토 | 결정 1개만 고쳐도 문서 전체 재리뷰 | 문서를 원자 단위로 취급 (결정 단위 추적 부재) |
| 순서 오류 | Plan(HOW)이 Spec(WHAT)보다 먼저 | `/plan` 내부에서 Plan 사이클 → Spec 사이클 순서 |
| 책임 혼재 | 브레인스토밍·결정 원장·명세·계획이 한 스킬에 | `/plan`이 superpowers:brainstorming + Planner + Reviewer를 모두 호출 |

---

## 3. 타깃 아키텍처 개요

```
┌──────────────┐       ┌────────────────────────────────────────────┐
│  /meeting    │──────►│ harness/meetings/M{ts}_{slug}/             │
│ (브레인스토밍)│       │   meeting.md   brainstorms/*.md            │
└──────────────┘       └────────────┬───────────────────────────────┘
                                    │ meeting-ref
                                    ▼
┌──────────────┐       ┌────────────────────────────────────────────┐
│ /design-doc  │──────►│ harness/topics/H{ts}_{slug}/               │
│  Spec 팀 →   │       │   spec.md  plan.md  decisions.md           │
│  Plan 팀     │       │   reviews/{spec|plan}/{d-id}/r{N}-*.md     │
└──────────────┘       │   meeting-ref.md                           │
                       └────────────┬───────────────────────────────┘
                                    │ (범위 밖)
                                    ▼
                              /work → reflection.md
```

---

## 4. 스킬 정의

### 4.1 `/meeting`

**목적**: 아이디어·요구사항을 브레인스토밍하고 백로그성 회의록을 유지한다.

**입력**: 자연어 프롬프트(또는 argument-hint). 기존 meeting 코드를 인자로 주면 해당 meeting을 재오픈해 업데이트 라운드로 진입.

**프로세스**:

1. 기존 meeting 목록을 `scripts/list-meetings.mjs`로 확인.
2. superpowers:brainstorming 스킬을 호출하되 출력 경로를 `harness/meetings/M{ts}_{slug}/brainstorms/{date}-r{N}.md`로 오버라이드.
3. 브레인스토밍 완료 후, 원본 대화를 `brainstorms/*.md`에 아카이브.
4. 핵심 결정 사항을 증류해 `meeting.md`에 요약 작성 (Planner 재호출 없이 오케스트레이터가 직접 작성 — meeting은 합의 절차가 아니다).
5. 사용자 확정 시 `meeting.md` frontmatter의 `status: confirmed`로 표기.

**출력**:

```
harness/meetings/M{ts}_{slug}/
├── meeting.md          # 확정/진화하는 회의록
└── brainstorms/
    └── YYYY-MM-DD-r{N}.md   # 각 브레인스토밍 라운드 원본
```

**meeting 상태 전이**:

| status | 의미 |
|--------|------|
| `draft` | 브레인스토밍 진행 중 |
| `confirmed` | 사용자 확정. design-doc 입력으로 사용 가능 |
| `archived` | 더 이상 관련 없음 (파일은 유지) |

meeting 슬러그는 내용 진화에 따라 바뀔 수 있다. 고정 ID는 `M{ts}`.

### 4.2 `/design-doc`

**목적**: meeting 확정 내용을 입력받아 구현 가능한 Spec과 Plan을 팀 대화로 생성한다.

**입력 해결 순서**:

1. argument로 topic code(`H{ts}_...`) 제공 시 해당 토픽 재오픈.
2. argument로 meeting code(`M{ts}_...`) 제공 시 새 토픽 생성.
3. argument 없음 + 현재 세션에 방금 생성한 meeting 존재 → 자동 연결.
4. argument 없음 + 새 세션 → `list-meetings.mjs` + `list-topics.mjs` 결과를 사용자에게 보여주고 선택받음.

**프로세스**:

```
Step 0. 전제조건 확인 (CLAUDE.md, ARCHITECTURE.md, harness/ 존재 여부)
Step 1. 입력 해결 → meeting-ref.md 작성
Step 2. 컨텍스트 팩 빌드 → context-pack.md (한 번만 생성, 팀이 공유)
Step 3. Spec 팀 사이클
Step 4. Spec 팀 종료 (Phase-bounded)
Step 5. Plan 팀 사이클
Step 6. Plan 팀 종료
Step 7. plan-config 생성 및 마무리
```

단계 3, 5는 결정 단위 합의 우선 루프. 자세한 내용은 §7에서 다룬다.

---

## 5. 폴더 구조

### 5.1 전체 구조

```
harness/
├── meetings/
│   └── M{YYYYMMDDHHmmss}_{slug}/
│       ├── meeting.md
│       └── brainstorms/
│           └── YYYY-MM-DD-r{N}.md
├── topics/
│   └── H{YYYYMMDDHHmmss}_{slug}/
│       ├── meeting-ref.md
│       ├── context-pack.md           # §8 (한 번만 생성)
│       ├── spec.md                   # Spec 사이클 산출물
│       ├── plan.md                   # Plan 사이클 산출물
│       ├── decisions.md              # 결정 원장 (f-*, d-*)
│       ├── plan-config.md            # /work 입력
│       ├── reflection.md             # /work 후 생성 → 완료 마커
│       └── reviews/
│           ├── spec/
│           │   └── {f-id}/
│           │       ├── r{N}-proposal.md
│           │       ├── r{N}-claude.md
│           │       └── r{N}-codex.md | r{N}-opus.md
│           └── plan/
│               └── {d-id}/...
└── (기존) rules/, learning-log.md, learning-history/
```

### 5.2 ID 체계

- **Meeting 코드**: `M{YYYYMMDDHHmmss}` — 14자리 UTC 타임스탬프. 불변.
- **Topic 코드**: `H{YYYYMMDDHHmmss}` — 14자리 UTC 타임스탬프. 불변.
- **Feature decision ID**: `f-001`, `f-002`, ... (spec 사이클 산출)
- **Plan decision ID**: `d-001`, `d-002`, ... (plan 사이클 산출)

슬러그는 frontmatter에 보조 필드로 두며, 변경 가능. 모든 상호 참조는 코드로.

### 5.3 완료 판정

`reflection.md`의 존재 = 토픽 완료. `/work` 완료 시 `flowness:reflector`가 생성한다. 중간 단계 마커 파일(`.done.md`, `spec.approved.md` 등)은 **사용하지 않는다**.

토픽 상태는 스크립트가 파일 존재와 frontmatter만 보고 판정한다. §9 참조.

---

## 6. 에이전트 팀 구성

### 6.1 에이전트 인벤토리

| 파일 | 역할 | 모델 |
|------|------|------|
| `agents/design-doc-planner.md` | Spec·Plan 양쪽 모드의 Writer + Proposer | (기본: sonnet; frontmatter에서 상속) |
| `agents/design-doc-claude-reviewer.md` | Claude 기반 비평적 리뷰어 | sonnet 또는 haiku |
| `agents/design-doc-codex-reviewer.md` | Codex CLI 기반 기술 타당성 리뷰어 | (Codex) |
| `agents/design-doc-opus-reviewer.md` | **Codex 폴백** — Opus 모델 기반 기술 리뷰어 | `model: opus` (frontmatter 명시) |

frontmatter 규칙:
- 파일명에 사용 AI가 명시된다(`-claude-`, `-codex-`, `-opus-`).
- Opus 폴백 에이전트는 `model: opus`를 frontmatter에 명시해 결정성 확보.

기존 `agents/plan-reviewer.md`, `agents/codex-plan-reviewer.md`는 신규 파일로 **대체**된다 (삭제).

### 6.2 팀 구성 로직

```
if codex_available:
    team = [Planner, ClaudeReviewer, CodexReviewer]
else:
    team = [Planner, ClaudeReviewer, OpusReviewer]
```

Codex 가용성은 `/design-doc` Step 0에서 codex-companion setup 체크로 판정. 불가 시 3인 구조를 깨지 않고 Opus로 폴백한다.

### 6.3 팀 수명 (Phase-bounded)

- Spec 팀: Spec 사이클 동안만 활성. 사이클 종료(혹은 에스컬레이션) 시 `TeamDelete`로 종료.
- Plan 팀: Plan 사이클 시작 시 새로 `TeamCreate`. Spec 팀의 메모리를 승계하지 않는다.

이유: 장기 세션 컴팩션 압력을 2배 줄이고, 사이클 간 컨텍스트 교차 오염을 방지한다. Plan 팀은 `spec.md` / `decisions.md`를 파일로 읽는다.

### 6.4 팀 대화 프로토콜

에이전트들은 `SendMessage`로 **서로 직접** 대화한다. 오케스트레이터는 중계하지 않는다. 단, 모든 메시지는 아래 상태 태그 중 정확히 하나로 시작해야 한다.

```
[STATUS: proposal r{N} {d-id}]      — Planner가 제안을 올림
[STATUS: review r{N} {d-id} PASS]   — 리뷰어가 승인
[STATUS: review r{N} {d-id} FAIL]   — 리뷰어가 반려
[STATUS: consensus {d-id}]          — 두 리뷰어 모두 PASS 확인 → Planner가 반영 선언
[STATUS: revision r{N} {d-id}]      — Planner가 절충안 제시 (라운드 +1)
[STATUS: done {d-id}]               — 반영 완료 (spec.md / plan.md에 기록됨)
[STATUS: escalate {d-id}]           — 20회 초과 또는 해결 불가
```

메시지 본문은 **경로 + 포인터 중심**이어야 한다 (§8 File-Truth 프로토콜).

오케스트레이터는 가드레일 역할만 수행:
- 태그 없는 메시지 감지 → 경고 후 재요청.
- `revision` 태그가 20회를 초과 → 자동 `escalate`.
- 동일 결정에 동시 `proposal` 두 개 이상 감지 → 가장 최근만 채택.
- 5분 이상 무반응 → 재촉 프롬프트.

### 6.5 합의 규칙 (계층적 Consensus)

```
Claude PASS + (Codex|Opus) PASS           → consensus  → Planner 반영
Claude FAIL + (Codex|Opus) FAIL           → 두 이슈를 병합해 Planner revision
Claude PASS + (Codex|Opus) FAIL (또는 반대) → Planner가 충돌 해소 절충안으로 revision
```

리뷰어끼리 상호 반박 가능하나, 합의 판정은 Planner가 수집해 `[STATUS: consensus ...]` 태그로 선언한다. 이는 Planner에게 "최종 반영 책임"을 귀속시키기 위해서다.

### 6.6 라운드 상한

결정 단위당 **최대 20 라운드**. 21 라운드 진입 직전에 오케스트레이터가 자동 `[STATUS: escalate ...]`를 기록하고 사용자 5옵션 메뉴를 제공:

1. 현재 Planner 최신 제안 그대로 채택
2. Claude 최종 FAIL 의견 반영해 수동 수정 후 재시도
3. Codex/Opus 최종 FAIL 의견 반영해 수동 수정 후 재시도
4. 해당 결정을 Out of Scope로 표시하고 스킵
5. 토픽 중단

---

## 7. 결정 단위 기반 합의 우선 루프

### 7.1 문서 스캐폴딩 (B) + 결정 단위 (C) 하이브리드

`spec.md`와 `plan.md`는 고정된 섹션 스캐폴딩을 가진다. 각 섹션 내부에는 결정 블록이 임베드된다. 결정 블록은 독립 단위로 ID를 가진다.

#### spec.md 섹션 스캐폴딩

```markdown
# Spec

## Overview
## Goals / Non-goals
## Features
### <!-- f-001 -->
### <!-- f-002 -->
...
## User Stories
## Success Criteria
## Dependencies & Integration Points
```

#### plan.md 섹션 스캐폴딩

```markdown
# Plan

## Architecture Overview
## Technical Decisions
### <!-- d-001 -->
### <!-- d-002 -->
...
## Component Boundaries
## Risks & Mitigations
## Scope (In / Out)
## Implementation Sequence
```

### 7.2 결정 블록 형식

각 결정은 HTML 주석 마커로 시작 + 표준화된 소제목 본문을 가진다.

```markdown
### <!-- f-007 -->
#### 통화 선택 UI

- **Decision status**: consensus (r3)
- **Summary**: 사용자는 드롭다운 대신 검색 가능한 통화 리스트를 본다.
- **Rationale**: 170개 통화를 드롭다운으로 탐색하는 것은 비효율적이다.
- **Acceptance**: 첫 번째 키 입력 시 200ms 내 필터링된 결과 표시.
- **Review trail**: [`reviews/spec/f-007/`](reviews/spec/f-007/)
```

### 7.3 decisions.md — 결정 원장

결정 메타 정보는 중앙 원장에서 관리된다. 스크립트와 리뷰어가 빠르게 상태를 파악할 수 있도록.

```markdown
# Decisions

## Spec Cycle

| ID    | Title            | Status    | Rounds | Last updated        |
|-------|------------------|-----------|--------|---------------------|
| f-001 | 개요             | consensus | 2      | 2026-04-16T07:10Z   |
| f-007 | 통화 선택 UI     | consensus | 3      | 2026-04-16T07:42Z   |
| f-012 | 환율 캐싱 정책   | open      | 4      | 2026-04-16T08:05Z   |

## Plan Cycle

| ID    | Title            | Status    | Rounds | Last updated        |
|-------|------------------|-----------|--------|---------------------|
| d-001 | 모노레포 레이아웃| open      | 1      | 2026-04-16T09:00Z   |
```

`Status` 값: `open` | `consensus` | `escalated` | `skipped`.

### 7.4 사이클 진행 알고리즘 (Spec / Plan 공통)

```
1. Planner가 meeting.md + context-pack.md를 읽고 초기 결정 목록 생성
   → decisions.md에 모든 항목 status=open으로 등록
   → spec.md(또는 plan.md)에 빈 결정 블록 스캐폴딩만 기록

2. while (open 결정 있음):
     for each open decision d (rounds < 20):
       Planner:
         [STATUS: proposal r{N} {d}] 제안 작성
         → reviews/{cycle}/{d}/r{N}-proposal.md 저장
         → 팀에 경로만 메시지로 전송

       두 리뷰어 병렬 리뷰:
         [STATUS: review r{N} {d} PASS|FAIL]
         → reviews/{cycle}/{d}/r{N}-{claude|codex|opus}.md 저장

       Planner가 결과 집계:
         PASS+PASS → [STATUS: consensus {d}]
           → 최종 결정 블록을 spec.md/plan.md에 쓰기
           → decisions.md status=consensus로 갱신
           → [STATUS: done {d}]
         그 외 → [STATUS: revision r{N+1} {d}]
           → 다음 라운드 proposal 작성 (리뷰 피드백만 소스로 참조)

     if round > 20:
       [STATUS: escalate {d}] → 사용자 5옵션 메뉴

3. 모든 결정이 consensus|escalated|skipped 상태가 되면 사이클 종료
   → 팀 TeamDelete
```

### 7.5 Delta-only 리뷰

`consensus` 상태 결정은 이후 라운드에서 리뷰어가 다시 보지 않는다. 리뷰어 에이전트는 다음만 본다:

- 대상 결정(`{d-id}`)의 최신 proposal 파일
- 해당 결정의 이전 리뷰들(`r{N-1}-*.md`)
- `context-pack.md` (한 번만 읽고 팀 메모리에 유지)

리뷰어가 "spec.md 전체"나 "ARCHITECTURE.md"를 다시 읽지 않는다는 것이 토큰 절감의 핵심이다.

---

## 8. 컨텍스트 팩 & File-Truth 프로토콜

### 8.1 context-pack.md

사이클 시작 전에 오케스트레이터가 한 번 생성하여 팀에 1회 로드시킨다.

```markdown
---
topic: H20260416152940
generated: 2026-04-16T06:30:00Z
---

# Context Pack

## Project config
(요약: CLAUDE.md의 핵심 부분)

## Architecture snapshot
(요약: ARCHITECTURE.md의 레이어 구조, 기술 스택)

## Existing specs in harness/topics/ (other topics)
- H20260312090000_foo: 요약 한 줄
- ...

## Meeting digest
(meeting.md의 확정 결정 리스트 — 복사가 아니라 참조 + 핵심 요약)

## Constraints
(반드시 준수해야 할 제약)

## Glossary
(용어 정의)
```

크기 상한: 5,000 토큰. 초과 시 오케스트레이터가 요약 압축.

### 8.2 File-Truth 프로토콜

에이전트 간 `SendMessage`는 **항상 파일 경로 + 간단한 포인터**를 싣는다. 결정 본문을 메시지에 싣지 않는다.

```
[STATUS: proposal r3 f-007]
Proposal updated at: reviews/spec/f-007/r3-proposal.md
Key change from r2: acceptance latency 500ms → 200ms
Please review.
```

이 규칙은 다음 이득을 준다:
- 메시지 크기가 작아 컴팩션 압력 감소.
- 진실은 항상 파일이므로, 세션 컴팩션이 발생해도 재진입 가능.
- 리뷰어는 필요한 파일만 선택적으로 읽는다.

오케스트레이터는 메시지 본문 길이가 500 토큰을 초과하면 경고를 띄운다.

### 8.3 컴팩션 완화 전략 요약

| ID | 전략 | 적용 |
|----|------|------|
| S1 | File-Truth | 모든 메시지 |
| S2 | Phase-bounded 팀 수명 | Spec 팀 / Plan 팀 분리 |
| S5 | Delta-only 리뷰 | consensus 결정 재검토 금지 |

(S3/S4는 검토 후 기각: S3=메시지 요약 봇은 왜곡 위험, S4=강제 요약 라운드는 오버헤드 큼.)

---

## 9. 스크립트 (scripts/)

모든 스크립트는 Node.js ESM(`.mjs`). 의존성 없음. 파일 존재와 frontmatter만 보고 판정한다.

### 9.1 `scripts/list-meetings.mjs`

출력: 모든 meeting 목록 + 연결된 topic.

```
M20260416152940  design-doc-split           confirmed  → H20260416152940
M20260312090000  add-dark-mode              archived   → (none)
M20260220113000  multi-currency-converter   draft      → (none)
```

판정 로직:
- `harness/meetings/*/meeting.md`의 frontmatter에서 `status`, `outputs[].topic`을 읽음.

### 9.2 `scripts/list-topics.mjs`

출력: 모든 topic 상태.

```
H20260416152940  design-doc-split           design-doc  (in Plan cycle)
H20260312090000  add-dark-mode              done
H20260220113000  multi-currency-converter   working
```

토픽 상태 판정 테이블:

| 조건 | 상태 |
|------|------|
| `reflection.md` 존재 | `done` |
| `plan-config.md` 존재, `reflection.md` 없음 | `working` |
| `plan.md`의 결정 중 consensus 미완료 있음 | `design-doc (in Plan cycle)` |
| `spec.md`의 결정 중 consensus 미완료 있음 | `design-doc (in Spec cycle)` |
| 위 어느 것도 아님 | `initialized` |

### 9.3 `scripts/topic-state.mjs`

사용법: `node scripts/topic-state.mjs H20260416152940`

출력:

```
Topic:      H20260416152940_design-doc-split
State:      design-doc (in Spec cycle)
Meeting:    M20260416152940_design-doc-split
Spec:       7 decisions total, 4 consensus, 3 open
Plan:       not started
Last touch: 2026-04-16T08:05Z
```

내부 로직: `decisions.md` 테이블을 파싱해 status 집계. 파일 mtime으로 last touch.

### 9.4 스크립트 호출 지점

- `/meeting`, `/design-doc` 진입 시 `list-meetings.mjs` / `list-topics.mjs`로 목록 제공.
- 오케스트레이터가 사이클 내부에서 결정 진행률 확인할 때 `topic-state.mjs` 사용.
- 사용자가 직접 CLI 쿼리 가능하도록 공개 스크립트.

### 9.5 비범위

파일 내용 파싱, 결정 본문 분석, 상태 변경 기능은 스크립트에 포함하지 않는다. 읽기 전용.

---

## 10. 파일 포맷 상세

### 10.1 meeting.md

```markdown
---
code: M20260416152940
slug: <kebab-case>
title: "..."
status: draft | confirmed | archived
created: <UTC ISO>
updated: <UTC ISO>
participants: [...]
outputs:
  - topic: H{ts}_{slug}    # 이 meeting에서 파생된 토픽
    kind: design-doc
---

# 회의 요약
## 문제 정의
## 확정된 결정 사항
## Open Questions
## 다음 단계
```

### 10.2 spec.md

```markdown
---
topic: H{ts}
slug: ...
status: in-progress | consensus | escalated
---

# Spec

## Overview
## Goals / Non-goals
## Features
### <!-- f-001 --> 기능 타이틀
- Decision status: ...
- Summary: ...
- Rationale: ...
- Acceptance: ...
- Review trail: reviews/spec/f-001/

## User Stories
## Success Criteria
## Dependencies & Integration Points
```

### 10.3 plan.md

```markdown
---
topic: H{ts}
slug: ...
status: in-progress | consensus | escalated
spec_hash: <spec.md의 sha256 8자리>
---

# Plan

## Architecture Overview
## Technical Decisions
### <!-- d-001 --> 결정 타이틀
- Decision status: ...
- Options considered: ...
- Chosen option: ...
- Rationale: ...
- Trade-offs: ...
- Review trail: reviews/plan/d-001/

## Component Boundaries
## Risks & Mitigations
## Scope (In / Out)
## Implementation Sequence
```

`spec_hash`는 spec이 변경되면 plan의 상태가 정합하지 않음을 알리는 체크섬이다. Plan 팀 시작 시 오케스트레이터가 기록.

### 10.4 decisions.md

§7.3 참조. 단일 파일에 `## Spec Cycle` / `## Plan Cycle` 두 테이블.

### 10.5 리뷰 파일

경로: `reviews/{cycle}/{d-id}/r{N}-{kind}.md`

```markdown
---
decision: f-007
round: 3
kind: proposal | claude | codex | opus
author: design-doc-planner | design-doc-claude-reviewer | ...
verdict: pass | fail | n/a   # proposal은 n/a
created: <UTC ISO>
---

# r3 proposal for f-007

## Change from r2
## Proposal body
## Open questions
```

### 10.6 plan-config.md

```markdown
---
topic: H{ts}
complexity: simple | moderate | complex
eval_rounds: 1 | 2 | 3
eval_tool: playwright | ...
applicable_rules: [...]
---

# Plan Config

(사람 읽기용 요약 + /work 입력 메타)
```

### 10.7 reflection.md

`/work`가 생성. 존재 = 토픽 완료. 본 설계 범위 밖이므로 포맷은 기존 `flowness:reflector` 규약 유지.

---

## 11. 마이그레이션 및 Breaking Change 정책

- **마이그레이션 도구 없음.** 기존 `harness/exec-plans/active/*`, `harness/product-specs/*.md`는 그대로 방치. 필요 시 사용자가 수동 이관.
- `skills/plan/` **제거**. `skills/meeting/` + `skills/design-doc/` 신규 생성.
- `agents/plan-reviewer.md`, `agents/codex-plan-reviewer.md` **제거**. 신규 4개 에이전트로 대체.
- `plugin.json`의 `agents` / `skills` 배열 갱신.
- 버전: `0.1.x`의 다음 패치 번호로 올림.
- README/CLAUDE.md 업데이트: 새 디렉토리 규약, 새 슬래시 커맨드 명시.

## 12. 검증 기준 (Success Criteria)

1. `/meeting → /design-doc → /work` 흐름이 새 디렉토리 구조에서 끊김 없이 동작.
2. 한 결정 수정 시 다른 consensus 결정은 재검토되지 않음 (로그 검증).
3. 리뷰어 한 라운드 토큰 소비가 기존 `/plan` 대비 최소 50% 감소 (샘플 토픽 기준).
4. Codex 미가용 환경에서도 3인 팀이 유지됨 (Opus 폴백).
5. 20회 초과 시 자동 에스컬레이션이 사용자 5옵션 메뉴로 이어짐.
6. `list-meetings.mjs`, `list-topics.mjs`, `topic-state.mjs` 3개 스크립트가 frontmatter만으로 정확한 상태 판정.
7. 본 토픽 `H20260416152940_design-doc-split`이 새 구조 기준으로 `/work`까지 성공적으로 완료 (dogfooding).

## 13. 리스크 및 완화

| 리스크 | 완화 |
|--------|------|
| 팀 대화가 무한 루프에 빠짐 | 결정당 20회 하드 상한 + 태그 기반 오케스트레이터 감시 |
| Codex 폴백(Opus)이 기술 타당성 검증을 대체하지 못함 | Opus 리뷰어 프롬프트에 ARCHITECTURE.md + context-pack을 강제 주입, 체크리스트 고정 |
| 결정 간 의존성이 있어 독립 병렬 리뷰 불가능 | decisions.md에 `depends_on` 필드 허용(선택). Planner가 의존 결정 consensus 전까지 제안 블록 |
| 슬러그 변경으로 경로 깨짐 | 모든 참조는 M/H 코드 기반. 스크립트는 코드로 인덱싱 |
| frontmatter 파싱 에러로 스크립트 crash | 스크립트는 파싱 실패 시 해당 항목을 `malformed`로 표시하고 계속 진행 |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS`가 미지원되는 런타임 | 설치 체크로 가용성 확인. 미가용 시 명확한 오류 메시지 + 비활성 모드(기존 `/plan`과 유사한 병렬 Agent 호출) 폴백 — **단, 이 폴백 구현은 본 설계의 범위 밖. 에러 메시지만 제공한다.** |

## 14. 구현 순서 (Implementation Sequence)

1. **스크립트 먼저**: `scripts/list-meetings.mjs`, `scripts/list-topics.mjs`, `scripts/topic-state.mjs` 작성 및 수동 테스트.
2. **에이전트 정의**: 4개 에이전트 파일 작성.
    - `agents/design-doc-planner.md`
    - `agents/design-doc-claude-reviewer.md`
    - `agents/design-doc-codex-reviewer.md`
    - `agents/design-doc-opus-reviewer.md`
3. **스킬 정의**:
    - `skills/meeting/SKILL.md`
    - `skills/design-doc/SKILL.md`
4. **템플릿**: `templates/` 하위에 `meeting.md.template`, `spec.md.template`, `plan.md.template`, `decisions.md.template`, `context-pack.md.template` 추가.
5. **`plugin.json` 갱신**: 에이전트/스킬 배열 + 버전 패치.
6. **`skills/plan/`, `agents/plan-reviewer.md`, `agents/codex-plan-reviewer.md` 삭제**.
7. **CLAUDE.md / README.md 업데이트**: 새 디렉토리 규약, 새 슬래시 커맨드.
8. **Dogfooding**: 본 토픽을 `/work`에 넘겨 구현 검증. reflection.md 생성으로 완료.

---

## Appendix A — 에이전트 프롬프트 뼈대 (참고)

### A.1 design-doc-planner.md (발췌)

```
---
name: design-doc-planner
description: Writer/Proposer for design-doc teams. Produces decision units and revisions.
allowed-tools: Read, Write, Edit, Grep, Glob, SendMessage
---

# 역할
Spec 또는 Plan 사이클에서 결정 단위(f-*, d-*)의 제안 및 절충안을 작성한다.

# 메시지 규약
- 모든 메시지는 정확한 상태 태그 하나로 시작한다.
- 메시지 본문은 파일 경로 + 짧은 요약 (File-Truth).

# 프로세스
1. context-pack.md + meeting-ref의 meeting.md 읽기 (사이클 시작 시 1회)
2. decisions.md에서 open 결정 선택
3. 결정별 proposal을 reviews/{cycle}/{d}/r{N}-proposal.md에 작성
4. 두 리뷰어 피드백 대기
5. 두 PASS: [STATUS: consensus ...] → spec.md/plan.md 및 decisions.md 갱신 → [STATUS: done ...]
6. 그 외: 피드백 병합해 [STATUS: revision r{N+1} ...]
```

### A.2 design-doc-claude-reviewer.md (발췌)

```
---
name: design-doc-claude-reviewer
description: Critical reviewer. Flags alignment, completeness, measurability issues.
allowed-tools: Read, Grep, Glob, SendMessage
---

# 역할
결정 단위 단위로 비평적 리뷰. 전수 재검토 금지.

# 프로세스
1. 대상 결정 ID 받음
2. reviews/{cycle}/{d}/r{N}-proposal.md + 이전 리뷰들만 읽기
3. context-pack.md는 1회 로드 후 재읽기 금지
4. [STATUS: review r{N} {d} PASS|FAIL] + 근거 경로 저장
```

### A.3 design-doc-codex-reviewer.md (발췌)

```
---
name: design-doc-codex-reviewer
description: Technical feasibility reviewer (Codex CLI based).
allowed-tools: Agent, Read, Write, SendMessage
---

# 역할
codex:codex-rescue 서브에이전트로 기술 타당성·대안·숨은 복잡도 검토.
결정 단위로만 실행. 읽기 전용.
```

### A.4 design-doc-opus-reviewer.md (발췌)

```
---
name: design-doc-opus-reviewer
description: Fallback technical reviewer using Opus when Codex unavailable.
model: opus
allowed-tools: Read, Grep, Glob, SendMessage
---

# 역할
Codex 미가용 환경에서 기술 타당성 리뷰를 대신 수행.
체크리스트: (1) 기술 스택 호환, (2) 결정 건전성, (3) 숨은 복잡성, (4) 아키텍처 정합성.
```

---

## Appendix B — 상태 기계 요약

```
meeting:
  draft → confirmed → archived

topic:
  initialized
    └── [Spec 사이클 시작]
  design-doc (in Spec cycle)
    └── [모든 f-* consensus|escalated|skipped]
  design-doc (in Plan cycle)
    └── [모든 d-* consensus|escalated|skipped + plan-config.md 생성]
  working
    └── [/work 완료 → reflection.md 생성]
  done
```

재진입:
- `design-doc (in Spec cycle)` ← `design-doc (in Plan cycle)`: spec 재개 명시적 승인 필요.
- `done` → 어떤 사이클로도: 명시적 사용자 승인 필수 (기본 잠금).

---

## 변경 로그

- 2026-04-16: 초안 작성 (M20260416152940 회의 확정 사항 반영).
