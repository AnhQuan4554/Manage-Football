# Decisions

## 2026-08-15

- Built the base with Next.js App Router, TypeScript, Ant Design, PWA manifest and Supabase scaffolding because this is the stack required by the architecture brief.
- Used the Lovable source as UX reference only. The original source used TanStack Start and shadcn/ui, so copying it directly would violate the brief.
- Kept data mocked through services/repositories for phase one. UI components do not call Supabase directly.
- Preserved the supplied `logo.jpg` as the primary brand mark and aligned the palette to magenta, white and deep navy/charcoal.
- Added RLS-enabled SQL tables with TODO policies so the schema is ready for Supabase without pretending the final security model is done.
