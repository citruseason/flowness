---
name: internal-worktree
description: Git worktree lifecycle management for topic and sub-task branches. Creates, reuses, merges, and cleans up worktrees. Internal skill — not user-invocable.
description-ko: 토픽 및 하위 작업 브랜치를 위한 Git worktree 수명주기 관리. Worktree를 생성, 재사용, 병합 및 정리합니다. 내부 스킬 — 사용자가 직접 호출할 수 없습니다.
user-invocable: false
allowed-tools: Bash, Read, Glob
argument-hint: "{operation} {topic-code} [options]"
---

# Worktree 관리자

Flowness 작업 파이프라인을 위한 git worktree를 관리합니다.

## 입력

$ARGUMENTS 형식: `{operation} {topic-code} [options]`

## 작업

### setup {topic-code}

메인 토픽 worktree를 생성하거나 재사용합니다.

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
WORKTREE_PATH="${PROJECT_ROOT}/.flowness-worktrees/{topic-code}"
```

- `{WORKTREE_PATH}`가 이미 존재하면 → 재사용합니다 (재개 케이스), 생성을 건너뜁니다
- 그렇지 않으면: `git worktree add -b topic/{topic-code} {WORKTREE_PATH}`

호출자가 캡처할 수 있도록 해석된 `WORKTREE_PATH`를 일반 텍스트로 **출력**합니다.

### create-subtask {topic-code} {NN}

토픽 브랜치에서 분기된 하위 작업 worktree를 생성합니다.

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
WORKTREE_PATH="${PROJECT_ROOT}/.flowness-worktrees/{topic-code}"
ST_PATH="${PROJECT_ROOT}/.flowness-worktrees/{topic-code}-{NN}"
git -C ${WORKTREE_PATH} worktree add -b topic/{topic-code}-{NN} ${ST_PATH}
```

해석된 `ST_PATH`를 **출력**합니다.

### merge-subtasks {topic-code} {NN-list}

하위 작업 브랜치를 순서대로 메인 토픽 worktree에 병합합니다.

`{NN-list}`는 쉼표로 구분합니다: `01,02,03`

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
WORKTREE_PATH="${PROJECT_ROOT}/.flowness-worktrees/{topic-code}"

for NN in {each NN from NN-list}; do
  git -C ${WORKTREE_PATH} merge topic/{topic-code}-${NN} --no-ff \
    -m "merge sub-task ${NN} into topic/{topic-code}"
done
```

### cleanup-subtask {topic-code} {NN}

하위 작업 worktree를 제거하고 해당 브랜치를 삭제합니다.

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
git worktree remove ${PROJECT_ROOT}/.flowness-worktrees/{topic-code}-${NN}
git branch -D topic/{topic-code}-${NN}
```

### cleanup {topic-code}

메인 토픽 worktree를 제거하고 선택적으로 브랜치를 삭제합니다. 토픽 브랜치가 병합되거나 폐기된 후에만 호출하세요.

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
git worktree remove ${PROJECT_ROOT}/.flowness-worktrees/{topic-code}
```

## 규칙

- 모든 worktree 경로는 `{PROJECT_ROOT}/.flowness-worktrees/` 아래에 위치합니다
- 브랜치 명명 규칙: 메인은 `topic/{topic-code}`, 하위 작업은 `topic/{topic-code}-{NN}`
- 출력에는 항상 절대 경로를 사용합니다
- `setup`의 경우: worktree가 이미 존재하면 재생성하지 않고 경로만 출력합니다
