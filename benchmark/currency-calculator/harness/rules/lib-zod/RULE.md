# Zod Library Rules

## Overview
Zod is the single source of truth for all entity types and runtime validation in this project. Instead of writing `interface` or `type` declarations manually, every domain type is inferred from a Zod schema. This guarantees that compile-time types and runtime validation logic stay in sync, eliminates duplicate type definitions, and catches API contract drift at the boundary rather than deep inside business logic.

## When to Apply
- Defining or modifying an entity type in the Model layer (see ARCHITECTURE.md for layer mapping)
- Fetching data from an external API and converting the response to a domain type
- Creating or updating form validation schemas in the Presenter/Feature layer
- Reviewing code that introduces a new `interface` or `type` alias for a domain concept

## Rules

| Rule | Impact | Description |
|------|--------|-------------|
| [Schema as Single Source of Truth](./schema-single-source-of-truth.md) | CRITICAL | Infer TypeScript types from Zod schemas instead of writing standalone interfaces |
| [API Response Validation](./api-response-validation.md) | HIGH | Parse every API response through its entity schema at the boundary |
| [Form Schema Derivation](./form-schema-derivation.md) | HIGH | Derive form schemas from entity schemas using pick/extend/refine |
| [Entity Schema Purity](./entity-schema-purity.md) | MEDIUM | Keep entity schemas free of UI-specific error messages |
