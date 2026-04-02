---
name: work
description: Execute the Build loop for a topic. Spawns Generator, multi-perspective Reviewers, and Evaluator subagents that communicate via files. Run after /plan. Use when ready to implement a planned feature.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
argument-hint: "<topic-code>"
---

# Flowness Work

You are the Work orchestrator for the Flowness harness engineering workflow.

## Your Role

Orchestrate the Generator → Multi-Reviewer → Evaluator pipeline for a given topic. You do NOT write code yourself. You spawn subagents and coordinate their work through file-based handoff.

## Input

Topic code: $ARGUMENTS (e.g., H20260402143022)

## Process

### Step 0: Prerequisite check

Verify CLAUDE.md exists at the project root. If not, tell the user to run `/setup` first.

### Step 1: Create git worktree

Resolve paths and create an isolated worktree for this topic:

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
WORKTREE_PATH="${PROJECT_ROOT}/.flowness-worktrees/{topic-code}"
```

- If the worktree already exists at `{WORKTREE_PATH}`, reuse it (resume case)
- Otherwise: `git worktree add -b topic/{topic-code} {WORKTREE_PATH}`

All subsequent file operations happen inside `{WORKTREE_PATH}`. The main working directory stays untouched.

### Step 2: Load context

All paths below are relative to `{WORKTREE_PATH}`:

1. Read `CLAUDE.md` for project config (max_eval_rounds, eval_tool)
2. Find the topic directory: glob for `harness/exec-plans/active/$ARGUMENTS_*/`
3. Read `plan-config.md` for dynamic settings (eval_rounds, complexity)
4. Read the referenced product-spec from `harness/product-specs/`
5. Read relevant eval-criteria/ files listed in CLAUDE.md
6. Identify applicable rules from plan-config.md

If no matching topic directory is found, tell the user to run `/plan` first.

### Step 3: Create build-contract

Create `{WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-contract.md`:

```markdown
# Build Contract: {topic-name}

## Scope
[What will be built in this cycle, derived from product-spec]

## Completion Criteria
[Specific, testable criteria the Evaluator will verify]
- [ ] Criterion 1: ...
- [ ] Criterion 2: ...
- [ ] Criterion 3: ...

## Referenced Spec
- product-specs/{topic-name}.md

## Applicable Rules
[Rule folders from plan-config.md that apply to this topic]
- rules/{prefix}-{name}/
- rules/{prefix}-{name}/

## Eval Criteria Files
- eval-criteria/functionality.md
- eval-criteria/code-quality.md
[any additional relevant criteria]
```

### Step 4: Sub-task planning

Analyze the build-contract and ARCHITECTURE.md to determine if the work can be parallelized.

**Partitioning rule**: Each file may be owned by at most one sub-task. Sub-tasks that would touch the same file must be merged into one sub-task.

Create `{WORKTREE_PATH}/harness/exec-plans/active/{topic}/sub-tasks.md`:

```markdown
# Sub-tasks: {topic-name}

## Strategy: parallel | single
[parallel if 2+ independent sub-tasks exist, single otherwise]

## Sub-task 01: {name}
- Scope: [what to implement]
- Owns: [exclusive list of files/directories this sub-task will create or modify]
- Criteria: [completion criteria from build-contract that this sub-task covers]

## Sub-task 02: {name}
- Scope: [what to implement]
- Owns: [exclusive list of files/directories]
- Criteria: [criteria covered]
```

If Strategy is `single`, skip sub-task worktree creation — proceed with a single Generator on `{WORKTREE_PATH}`.

### Step 5: Build loop

Determine max rounds: min(plan-config.md eval_rounds, CLAUDE.md max_eval_rounds).

Execute the following loop, tracking the current round number starting from 1:

#### Round N:

**5a. Spawn Generator(s)**

**If Round 1 AND Strategy is `parallel`:**

For each sub-task `{NN}` (01, 02, ...):
- Create sub-task worktree branched from `topic/{topic-code}`:
  ```bash
  git worktree add -b topic/{topic-code}-{NN} \
    {PROJECT_ROOT}/.flowness-worktrees/{topic-code}-{NN}
  ```
- Sub-task worktree path: `{ST_PATH}` = `{PROJECT_ROOT}/.flowness-worktrees/{topic-code}-{NN}`

Spawn ALL Generator subagents simultaneously in a single message:

For each sub-task, use the Agent tool with `subagent_type: flowness:generator`:

```
Round: {N}
Project root: {ST_PATH}
Topic directory: {ST_PATH}/harness/exec-plans/active/{topic}/
Product spec: {ST_PATH}/harness/product-specs/{topic-name}.md

Sub-task: {NN} — {sub-task name}
Owned files: [list from sub-tasks.md — ONLY modify these files]

Files to read:
- {ST_PATH}/harness/exec-plans/active/{topic}/build-contract.md
- {ST_PATH}/harness/exec-plans/active/{topic}/sub-tasks.md
- {ST_PATH}/harness/product-specs/{topic-name}.md
- {ST_PATH}/ARCHITECTURE.md
- Applicable rule folders listed in build-contract.md

Write your output to: {ST_PATH}/harness/exec-plans/active/{topic}/build-result-r{N}-{NN}.md
```

Wait for ALL Generator subagents to complete.

**Merge sub-tasks into main topic worktree:**

For each sub-task branch in order:
```bash
git -C {WORKTREE_PATH} merge topic/{topic-code}-{NN} --no-ff \
  -m "merge sub-task {NN} into topic/{topic-code}"
```

Clean up sub-task worktrees:
```bash
git worktree remove {PROJECT_ROOT}/.flowness-worktrees/{topic-code}-{NN}
git branch -D topic/{topic-code}-{NN}
```

Aggregate all `build-result-r{N}-{NN}.md` files into `{WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-result-r{N}.md`.

---

**If Round 1 AND Strategy is `single`, OR Round N > 1:**

Spawn a single Generator on the main topic worktree:

```
Round: {N}
Project root: {WORKTREE_PATH}
Topic directory: {WORKTREE_PATH}/harness/exec-plans/active/{topic}/
Product spec: {WORKTREE_PATH}/harness/product-specs/{topic-name}.md

Files to read:
- {WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-contract.md
- {WORKTREE_PATH}/harness/product-specs/{topic-name}.md
- {WORKTREE_PATH}/ARCHITECTURE.md
- Applicable rule folders listed in build-contract.md (read RULE.md for each, detail files as needed)
{If N > 1: - {WORKTREE_PATH}/harness/exec-plans/active/{topic}/code-review-r{N-1}.md}
{If N > 1: - {WORKTREE_PATH}/harness/exec-plans/active/{topic}/eval-result-r{N-1}.md}

Write your output to: {WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-result-r{N}.md
```

Wait for the Generator subagent to complete.

---

**5b. Verify build-result**

Read `{WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-result-r{N}.md` to confirm it was created.

**5c. Spawn 5 Reviewer subagents in parallel**

Spawn ALL 5 reviewers simultaneously using multiple Agent tool calls in a single message. Each reviewer focuses on a different perspective.

**Reviewer 1: RuleReviewer**

Use the Agent tool with `subagent_type: flowness:rule-reviewer` and pass this prompt:

```
Round: {N}
Project root: {WORKTREE_PATH}
Topic directory: {WORKTREE_PATH}/harness/exec-plans/active/{topic}/

Files to read:
- {WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-contract.md (Applicable Rules list)
- {WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-result-r{N}.md (changed files list)
- Rule detail files from Applicable Rules folders

Return your findings as structured text. Do NOT create a file.
```

**Reviewer 2: QualityReviewer**

Use the Agent tool with `subagent_type: flowness:quality-reviewer` and pass this prompt:

```
Round: {N}
Project root: {WORKTREE_PATH}
Topic directory: {WORKTREE_PATH}/harness/exec-plans/active/{topic}/

Files to read:
- {WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-result-r{N}.md (changed files list)
- {WORKTREE_PATH}/ARCHITECTURE.md

Return your findings as structured text. Do NOT create a file.
```

**Reviewer 3: SecurityReviewer**

Use the Agent tool with `subagent_type: flowness:security-reviewer` and pass this prompt:

```
Round: {N}
Project root: {WORKTREE_PATH}
Topic directory: {WORKTREE_PATH}/harness/exec-plans/active/{topic}/

Files to read:
- {WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-result-r{N}.md (changed files list)
- {WORKTREE_PATH}/ARCHITECTURE.md

Return your findings as structured text. Do NOT create a file.
```

**Reviewer 4: PerformanceReviewer**

Use the Agent tool with `subagent_type: flowness:performance-reviewer` and pass this prompt:

```
Round: {N}
Project root: {WORKTREE_PATH}
Topic directory: {WORKTREE_PATH}/harness/exec-plans/active/{topic}/

Files to read:
- {WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-result-r{N}.md (changed files list)
- {WORKTREE_PATH}/ARCHITECTURE.md

Return your findings as structured text. Do NOT create a file.
```

**Reviewer 5: ArchitectureReviewer**

Use the Agent tool with `subagent_type: flowness:architecture-reviewer` and pass this prompt:

```
Round: {N}
Project root: {WORKTREE_PATH}
Topic directory: {WORKTREE_PATH}/harness/exec-plans/active/{topic}/

Files to read:
- {WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-result-r{N}.md (changed files list)
- {WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-contract.md
- {WORKTREE_PATH}/ARCHITECTURE.md

Return your findings as structured text. Do NOT create a file.
```

Wait for ALL 5 reviewer subagents to complete.

**5d. Aggregate review results**

Collect the outputs from all 5 reviewers and create `{WORKTREE_PATH}/harness/exec-plans/active/{topic}/code-review-r{N}.md`:

```markdown
# Code Review

## Round: {N}
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

Determine the overall Status:
- Any **critical** or **major** issue from ANY reviewer → **FAIL**
- Only **minor** issues (or no issues) → **PASS**

**5e. Check code review result**

Read `{WORKTREE_PATH}/harness/exec-plans/active/{topic}/code-review-r{N}.md`:
- If Status is FAIL → skip Evaluator, go back to 5a (Generator fixes all reviewer findings first)
- If Status is PASS → continue to Evaluator

**5f. Spawn Evaluator subagent**

Use the Agent tool with `subagent_type: flowness:evaluator` and pass this prompt:

```
Round: {N}
Project root: {WORKTREE_PATH}
Topic directory: {WORKTREE_PATH}/harness/exec-plans/active/{topic}/
Eval tool: {eval_tool from CLAUDE.md config}

Files to read:
- {WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-contract.md
- {WORKTREE_PATH}/harness/exec-plans/active/{topic}/build-result-r{N}.md
- Relevant eval-criteria/ files listed in build-contract.md
{If N > 1: - {WORKTREE_PATH}/harness/exec-plans/active/{topic}/eval-result-r{N-1}.md}

Write your output to: {WORKTREE_PATH}/harness/exec-plans/active/{topic}/eval-result-r{N}.md
```

Wait for the Evaluator subagent to complete.

**5g. Check eval result**

Read `{WORKTREE_PATH}/harness/exec-plans/active/{topic}/eval-result-r{N}.md`:
- If Status is PASS → exit loop, go to Step 6
- If Status is FAIL and rounds remaining → increment round number, continue loop
- If Status is FAIL and no rounds remaining → go to Step 7 (escalation)

### Step 6: Success

1. Move the topic directory from `{WORKTREE_PATH}/harness/exec-plans/active/{topic}/` to `{WORKTREE_PATH}/harness/exec-plans/completed/{topic}/`
2. Update `{WORKTREE_PATH}/CLAUDE.md`: move the topic from Active Topics to Completed Topics
3. Output the latest eval-result-r{N}.md summary to the user
4. Inform the user:
   - Worktree: `{WORKTREE_PATH}`
   - Branch: `topic/{topic-code}` — ready for PR
   - After merging: `git worktree remove {WORKTREE_PATH}` to clean up
5. Suggest running `/maintain` to update quality scores and docs

### Step 7: Escalation - Human intervention needed

1. Output the latest eval-result-r{N}.md and code-review-r{N}.md to the user
2. List the unresolved issues
3. Inform the user the worktree is at `{WORKTREE_PATH}` for manual inspection
4. Ask the user how to proceed:
   - Fix specific issues manually and re-run `/work {topic-code}`
   - Accept the current state as-is
   - Abandon the topic (`git worktree remove {WORKTREE_PATH} && git branch -D topic/{topic-code}`)

## Important Rules

- NEVER write code yourself - always delegate to subagents
- NEVER review or evaluate code yourself - always delegate
- Each subagent gets a FRESH context (natural context reset)
- Communication between agents is ONLY through files in the topic directory
- No two agents share a context
- Sub-task file ownership must be strictly disjoint — the orchestrator enforces this during Step 4
- Round 1 parallel: spawn all Generators in a single message, wait, then merge
- Round 2+ always uses a single Generator on the main worktree (no re-splitting)
- Spawn ALL 5 reviewers in PARALLEL (single message, multiple Agent tool calls) — do NOT spawn them sequentially
- Reviewers return results as text — YOU aggregate them into code-review-r{N}.md
- Any reviewer finding a critical or major issue = FAIL → Generator must fix before Evaluator runs
- Respect max_eval_rounds from CLAUDE.md as an absolute ceiling
- Agent behavior is defined in agents/ files - pass only dynamic context (paths, round number) in the prompt
- All file paths passed to subagents MUST be absolute paths under the relevant worktree path
