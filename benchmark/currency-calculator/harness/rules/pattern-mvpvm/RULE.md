# MVPVM (Model-View-Presenter-ViewModel)

## Overview
MVPVM은 MVP와 MVVM을 결합한 하이브리드 아키텍처 패턴이다. 각 레이어의 책임을 엄격히 분리하여 테스트 용이성과 유지보수성을 높인다.

## When to Apply
- 새로운 UI 컴포넌트, 비즈니스 로직, 데이터 페칭 코드를 작성할 때
- 기존 코드를 리팩터링할 때
- 코드 리뷰에서 레이어 책임 위반을 검사할 때

## Rules

| Rule | Impact | Description |
|------|--------|-------------|
| [View Purity](./view-purity.md) | CRITICAL | View는 렌더링만 담당, 비즈니스 로직 금지 |
| [Presenter Orchestration](./presenter-orchestration.md) | HIGH | Presenter는 흐름 제어만, UI 상태 관리 금지 |
| [ViewModel Binding](./viewmodel-binding.md) | HIGH | ViewModel은 UI 상태 변환만, 데이터 페칭 금지 |
| [Model Purity](./model-purity.md) | HIGH | Model은 비즈니스 로직만, UI 관련 로직 금지 |
