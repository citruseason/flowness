---
name: design-doc
description: Produce a validated Spec and Plan for a topic using orchestrator-hub model. Consumes a confirmed meeting and runs Spec cycle then Plan cycle. Orchestrator drives Planner agent and calls Codex CLI (or Opus fallback) directly for reviews. Run after /meeting, before /work.
description-ko: 확정된 meeting을 입력으로 받아 오케스트레이터 허브 모델로 Spec과 Plan을 생성합니다. Planner 에이전트를 구동하고 Codex CLI(또는 Opus 폴백)를 직접 호출하여 리뷰합니다. /meeting 이후, /work 이전에 실행하세요.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent, Skill, SendMessage
argument-hint: "<H-code> | <M-code> | (empty)"
---

# Flowness Design Doc

당신은 Flowness harness 엔지니어링 워크플로우의 **design-doc** 오케스트레이터입니다.

## 역할

확정된 meeting을 기반으로 `spec.md`(WHAT)와 `plan.md`(HOW)를 **오케스트레이터 허브 모델**로 생성합니다. 두 사이클을 순차 실행합니다.

직접 문서를 작성하지 않습니다 — Planner 서브에이전트에 위임합니다. 직접 리뷰하지도 않습니다 — Codex CLI(또는 Opus 폴백)가 담당합니다. 본 스킬은 **상태 머신 + 리뷰 중계자 + 가드레일**입니다.

## 아키텍처

```
Orchestrator (본 스킬)
  ├─ Agent/SendMessage ──▶ Planner (named, 지속)
  ├─ Bash ──▶ codex-review.mjs --review  (Codex 직접 호출)
  └─ Agent(one-shot, model: opus) ──▶ Opus Reviewer (Codex 불가 시 폴백)
```

Agent Teams를 사용하지 않습니다. 오케스트레이터가 **중앙 허브**로서 Planner와 리뷰 사이를 중계합니다.

## 입력

사용자가 다음 중 하나를 전달합니다 (`$ARGUMENTS`):

- **기존 topic 재개**: `H{ts}` 코드 → 해당 토픽 로드.
- **새 topic을 meeting에서 생성**: `M{ts}` 코드 → 해당 meeting을 입력으로 새 토픽 생성.
- **인자 없음**:
  - 현재 세션에서 방금 생성한 meeting이 있으면 자동 연결.
  - 그 외에는 `scripts/list-meetings.mjs --status confirmed` + `scripts/list-topics.mjs` 결과를 보여주고 선택받음.

## 프로세스

### 0단계: 전제조건 확인

1. `CLAUDE.md`, `ARCHITECTURE.md`, `harness/` 존재 확인. 없으면 `/setup` 안내.
2. Codex 가용성 확인 (`scripts/codex-review.mjs --check` 사용):
   ```bash
   node scripts/codex-review.mjs --check --json
   ```
   결과 JSON의 `ok`가 `true`이면 `CODEX_AVAILABLE=true`, 그 외 `false`.
   이 체크는 **바이너리 존재 + 로그인 상태**를 모두 검증합니다.

### 1단계: 입력 해석

```
if $ARGUMENTS matches /^H\d{14}$/:
  기존 topic 재개
  node scripts/topic-state.mjs {H-code} 로 현재 상태 파악
elif $ARGUMENTS matches /^M\d{14}$/:
  새 topic 생성 (해당 meeting을 입력으로)
elif $ARGUMENTS is empty:
  node scripts/list-topics.mjs  →  in-progress topic 목록
  node scripts/list-meetings.mjs --status confirmed  →  사용 가능한 meeting 목록
  사용자 선택 요청
else:
  에러 출력 후 종료
```

### 2단계: topic 디렉토리 준비

**새 topic 생성**:

```bash
date -u +H%Y%m%d%H%M%S    # 예: H20260416152940
```

meeting의 슬러그를 기본값으로 하되 사용자가 변경 가능. 디렉토리 생성:

```
harness/topics/H{ts}_{slug}/
└── reviews/
    ├── spec/
    └── plan/
```

`meeting-ref.md` 작성:

```markdown
---
topic: H{ts}
slug: {slug}
source_meetings:
  - M{meeting-code}
---

# Meeting Reference

...
```

### 3단계: context-pack.md 생성

한 번만 생성하여 두 사이클이 공유합니다.

```
{topic-dir}/context-pack.md
```

포함 내용 (design-doc.md §8.1 참조):

