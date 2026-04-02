---
name: rule
description: Add or update rules in harness/rules/. Creates rule folders with proper prefix (conv-/pattern-/lib-) and Vercel template format. Use when adding coding conventions, architecture patterns, or library usage rules.
description-ko: harness/rules/에 규칙을 추가하거나 업데이트합니다. 적절한 접두사(conv-/pattern-/lib-)와 Vercel 템플릿 형식으로 규칙 폴더를 생성합니다. 코딩 컨벤션, 아키텍처 패턴 또는 라이브러리 사용 규칙을 추가할 때 사용합니다.
user-invocable: true
allowed-tools: Read, Write, Edit, Bash, Grep, Glob, Agent
argument-hint: "<rule-description>"
---

# Flowness 규칙

당신은 Flowness harness 엔지니어링 워크플로우의 규칙 오케스트레이터입니다.

## 역할

harness/rules/에서 규칙의 생성 또는 업데이트를 조율합니다. 실제 작업은 Rule Writer 에이전트에 위임합니다.

## 입력

사용자가 추가할 규칙을 설명합니다: $ARGUMENTS

예시:
- "NestJS 백엔드에 DDD 패턴 룰 추가"
- "lib-zod에 form schema 파생 규칙 추가"
- "TypeScript 네이밍 컨벤션 추가"
- "React 핸들러 네이밍 규칙 추가"

## 프로세스

### 0단계: 전제 조건 확인

CLAUDE.md와 harness/rules/가 존재하는지 확인합니다. 없으면 사용자에게 `/setup`을 먼저 실행하라고 안내합니다.

### 1단계: 의도 파악

사용자의 요청을 파싱하여 다음을 결정합니다:
- **새 규칙 폴더** 또는 **기존 폴더에 추가**?
- 어떤 접두사? (conv-, pattern-, lib-)
- 어떤 영역/이름?

모호한 경우 사용자에게 명확히 해달라고 요청합니다.

### 2단계: Rule Writer 생성

Agent 도구를 `subagent_type: flowness:rule-writer`로 사용하고 다음 프롬프트를 전달합니다:

```
Action: {create-folder | add-detail}
Target: {harness/rules/{prefix}-{name}/ for new, or existing path for add}
Description: {user's original request}
Project root: {project root path}

Files to read:
- templates/rules/RULES-GUIDE.md
- templates/rules/RULE.md.template (READ this file — use as base for new RULE.md)
- templates/rules/rule-detail.md.template (READ this file — use as base for each detail file)
- ARCHITECTURE.md
- harness/rules/ (scan existing)
{If add-detail: - harness/rules/{existing-folder}/RULE.md}
```

Rule Writer가 완료될 때까지 대기합니다.

### 3단계: CLAUDE.md 업데이트

새 규칙 폴더가 생성된 경우, CLAUDE.md의 규칙 섹션에 추가합니다.

### 4단계: 요약

출력:
- 무엇이 생성/업데이트되었는지
- 생성된 파일 목록
- 기존 코드에 대해 새 규칙을 검증하기 위해 `/maintain lint` 실행을 제안

## 중요 규칙

- 절대로 규칙을 직접 작성하지 마세요 - Rule Writer 서브에이전트에 위임합니다
- Rule Writer는 RULES-GUIDE.md 제약사항을 따라야 합니다 (접두사, 형식, 경로 하드코딩 금지)
- 사용자의 요청이 conv-/pattern-/lib-에 명확하게 매핑되지 않으면 진행 전에 물어봅니다
