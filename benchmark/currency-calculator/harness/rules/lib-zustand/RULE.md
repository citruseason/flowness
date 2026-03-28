# Zustand Library Rules

## Overview
Zustand manages **client-side UI state** within the MVPVM + Domain-FSD architecture. It occupies the Presenter layer, handling ephemeral session state such as filter selections, panel visibility, and active tabs. Server state is explicitly out of scope -- React Query owns that boundary. These rules define where stores live, what they may contain, and how they integrate with other layers.

## When to Apply
- Creating a new Zustand store for UI or session state
- Deciding whether state belongs in Zustand, React Query, or `useState`
- Reviewing code that imports from `zustand`
- Placing a store file within the Domain-FSD directory structure
- Connecting client-side filter/sort state to server queries

## Rules

| Rule | Impact | Description |
|------|--------|-------------|
| [Store Placement by Sharing Scope](./store-placement.md) | CRITICAL | Place shared stores in use-cases/ and widget-local stores in widgets/*/model/ |
| [Client State Only](./client-state-only.md) | CRITICAL | Never cache server data in Zustand -- use React Query for server state |
| [React Query Integration](./react-query-integration.md) | HIGH | Reflect Zustand state in React Query queryKeys to keep server and client state in sync |
| [Forbidden Store Layers](./forbidden-layers.md) | HIGH | Never define stores in entities/, features/, or widgets/*/ui/ |
| [Local State Preference](./local-state-preference.md) | MEDIUM | Prefer useState for component-scoped state that does not cross component boundaries |
