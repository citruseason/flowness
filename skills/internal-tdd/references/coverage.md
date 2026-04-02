---
title: Test Coverage
impact: MEDIUM
impactDescription: Focused coverage prevents regressions without test maintenance burden
tags: tdd, testing, coverage
---

## 테스트 커버리지

**영향도: 중간 (집중적인 커버리지는 테스트 유지 보수 부담 없이 회귀를 방지합니다)**

커버리지는 도구이지 목표가 아닙니다. 숫자를 맞추는 것보다 의미 있는 커버리지를 우선시합니다.

### 커버해야 할 항목

**항상 커버:**
- 비즈니스 로직 (계산, 유효성 검사, 상태 전이)
- 엣지 케이스 (빈 입력, 경계 값, 오류 상태)
- 각 모듈의 공개 API (다른 모듈이 의존하는 인터페이스)
- 버그 수정 (수정 전에 회귀 테스트를 먼저 작성)

**커버 생략 가능:**
- 프레임워크 보일러플레이트 (설정 파일, 프로바이더 래퍼)
- 로직이 없는 단순 패스스루 컴포넌트
- 타입 정의
- 생성된 코드

### 커버리지 우선순위

**잘못된 예 (무의미한 테스트로 100% 커버리지 추구):**

```typescript
// Testing that a constant is a constant
test('API_URL is defined', () => {
  expect(API_URL).toBe('https://api.example.com');
});

// Testing framework behavior
test('component renders without crashing', () => {
  render(<App />);
});
```

**올바른 예 (의미 있는 동작 커버):**

```typescript
// Testing business logic edge case
test('convert returns 0 when amount is 0', () => {
  expect(convert(0, 'USD', 'EUR', rates)).toBe(0);
});

// Testing error path
test('shows error message when API fetch fails', async () => {
  server.use(http.get('/api/rates', () => HttpResponse.error()));
  render(<CurrencyCalculator />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/failed/i);
});
```

### 우선순위

1. **핵심 경로** -- 주요 사용자 워크플로우는 반드시 커버해야 합니다
2. **오류 처리** -- 모든 오류 상태에 대한 테스트가 있어야 합니다
3. **엣지 케이스** -- 경계 값, 빈 상태, 유효하지 않은 입력
4. **회귀** -- 모든 버그 수정에는 버그를 재현하는 테스트가 포함되어야 합니다
