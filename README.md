# NexFlow Tools — MVP Phase 1

**Intelligent Automation Platform.** _Connect everything. Automate. Make it happen._

Phase 1 delivers the end-to-end foundation: register → login → dashboard → create /
activate / run a workflow → see execution results and history. Real data, isolated
per user, light/dark themes, English + Portuguese, n8n behind a service layer.

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
│       ├── components/     ui/ (reusable) · layout/ (shells, guards)
│       ├── pages/          auth/ · workflows/ · executions/ · Dashboard · Profile
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
npm run db:migrate          # apply migrations
npm run db:seed             # demo@nexflow.tools / demodemo

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

Supabase is used **only** as the hosted PostgreSQL database — no Supabase Auth,
no Supabase client. Auth stays custom JWT + Argon2.

## Scripts (root)

| Command              | Effect                                    |
| -------------------- | ----------------------------------------- |
| `npm run dev`        | backend + frontend in parallel            |
| `npm run build`      | typecheck + build both packages           |
| `npm test`           | backend unit tests (Vitest)               |
| `npm run db:migrate` | apply Prisma migrations                   |
| `npm run db:seed`    | seed demo data                            |
| `npm run infra:up` / `infra:down` | start / stop n8n (Docker)     |

## Documentation

- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Database](docs/database.md)
- [n8n integration](docs/n8n-integration.md)
- [Development & contribution](docs/development.md)

## Left for Phase 2

Payments/plans, visual workflow builder, additional automation engines, more
integrations, analytics, teams/roles, avatar file uploads, email verification,
rate limiting, and E2E tests. See [docs/development.md](docs/development.md#phase-2).
