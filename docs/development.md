# Development & contribution

## Prerequisites

Node ≥ 20, npm ≥ 10, Docker (for n8n), and access to the shared **Supabase**
development project (hosted PostgreSQL). See [README](../README.md) for the quick
start and Supabase setup.

## Day-to-day

```bash
npm run dev                       # API + web, hot reload
npm run test                      # backend + frontend unit tests
npm run test --workspace frontend # frontend only (Vitest + Testing Library + jsdom)
npm run build                     # full typecheck + build (run before pushing)
npm run typecheck --workspace frontend
npm run typecheck --workspace backend
```

### Frontend tests

Vitest runs under jsdom (`frontend/vite.config.ts` → `test`), with
`src/test/setup.ts` initialising i18n and jest-dom matchers and
`src/test/utils.tsx` providing a `renderWithProviders` helper (router + theme).
Tests assert behaviour, not markup: a template creates a real workflow, the
onboarding gate, supported recovery actions per error code, language and theme
switching. Co-locate new suites in `src/test/` as `*.test.tsx`.

## Environment variables

One `.env` at the repo root, loaded by both packages. Copy from `.env.example`.
Only `VITE_*` vars reach the browser. **Never** put `N8N_API_KEY`, JWT secrets,
the Supabase database password or `DATABASE_URL` / `DIRECT_URL` behind a `VITE_`
prefix, and never commit `.env`. Database access is backend-only.

`VITE_DEMO_MODE=true` shows the in-app "Demo environment" banner (dev/demo only).
`ALLOW_DEMO_SEED` is a safety override for the demo seed — leave it blank.

## Demo data

`npm run db:seed` (re)creates the fictional `demo@nexflow.tools` / `demodemo`
account with sample workflows and execution history. It is idempotent, guarded
against `NODE_ENV=production`, and never runs automatically. Full details in
[docs/database.md](database.md#seed--demo-data).

## Two-developer workflow

- **Ownership by module.** Backend `src/modules/<x>` and the matching frontend
  `pages/<x>` + `services/<x>.service.ts` are self-contained — two people can work
  in parallel with minimal merge conflicts. Shared surface area
  (`components/ui/`, `styles/`, `i18n/`, `automation/`) changes via small PRs.
- **Branches:** `feat/<scope>-<summary>`, `fix/<scope>-<summary>`. No direct
  pushes to `main`.
- **Commits:** small and focused, imperative subject (`add workflow activation`).
- **PRs:** required for `main`; include what changed and how it was tested.
  Update the relevant `docs/` file in the same PR when architecture changes.
- **Migrations:** every schema change goes through `npm run db:migrate`; commit
  the generated `backend/prisma/migrations/` folder and call it out in the PR.
  Never edit the shared Supabase tables by hand. First-time setup applies the
  committed `20260905000000_init` via `npm run db:deploy` — see
  [database.md](database.md#first-time-supabase-setup).
- Don't commit generated output (`dist/`, `node_modules/`, `.docker-data/`).

## Adding a translated string

1. Add the key to **both** `src/i18n/en/common.json` and `pt/common.json`.
2. Use it via `const { t } = useTranslation();` → `t('section.key')`.
3. Never inline user-facing text in a component.

## Adding a reusable component

Check `components/ui/` first. New shared component → add it there, keep it
presentational (no data fetching), style with `nf-*` classes / Bootstrap only.

## Definition of done (Phase 1 feature)

- [ ] Types check (`npm run build`)
- [ ] Loading / empty / error states handled
- [ ] Strings in `en` + `pt`
- [ ] Works in light and dark theme
- [ ] Usable at mobile width (no horizontal overflow)
- [ ] Data scoped to the current user on the backend
- [ ] Docs updated if architecture changed

<a id="phase-2"></a>
<a id="roadmap"></a>
## Delivered after Phase 1

Visual workflow builder (React Flow, lazy-loaded) · shared node catalogue and
`validateDefinition` · workflow `definition` persistence · pre-run check panel ·
template catalogue (`frontend/src/data/templateCatalog.ts`) · first-run
onboarding · workspace dashboard with skeleton loading states · execution
`errorCode` + recovery guidance · refined `--nf-*` design system · frontend unit
tests.

## Still ahead

Payments / subscription plans · additional automation engines · live integration
catalogue · AI-assisted workflow generation · analytics dashboards · teams, roles
& sharing · avatar file uploads (S3) · email verification · API rate limiting &
audit log · E2E test suite (Playwright) · CI pipeline · production deploy
manifests.
