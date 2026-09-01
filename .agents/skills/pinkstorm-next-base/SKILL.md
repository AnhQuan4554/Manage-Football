---
name: pinkstorm-next-base
description: Project-specific development guide for Pinkstorm FC Manage. Use this skill whenever Codex works on this repository's UI, frontend features, routes, Supabase integration, mock-to-real-data migration, auth flow, PWA behavior, or long-term feature development across src/app, src/components, src/features, src/lib, and supabase.
---

# Pinkstorm Next Base

## Purpose

Use this skill to develop Pinkstorm FC Manage consistently over time. Treat it as the project onboarding and guardrail for all frontend, UI, feature, routing, data, and Supabase work in this repository.

This skill currently covers the whole project. Do not split it into smaller skills yet. Consider splitting later only when one area becomes large and repeatable enough to need its own workflow, such as database migrations, auth/roles, or UI feature delivery.

## Project Snapshot

- App: Pinkstorm FC Manage, a mobile-first PWA for managing a 7-a-side football team.
- Stack: Next.js App Router, TypeScript, React 19, Ant Design, Supabase, next-pwa.
- Main app code: `src/app`, `src/components`, `src/features`, `src/lib`.
- Database files: `supabase/migrations`, `supabase/seed.sql`.
- Current data mode: mock data first.
- Future data mode: migrate feature-by-feature to real API/Supabase only when requested.
- Current auth mode: keep the existing prototype/auth-session flow unless the user explicitly asks to develop it.

## Working Rules

Before changing code, make sure the user's request is clear. If the request is ambiguous, risky, or could affect multiple screens, ask a short clarifying question before editing.

Do not infer hidden requirements. Do not silently redesign workflows, database behavior, permissions, auth, or feature scope.

Before refactoring, creating a feature, or changing business logic, run an impact scan across related routes, components, services, types, mock data, APIs, and Supabase tables. Identify every screen or flow that reads, writes, or displays the affected data, then update all directly related usages in the same change so the app does not drift into inconsistent behavior.

For database-affecting work, trace both directions before editing:

- From UI/action to API/service/repository to table columns and policies.
- From changed table/field/API response back to every screen, form, detail view, list, mock fallback, and type that consumes it.

Do not leave a related screen knowingly broken because it is outside the first file you touched. If the related update would expand scope, pause and explain the affected areas before continuing.

When the user asks to build or change a screen, first give a short implementation suggestion with tradeoffs, then wait for confirmation before coding if the change is non-trivial or touches important behavior.

For small, clearly scoped fixes, follow the repository patterns and proceed normally.

When a change is large, dangerous, cross-cutting, or touches database/auth/roles, pause and confirm the intended approach with the user.

## Data Rules

The app currently uses mock data from `src/lib/constants/mockData.ts`.

Current services and repositories may return mock data directly. This is expected.

When the user asks to integrate real API calls, Supabase, or database-backed data for a feature:

1. Find every mock data usage for that specific feature.
2. Explain briefly what will move from mock to real data.
3. Ask for confirmation if schema, RLS, auth, or destructive mock removal is involved.
4. Remove or bypass mock data only for the feature being migrated.
5. Do not delete unrelated mock data.

Do not migrate the whole app away from mock data unless the user explicitly asks for that.

## Supabase Rules

Read all relevant schema before touching database-backed work:

- `supabase/migrations/0001_initial_schema.sql`
- `supabase/seed.sql`
- `src/lib/supabase/browser.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/middleware.ts`
- `middleware.ts`

Current schema includes:

- `teams`
- `profiles`
- `team_members`
- `matches`
- `match_attendances`
- `fund_transactions`

Before changing schema, RLS, policies, or data ownership rules, ask the user what behavior they want for that feature. Develop schema incrementally and only for the requested area.

If new environment variables are needed, detect affected files first, explain them, then update `.env.example` after confirmation when the change has broad impact.

## Auth And Roles

Keep the current auth flow as-is for now. Login, register, and pending approval are prototype surfaces unless the user asks to implement real auth behavior.

Protected routes currently include areas such as:

- `/dashboard`
- `/matches`
- `/members`
- `/funds`
- `/lineup`
- `/media`
- `/team`
- `/settings`

Future route access should be role-aware, but do not implement or change role permission rules without explicit user direction.

Do not hard-code new role behavior based only on assumptions.

## Architecture Guidelines

Prefer existing project structure:

- `src/app`: routes, layouts, route-level composition.
- `src/components`: shared/common layout components.
- `src/features`: feature modules and feature-specific components, services, repositories, schemas, and types.
- `src/lib`: shared utilities, constants, response helpers, Supabase clients.

Prefer adding feature logic inside the relevant `src/features/<feature>` folder instead of putting heavy logic directly in route pages.

Use server and client components intentionally:

