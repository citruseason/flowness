---
name: internal-learn
description: Aggregates learnings across completed topics, generates improvement proposals, and presents them for user approval. Called by /maintain. Internal skill — not user-invocable.
description-ko: 완료된 토픽들의 학습 내용을 집계하고, 개선 제안을 생성하며, 사용자 승인을 위해 제시합니다. /maintain에 의해 호출됩니다. 내부 스킬 — 사용자가 직접 호출할 수 없습니다.
user-invocable: false
allowed-tools: Read, Write, Edit, Agent, Grep, Glob, Skill, Bash
argument-hint: "[project-root={path}]"
---

# 학습 단계

완료된 토픽들의 반성 결과를 집계하고, 교차 토픽 패턴을 감지하여 harness 개선 제안을 생성합니다.

## 입력

$ARGUMENTS에서 파싱합니다:

| 키 | 필수 | 설명 |
|-----|------|------|
| `project-root` | 선택 | 프로젝트 루트 경로 (기본값: git root) |

## 프로세스

### 1. 미처리 반성 파일 수집

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
```

`{PROJECT_ROOT}/harness/topics/*/reflection.md`를 스캔합니다. `reflection.md`의 존재가 토픽 완료 마커입니다.

`{PROJECT_ROOT}/harness/learning-log.md`를 읽어 이미 처리된 토픽을 확인합니다. 상태가 "처리 완료"인 항목은 건너뜁니다.

미처리 반성 파일이 없으면 "새로운 학습 내용 없음"을 출력하고 종료합니다.

### 2. Knowledge Synthesizer 에이전트 생성

Agent 도구를 `subagent_type: flowness:knowledge-synthesizer`로 사용합니다:

```
Project root: {PROJECT_ROOT}

Files to read:
- {PROJECT_ROOT}/harness/learning-log.md
- {PROJECT_ROOT}/harness/topics/*/reflection.md (all reflections — reflection.md's existence marks a completed topic)
- {PROJECT_ROOT}/harness/rules/ (scan RULE.md in each folder)
- {PROJECT_ROOT}/harness/eval-criteria/ (all criteria files)
- {PROJECT_ROOT}/ARCHITECTURE.md
- {PROJECT_ROOT}/harness/design-docs/ (all design docs)

Only analyze reflections NOT already marked as processed in learning-log.md.

Write your output to: {PROJECT_ROOT}/harness/proposals.md
```

완료될 때까지 대기합니다.

### 3. 제안 확인

`{PROJECT_ROOT}/harness/proposals.md`를 읽습니다. 제안이 없으면 학습 로그를 업데이트하고 종료합니다.

### 4. 사용자 승인 게이트

모든 제안을 사용자에게 번호와 함께 제시합니다:

```
## Harness 개선 제안

### P-001: [HIGH] {제목}
근거: {N}건 발생, {M}개 토픽
상세: {요약}

### P-002: [MEDIUM] {제목}
근거: {N}건 발생, {M}개 토픽
상세: {요약}

어떤 제안을 적용할까요? (예: "1,2" 또는 "all" 또는 "none" 또는 "1은 수정해서: ...")
```

사용자 응답을 기다립니다.

### 5. 승인된 제안 적용

각 승인된 제안에 대해 유형별로 적절한 조치를 실행합니다:

| 제안 유형 | 실행 방법 |
|-----------|----------|
| `new-rule` | `Skill: flowness:rule, args="{synthesizer가 제안한 규칙 설명}"` |
| `update-rule` | 기존 규칙 파일을 읽고 Edit으로 제안된 변경 적용 |
| `update-architecture` | ARCHITECTURE.md를 읽고 Edit으로 제안된 섹션 업데이트 |
| `update-eval-criteria` | 해당 eval-criteria 파일을 읽고 Edit으로 변경 적용 |
| `new-design-doc` | `harness/design-docs/`에 새 파일 Write |

### 6. 학습 로그 업데이트

`harness/learning-log.md`의 관련 항목들을 업데이트합니다:
- 처리된 반성 항목의 상태를 "처리 완료"로 변경
- 수락/거절된 제안 목록 기록
- 적용된 변경 사항 기록

### 7. 제안 보관

처리된 proposals.md를 보관합니다:

```bash
mkdir -p {PROJECT_ROOT}/harness/learning-history
mv {PROJECT_ROOT}/harness/proposals.md \
   {PROJECT_ROOT}/harness/learning-history/proposals-{날짜}.md
```

### 8. 결과 출력

호출자에게 학습 결과 요약을 출력합니다:
- 분석된 반성 파일 수
- 생성된 제안 수
- 수락/거절된 제안 수
- 적용된 변경 사항

## 규칙

- 사용자 승인 없이 harness 파일을 수정하지 마세요
- 제안 적용 시 기존 `/rule` 스킬을 재사용합니다 (새 규칙 생성)
- `learning-log.md`는 추가 전용(append-only)으로 운영합니다
- 처리 완료된 proposals.md는 반드시 `learning-history/`로 보관합니다
- 에이전트 동작은 `agents/knowledge-synthesizer.md`에 정의 — 동적 컨텍스트만 전달합니다
