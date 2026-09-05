# Development & contribution

## Prerequisites

Node ≥ 20, npm ≥ 10, Docker (for Postgres + n8n). See [README](../README.md) for
the quick start.

## Day-to-day

```bash
npm run dev                       # API + web, hot reload
npm run test                      # backend unit tests
npm run build                     # full typecheck + build (run before pushing)
npm run typecheck --workspace frontend
npm run typecheck --workspace backend
```

## Environment variables

One `.env` at the repo root, loaded by both packages. Copy from `.env.example`.
Only `VITE_*` vars reach the browser. **Never** put `N8N_API_KEY`, JWT secrets or
`DATABASE_URL` behind a `VITE_` prefix, and never commit `.env`.

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
- **Migrations:** commit the generated `backend/prisma/migrations/` folder; call
  it out in the PR description.
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
## Left for Phase 2

Payments / subscription plans · visual workflow builder · additional automation
engines · more integrations · analytics dashboards · teams, roles & sharing ·
avatar file uploads (S3) · email verification · API rate limiting & audit log ·
E2E test suite (Playwright) · CI pipeline · production deploy manifests.
