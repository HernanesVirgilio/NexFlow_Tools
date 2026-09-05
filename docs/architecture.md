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
- **Auth**: `requireAuth` verifies the Bearer access token and sets `req.user`.
  Refresh tokens are opaque, hashed (SHA-256) in the DB, rotated on every use,
  and revoked on password change. Social sign-in (`authService.socialLogin`) is
  a reserved seam — the UI and endpoint exist but return `501` until an OAuth
  provider is configured; see [api.md](api.md#social-sign-in-future).
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
  `AsyncBoundary`, `Spinner`, `ThemeToggle`, `LanguageSwitcher`, `PageHeader`,
  `Brand`). `components/layout/` holds the two shells and the route guards.
- **Every data view** renders loading, empty, and error states via
  `AsyncBoundary` + `EmptyState`.

## Styling

`frontend/src/styles/`:

| File               | Responsibility                                        |
| ------------------ | ---------------------------------------------------- |
| `variables.css`    | raw brand palette + spacing/radius/shadow tokens     |
| `themes/light.css` | semantic tokens for light (also the `:root` default) |
| `themes/dark.css`  | semantic token overrides under `[data-nf-theme=dark]`|
| `components.css`   | reusable `nf-*` classes layered on Bootstrap         |
| `responsive.css`   | custom-shell breakpoints (Bootstrap covers the rest) |
| `main.css`         | entrypoint: imports Bootstrap → tokens → themes → layers, plus base |

Rules: no colour/spacing literals in components — use `var(--nf-*)`; no large
inline `style` blocks; extend Bootstrap, don't override it wholesale. Theme
switching only swaps semantic tokens, never duplicates markup.

## Internationalisation

`react-i18next`, namespace `common`, languages `en` + `pt` under `src/i18n/`.
No user-facing string is hardcoded. Language is detected from `localStorage` →
browser, and follows the signed-in user's saved preference.
