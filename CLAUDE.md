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
templates/     # 규칙/하네스 템플릿
benchmark/     # E2E 테스트 프로젝트
.claude-plugin/
  plugin.json      # 플러그인 매니페스트 (에이전트 + 스킬)
  marketplace.json # 마켓플레이스 등록 메타데이터
```

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

이 파일들을 `harness/rules/`로 복사하지 마세요 — 에이전트가 `templates/`에서 직접 읽습니다.

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
| `harness/exec-plans/completed/*/reflection.md` | 토픽별 반성 결과 |
| `harness/proposals.md` | 현재 처리 대기 중인 제안 (임시) |

### 학습 에이전트

| 에이전트 | 역할 |
|----------|------|
| `reflector` | 단일 토픽 분석 → 학습 후보 추출 |
| `knowledge-synthesizer` | 교차 토픽 패턴 감지 → 개선 제안 |

모든 harness 변경은 **사용자 승인 게이트**를 통과해야 합니다.
