# API reference

Base URL: `http://localhost:4000/api`. All bodies are JSON.
Authenticated requests send `Authorization: Bearer <accessToken>`.
The refresh token is an httpOnly cookie (`nf_refresh`, path `/api/auth`) — the
browser sends it automatically; it is never readable by JS.

Error shape:

```json
{ "error": { "code": "STRING_CODE", "message": "Human readable", "details": {} } }
```

## Auth — `/api/auth`

| Method | Path               | Body                              | Notes |
| ------ | ------------------ | --------------------------------- | ----- |
| POST   | `/register`        | `{ name, email, password }`       | sets refresh cookie, returns `{ user, accessToken }` |
| POST   | `/login`           | `{ email, password }`             | returns `{ user, accessToken }` |
| POST   | `/refresh`         | –                                 | rotates refresh cookie, returns `{ accessToken }` |
| POST   | `/logout`          | –                                 | revokes refresh token |
| POST   | `/forgot-password` | `{ email }`                       | always 200 (no account enumeration) |
| POST   | `/reset-password`  | `{ token, password }`             | invalidates all sessions |

## Users — `/api/users` (auth)

| Method | Path           | Body                                        |
| ------ | -------------- | ------------------------------------------- |
| GET    | `/me`          | –                                          |
| PATCH  | `/me`          | `{ name?, avatarUrl?, language?, theme? }`  |
| POST   | `/me/password` | `{ currentPassword, newPassword }`         |

## Workflows — `/api/workflows` (auth, owner-scoped)

| Method | Path                  | Body                                          |
| ------ | --------------------- | -------------------------------------------- |
| GET    | `/`                   | – → `Workflow[]` (with `_count.executions`)  |
| POST   | `/`                   | `{ name, description?, engineRef? }`          |
| GET    | `/:id`                | –                                            |
| PATCH  | `/:id`                | `{ name?, description?, engineRef?, isActive? }` |
| DELETE | `/:id`                | – (cascades executions)                       |
| POST   | `/:id/execute`        | – → 202 `WorkflowExecution` (must be active)  |
| GET    | `/:id/executions`     | – → `WorkflowExecution[]`                     |

## Executions — `/api/executions` (auth, owner-scoped)

| Method | Path         | Notes |
| ------ | ------------ | ----- |
| GET    | `/?limit=50` | newest first, max 200 |
| GET    | `/:id`       | refreshes status from the engine if still RUNNING/PENDING |

## Dashboard — `/api/dashboard` (auth)

| Method | Path       | Returns |
| ------ | ---------- | ------- |
| GET    | `/summary` | totals, `executionsByStatus`, `recentExecutions`, `recentWorkflows` |

## Health

`GET /api/health` → `{ status: "ok", automation: { n8n: boolean } }`
