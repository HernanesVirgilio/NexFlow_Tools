# Architecture

## Principle

`Understand → Organize → Reuse → Improve → Extend`. Every kind of responsibility
has one predictable home. Frontend, backend, database and automation are
separated; the product (NexFlow) is never coupled directly to the engine (n8n).

## High-level flow

```
Browser (React SPA)
  │  fetch  (JSON, Bearer access token, httpOnly refresh cookie)
  ▼
Express API  ──►  Prisma  ──►  PostgreSQL (Supabase, hosted)
  │
  └─►  AutomationService  ──►  N8nProvider  ──►  n8n REST / webhook
```

## Backend

- **Module = folder** under `src/modules/<name>` with `routes / controller /
  service / schemas`. Controllers are thin (HTTP in/out). Services hold business
  logic and are the only place that touches Prisma.
- **Validation**: every request body/params/query is parsed with a Zod schema via
  `middleware/validate`. Parsed values replace the raw input.
- **Errors**: throw `AppError` (typed status + safe `code`/`message`). The error
  middleware converts `ZodError` → 400 and hides unexpected errors in production.
- **Auth**: `requireAuth` verifies the Bearer access token and sets `req.user`
  (`{ id, email, role }` — `role` travels inside the signed token, no DB
  round-trip needed to authorize a request). Refresh tokens are opaque, hashed
  (SHA-256) in the DB, rotated on every use, and revoked on password change.
  Social sign-in (`authService.socialLogin`) is a reserved seam — the UI and
  endpoint exist but return `501` until an OAuth provider is configured; see
  [api.md](api.md#social-sign-in-future).
- **Authorization**: `requireRole(...roles)` runs after `requireAuth` and 403s
  when `req.user.role` isn't included — the only role today is the admin
  boundary (`modules/admin/`, see [api.md](api.md#admin--apiadmin-auth-admin-role)).
  Authentication proves identity; this proves permission. Never inferred from
  the frontend — hiding a link is UX, this middleware is the actual gate.
- **Data isolation**: every workflow/execution query filters by `req.user.id`.
  `WorkflowExecution.userId` is denormalised so ownership checks never need a join.

## Automation layer

`src/automation/` defines `AutomationProvider` (`ping`, `trigger`,
`getExecution`) and `AutomationError` (typed failure kinds). `AutomationService`
is the facade the app calls; it selects a provider by `workflow.engine` and maps
provider failures to safe `AppError`s. Adding an engine = new folder in
`providers/`, register it in `AutomationService`. Nothing outside this folder
imports an n8n type.

## Frontend

- **Services**: `services/api.ts` is the single HTTP client (base URL, token,
  auto-refresh-on-401). One service module per domain — components never `fetch`.
- **State**: `AuthContext` (session + user, restores via refresh cookie on load)
  and `ThemeContext` (light/dark/system, persisted to `localStorage`, synced to
  the user's saved preference). `useAsync` standardises loading/error/data.
- **Components**: `components/ui/` are reusable and presentational
  (`Field`, `ConfirmModal`, `StatusBadge`, `EmptyState`, `ErrorState`,
  `AsyncBoundary`, `Spinner`, `Skeleton`, `ThemeToggle`, `LanguageSwitcher`,
  `PageHeader`, `Brand`). `components/layout/` holds the shells and route guards.
- **Every data view** renders loading, empty, and error states via
  `AsyncBoundary` + `EmptyState`. `AsyncBoundary` accepts a `skeleton` node so
  pages show shaped placeholders (`components/ui/Skeleton`) instead of a spinner.

### Visual workflow builder

`pages/workflows/WorkflowBuilderPage` is a React Flow canvas, **lazy-loaded** so
`@xyflow/react` stays out of the main bundle. It reads the node catalogue from
`GET /api/workflows/node-types`, edits a `definition` graph
(`{ version, nodes, edges }`), and calls `POST /api/workflows/:id/check` for a
dry-run validation (`validateDefinition`) before the user runs anything — no
execution row is created for a failed check.

### Templates & onboarding

- `data/templateCatalog.ts` is a small static catalogue. Each `available`
  template holds a real `definition` compatible with the node catalogue;
  `TemplatesPage` "Use template" does `POST /workflows` then opens the builder.
- `components/onboarding/OnboardingModal` is a two-step, skippable first-run
  guide gated purely by `localStorage` (`nf_onboarded`). It routes into the real
  builder or template catalogue; it stores no server state.

### Error recovery

`components/executions/ExecutionError` maps a failed execution's stored
`errorCode` to a fixed table of supported recovery actions (retry / open builder
/ view execution) and translated cause text. Unknown codes get generic guidance;
raw provider detail is never shown.

## Styling

`frontend/src/styles/`:

| File               | Responsibility                                        |
| ------------------ | ---------------------------------------------------- |
| `variables.css`    | raw brand palette (indigo primary) + typography/spacing/radius/shadow/motion tokens |
| `themes/light.css` | semantic tokens for light (also the `:root` default) |
| `themes/dark.css`  | semantic token overrides under `[data-nf-theme=dark]`|
| `components.css`   | reusable `nf-*` classes layered on Bootstrap         |
| `pages/*.css`      | page-scoped layout (`dashboard`, `builder`, `settings`, `templates`, `workflows`) |
| `responsive.css`   | custom-shell breakpoints (Bootstrap covers the rest) |
| `main.css`         | entrypoint: imports Bootstrap → tokens → themes → components → pages → responsive, plus base + a global `prefers-reduced-motion` reset |

Inter is loaded from Google Fonts as a progressive enhancement; the token font
stack falls back to `system-ui` if the stylesheet fails.

Rules: no colour/spacing literals in components — use `var(--nf-*)`; no large
inline `style` blocks; extend Bootstrap, don't override it wholesale. Theme
switching only swaps semantic tokens, never duplicates markup.

## Internationalisation

`react-i18next`, namespace `common`, languages `en` + `pt` under `src/i18n/`.
No user-facing string is hardcoded. Language is detected from `localStorage` →
browser, and follows the signed-in user's saved preference.
