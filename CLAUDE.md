# Flowness

Claude Code를 위한 구조화된 엔지니어링 워크플로우 플러그인.

## 언어 규칙

- 모든 스킬, 에이전트, 템플릿 파일의 본문은 **한국어**로 작성합니다.
- frontmatter의 `description` 필드는 영문으로 유지합니다 (트리거링 호환성).
- frontmatter에 `description-ko` 필드를 추가하여 한국어 설명을 포함합니다.
- 코드 블록, 파일 경로, 변수명, 도구명, 스킬명(`flowness:xxx`)은 번역하지 않습니다.

## 프로젝트 구조

```
agents/        # 서브에이전트 정의
skills/        # 사용자 호출 스킬 (슬래시 커맨드) 및 내부 스킬
templates/     # 규칙/하네스/design-doc 템플릿
scripts/       # 결정론적 상태 조회 스크립트 (list-meetings / list-topics / topic-state)
benchmark/     # E2E 테스트 프로젝트
.claude-plugin/
  plugin.json      # 플러그인 매니페스트 (에이전트 + 스킬)
  marketplace.json # 마켓플레이스 등록 메타데이터
```

## 워크플로우

사용자 호출 스킬 실행 순서:

```
/setup  →  /meeting  →  /design-doc  →  /work  →  /maintain
```

| 스킬 | 역할 | 산출물 |
|------|------|--------|
| `/setup` | 프로젝트 분석 + harness 스캐폴딩 | `CLAUDE.md`, `ARCHITECTURE.md`, `harness/` |
| `/meeting` | 브레인스토밍 + 백로그 관리 | `harness/meetings/M{ts}_{slug}/` |
| `/design-doc` | Spec → Plan 생성 (결정 단위 합의 팀) | `harness/topics/H{ts}_{slug}/` |
| `/work` | Build–Eval 루프 | 코드 변경 + `reflection.md` |
| `/maintain` | 학습 / 규칙 작성 / 유지보수 | `harness/proposals.md`, `harness/rules/*` |

## 하네스 디렉토리 규약

```
harness/
├── meetings/
│   └── M{YYYYMMDDHHmmss}_{slug}/
│       ├── meeting.md
│       └── brainstorms/{YYYY-MM-DD}-r{N}.md
├── topics/
│   └── H{YYYYMMDDHHmmss}_{slug}/
│       ├── meeting-ref.md
│       ├── context-pack.md
│       ├── spec.md
│       ├── plan.md
│       ├── decisions.md
│       ├── plan-config.md
│       ├── reflection.md          # 존재 = 토픽 완료
│       └── reviews/{spec|plan}/{d-id}/r{N}-*.md
├── rules/                         # /rule, /maintain learn의 산출물
├── learning-log.md
├── learning-history/
└── proposals.md                   # 임시
```

### ID 체계

| 코드 | 의미 | 형식 | 불변 |
|------|------|------|------|
| `M{ts}` | Meeting 코드 | `M` + 14자리 UTC 타임스탬프 | 예 |
| `H{ts}` | Topic 코드 | `H` + 14자리 UTC 타임스탬프 | 예 |
| `f-NNN` | Spec 결정 ID | 사이클 내 증가 | 예 |
| `d-NNN` | Plan 결정 ID | 사이클 내 증가 | 예 |

슬러그(kebab-case 이름)는 **가변**입니다. 참조는 항상 코드로 합니다.

### 완료 판단

- **meeting 완료**: `meeting.md` frontmatter `status: confirmed`.
- **topic 완료**: `harness/topics/{code}_{slug}/reflection.md` 존재.

중간 단계 완료 마커 파일(`.done.md` 등)은 사용하지 않습니다.

## 플러그인 매니페스트 (`plugin.json`)

`plugin.json`은 플러그인에 포함될 에이전트 파일과 스킬 디렉토리를 선언합니다. `agents/`의 실제 파일과 항상 동기화 상태를 유지해야 합니다.

### `plugin.json` 업데이트 시점

| 변경 사항 | 필요한 업데이트 |
|-----------|----------------|
| 새 에이전트 파일 추가 | `agents` 배열에 항목 추가 |
| 에이전트 제거 또는 이름 변경 | 해당 항목 제거/업데이트 |
| 새 스킬 디렉토리 추가 | `skills` 배열에 항목 추가 |

**`plugin.json`이 존재하지 않는 파일을 참조하면 경로 오류로 플러그인 로드에 실패합니다.**

### 버전 관리

버전 형식: `0.1.x` — 패치 번호만 올립니다.

```bash
# 현재 버전 확인
cat .claude-plugin/plugin.json | grep version

# 예시: 0.1.0 → 0.1.1
```

