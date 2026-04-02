---
title: Unit vs Integration Tests
impact: HIGH
impactDescription: Right test type at right layer prevents fragile tests and missed bugs
tags: tdd, testing, unit, integration
---

## 단위 테스트 vs 통합 테스트

**영향도: 높음 (적절한 계층에서 올바른 테스트 유형을 사용하면 취약한 테스트와 놓치는 버그를 방지합니다)**

테스트 대상에 따라 테스트 유형을 선택합니다.

### 단위 테스트

단일 함수, 모듈 또는 컴포넌트를 격리하여 테스트합니다. 의존성은 모킹하거나 스텁으로 대체합니다.

**사용 대상:**
- 순수 비즈니스 로직 (계산, 변환, 유효성 검사)
- 유틸리티 함수
- 개별 UI 컴포넌트 (렌더링, 사용자 상호작용)
- 상태 관리 로직

**잘못된 예 (단위 테스트로 위장한 통합 테스트):**

```typescript
// This tests the whole stack — not a unit test
test('converts currency', async () => {
  const result = await fetch('/api/convert?from=USD&to=EUR&amount=100');
  const data = await result.json();
  expect(data.result).toBe(85);
});
```

**올바른 예 (격리된 단위 테스트):**

```typescript
test('converts 100 USD to EUR at 0.85 rate', () => {
  const rates = { USD: 1, EUR: 0.85 };
  expect(convert(100, 'USD', 'EUR', rates)).toBe(85);
});
```

### 통합 테스트

여러 모듈이 함께 작동하는 방식을 테스트합니다. 실용적인 범위에서 실제 의존성을 사용합니다.

**사용 대상:**
- API 엔드포인트 동작 (요청 → 응답)
- 데이터베이스 작업 (CRUD 워크플로우)
- 다중 컴포넌트 사용자 흐름
- 외부 서비스 연동

**잘못된 예 (통합 테스트에서 모든 것을 모킹):**

```typescript
test('user can create a trip', async () => {
  const mockDb = { insert: vi.fn() };
  const mockAuth = { getUser: vi.fn(() => ({ id: '1' })) };
  // Testing with all mocks defeats the purpose of integration testing
});
```

**올바른 예 (실제 상호작용 테스트):**

```typescript
test('user can create and retrieve a trip', async () => {
  // Arrange — use real service with test database
  const response = await request(app)
    .post('/api/trips')
    .send({ name: 'Tokyo Trip', startDate: '2026-04-01' });

  // Assert creation
  expect(response.status).toBe(201);

  // Assert retrieval
  const getResponse = await request(app).get(`/api/trips/${response.body.id}`);
  expect(getResponse.body.name).toBe('Tokyo Trip');
});
```

### 판단 가이드

| 테스트 대상 | 테스트 유형 | 모킹 여부 |
|---|---|---|
| 순수 함수 / 계산 | 단위 | 모킹 불필요 |
| 컴포넌트 렌더링 | 단위 | 데이터 props만 모킹, 컴포넌트는 모킹하지 않음 |
| API 호출 함수 | 단위 | HTTP 클라이언트 모킹 |
| API 엔드포인트 | 통합 | 실제 핸들러 사용, 외부 서비스만 모킹 |
| 전체 사용자 흐름 | 통합 | 최소한의 모킹 |
