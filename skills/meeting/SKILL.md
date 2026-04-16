---
name: meeting
description: Brainstorm ideas and maintain backlog-style meeting notes. Delegates to superpowers:brainstorming, then distills confirmed decisions into a persistent meeting file. Run before /design-doc. Meetings are reusable inputs across multiple topics.
description-ko: 아이디어를 브레인스토밍하고 백로그 형태의 회의록을 유지합니다. superpowers:brainstorming에 위임한 뒤 확정 사항을 지속적인 회의 파일로 증류합니다. /design-doc 이전에 실행하세요. 회의는 여러 토픽의 입력으로 재사용될 수 있습니다.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Skill
argument-hint: "<topic-description> | <M-code> (to resume)"
---

# Flowness Meeting

당신은 Flowness harness 엔지니어링 워크플로우의 **회의(Meeting)** 오케스트레이터입니다.

## 역할

아이디어를 브레인스토밍하고 **백로그성 회의록**을 지속 관리합니다. `meeting.md`는 아직 구현 단계가 아닌 확정된 아이디어 묶음이며, 이후 `/design-doc`의 입력이 됩니다. 한 meeting이 여러 topic의 입력이 될 수 있습니다.

직접 회의록을 작성하지 않습니다 — `superpowers:brainstorming` 스킬에 위임하고, 완료 후 확정 내용을 증류해 `meeting.md`에 기록합니다.

## 입력

사용자가 다음 중 하나를 전달합니다 (`$ARGUMENTS`):

- **새 meeting**: 자연어로 브레인스토밍할 주제 (예: "다크모드 토글을 추가하고 싶어").
- **기존 meeting 재개**: `M{ts}` 코드 (예: `M20260416152940`).
- **인자 없음**: `scripts/list-meetings.mjs` 결과를 보여주고 사용자에게 선택/신규 생성 여부 확인.

## 프로세스

### 0단계: 전제조건 확인

프로젝트 루트에 `CLAUDE.md`, `harness/` 디렉토리가 존재하는지 확인합니다. 없으면 `/setup`을 먼저 실행하도록 안내.

### 1단계: 입력 해석

```
if $ARGUMENTS matches /^M\d{14}$/:
  기존 meeting 재개 → scripts/list-meetings.mjs --json 으로 확인 후 해당 디렉토리 로드
elif $ARGUMENTS is empty:
  node scripts/list-meetings.mjs 실행 → 결과 사용자에게 보여주고 선택 또는 신규 요청
else:
  새 meeting 생성 모드
```

### 2단계: 새 meeting일 경우 코드와 디렉토리 할당

타임스탬프 기반 코드 생성:

```bash
date -u +M%Y%m%d%H%M%S
# 예: M20260416152940
```

`$ARGUMENTS`에서 kebab-case 슬러그 도출. 디렉토리 생성:

```
harness/meetings/M{ts}_{kebab-slug}/
└── brainstorms/
```

### 3단계: 브레인스토밍 위임

다음 args로 `superpowers:brainstorming` 스킬을 호출합니다:

```
Skill: superpowers:brainstorming
args: |
  <사용자의 $ARGUMENTS 또는 기존 meeting.md의 "다음 단계" 섹션>

  Design document output path: harness/meetings/M{ts}_{slug}/brainstorms/{YYYY-MM-DD}-r{N}.md
  Do NOT write to docs/superpowers/specs/. Use the path above instead.
  After writing, do NOT transition to writing-plans skill. Return control to the caller.
```

- `{N}`은 기존 brainstorms/ 디렉토리에서 해당 날짜의 기존 파일 수 + 1.
- 브레인스토밍 스킬이 "writing-plans로 전환"을 제안해도 따르지 말고 본 스킬로 복귀합니다.

### 4단계: meeting.md 증류

브레인스토밍 원본 파일을 읽고 **확정된 결정 사항만 증류**하여 `meeting.md`에 기록합니다. 원본 대화는 `brainstorms/`에 보존됩니다.

기존 meeting 재개의 경우 `meeting.md` 하단에 새 섹션을 추가하는 형태로 **증분 업데이트**합니다.

`meeting.md` frontmatter:

```yaml
---
code: M{ts}
slug: {kebab-slug}
title: "..."
status: draft | confirmed    # 사용자 확정 전까지 draft
created: <UTC ISO>
updated: <UTC ISO>
participants:
  - user
  - claude (brainstormer)
outputs: []                  # design-doc에서 채워짐
---
```

본문 구조 (`templates/meeting.md.template` 참조):

```markdown
# 회의 요약

## 문제 정의
...

## 확정된 결정 사항
...

## Open Questions
...

## 다음 단계
...
```

### 5단계: 사용자 확정

meeting.md 내용을 사용자에게 요약 제시 후 다음 중 선택:

1. **Confirm** — `status: confirmed`로 변경. 이후 `/design-doc`의 입력으로 사용 가능.
2. **Iterate** — 추가 브레인스토밍 라운드 진입 (3단계로 복귀, r{N+1}).
3. **Archive** — `status: archived`로 저장. 실행하지 않고 보존.

### 6단계: 마무리

사용자에게 요약 출력:

- 생성/갱신된 meeting 코드 및 경로.
- 상태 (`draft | confirmed | archived`).
- 다음 단계:
  - `confirmed`인 경우: `/design-doc M{code}` 실행.
  - `draft`인 경우: 후속 라운드 안내.

## 출력

```
harness/meetings/M{ts}_{slug}/
├── meeting.md
└── brainstorms/
    └── {YYYY-MM-DD}-r{N}.md
```

## 중요 규칙

- **직접 회의록을 작성하지 않는다** — 브레인스토밍은 `superpowers:brainstorming`에, 증류만 본 스킬이 수행합니다.
- **원본은 보존, 증류는 별도** — `brainstorms/*.md`는 편집하지 않고, `meeting.md`만 업데이트합니다.
- **슬러그 변경 허용** — 내용 방향이 바뀌면 슬러그를 변경할 수 있습니다. 디렉토리명도 리네임 가능. 단 코드 `M{ts}`는 불변.
- **여러 topic에 재사용 가능** — 한 meeting이 여러 design-doc topic의 입력이 될 수 있습니다 (`outputs[]` 배열).
- **완료 마커 없음** — meeting에는 별도 완료 파일이 없습니다. `status: confirmed` frontmatter 값으로 충분합니다.
- **`/design-doc`을 자동 실행하지 않는다** — 사용자에게 안내만 하고 종료합니다.
