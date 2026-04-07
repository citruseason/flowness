# Rules Guide

## Folder Naming Convention

Rules are organized as folders under `harness/rules/` with a prefix that indicates the rule type:

| Prefix | Purpose | Scope | Examples |
|--------|---------|-------|----------|
| `conv-` | Naming and style conventions | Per language or framework | `conv-typescript/`, `conv-react/`, `conv-vue/` |
| `pattern-` | Architecture pattern rules | Per architectural pattern | `pattern-ddd/`, `pattern-mvpvm/`, `pattern-domain-fsd/` |
| `lib-` | Library/tool usage rules | Per library | `lib-zod/`, `lib-react-query/`, `lib-zustand/` |

## Folder Structure

Each rule is a folder following the Vercel agent-skills pattern:

```
{prefix}-{name}/
├── SKILL.md                        # Quick Reference index (auto-triggering)
└── rules/
    ├── _sections.md                # Section metadata — categories + priorities
    ├── {category}-{rule-name}.md   # Individual rule with full code examples
    ├── {category}-{rule-name}.md
    └── ...
```

### 파일 역할

| File | Purpose | Audience |
|------|---------|----------|
| `SKILL.md` | 간결한 Quick Reference 인덱스 — 카테고리, 우선순위, 규칙 목록 한줄 요약 | Generator (트리거 판단), agents |
| `rules/_sections.md` | 카테고리 접두사 → 섹션 → 우선순위 매핑 메타데이터 | Rule Writer (컴파일 시 참조) |
| `rules/{category}-{name}.md` | 개별 규칙 — 상세 설명, Incorrect/Correct 코드 예시 포함 | Generator (구현 시), Rule Reviewer |

### Category Prefix Convention

개별 규칙 파일명은 `{category}-{rule-name}.md` 형식을 따르며 `rules/` 하위에 위치합니다:

```
# lib-react-query/rules/ 예시:
arch-keys-queries-mutations.md  → API 아키텍처 섹션
ownership-server-state.md       → 상태 소유권 섹션

# pattern-domain-fsd/rules/ 예시:
structure-application.md        → 레이어 구조 섹션
structure-entity.md             → 레이어 구조 섹션
boundaries-layer-deps.md        → 경계 규칙 섹션
boundaries-cross-domain.md      → 경계 규칙 섹션
composition-naming.md           → 컴포지션 섹션
gates-feature.md                → 생성 게이트 섹션
```

카테고리 접두사와 섹션의 매핑은 `_sections.md`에 정의됩니다.

## File Formats

### SKILL.md (Quick Reference index)

`SKILL.md.template`을 참조하세요. 핵심 구조:

1. **Frontmatter** — `description`에 트리거 조건 기술
2. **When to Apply** — 이 규칙이 적용되는 상황
3. **Rule Categories by Priority** — 섹션을 우선순위 순으로 나열
4. **Quick Reference** — 섹션별 규칙 한줄 요약 목록 (코드 없음)
5. **How to Use** — `rules/` 디렉토리의 상세 파일 참조 안내

SKILL.md는 **인덱스 역할**입니다. 코드 예시는 포함하지 않습니다.
Generator는 SKILL.md로 적용 가능한 규칙을 파악한 뒤, 필요한 `rules/` 상세 파일을 읽습니다.
규칙 파일을 추가/수정하면 **SKILL.md의 Quick Reference도 반드시 업데이트**해야 합니다.

### _sections.md (section metadata)

`_sections.md.template`을 참조하세요. 각 섹션의:
- 이름, 카테고리 접두사, 우선순위 (CRITICAL/HIGH/MEDIUM/LOW), 설명

### Individual rule file ({category}-{name}.md)

`rule-detail.md.template`을 참조하세요. 각 파일의:

```markdown
---
title: Rule Title Here
impact: MEDIUM
impactDescription: Quantified impact (e.g., "prevents N+1 queries")
tags: tag1, tag2
---

## Rule Title Here

**Impact: MEDIUM — {impactDescription}**

{규칙 설명 — 왜 중요한지}

**Incorrect:**
{안티패턴 코드 예시}

**Correct:**
{올바른 코드 예시}

{추가 컨텍스트 (선택사항)}
```

