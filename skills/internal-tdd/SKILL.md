---
name: internal-tdd
description: Test-Driven Development process for the Generator agent. Guides RED-GREEN-REFACTOR cycle for each feature in the build contract. Internal skill — not user-invocable.
description-ko: Generator 에이전트를 위한 테스트 주도 개발 프로세스. 빌드 계약의 각 기능에 대해 RED-GREEN-REFACTOR 사이클을 안내합니다. 내부 스킬 — 사용자가 직접 호출할 수 없습니다.
user-invocable: false
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
---

# TDD (테스트 주도 개발)

이 스킬은 Generator 에이전트가 기능을 구현할 때 따르는 TDD 프로세스를 정의합니다.

## 참고 자료

자세한 안내는 references/ 디렉토리에서 확인할 수 있습니다:

- [테스트 구조](references/test-structure.md) — AAA 패턴, 명명 규칙, 구성
- [단위 vs 통합](references/unit-vs-integration.md) — 어떤 테스트 유형을 언제 사용할지
- [커버리지](references/coverage.md) — 무엇을 커버하고, 무엇을 건너뛰고, 우선순위
- [모킹](references/mocking.md) — 경계에서 모킹, 자체 모듈은 모킹하지 않기

## 프로세스

빌드 계약의 각 완료 기준에 대해:

### 단계 1: RED — 실패하는 테스트 작성

1. build-contract.md에서 완료 기준을 읽습니다
2. 하나 이상의 테스트 케이스로 변환합니다
3. 테스트 명명 규칙을 따릅니다: 구현이 아닌 **동작**을 설명합니다
   - 나쁜 예: `test('calls fetchRates')`
   - 좋은 예: `test('converts 100 USD to EUR using current exchange rate')`
4. AAA 패턴을 사용합니다: Arrange → Act → Assert ([references/test-structure.md](references/test-structure.md) 참조)
5. 테스트를 실행합니다 → **반드시 실패해야 합니다**
   - 통과하면 테스트가 잘못되었거나 기능이 이미 존재합니다
   - 실패하지 않는 테스트는 아무것도 증명하지 못합니다

### 단계 2: GREEN — 최소한의 구현 작성

1. 실패하는 테스트를 통과시키기 위한 최소한의 코드를 작성합니다
2. 다음을 추가하지 마세요:
   - 테스트가 요구하지 않는 추가 에러 처리
   - 테스트가 측정하지 않는 최적화
   - 테스트가 커버하지 않는 기능
3. 테스트를 실행합니다 → **반드시 통과해야 합니다**
4. 모든 기존 테스트를 실행합니다 → **여전히 통과해야 합니다** (회귀 없음)

### 단계 3: REFACTOR — 그린 상태에서 개선

1. 코드를 정리합니다:
   - 중복 제거
   - 명명 개선
   - 필요시 함수 추출
   - ARCHITECTURE.md 레이어 규칙 준수 확인
2. 각 변경 후 모든 테스트를 실행합니다 → **그린 상태를 유지해야 합니다**
3. 리팩토링 중 테스트가 실패하면 → 되돌리고 다시 시도합니다

### 단계 4: 반복

다음 완료 기준으로 이동합니다. 단계 1-3을 반복합니다.

## 단위 테스트 vs 통합 테스트 선택 기준

자세한 내용은 [references/unit-vs-integration.md](references/unit-vs-integration.md)를 참조하세요.

빠른 판단:
- **순수 로직** (계산, 검증, 변환) → 단위 테스트
- **API 엔드포인트** (요청 → 응답) → 통합 테스트
- **UI 컴포넌트** (렌더링, 상호작용) → 컴포넌트 테스트 (단위 테스트 유사)
- **전체 사용자 흐름** (다단계) → 통합 테스트

## 모킹 규칙

자세한 내용은 [references/mocking.md](references/mocking.md)를 참조하세요.

빠른 규칙:
- 시스템 경계에서 모킹합니다 (HTTP, DB, 파일시스템, 시계)
- 자체 모듈은 모킹하지 마세요
- 모든 것을 모킹하고 있다면, 대신 통합 테스트를 작성하세요

## 버그 수정 TDD

Evaluator 또는 CodeReviewer가 발견한 버그를 수정할 때:

1. **버그를 재현하는** 테스트를 작성합니다 (RED)
2. 버그를 수정합니다 (GREEN)
3. 필요시 리팩토링합니다

이렇게 하면 버그가 다시 발생하지 않습니다.

## 출력 요구사항

build-result-r{N}.md에 다음을 포함합니다:

```markdown
## TDD Summary
- Tests written: [N total]
- Tests passing: [N passing]
- RED-GREEN-REFACTOR cycles completed: [N]
```
