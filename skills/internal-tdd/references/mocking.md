---
title: Mocking Strategy
impact: MEDIUM
impactDescription: Correct mocking boundaries prevent fragile tests and false confidence
tags: tdd, testing, mocking
---

## 모킹 전략

**영향도: 중간 (올바른 모킹 경계는 취약한 테스트와 거짓된 확신을 방지합니다)**

시스템 경계에서 모킹하되, 내부 모듈은 모킹하지 않습니다. 과도한 모킹은 테스트를 통과시키지만 실제 버그를 놓치게 만듭니다.

### 경계에서 모킹하기

**경계 = 코드가 외부 시스템과 만나는 지점:**
- 외부 API에 대한 HTTP 호출
- 데이터베이스 쿼리
- 파일 시스템 작업
- 시스템 시계 (Date.now, 타이머)
- 서드파티 서비스

**잘못된 예 (내부 모듈 모킹):**

```typescript
// Mocking your own service function — this tests nothing useful
vi.mock('../service/exchangeRateService');

test('converter calls exchange rate service', () => {
  const mockConvert = vi.mocked(convert);
  mockConvert.mockReturnValue(85);

  // This test only proves the mock works, not the actual code
  expect(convert(100, 'USD', 'EUR')).toBe(85);
});
```

**올바른 예 (HTTP 경계 모킹):**

```typescript
// Mock the external API, not your own code
const server = setupServer(
  http.get('https://api.frankfurter.app/latest', () => {
    return HttpResponse.json({ rates: { EUR: 0.85 } });
  })
);

test('fetches rates and converts currency', async () => {
  const rates = await fetchRates('USD');
  expect(convert(100, 'USD', 'EUR', rates)).toBe(85);
});
```

### 자신이 소유한 코드를 모킹하지 마세요

자신의 모듈을 광범위하게 모킹하고 있다면, 이는 다음을 의미합니다:
- 모듈 간 결합도가 너무 높습니다
- 대신 통합 테스트를 작성해야 합니다
- 아키텍처 리팩토링이 필요합니다

**잘못된 예 (자체 리포지토리 모킹):**

```typescript
vi.mock('../repository/tripRepository');

test('TripService creates trip', async () => {
  // You're testing that your service calls your repository
  // If you refactor the repository, this test breaks even if behavior is correct
});
```

**올바른 예 (공개 인터페이스를 통한 테스트):**

```typescript
test('creates a trip and returns it', async () => {
  const trip = await tripService.create({ name: 'Tokyo' });
  const found = await tripService.findById(trip.id);
  expect(found.name).toBe('Tokyo');
});
```

### 모킹이 필요한 경우

| 시나리오 | 모킹 대상 | 이유 |
|---|---|---|
| 외부 API | HTTP 클라이언트 / fetch | 테스트에서 실제 네트워크 호출 방지 |
| 시간 의존 로직 | Date.now, setTimeout | 테스트를 결정적으로 만들기 위해 |
| 무작위성 | Math.random, crypto | 테스트를 재현 가능하게 만들기 위해 |
| 파일 시스템 | fs 작업 | 테스트 오염 방지 |
| 고비용 작업 | 테스트가 느릴 때만 | 최후의 수단 -- 실제 호출을 선호 |
