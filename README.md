# NexFlow Tools — MVP Phase 1

**Intelligent Automation Platform.** _Connect everything. Automate. Make it happen._

Phase 1 delivers the end-to-end foundation: register → login → dashboard → create /
activate / run a workflow → see execution results and history. Real data, isolated
per user, light/dark themes, English + Portuguese, n8n behind a service layer.

Phases 2–3 build the product experience on top of that foundation:

- **Visual workflow builder** — a React Flow canvas with a node library, inspector
  and a pre-execution check panel. Node types and validation are shared with the
  backend (`automation/nodeCatalog`, `validateDefinition`). Lazy-loaded.
- **Template catalog** — a small curated set of starting points. "Use template"
  creates a real workflow via `POST /workflows` and opens it in the builder.
- **First-run onboarding** — a lightweight, skippable two-step guide. Gated only
  by `localStorage` (`nf_onboarded`); no database state.
- **Workspace dashboard** — real metrics, recent workflows and execution overview,
  with deliberate loading / empty / error states (skeletons, not "Loading…").
- **Error recovery** — failed executions map their stored `errorCode` to supported
  recovery actions only; no fabricated causes, no leaked secrets.
- **Refined design system** — a single `--nf-*` token set (indigo primary), Inter
  as a progressive enhancement with a system-font fallback.

## Stack

| Layer     | Choice                                                        |
| --------- | ------------------------------------------------------------ |
| Frontend  | React 18 + Vite + TypeScript, React Router, Bootstrap 5, react-i18next |
| Backend   | Node + Express + TypeScript, Zod validation                  |
| Database  | PostgreSQL on Supabase (hosted) + Prisma (migrations)        |
| Auth      | Custom JWT access tokens + rotating refresh tokens (httpOnly cookie), Argon2 hashing |
| Automation| n8n via REST, isolated behind `AutomationService`           |

## Repository layout

```
NexFlow_Tools/
├── backend/                Express API
│   ├── prisma/             schema, migrations, seed
│   └── src/
│       ├── config/         env loading + validation
│       ├── lib/            prisma client, logger
│       ├── middleware/     auth, validation, error handling
│       ├── modules/        auth · users · workflows · executions · dashboard
│       │                   (each: *.routes / *.controller / *.service / *.schemas)
│       ├── automation/     engine-agnostic layer + providers/n8n
│       └── utils/          jwt, password, mailer, AppError
├── frontend/               React app
│   └── src/
│       ├── components/     ui/ (reusable) · layout/ (shells, guards) · onboarding/
│       ├── data/           static template catalogue
│       ├── pages/          auth/ · workflows/ (list · form · builder) · executions/
│       │                   · Dashboard · Templates · Settings
│       ├── services/       one HTTP client + one service per domain
│       ├── context/        AuthContext · ThemeContext
│       ├── hooks/          useAsync
│       ├── i18n/           en/ · pt/  (+ index.ts)
│       └── styles/         variables · themes/ · components · responsive · main
├── docs/                   architecture, api, database, n8n, development
├── docker-compose.yml      n8n for local dev (DB is hosted on Supabase)
└── .env.example
```

> **CSS note:** the brief's top-level `css/` folder maps to `frontend/src/styles/`
> so Vite can bundle it. The prescribed sub-structure (variables / themes / components /
> responsive) is kept. See [docs/architecture.md](docs/architecture.md).

## Quick start

```bash
# 1. install
npm install

# 2. environment
cp .env.example .env        # fill in Supabase DATABASE_URL / DIRECT_URL,
                            # JWT secrets, and N8N_API_KEY

# 3. infrastructure (n8n only — PostgreSQL is hosted on Supabase)
npm run infra:up

# 4. database (against the shared Supabase project)
npm run db:deploy           # first time: applies the committed initial migration
npm run db:seed             # demo@nexflow.tools / demodemo
# (after the first setup, use `npm run db:migrate` for new schema changes)

# 5. run everything
npm run dev                 # API :4000  ·  web :5173
```

Open http://localhost:5173.

### Supabase project

The two developers share **one Supabase project** for development. Create it once
at [supabase.com](https://supabase.com), then everyone copies its connection
strings into `.env`:

- **Project Settings → Database → Connection string**
- `DATABASE_URL` → the **Transaction pooler** URI (port `6543`), with
  `?pgbouncer=true&connection_limit=1` appended (Supabase + Prisma recommendation).
- `DIRECT_URL` → the **direct / session** URI (port `5432`), used by
  `prisma migrate`.

The database structure is version-controlled as Prisma migrations in
[`backend/prisma/migrations/`](backend/prisma/migrations/). The initial migration
(`20260905000000_init`) is committed but **not yet applied** — `npm run db:deploy`
applies it to your Supabase project. Never edit Supabase tables by hand. See
[docs/database.md](docs/database.md).

Supabase is used **only** as the hosted PostgreSQL database — no Supabase Auth,
no Supabase client, no Row Level Security (Prisma on the backend is the only
access path). Auth stays custom JWT + Argon2.

### Demo account

`npm run db:seed` creates a **clearly fictional** demo account so the app is
never empty when evaluating it:

| | |
| --- | --- |
| Email | `demo@nexflow.tools` |
| Password | `demodemo` _(development-only)_ |
| Data | 5 workflows (3 active) + 24 executions across all statuses, fictional timestamps |

The seed is **idempotent** (it rebuilds only the demo user's workflows/executions)
and **refuses to run when `NODE_ENV=production`** unless `ALLOW_DEMO_SEED=true`.
It is never run automatically — only via the explicit command. Set
`VITE_DEMO_MODE=true` to show a "Demo environment" banner in the UI (dev/demo only).
All backend behaviour (auth, CRUD, authorization, execution records) is real —
the seed only provides an initial state.

## Scripts (root)

| Command              | Effect                                    |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | backend + frontend in parallel            |
| `npm run build`      | typecheck + build both packages           |
| `npm test`           | backend + frontend unit tests (Vitest)    |
| `npm run db:deploy`  | apply committed migrations (first setup / CI) |
| `npm run db:migrate` | create + apply a migration after a schema change |
| `npm run db:seed` / `db:seed:demo` | (re)seed the fictional demo account |
| `npm run db:reset`   | **dev only** — drop, re-migrate & re-seed the DB |
| `npm run infra:up` / `infra:down` | start / stop n8n (Docker)     |

## Documentation

- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Database](docs/database.md)
- [n8n integration](docs/n8n-integration.md)
- [Development & contribution](docs/development.md)

## Still ahead

Payments / plans, additional automation engines, live integration catalogue,
AI-assisted workflow generation (the Intelligence prompt currently drafts a real
workflow skeleton and is honestly labelled "coming soon"), analytics, teams /
roles, avatar uploads, email verification, rate limiting, and an E2E suite.
See [docs/development.md](docs/development.md#roadmap).