- Prefer server components for data loading, read-only page composition, and route-level rendering.
- Use client components for forms, interactive controls, local state, browser APIs, and Ant Design interactions that require the client.

When there are multiple valid approaches, present the short pros and cons before implementation and ask the user to choose.

## UI Guidelines

Preserve the existing Pinkstorm UI direction unless the user asks for redesign.

Keep the app mobile-first and practical for repeated team-management workflows. Favor clear navigation, scannable information, and fast actions over decorative layouts.

For every CSS, layout, component, or UI-facing code change, make responsive behavior part of the implementation rather than an afterthought. Ensure the result is balanced and usable on both mobile and desktop: text should fit, controls should remain reachable, spacing should feel intentional, important actions should stay clear, and the layout should not overlap, overflow, or become awkward at common phone and desktop widths.

When editing an existing screen, preserve the desktop experience while improving or maintaining the phone experience. When creating a new UI surface, design the mobile layout and desktop layout together so the interaction feels native in both contexts.

Use Ant Design components where they already fit the project. Do not introduce a new UI library without asking.

Typography rule:

- The whole app uses Roboto from `next/font/google`; keep `var(--font-roboto)` as the global body font and do not reintroduce another primary UI font without asking.
- Normal body text, labels, metadata, descriptions, and table/list content should stay around 12-16px with font weight 400-500. Use 700 only for clear emphasis, headings, numbers, and primary action text.
- Avoid unusual font weights such as 720, 750, 800, 820, 850, 900, or 950 in CSS/JSX. Avoid oversized type unless it is a true page hero; compact cards and detail rows should use restrained sizes.

Loading rule for API and route work:

- Use the existing common `LogoLoading` component from `src/components/common/LogoLoading.tsx` for any route-level loading, client-side fetch loading, or click action that calls an API and waits for a response.
- Do not introduce Ant Design button spinners, Skeleton-based loading, or ad hoc text-only loading for new API integrations. Disable the triggering control while `LogoLoading` is visible.

When changing UI, inspect nearby pages/components first so the new work feels native to the app.

Color rule for every UI change:

- Prefer the shared palette in `src/lib/constants/colors.ts` and the existing CSS variables in `src/styles/globals.css`.
- Do not introduce new hardcoded brand hex values in JSX, TS, or new CSS unless you also add them to the shared palette first.
- Reuse the existing semantic colors for primary actions, surfaces, text, and success states instead of inventing one-off shades.

API and server rule:

- Before creating or changing any API route, server action, or backend endpoint, read `pinkstorm-api-standard` first and follow its response/request contract.
- If any endpoint payload, DB write path, auth rule, or business rule is unclear, stop and ask the user before coding.

## Commands

Use the existing scripts from `package.json` when relevant, but do not treat command execution as the default self-test.

Self-test rule:

- Self-test means reviewing the source changes yourself: scan related files, imports, types, props, CSS selectors, API callers, response shapes, missing/unused code, obvious runtime risks, and consistency with this skill.
- Do not run `pnpm build`, `npm run build`, `pnpm dev`, `npm run dev`, or any command that starts/restarts a local server unless the user explicitly approves that exact action first.
- Do not run build while the user has a local dev server open unless they explicitly ask for it; it can rewrite `.next` and break the running dev session's chunks.
- Prefer non-server, non-build checks such as `rg`, focused file reads, formatter checks, and narrowly scoped static inspection. Run `pnpm lint`, `pnpm exec tsc --noEmit`, or similar only when it is appropriate and does not mutate `.next` or start a server.

Available project scripts, when explicitly appropriate:

- `pnpm dev` or `npm run dev` for local development, only after user approval.
- `pnpm build` or `npm run build` for production build checks, only after user approval.
- `pnpm lint` or `npm run lint` for linting, if available and working.
- `pnpm format` or `npm run format` for formatting when needed.

Prefer `pnpm` because this repository has `pnpm-lock.yaml`.

If a new command, dependency install, generator, migration command, or external service action could have broad impact, explain it and ask first.

## PWA Notes

The project uses `next-pwa` in `next.config.mjs`.

There are no special PWA requirements for now. Do not change PWA behavior unless needed for the requested task.

## Default Investigation Order

When unsure, inspect in this order:

1. The user's latest request.
2. The route or feature files directly involved.
3. `src/lib/constants/mockData.ts` for current data shape.
4. Related services/repositories/types in `src/features`.
5. Supabase clients and migrations if real data/auth/database is involved.
6. Ask the user before making assumptions that affect product behavior.

## Safety Boundaries

Do not automatically:

- Rewrite large parts of the app without confirmation.
- Remove mock data outside the requested feature.
- Change auth behavior without explicit direction.
- Invent role permissions.
- Modify RLS or database policies without asking.
- Add major dependencies without explaining why.
- Treat prototype UI as production behavior unless confirmed.

If the request is not clear enough to implement safely, ask the user to clarify before editing.
