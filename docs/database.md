# Database

PostgreSQL, managed with Prisma. Schema: [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).
Migrations are the source of truth — **never** change the schema by hand.

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

All child records cascade on user/workflow delete.

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
in PRs like any other code.
