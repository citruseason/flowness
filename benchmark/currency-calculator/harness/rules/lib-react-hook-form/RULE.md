# React Hook Form Library Rules

## Overview
React Hook Form manages form state and validation in the Presenter layer of the MVPVM + Domain-FSD architecture. It acts as the Presenter for user actions that involve form input, pairing `useForm` with `zodResolver` for schema-based validation and `useMutation` for server communication. These rules ensure forms stay in the correct architectural layer, Views remain free of business logic, and validation responsibilities are clearly separated between client and server.

## When to Apply
- Creating a new form feature in any domain
- Connecting form state to a mutation for create or update operations
- Reviewing code that imports from `react-hook-form` or `@hookform/resolvers`
- Populating form defaults from server data in an edit flow
- Adding validation logic to a form schema

## Rules

| Rule | Impact | Description |
|------|--------|-------------|
| [Form Hook Placement in Features](./form-hook-in-features.md) | CRITICAL | useForm must live in features/*/model/ as a Presenter -- never in View, ViewModel, or entities |
| [View Consumes Form Hook Only](./view-consumes-form-hook.md) | HIGH | View components destructure register, errors, and onSubmit from the feature hook -- no direct useForm |
| [zodResolver with Derived Schema](./zod-resolver-derived-schema.md) | HIGH | Always pass zodResolver with a schema derived from the entity schema -- never use inline validation |
| [Client-Only Form Validation](./client-only-form-validation.md) | HIGH | Form schemas must contain only synchronous client-side rules -- async/server checks belong in mutations |
| [Edit Form Server Defaults](./edit-form-server-defaults.md) | MEDIUM | Edit forms populate defaultValues from server data fetched via useSuspenseQuery |