- Project config 요약 (CLAUDE.md 핵심)
- Architecture snapshot (ARCHITECTURE.md 레이어/스택)
- Other topics (harness/topics/ 중 다른 슬러그) 한 줄 요약
- Meeting digest (meeting.md 확정 사항 리스트 + 핵심 요약)
- Constraints
- Glossary

크기 상한 5,000 토큰. 초과 시 요약 압축.

### 4단계: Spec 사이클

#### 4a. Planner 에이전트 생성

```
Agent(name: "spec-planner", subagent_type: "flowness:design-doc-planner"):
```

초기 프롬프트에 다음 컨텍스트 + 부트 명령을 포함합니다:

```
Mode: spec
Topic directory: harness/topics/H{ts}_{slug}/
Project root: {project-root}
Max rounds per decision: 10

[BOOT] Initialize the Spec cycle.
Read meeting-ref.md → source meetings → meeting.md.
Produce initial list of feature decisions (f-*).
Write:
  - decisions.md (Spec Cycle table, all status=open)
  - spec.md scaffolding with empty decision blocks
Then propose the first decision:
  - Write r1-proposal.md with self-validation (S1-S5)
  - RETURN with: [STATUS: proposal r1 f-001]

After producing each proposal, RETURN immediately.
You will be resumed with the review result.
r2+ proposals MUST use delta format (Appendix B).
```

Planner가 초기화 + 첫 proposal을 완료하고 **반환**합니다.

#### 4b. 오케스트레이터 주도 루프

Planner가 proposal을 반환하면, 오케스트레이터가 리뷰를 실행하고 결과를 전달합니다:

```
LOOP:
  1. Planner 응답에서 상태 태그 파싱
     - [STATUS: proposal r{N} {d-id}] → 2단계 (리뷰)
     - [STATUS: done {d-id}] → 4단계 (다음 결정)
     - [STATUS: escalate {d-id}] → §에스컬레이션

  2. 리뷰 실행
     if CODEX_AVAILABLE:
       Bash:
         node scripts/codex-review.mjs --review \
           --topic-dir {topic-dir} \
           --decision {d-id} \
           --round {N} \
           --cycle spec \
           --project-root {project-root} \
           --timeout 120000 --retries 2 --json
       → JSON에서 verdict 추출
     else:
       Agent(subagent_type: "flowness:design-doc-opus-reviewer",
             model: opus,
             prompt: "Mode: spec
               Topic directory: {topic-dir}
               Project root: {project-root}
               Review decision {d-id} round {N}.
               Proposal at: reviews/spec/{d-id}/r{N}-proposal.md")
       → 응답에서 verdict 추출

  3. Planner에게 verdict 전달
     SendMessage → spec-planner:
       [STATUS: review r{N} {d-id} PASS|FAIL]
       Review at: reviews/spec/{d-id}/r{N}-codex.md (또는 r{N}-opus.md)

  4. 다음 결정 확인
     decisions.md에서 다음 open 결정이 있으면:
       SendMessage → spec-planner:
         "Proceed to next open decision."
     모든 결정 완료 → 사이클 종료

  가드레일:
  | 감시 | 조치 |
  |------|------|
  | 태그 없는 응답 | Planner에게 재요청 |
  | 동일 결정 rounds > 10 | escalate 처리, §에스컬레이션 메뉴 |
  | r2+ proposal이 delta가 아님 | Planner에게 delta 형식 재작성 요청 |
  | decisions.md 파싱 에러 | Planner에게 수정 요청, 3회 실패 시 에스컬레이션 |
```

사이클 루프 진행 상태는 주기적으로 `scripts/topic-state.mjs H{ts}`로 확인합니다.

#### 4c. 사이클 종료

모든 f-* 결정이 `consensus | escalated | skipped` 상태가 되면 Spec 사이클 종료.

Spec Planner 세션은 여기서 종료됩니다. Plan Planner는 새 에이전트로 시작합니다.

#### 4d. 사용자 검토 게이트

`spec.md`와 `decisions.md`를 사용자에게 요약 제시:

- 합의된 f-* 결정 수
- 에스컬레이션된 결정 수
- 사용자 선택:
  1. **Approve** → Plan 사이클 진행 (5단계)
  2. **Iterate** → Spec Planner 재생성, 특정 결정 재오픈 (4a 재진입)
  3. **Abort** → 토픽 중단

### 5단계: Plan 사이클

