---
name: internal-review
description: Spawns 5 Reviewer agents in parallel, aggregates findings into code-review file. Returns PASS or FAIL. Internal skill — not user-invocable.
description-ko: 5개의 Reviewer 에이전트를 병렬로 생성하고, 결과를 코드 리뷰 파일로 집계합니다. PASS 또는 FAIL을 반환합니다. 내부 스킬 — 사용자가 직접 호출할 수 없습니다.
user-invocable: false
allowed-tools: Read, Write, Agent, Grep, Glob, TaskUpdate
argument-hint: "round={N} worktree={path} topic={dir} [task-ids={rule,qual,sec,perf,arch,aggr}]"
---

# 리뷰 단계

5개의 전문 리뷰어를 병렬로 생성하고 결과를 집계합니다.

## 입력

$ARGUMENTS에서 파싱합니다:

| 키 | 필수 | 설명 |
|-----|----------|-------------|
| `round` | 예 | 현재 라운드 번호 |
| `worktree` | 예 | 메인 토픽 worktree 절대 경로 |
| `topic` | 예 | 토픽 디렉토리 이름 |
| `task-ids` | 선택 | 쉼표로 구분된 작업 ID 순서: rule, quality, security, performance, architecture, aggregate |

## 프로세스

`task-ids`가 제공된 경우, 처음 5개(리뷰어) 작업 ID를 `in_progress`로 표시합니다.

### 5개 리뷰어 병렬 생성

여러 Agent 도구 호출을 사용하여 **하나의 메시지에서 동시에** 5개 모두를 생성합니다.

**모든 리뷰어의 공통 프롬프트 기반:**

```
Round: {round}
Project root: {worktree}
Topic directory: {worktree}/harness/exec-plans/active/{topic}/

Files to read:
- {worktree}/harness/exec-plans/active/{topic}/build-result-r{round}.md (changed files list)
- {additional files — see table below}

Return your findings as structured text. Do NOT create a file.
```

**리뷰어별 추가 파일:**

| # | 리뷰어 | `subagent_type` | 추가로 읽을 파일 |
|---|----------|-----------------|--------------------------|
| 1 | Rule | `flowness:rule-reviewer` | `build-contract.md` (적용 가능한 규칙 목록), 규칙 폴더의 규칙 상세 파일 |
| 2 | Quality | `flowness:quality-reviewer` | `ARCHITECTURE.md` |
| 3 | Security | `flowness:security-reviewer` | `ARCHITECTURE.md` |
| 4 | Performance | `flowness:performance-reviewer` | `ARCHITECTURE.md` |
| 5 | Architecture | `flowness:architecture-reviewer` | `build-contract.md`, `ARCHITECTURE.md` |

모든 추가 파일 경로는 절대 경로여야 합니다: `{worktree}/harness/exec-plans/active/{topic}/build-contract.md`, `{worktree}/ARCHITECTURE.md`.

5개 모두 완료될 때까지 대기합니다.

`task-ids`가 제공된 경우, 처음 5개 작업 ID를 `completed`로 표시합니다.

### 결과 집계

`task-ids`가 제공된 경우, 6번째(집계) 작업 ID를 `in_progress`로 표시합니다.

`{worktree}/harness/exec-plans/active/{topic}/code-review-r{round}.md`를 생성합니다:

```markdown
# Code Review

## Round: {round}
## Status: PASS | FAIL

## Rule Violations
{RuleReviewer output — or "No violations found."}

## Quality Issues
{QualityReviewer output — or "No issues found."}

## Security Issues
{SecurityReviewer output — or "No issues found."}

## Performance Issues
{PerformanceReviewer output — or "No issues found."}

## Architecture Issues
{ArchitectureReviewer output — or "No issues found."}

## Summary
- Total: {n} issues ({critical}C / {major}M / {minor}m)
- Blocking: {list of critical + major issues}
```

**상태 결정:**
- 어떤 리뷰어에서든 **critical** 또는 **major** 이슈가 있으면 → **FAIL**
- **minor** 이슈만 있거나 이슈가 없으면 → **PASS**

`task-ids`가 제공된 경우, 집계 작업 ID를 `completed`로 표시합니다.

호출자가 읽을 수 있도록 상태(`PASS` 또는 `FAIL`)를 일반 텍스트로 **출력**합니다.

## 규칙

- 5개 리뷰어를 모두 병렬로 생성합니다 — 순차적으로 생성하지 마세요
- 리뷰어는 구조화된 텍스트를 반환합니다, 파일이 아닙니다 — 집계는 이 스킬이 담당합니다
- 리뷰어에게 전달하는 모든 파일에 절대 경로를 사용합니다
- 에이전트 동작은 `agents/*-reviewer.md`에 정의되어 있습니다 — 여기서는 동적 컨텍스트만 전달합니다
