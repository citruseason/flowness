# Domain-FSD (Feature-Sliced Design)

## Overview
Domain-FSD는 FSD를 상위 구조 원칙으로, domains/{domain} 구조로 도메인 응집도를 높이는 프론트엔드 아키텍처이다. 의존 방향 정리, 관심사 분리, 조합 위치 통제가 핵심이다.

## When to Apply
- 새로운 도메인, 엔티티, 피처, 위젯을 생성할 때
- 파일 위치를 결정할 때
- import 방향을 검증할 때

## Rules

| Rule | Impact | Description |
|------|--------|-------------|
| [Layer Dependency Direction](./layer-dependency.md) | CRITICAL | entities → features → widgets → use-cases 방향만 허용 |
| [Entity Isolation](./entity-isolation.md) | HIGH | 엔티티는 해당 객체 하나만 알아도 성립하는 로직만 포함 |
| [Feature Boundary](./feature-boundary.md) | HIGH | 피처는 사용자 행동 단위, 다른 피처에 의존 금지 |
| [Widget Composition](./widget-composition.md) | MEDIUM | 위젯은 여러 엔티티/피처를 조합하는 독립 UI 블록 |