#### 5a. Planner 에이전트 생성

```
Agent(name: "plan-planner", subagent_type: "flowness:design-doc-planner"):
```

초기 프롬프트:

```
Mode: plan
Topic directory: harness/topics/H{ts}_{slug}/
Project root: {project-root}
Max rounds per decision: 10

[BOOT] Initialize the Plan cycle.
Read spec.md + decisions.md (Spec Cycle).
Derive d-* technical decisions needed to implement the consented f-*.
Write:
  - decisions.md Plan Cycle table (all status=open)
  - plan.md scaffolding with empty decision blocks
Then propose first decision and RETURN with:
  [STATUS: proposal r1 d-001]

After producing each proposal, RETURN immediately.
You will be resumed with the review result.
r2+ proposals MUST use delta format (Appendix B).
```

#### 5b. 오케스트레이터 주도 루프

4b와 동일. `--cycle plan`, 결정 ID는 `d-*`.

#### 5c. 사이클 종료

모든 d-* 결정이 `consensus | escalated | skipped`가 되면 Plan 사이클 종료.

plan.md frontmatter의 `spec_hash`에 spec.md 내용의 sha256 앞 8자리를 기록합니다:

```bash
sha256sum {topic-dir}/spec.md | cut -c1-8
```

#### 5d. 사용자 검토 게이트

동일하게 사용자에게 요약 제시 → Approve / Iterate / Abort 선택.

### 6단계: plan-config.md 생성 및 마무리

복잡도 평가 (design-doc.md §의 기준과 일치):

- `simple`: 단일 도메인, 새 의존성 없음 (eval_rounds: 1)
- `moderate`: 2-3 도메인, 기존 패턴 확장 (eval_rounds: 2)
- `complex`: 횡단 관심사, 새 아키텍처 패턴 (eval_rounds: 3)

`harness/rules/`에서 적용 가능한 규칙 스캔.

`{topic-dir}/plan-config.md` 작성:

```markdown
---
topic: H{ts}
complexity: simple | moderate | complex
eval_rounds: 1 | 2 | 3
eval_tool: playwright | ...
applicable_rules: [...]
---

# Plan Config

## Complexity reasoning
...

## Applicable rules
...

## Notes
...
```

`CLAUDE.md`의 활성 토픽 섹션을 갱신합니다.

출력 요약:

- 할당된 H-code + slug.
- spec.md: 합의 {X}개, 에스컬레이션 {Y}개.
- plan.md: 합의 {X}개, 에스컬레이션 {Y}개.
- 복잡도: {level}.
- 다음 단계: `/work H{ts}`.

### 7단계: 에스컬레이션 처리

결정 단위가 10 라운드를 초과하면 사용자에게 5옵션 메뉴를 제시합니다:

1. 현재 Planner 최신 제안 그대로 채택 (status: consensus로 강제 반영)
2. Codex/Opus 최종 FAIL 의견 반영해 수동 수정 후 재시도 (라운드 카운터 리셋)
3. 사용자가 직접 수정 후 재시도 (라운드 카운터 리셋)
4. 해당 결정을 **Out of Scope**로 표시하고 스킵 (status: skipped)
5. 토픽 중단 (status: aborted)

## 중요 규칙

- **직접 spec.md / plan.md를 작성하지 마세요** — Planner가 담당.
- **직접 리뷰를 수행하지 마세요** — Codex CLI 또는 Opus 폴백이 담당.
- **Planner 세션은 사이클 단위** — Spec Planner를 Plan 사이클로 재사용하지 않습니다.
- **파일이 진실** — 메시지가 유실되어도 `reviews/`, `decisions.md`, `spec.md`, `plan.md`에서 재진입 가능해야 합니다.
- **Codex 가용성** — `CODEX_AVAILABLE=false`이면 Opus 폴백을 사용합니다.
- **Delta 강제** — r2+ proposal이 `kind: proposal-delta`가 아니면 Planner에게 재작성을 요청합니다.
- **script 호출로 상태 파악** — 파일 내용을 AI가 재읽지 말고 `scripts/topic-state.mjs`로 상태를 먼저 확인합니다.
- **Max rounds는 결정 단위 기준** — 전체 사이클이 아니라 한 결정 단위에 대한 상한입니다.
- **재개 시 중복 생성 금지** — 이미 consensus 상태인 결정은 다시 제안되지 않도록 Planner에게 지시합니다.
