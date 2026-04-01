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

Topic code: $ARGUMENTS (e.g., H00001)

## Process

### Step 0: Prerequisite check

Verify CLAUDE.md exists at the project root. If not, tell the user to run `/setup` first.

### Step 1: Load context

1. Read CLAUDE.md for project config (max_eval_rounds, eval_tool)
2. Find the topic directory: glob for `harness/exec-plans/active/$ARGUMENTS_*/` to match the topic code
3. Read plan-config.md for dynamic settings (eval_rounds, complexity)
4. Read the referenced product-spec from harness/product-specs/ (path is in plan-config.md)
5. Read relevant eval-criteria/ files listed in CLAUDE.md
6. Identify applicable rules from plan-config.md

If no matching topic directory is found, tell the user to run `/plan` first.

### Step 2: Create build-contract

Create `harness/exec-plans/active/{topic}/build-contract.md`:

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

### Step 3: Generator → Multi-Reviewer → Evaluator Loop

Determine max rounds: min(plan-config.md eval_rounds, CLAUDE.md max_eval_rounds).

Execute the following loop, tracking the current round number starting from 1:

#### Round N:

**3a. Spawn Generator subagent**

Use the Agent tool with `subagent_type: flowness:generator` and pass this prompt:

```
Round: {N}
Topic directory: harness/exec-plans/active/{topic}/
Product spec: harness/product-specs/{topic-name}.md

Files to read:
- harness/exec-plans/active/{topic}/build-contract.md (includes Applicable Rules)
- harness/product-specs/{topic-name}.md
- ARCHITECTURE.md
- Applicable rule folders listed in build-contract.md (read RULE.md for each, detail files as needed)
{If N > 1: - harness/exec-plans/active/{topic}/code-review-r{N-1}.md (previous code review feedback)}
{If N > 1: - harness/exec-plans/active/{topic}/eval-result-r{N-1}.md (previous eval feedback)}

Write your output to: harness/exec-plans/active/{topic}/build-result-r{N}.md
```

Wait for the Generator subagent to complete.

**3b. Verify build-result**

Read `harness/exec-plans/active/{topic}/build-result-r{N}.md` to confirm it was created.

**3c. Spawn 5 Reviewer subagents in parallel**

Spawn ALL 5 reviewers simultaneously using multiple Agent tool calls in a single message. Each reviewer focuses on a different perspective.

**Reviewer 1: RuleReviewer**

Use the Agent tool with `subagent_type: flowness:rule-reviewer` and pass this prompt:

```
Round: {N}
Topic directory: harness/exec-plans/active/{topic}/

Files to read:
- harness/exec-plans/active/{topic}/build-contract.md (Applicable Rules list)
- harness/exec-plans/active/{topic}/build-result-r{N}.md (changed files list)
- Rule detail files from Applicable Rules folders

Return your findings as structured text. Do NOT create a file.
```

**Reviewer 2: QualityReviewer**

Use the Agent tool with `subagent_type: flowness:quality-reviewer` and pass this prompt:

```
Round: {N}
Topic directory: harness/exec-plans/active/{topic}/

Files to read:
- harness/exec-plans/active/{topic}/build-result-r{N}.md (changed files list)
- ARCHITECTURE.md

Return your findings as structured text. Do NOT create a file.
```

**Reviewer 3: SecurityReviewer**

Use the Agent tool with `subagent_type: flowness:security-reviewer` and pass this prompt:

```
Round: {N}
Topic directory: harness/exec-plans/active/{topic}/

Files to read:
- harness/exec-plans/active/{topic}/build-result-r{N}.md (changed files list)
- ARCHITECTURE.md

Return your findings as structured text. Do NOT create a file.
```

**Reviewer 4: PerformanceReviewer**

Use the Agent tool with `subagent_type: flowness:performance-reviewer` and pass this prompt:

```
Round: {N}
Topic directory: harness/exec-plans/active/{topic}/

Files to read:
- harness/exec-plans/active/{topic}/build-result-r{N}.md (changed files list)
- ARCHITECTURE.md

Return your findings as structured text. Do NOT create a file.
```

**Reviewer 5: ArchitectureReviewer**

Use the Agent tool with `subagent_type: flowness:architecture-reviewer` and pass this prompt:

```
Round: {N}
Topic directory: harness/exec-plans/active/{topic}/

Files to read:
- harness/exec-plans/active/{topic}/build-result-r{N}.md (changed files list)
- harness/exec-plans/active/{topic}/build-contract.md
- ARCHITECTURE.md

Return your findings as structured text. Do NOT create a file.
```

Wait for ALL 5 reviewer subagents to complete.

**3d. Aggregate review results**

Collect the outputs from all 5 reviewers and create `harness/exec-plans/active/{topic}/code-review-r{N}.md`:

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

**3e. Check code review result**

Read `harness/exec-plans/active/{topic}/code-review-r{N}.md`:
- If Status is FAIL → skip Evaluator, go back to 3a (Generator fixes all reviewer findings first)
- If Status is PASS → continue to Evaluator

**3f. Spawn Evaluator subagent**

Use the Agent tool with `subagent_type: flowness:evaluator` and pass this prompt:

```
Round: {N}
Topic directory: harness/exec-plans/active/{topic}/
Eval tool: {eval_tool from CLAUDE.md config}

Files to read:
- harness/exec-plans/active/{topic}/build-contract.md
- harness/exec-plans/active/{topic}/build-result-r{N}.md
- Relevant eval-criteria/ files listed in build-contract.md
{If N > 1: - harness/exec-plans/active/{topic}/eval-result-r{N-1}.md (previous round for regression check)}

Write your output to: harness/exec-plans/active/{topic}/eval-result-r{N}.md
```

Wait for the Evaluator subagent to complete.

**3g. Check eval result**

Read `harness/exec-plans/active/{topic}/eval-result-r{N}.md`:
- If Status is PASS → exit loop, go to Step 4
- If Status is FAIL and rounds remaining → increment round number, continue loop
- If Status is FAIL and no rounds remaining → go to Step 5 (escalation)

### Step 4: Success

1. Move the topic directory from `harness/exec-plans/active/{topic}/` to `harness/exec-plans/completed/{topic}/`
2. Update CLAUDE.md: move the topic from Active Topics to a Completed Topics section (or remove it)
3. Output the latest eval-result-r{N}.md summary to the user
4. Inform the user the build is complete
5. Suggest running `/maintain` to update quality scores and docs

### Step 5: Escalation - Human intervention needed

1. Output the latest eval-result-r{N}.md and code-review-r{N}.md to the user
2. List the unresolved issues
3. Ask the user how to proceed:
   - Fix specific issues manually and re-run `/work {topic-code}`
   - Accept the current state as-is
   - Abandon the topic

## Important Rules

- NEVER write code yourself - always delegate to subagents
- NEVER review or evaluate code yourself - always delegate
- Each subagent gets a FRESH context (natural context reset)
- Communication between agents is ONLY through files in the topic directory
- No two agents share a context
- Spawn ALL 5 reviewers in PARALLEL (single message, multiple Agent tool calls) — do NOT spawn them sequentially
- Reviewers return results as text — YOU aggregate them into code-review-r{N}.md
- Any reviewer finding a critical or major issue = FAIL → Generator must fix before Evaluator runs
- Respect max_eval_rounds from CLAUDE.md as an absolute ceiling
- Agent behavior is defined in agents/ files - pass only dynamic context (paths, round number) in the prompt
