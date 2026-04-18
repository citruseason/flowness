# Flowness

Claude Code를 위한 구조화된 엔지니어링 워크플로우 플러그인. `Setup → Meeting → Design-Doc → Work (Build-Eval) → Maintain` 흐름으로 개발을 안내합니다.

## 설치

**사전 조건:** [Claude Code](https://docs.anthropic.com/en/docs/claude-code) CLI 설치 및 인증 완료.

```bash
# 1. 이 저장소를 마켓플레이스로 추가
claude plugins marketplace add citruseason/flowness

# 2. 플러그인 설치
claude plugins install flowness
```

Claude Code 세션에서 `/setup`이 스킬로 인식되면 설치가 완료된 것입니다.

### 필수 플러그인: superpowers

`/meeting`의 브레인스토밍 단계에서 [superpowers](https://github.com/obra/superpowers) 플러그인의 `brainstorming` 스킬을 사용합니다.

```
/plugin install superpowers@claude-plugins-official
```

### 선택 플러그인: Codex

`/design-doc`의 리뷰 단계에서 Codex 기반 기술 타당성 리뷰를 추가로 수행할 수 있습니다. 없어도 동작하지만, 설치 시 Claude 리뷰어와 병렬로 Codex 리뷰가 실행됩니다.

```
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
```

## 업데이트

```bash
# 1. 마켓플레이스 메타데이터 새로고침
claude plugins marketplace update flowness

# 2. 설치된 플러그인 업데이트
claude plugins update flowness@flowness
```

## 스킬 (슬래시 커맨드)

| 커맨드 | 설명 |
|--------|------|
| `/setup` | 프로젝트 분석 후 harness 지식 베이스 스캐폴딩 (`CLAUDE.md`, `ARCHITECTURE.md`, `harness/`) |
| `/meeting` | 브레인스토밍 + 백로그 관리. 결정을 담은 재사용 가능한 meeting 문서 생성 |
| `/design-doc` | 확정된 meeting으로부터 Spec → Plan 생성 (결정 단위 합의 팀) |
| `/work <topic-code>` | TDD 없는 Build 루프 — 결정 단위(`d-NNN`)별로 `GENERATE → REVIEW → COMMIT` 3단계 수행 |
| `/work-tdd <topic-code>` | TDD 기반 Build 루프 — 결정 단위별로 `RED → GREEN → REFACTOR → REVIEW → COMMIT` 5단계 수행 |
| `/evaluate <topic-code>` | 최신 빌드를 실행해 eval 기준으로 PASS/FAIL 판정 |
| `/maintain [lint\|doc-garden\|gc\|learn\|all]` | 린터, doc-garden, GC, 교차 토픽 학습 수행 |
| `/rule <rule-description>` | `harness/rules/` 규칙 추가/업데이트 (Vercel agent-skills 패턴) |
| `/using-worktree` | 격리된 git worktree 생성/정리 (워크플로우와 독립된 편의 스킬) |

## 에이전트

| 에이전트 | 역할 |
|----------|------|
| `design-doc-planner` | Spec/Plan의 결정 단위 제안 작성 및 리뷰 피드백 반영 |
| `design-doc-claude-reviewer` | 결정 단위의 정합성/완전성/측정 가능성/명확성 리뷰 |
| `design-doc-codex-reviewer` | Codex 기반 기술 타당성 리뷰 (Codex 플러그인 필요) |
| `design-doc-opus-reviewer` | Codex 미설치 시 Opus 모델로 대체 기술 리뷰 |
| `generator` | 결정 단위 구현 — `GENERATE` / `RED` / `GREEN` / `REFACTOR` / `REVIEW-fix` 단계 수행 |
| `code-reviewer` | 모듈성, 최적화, 시간 복잡도, 패턴, lint/test 통과 통합 리뷰 |
| `evaluator` | 실행 중인 애플리케이션 테스트 후 PASS/FAIL 판정 |
| `rule-writer` | `harness/rules/` 규칙 생성/업데이트 |
| `librarian` | 라이브러리 조사 및 버전 비교 |
| `explorer` | 프로젝트 레이아웃 및 구조 탐색 |
| `reflector` | 토픽 완료 후 리뷰/평가 결과에서 학습 후보 추출 |
| `knowledge-synthesizer` | 교차 토픽 패턴 집계 및 harness 개선 제안 |

## 워크플로우

```
/setup → /meeting → /design-doc → /work (or /work-tdd) → /evaluate → /maintain
   |        |            |                 |                  |           |
 harness  결정 담은    Spec + Plan       task.md 기반       실행 테스트  /rule,
 스캐폴딩 meeting     (결정 단위 합의)    Build 루프         + PASS/FAIL  learn
```

1. **Setup** — 지식 베이스 스캐폴딩 및 worktree용 `.gitignore` 초기화
2. **Meeting** — 브레인스토밍으로 결정/옵션을 모으고 재사용 가능한 meeting 문서 작성
3. **Design-Doc** — 확정된 meeting을 입력으로 Spec(무엇을) / Plan(어떻게) 문서를 결정 단위 합의 방식으로 생성
4. **Work / Work-TDD** — `task.md` 트래커(`d-NNN × step`)로 결정 단위별 빌드 수행
5. **Evaluate** — 실행 중인 앱을 eval 기준으로 검증
6. **Maintain** — 코드/문서 건강성 유지 + 교차 토픽 학습

## Spec & Plan (결정 단위 합의)

`/design-doc`은 두 문서를 각각 독립된 사이클로 생성합니다. 각 사이클은 **결정 단위(`f-NNN` 또는 `d-NNN`)** 단위로 **Planner ↔ Reviewer 합의** 라운드를 반복합니다.

### Spec (`spec.md`)

**무엇을** 만들 것인가 — 기능, 사용자 스토리, 성공 기준. 결정 ID: `f-NNN`.

### Plan (`plan.md`)

**어떻게** 구현할 것인가 — 아키텍처 결정, 모듈 경계, 기술 의존성. 결정 ID: `d-NNN`. Spec이 확정된 후 작성되며, Plan 결정은 `/work`의 `task.md`에서 1:1로 매핑됩니다.

### 결정 단위 합의 팀

- **Planner**: 결정 단위 제안 작성
- **Claude Reviewer**: 정합성/완전성/측정 가능성/명확성 리뷰
- **Codex Reviewer** (선택, Codex 플러그인 필요): 기술 타당성 리뷰
- **Opus Reviewer** (폴백): Codex 미설치 시 Claude Opus 모델로 대체 기술 리뷰

합의에 도달한 결정만 `spec.md` / `plan.md`에 커밋됩니다.

## 하네스 디렉토리 규약

```
harness/
├── meetings/M{ts}_{slug}/
│   ├── meeting.md
│   └── brainstorms/{date}-r{N}.md
├── topics/{T|H}{ts}_{slug}/
│   ├── meeting-ref.md
│   ├── context-pack.md
│   ├── spec.md
│   ├── plan.md
│   ├── decisions.md
│   ├── plan-config.md
│   ├── task.md                    # /work, /work-tdd 트래커
│   ├── reflection.md              # 존재 = 토픽 완료
│   └── reviews/{spec|plan}/{d-id}/r{N}-*.md
├── rules/
├── learning-log.md
├── learning-history/
└── proposals.md
```

### ID 체계

| 코드 | 의미 | 형식 |
|------|------|------|
| `M{ts}` | Meeting 코드 | `M` + 14자리 UTC 타임스탬프 |
| `T{ts}` | Topic 코드 (신규) | `T` + 14자리 UTC 타임스탬프 |
| `H{ts}` | Topic 코드 (레거시) | `H` + 14자리 UTC 타임스탬프 — 신규 생성은 중단, 기존 토픽만 유지 |
| `f-NNN` | Spec 결정 ID | 사이클 내 증가 |
| `d-NNN` | Plan 결정 ID | 사이클 내 증가 |

슬러그(kebab-case 이름)는 가변, 코드는 불변. 참조는 항상 코드로.

## 상태 조회 스크립트

Frontmatter와 파일 존재만으로 상태를 판정하는 결정론적 Node.js ESM 스크립트. AI가 전체 harness를 재읽지 않고 토큰을 절감합니다.

| 스크립트 | 용도 |
|----------|------|
| `node scripts/list-meetings.mjs [--json] [--status draft\|confirmed\|archived]` | meeting 목록 + 연결된 topic |
| `node scripts/list-topics.mjs [--json] [--state initialized\|design-doc\|working\|done]` | 토픽 상태 목록 |
| `node scripts/topic-state.mjs <T\|H>{ts} [--json]` | 특정 토픽의 상태 요약 |

## 자기 학습 시스템

`/work` 또는 `/work-tdd` 완료 시 자동으로 `reflector`가 실행되어 `reflection.md`와 `learning-log.md`를 갱신합니다. `/maintain learn`은 `knowledge-synthesizer`로 교차 토픽 패턴을 집계하고 `harness/proposals.md`에 개선 제안을 작성합니다. 모든 harness 변경은 **사용자 승인 게이트**를 통과합니다.

## 주요 설계 결정

### Git Worktree 격리

`/using-worktree`로 워크플로우와 독립되게 worktree를 만들 수 있고, `/work` / `/work-tdd` 실행 시에도 격리된 환경에서 빌드가 진행됩니다. main 작업 디렉토리를 직접 건드리지 않습니다.

### 결정 단위 체크박스 트래커 (`task.md`)

`/work`, `/work-tdd`는 `plan.md`의 각 결정 `d-NNN`을 행으로, 단계(`GENERATE`/`REVIEW`/`COMMIT` 또는 `RED`/`GREEN`/`REFACTOR`/`REVIEW`/`COMMIT`)를 열로 하는 체크박스 매트릭스를 사용합니다. 재개 시 체크되지 않은 다음 셀부터 이어서 진행합니다.

### 통합 Code Reviewer

초기의 Architecture/Security/Performance/Quality/Rule 5개 reviewer는 단일 `code-reviewer`로 통합되었습니다 (결정 이력: `M20260416071814` 결정 3·4). 모듈성, 최적화, 시간 복잡도, 패턴, lint/test 통과를 한 번에 검토하여 리뷰 오버헤드를 줄입니다.

### Rule Skills (Vercel Agent-Skills 패턴)

규칙은 [Vercel agent-skills](https://github.com/vercel-labs/agent-skills) 패턴을 따릅니다:

```
harness/rules/{prefix}-{name}/
├── SKILL.md              # Quick Reference 인덱스 (코드 없음)
└── rules/
    ├── _sections.md      # 카테고리 → 우선순위 메타
    └── {cat}-{name}.md   # Incorrect/Correct 예시와 함께 개별 규칙
```

`/rule`은 `.claude/skills/`에 심볼릭 링크를 만들어 Claude Code가 `description` 기반으로 규칙을 자동 트리거하게 합니다. Generator는 `SKILL.md`로 적용 규칙을 식별하고, `rules/`의 상세 파일로 전체 패턴을 읽어옵니다.

## 언어 규칙

- 모든 스킬, 에이전트, 템플릿 파일의 본문은 **한국어**로 작성합니다.
- frontmatter의 `description` 필드는 영문으로 유지합니다 (트리거링 호환성).
- frontmatter에 `description-ko` 필드를 추가하여 한국어 설명을 포함합니다.
- 코드 블록, 파일 경로, 변수명, 도구명, 스킬명(`flowness:xxx`)은 번역하지 않습니다.

## 라이선스

MIT
