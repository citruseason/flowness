---
name: using-worktree
description: Create a git worktree for isolated work. User-invocable convenience skill — orthogonal to Flowness workflow (meeting/design-doc/work). Defaults to auto-branching from main/master; asks when on another branch. Clean up with the cleanup operation.
description-ko: 격리된 작업을 위한 git worktree를 생성합니다. 사용자 호출 편의 스킬 — Flowness 워크플로우(meeting/design-doc/work)와 직교. 기본적으로 main/master에서는 자동 분기하고, 다른 브랜치에서는 사용자에게 물어봅니다. cleanup 작업으로 정리합니다.
user-invocable: true
allowed-tools: Bash, Read, Glob, AskUserQuestion
argument-hint: "[setup {label} | cleanup {label} | list]"
---

# Worktree 편의 스킬

Git worktree를 사용자가 원하는 시점에 만들거나 정리하기 위한 편의 스킬입니다.

## 설계 원칙 (M20260416071814 결정 5)

- **직교**: Flowness의 meeting/design-doc/work 파이프라인과 무관. 어떤 단계에서든 사용자가 직접 호출합니다.
- **명시성**: 자동 생성/자동 진입 없음. 사용자가 호출해야 동작.
- **단일 책임**: 한 번의 호출은 하나의 worktree 연산만 수행.

## 입력

$ARGUMENTS 형식:

| 명령 | 형태 | 설명 |
|------|------|------|
| setup | `setup {label}` | `{label}` worktree 생성 (존재하면 재사용) |
| cleanup | `cleanup {label}` | worktree 제거 + 브랜치 삭제 (브랜치 merge/폐기 후) |
| list | `list` | 현재 worktree 목록 |

`{label}`은 디렉토리/브랜치 이름의 기반이 되는 문자열입니다. 토픽 코드여도 되고 (`T20260416081240`), 임의 슬러그여도 됩니다 (`experiment-foo`). 공백 대신 `-`를 사용하세요.

인자가 비어 있으면 사용법을 출력하고 종료합니다.

## setup 동작

### 1단계: 환경 수집

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
WORKTREE_PATH="${PROJECT_ROOT}/.flowness-worktrees/{label}"
CURRENT_BRANCH=$(git -C "${PROJECT_ROOT}" branch --show-current)
```

### 2단계: 이미 존재하는지 확인

`{WORKTREE_PATH}` 디렉토리가 이미 있으면 재사용합니다. 생성을 건너뛰고 경로를 출력한 뒤 종료합니다.

### 3단계: 브랜치 정책 결정

- **`CURRENT_BRANCH` == `main` 또는 `master`**: 묻지 않고 새 브랜치 `work/{label}`을 자동 생성합니다.
- **그 외**: `AskUserQuestion`으로 사용자에게 질문합니다:

  ```
  Question: 현재 브랜치 '{CURRENT_BRANCH}'에서 worktree를 어떻게 만들까요?
  Options:
    - reuse: '{CURRENT_BRANCH}' 브랜치 그대로 worktree 생성 (기존 브랜치 공유)
    - branch: '{CURRENT_BRANCH}'을 베이스로 새 브랜치 'work/{label}' 생성
  ```

  사용자 응답에 따라 분기합니다.

### 4단계: worktree 생성

**자동 분기 또는 사용자가 `branch` 선택**:

```bash
git -C "${PROJECT_ROOT}" worktree add -b "work/{label}" "${WORKTREE_PATH}"
```

**사용자가 `reuse` 선택**:

```bash
git -C "${PROJECT_ROOT}" worktree add "${WORKTREE_PATH}" "${CURRENT_BRANCH}"
```

### 5단계: 결과 출력

해석된 `WORKTREE_PATH`를 일반 텍스트로 한 줄로 출력합니다 (호출자/사용자가 바로 `cd` 가능하도록). 추가 설명은 출력하지 마세요.

예:
```
/Users/foo/projects/bar/.flowness-worktrees/experiment-foo
```

## cleanup 동작

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
WORKTREE_PATH="${PROJECT_ROOT}/.flowness-worktrees/{label}"

git -C "${PROJECT_ROOT}" worktree remove "${WORKTREE_PATH}"
# unmerged 브랜치를 의도치 않게 날리지 않도록 -d(safe)를 기본으로
git -C "${PROJECT_ROOT}" branch -d "work/{label}" 2>/dev/null || true
```

`-d`가 실패하면(unmerged 브랜치) 메시지를 출력하고 종료합니다. 강제 삭제가 필요하면 사용자가 직접 `git branch -D work/{label}`을 실행하도록 안내합니다.

## list 동작

```bash
git worktree list
```

결과를 그대로 출력합니다.

## 규칙

- **자동 진행**: 요청된 작업을 즉시 수행하고 결과만 출력합니다. 부가 설명 금지.
- 모든 worktree 경로는 `{PROJECT_ROOT}/.flowness-worktrees/` 아래.
- 브랜치 명명: 자동/`branch` 선택 시 `work/{label}`. `reuse` 시 기존 브랜치 그대로.
- 출력은 항상 절대 경로.
- `setup`은 멱등: 이미 존재하면 재생성 없이 경로만 출력.
- **병렬 하위 작업 기능은 없습니다** — 동시 작업이 필요하면 사용자가 `setup`을 서로 다른 label로 여러 번 호출하세요.
