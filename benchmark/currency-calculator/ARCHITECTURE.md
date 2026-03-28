# Architecture

## Stack
React + TypeScript + Vite, MVPVM + Domain-FSD

## Domains
- currency — exchange rates, conversion logic

## Domain Internal Layers (Domain-FSD)
```
domains/{domain}/
  entities/     [Model]     — 엔티티 타입, 스키마, API
  features/     [Presenter] — 사용자 행동 단위, 단일 mutation
  widgets/      [VM + View] — 독립 UI 블록, ViewModel + View 조합
  use-cases/    [Presenter] — 여러 피처/엔티티 오케스트레이션
```

## MVPVM Layer Mapping
| MVPVM Layer | Domain-FSD Location | Responsibility |
|-------------|-------------------|----------------|
| Model | entities/*/model/, entities/*/api/ | 타입, 스키마, API, 비즈니스 규칙 |
| Presenter | features/*/model/, use-cases/ | 흐름 제어, 오케스트레이션 |
| ViewModel | widgets/*/model/ | UI 상태 변환, 포매팅 |
| View | widgets/*/ui/ | 순수 렌더링, 이벤트 전달 |

## Dependency Rules
- entities는 다른 계층에 의존하지 않음
- features는 entities만 import 가능
- widgets는 entities, features를 import 가능
- use-cases는 모든 하위 계층을 import 가능
- 역방향 의존 금지