에이전트나 스킬이 추가, 제거, 또는 크게 변경될 때마다 `plugin.json`의 버전을 올립니다.

## 템플릿

`templates/rules/`는 규칙 형식의 단일 진실 공급원(single source of truth)입니다:
- `RULES-GUIDE.md` — 규칙 작성 규약 및 핵심 원칙
- `RULE.md.template` — 새 규칙 폴더의 기본 템플릿
- `rule-detail.md.template` — 개별 규칙 파일의 기본 템플릿

`templates/design-doc/`는 `/meeting`, `/design-doc` 스킬이 사용하는 템플릿 모음입니다:
- `meeting.md.template`, `meeting-ref.md.template`
- `context-pack.md.template`
- `spec.md.template`, `plan.md.template`
- `decisions.md.template`
- `proposal.md.template`, `review.md.template`
- `plan-config.md.template`

이 파일들을 `harness/` 하위로 복사하지 마세요 — 에이전트가 `templates/`에서 직접 읽습니다.

## 스크립트 (결정론적 상태 조회)

`scripts/`의 Node.js ESM 스크립트는 frontmatter와 파일 존재만으로 상태를 판정합니다. AI가 파일을 재읽는 대신 이 스크립트를 호출해 토큰을 절감합니다.

| 스크립트 | 용도 |
|----------|------|
| `node scripts/list-meetings.mjs [--json] [--status draft\|confirmed\|archived]` | 모든 meeting 목록 + 연결된 topic |
| `node scripts/list-topics.mjs [--json] [--state initialized\|design-doc\|working\|done]` | 모든 topic의 현재 상태 |
| `node scripts/topic-state.mjs H{ts} [--json]` | 특정 topic의 상태 요약 |

출력은 사람이 읽는 형태와 `--json` 두 모드를 지원합니다.

## 자기 학습 시스템

`/work` 완료 후 자동으로 반성(reflection) 분석이 실행되어 학습 후보를 추출합니다. `/maintain learn`으로 교차 토픽 패턴을 집계하고 harness 개선 제안을 생성합니다.

### 학습 흐름

```
/work 완료 → internal-reflect → reflection.md → learning-log.md
                                                       ↓
/maintain learn → internal-learn → proposals.md → 사용자 승인 → harness 업데이트
```

### 학습 관련 파일

| 파일 | 역할 |
|------|------|
| `harness/learning-log.md` | 추가 전용 학습 기록 |
| `harness/learning-history/` | 처리 완료된 제안 보관 |
| `harness/topics/*/reflection.md` | 토픽별 반성 결과 (완료 마커 겸용) |
| `harness/proposals.md` | 현재 처리 대기 중인 제안 (임시) |

### 학습 에이전트

| 에이전트 | 역할 |
|----------|------|
| `reflector` | 단일 토픽 분석 → 학습 후보 추출 |
| `knowledge-synthesizer` | 교차 토픽 패턴 감지 → 개선 제안 |

모든 harness 변경은 **사용자 승인 게이트**를 통과해야 합니다.

## 활성 토픽

현재 진행 중인 토픽 없음.

완료된 이전 토픽:

- `T20260416081240_using-worktree-skill` — `internal-worktree` → `using-worktree` rename, user-invocable, AskUserQuestion 통합, sub-task 제거. (M20260416071814 결정 5)
- `T20260416081244_work-task-tracking` — `task.md` 도입, `/work` 0단계 자동 파생, plan.md ↔ task.md 매핑. (M20260416071814 결정 1·4)
- `T20260416081248_work-tdd-split` — `/work-tdd` 신규 스킬, `/work` 3-step 정리, internal-tdd 통합. (M20260416071814 결정 2)
- `T20260416081252_work-review-collapse` — 5 reviewer 에이전트 삭제, `code-reviewer` 신규, `code-reviews/` 폴더 도입. (M20260416071814 결정 3·4)
- `H20260416152940_design-doc-split` — `/plan` 분해 (`/meeting` + `/design-doc`) 재설계.
- `H20260416065800_work-path-integration` — `/work` 및 내부 스킬의 harness 경로 참조 통합.

## 토픽 코드 prefix

- 신규 토픽은 `T{ts}` prefix 사용 (`M20260416071814` 결정 6).
- 기존 `H{ts}` 토픽은 그대로 유지. 일괄 H→T rename은 위 4개 토픽 완료 후 별도 미팅에서 처리한다.
- `scripts/lib/harness-fs.mjs`는 `H`/`T` 모두 인식하도록 호환 처리됨 (R4 기술 전제조건).
