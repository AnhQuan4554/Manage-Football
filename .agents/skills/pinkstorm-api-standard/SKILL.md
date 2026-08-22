---
name: pinkstorm-api-standard
description: Standard request/response and route conventions for server APIs, route handlers, and Supabase-backed mutations in Pinkstorm FC Manage.
---

# Pinkstorm API Standard

Use this skill whenever you create or update:

- `src/app/api/*` route handlers
- server actions or backend helpers that talk to Supabase
- new endpoint shapes, request bodies, or response envelopes

Read [references/api-contracts.md](references/api-contracts.md) before implementing an endpoint.

## Core Rules

- Do not invent payload fields, route semantics, or business rules when anything is unclear.
- Ask the user first if the request body, response shape, ownership rule, or DB write path is not fully defined.
- Before changing an endpoint or Supabase-backed logic, scan related callers and consumers so route params, request payloads, response fields, table columns, and UI states stay aligned across every affected screen.
- Use the shared response envelope in `src/lib/response.ts`:
  - `ok(data, message?)` for success
  - `fail(error, message?)` for failure
- Keep request validation close to the endpoint or in feature-local schemas.
- Validate POST/PATCH/PUT input before any DB write.
- For Supabase-backed writes, use the server client and respect the existing auth/RLS model.
- Return stable JSON and avoid ad hoc response shapes.

## Default Endpoint Shape

- GET endpoints should return `AppResponse<T>` via `ok(...)`.
- POST endpoints should parse and validate request JSON, then return `ok(createdRecord)` or `fail(...)`.
- If an endpoint can be paginated or filtered, the response should keep `data` plus explicit metadata instead of inventing multiple shapes.

## When To Stop

- If the feature requirement is ambiguous, stop and ask the user.
- If schema changes, RLS behavior, or ownership rules are involved and not yet agreed, stop and ask the user.
- If the endpoint affects money, attendance, or match results and the business rule is not explicit, do not guess.

## Layering

- Route handlers should stay thin.
- Put domain logic in the relevant `src/features/<feature>/services` or repositories.
- Keep request/response types close to the feature that owns them.
