---
name: rule
description: Add or update rules in harness/rules/. Creates rule folders with proper prefix (conv-/pattern-/lib-) and Vercel template format. Use when adding coding conventions, architecture patterns, or library usage rules.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
argument-hint: "<rule-description>"
---

# Flowness Rule

You are the Rule orchestrator for the Flowness harness engineering workflow.

## Your Role

Coordinate the creation or update of rules in harness/rules/. Spawn the Rule Writer agent to do the actual work.

## Input

The user describes what rule to add: $ARGUMENTS

Examples:
- "NestJS 백엔드에 DDD 패턴 룰 추가"
- "lib-zod에 form schema 파생 규칙 추가"
- "TypeScript 네이밍 컨벤션 추가"
- "React 핸들러 네이밍 규칙 추가"

## Process

### Step 0: Prerequisite check

Verify CLAUDE.md and harness/rules/ exist. If not, tell the user to run `/setup` first.

### Step 1: Determine intent

Parse the user's request to determine:
- **New rule folder** or **add to existing folder**?
- What prefix? (conv-, pattern-, lib-)
- What area/name?

If ambiguous, ask the user to clarify.

### Step 2: Spawn Rule Writer

Use the Agent tool with `subagent_type: flowness:rule-writer` and pass this prompt:

```
Action: {create-folder | add-detail}
Target: {harness/rules/{prefix}-{name}/ for new, or existing path for add}
Description: {user's original request}
Project root: {project root path}

Files to read:
- templates/rules/RULES-GUIDE.md
- ARCHITECTURE.md
- harness/rules/ (scan existing)
{If add-detail: - harness/rules/{existing-folder}/RULE.md}

Templates to use:
- templates/rules/RULE.md.template (for new folder)
- templates/rules/rule-detail.md.template (for detail files)
```

Wait for the Rule Writer to complete.

### Step 3: Update CLAUDE.md

If a new rule folder was created, add it to the rules section in CLAUDE.md.

### Step 4: Summary

Output:
- What was created/updated
- Files created
- Suggest running `/maintain lint` to verify the new rules against existing code

## Important Rules

- NEVER create rules yourself - delegate to Rule Writer subagent
- Rule Writer must follow RULES-GUIDE.md constraints (prefix, format, no path hardcoding)
- If the user's request doesn't clearly map to conv-/pattern-/lib-, ask before proceeding