## Key Principles

- Rules must be **generic and portable** — 어떤 프로젝트에서든 그대로 사용할 수 있어야 합니다:
  - 프로젝트 특정 경로 (`src/domains/`, `apps/management/src/` 등)를 절대 하드코딩하지 마세요
  - 프로젝트 구조가 필요하면 "ARCHITECTURE.md 참조"로 대체합니다
  - 트리거 조건과 적용 범위는 역할/레이어/패턴 기반으로 서술합니다 (예: "엔티티 레이어", "API 모듈")
  - 코드 예시의 import 경로는 `@/entities/...` 같은 범용 alias를 사용합니다
- Each rule must include **Incorrect/Correct code examples** so Generator can apply them immediately and Rule Reviewer can detect violations.
- **Impact must be quantified** — "좋지 않음" 대신 "N+1 쿼리 발생", "번들 30%+ 증가" 등 구체적 수치로 표현합니다
- Rules are consumed by:
  - **Generator** — SKILL.md를 읽어 규칙을 내재화하고 코드 작성 시 적용
  - **Rule Reviewer** — SKILL.md + 상세 파일로 코드 위반 검출
  - **/maintain** — 전체 코드베이스를 규칙과 대조하여 주기적 검증
  - **일반 코딩 세션** — CLAUDE.md의 Auto-Applied Rules 섹션을 통해 /work 외에서도 트리거
- Applicable rules per topic are determined in `/plan` and recorded in `plan-config.md`, then carried into `build-contract.md`.
- `/maintain` determines applicability by checking ARCHITECTURE.md tech stack + project dependencies.

## Skill Registration (심볼릭 링크)

규칙 폴더를 Claude Code 스킬로 인식시키려면 `.claude/skills/`에 심볼릭 링크를 생성합니다:

```bash
ln -s ../../harness/rules/{prefix}-{name} .claude/skills/{prefix}-{name}
```

이렇게 하면:
- Claude Code가 SKILL.md의 `description`으로 자동 트리거 판단
- 규칙 원본은 `harness/rules/`에서 관리 — 단일 소스
- `/rule` 스킬이 새 규칙 생성 시 자동으로 심볼릭 링크도 생성

```
.claude/skills/
├── conv-testing -> ../../harness/rules/conv-testing
├── lib-react-query -> ../../harness/rules/lib-react-query
└── pattern-domain-fsd -> ../../harness/rules/pattern-domain-fsd
```

## Auto-Applied Rules (CLAUDE.md 등록)

규칙을 /work 파이프라인 외에서도 자동 적용하려면, CLAUDE.md에 다음 섹션을 추가합니다:

```markdown
## Auto-Applied Rules

코드를 작성하거나 수정할 때, 해당 파일/컨텍스트에 적용 가능한 규칙 스킬을 읽고 따르세요:

| Rule | Trigger | Path |
|------|---------|------|
| {Rule Name} | {trigger condition} | harness/rules/{prefix}-{name}/SKILL.md |
```

`/rule` 스킬이 새 규칙을 생성하면 이 섹션을 자동으로 업데이트합니다.

## When to Add a New Rule

- A pattern or convention is violated repeatedly
- A new library/framework is added to the project
- A human taste preference needs to be enforced consistently
- An Evaluator keeps flagging the same issue across topics

## Update Process

규칙 파일 추가/수정 시 SKILL.md 업데이트 절차:

1. `rules/_sections.md`를 읽어 섹션 순서와 우선순위를 확인합니다
2. 새 규칙을 `rules/` 디렉토리에 `{category}-{name}.md`로 추가합니다
3. 새 카테고리인 경우 `_sections.md`에 섹션을 추가합니다
4. `SKILL.md`의 Quick Reference에 한줄 요약을 추가합니다
5. Rule Categories by Priority 테이블의 규칙 수를 업데이트합니다
