# Database

PostgreSQL **hosted on Supabase**, managed with Prisma. Schema:
[`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma). Migrations are
the source of truth — **never** change the schema (or the Supabase tables) by hand.

## Connection

Prisma uses two URLs (both from Supabase → Project Settings → Database):

| Env var        | Supabase connection            | Used for |
| -------------- | ------------------------------ | -------- |
| `DATABASE_URL` | Transaction pooler, port `6543`, `?pgbouncer=true&connection_limit=1` | app runtime |
| `DIRECT_URL`   | Direct / session, port `5432`  | `prisma migrate`, introspection, seed |

Set in `schema.prisma` as `url` and `directUrl`. Supabase is the database only —
no Supabase Auth or client SDK.

## Entities

| Model                | Purpose |
| -------------------- | ------- |
| `User`               | credentials (`email`, Argon2 `passwordHash`) |
| `Profile`            | 1–1 with User: `name`, `avatarUrl`, `language`, `theme` |
| `RefreshToken`       | hashed opaque tokens; `expiresAt`, `revokedAt` (rotation + revocation) |
| `PasswordResetToken` | hashed one-time reset tokens; `expiresAt`, `usedAt` |
| `Workflow`           | `name`, `description`, `isActive`, `engine` (default `n8n`), `engineRef` |
| `WorkflowExecution`  | `status` enum, `engineRef`, timings, `durationMs`, `errorMessage`; carries `userId` for isolation |

`ExecutionStatus`: `PENDING · RUNNING · COMPLETED · FAILED`.

All child records cascade on user/workflow delete (`ON DELETE CASCADE`).

## Indexes & constraints

| Table | Unique | Index |
| ----- | ------ | ----- |
| `users` | `email` | – |
| `profiles` | `userId` (enforces 1–1) | – |
| `refresh_tokens` | `tokenHash` | `userId` |
| `password_reset_tokens` | `tokenHash` | `userId` |
| `workflows` | – | `userId` |
| `workflow_executions` | – | `workflowId`, `userId` |

`userId` on `workflow_executions` is denormalised so ownership checks never need
a join. Every backend service filters by the authenticated `userId` — see
[architecture.md](architecture.md#backend). RLS is intentionally **not** used:
Prisma (backend-only) is the single access path and the frontend never touches
the database.

## Migrations

The schema is version-controlled as Prisma migrations under
[`backend/prisma/migrations/`](../backend/prisma/migrations/) — the source of truth
for the database structure. **Never edit Supabase tables by hand.**

- `20260905000000_init` — the complete Phase 1 schema (6 tables, `ExecutionStatus`
  enum, PKs, FKs, unique constraints, indexes, defaults). Generated with
  `prisma migrate diff` from `schema.prisma`; **not yet applied to Supabase** —
  see below.

### First-time Supabase setup

Once `DATABASE_URL` / `DIRECT_URL` point at a real Supabase project:

```bash
npm run db:deploy --workspace backend   # applies 20260905000000_init to Supabase
npm run db:seed   --workspace backend   # optional: fictional demo account
```

`db:deploy` (`prisma migrate deploy`) applies the committed migration to an empty
database and records it in `_prisma_migrations`. If the schema was ever pushed to
that database another way, run
`npx prisma migrate resolve --applied 20260905000000_init` first to baseline it.
After this, use `npm run db:migrate` for every subsequent schema change.

## Workflow

```bash
# create / apply a migration in dev
npm run db:migrate --workspace backend        # prisma migrate dev

# apply pending migrations (CI / prod)
npm run db:deploy --workspace backend         # prisma migrate deploy

# regenerate the typed client after a schema change
npm run db:generate --workspace backend

# browse data
npm run db:studio --workspace backend
```

Commit the generated folder under `backend/prisma/migrations/`. Review migrations
in PRs like any other code. `prisma migrate dev` runs through `DIRECT_URL`
(the shared Supabase project) — coordinate schema changes between the two devs.

## Seed / demo data

```bash
npm run db:seed --workspace backend        # alias: db:seed:demo
```

Creates one fictional account — `demo@nexflow.tools` / `demodemo` — with a
`Demo User` profile, 5 sample workflows (3 active) and 24 executions spread
across `COMPLETED / RUNNING / FAILED / PENDING` with realistic timestamps and
durations. See [`backend/prisma/seed.ts`](../backend/prisma/seed.ts).

- **Idempotent** — reruns delete and rebuild *only* the demo user's workflows
  and executions (executions cascade). Real users are never touched.
- **Production-guarded** — throws if `NODE_ENV=production` unless
  `ALLOW_DEMO_SEED=true`. Never wire it into a deploy step.
- **Not automatic** — it only runs when you invoke the command.

## Reset (development only)

```bash
npm run db:reset --workspace backend       # prisma migrate reset
```

Drops every table, replays all migrations and re-runs the seed. **Only ever point
this at a development Supabase project** — it is destructive. There is no
production reset command.
