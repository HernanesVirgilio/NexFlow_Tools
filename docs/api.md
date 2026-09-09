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
| POST   | `/social/:provider`| –                                 | `provider` ∈ `google \| github \| facebook \| twitter`. **Reserved — not implemented.** Always `501 SOCIAL_AUTH_NOT_CONFIGURED`; invalid provider → `400`. See [social sign-in](#social-sign-in-future). |
| POST   | `/refresh`         | –                                 | rotates refresh cookie, returns `{ accessToken }` |
| POST   | `/logout`          | –                                 | revokes refresh token |
| POST   | `/forgot-password` | `{ email }`                       | always 200 (no account enumeration) |
| POST   | `/reset-password`  | `{ token, password }`             | invalidates all sessions |

<a id="social-sign-in-future"></a>
### Social sign-in (future integration)

The auth page shows Google / GitHub / Facebook / X buttons and the
`POST /api/auth/social/:provider` endpoint exists, but **no OAuth provider is
wired up**. The endpoint returns `501 SOCIAL_AUTH_NOT_CONFIGURED` and the UI
surfaces a "not available yet" message — a click never produces a session.

To implement a provider later: add its OAuth credentials to the environment,
implement the token/code exchange inside `authService.socialLogin` (upsert
`User` + `Profile`, then `issueSession` — the same session path as password
login), and keep it isolated from `authService.login`.

## Users — `/api/users` (auth)

| Method | Path           | Body                                        |
| ------ | -------------- | ------------------------------------------- |
| GET    | `/me`          | –                                          |
| PATCH  | `/me`          | `{ name?, avatarUrl?, language?, theme? }`  |
| POST   | `/me/password` | `{ currentPassword, newPassword }`         |

## Workflows — `/api/workflows` (auth, owner-scoped)

| Method | Path                  | Body                                          |
| ------ | --------------------- | -------------------------------------------- |
| GET    | `/`                   | – → `Workflow[]` (`_count.executions` + newest `executions[0]`) |
| POST   | `/`                   | `{ name, description?, engineRef?, definition? }` |
| GET    | `/:id`                | –                                            |
| PATCH  | `/:id`                | `{ name?, description?, engineRef?, isActive?, definition? }` |
| DELETE | `/:id`                | – (cascades executions)                       |
| POST   | `/:id/execute`        | – → 202 `WorkflowExecution` (must be active)  |
| POST   | `/:id/check`          | `{ definition }` → `{ ok, issues[], runnableRef }` (no execution row created) |
| GET    | `/:id/executions`     | – → `WorkflowExecution[]`                     |
| GET    | `/node-types`         | – → node catalogue for the builder (`nodeCatalogView()`) |

`definition` is the builder graph: `{ version: 1, nodes: [{ id, type, position,
config, label? }], edges: [{ id, source, target, sourceHandle?, targetHandle? }] }`.
It is validated against the shared node catalogue on write and before execution.

## Executions — `/api/executions` (auth, owner-scoped)

| Method | Path         | Notes |
| ------ | ------------ | ----- |
| GET    | `/?limit=50` | newest first, max 200 |
| GET    | `/:id`       | refreshes status from the engine if still RUNNING/PENDING |

A `FAILED` `WorkflowExecution` carries `errorCode` (a stable `AppError` code such
as `AUTOMATION_TIMEOUT`) and a client-safe `errorMessage`. The frontend maps
`errorCode` to supported recovery actions only — unknown codes fall back to
generic guidance. Engine and provider messages are normalised server-side; no
credentials or connection details are ever returned.

## Dashboard — `/api/dashboard` (auth)

| Method | Path       | Returns |
| ------ | ---------- | ------- |
| GET    | `/summary` | totals, `executionsByStatus`, `recentExecutions`, `recentWorkflows` |

## Health

`GET /api/health` → `{ status: "ok", automation: { n8n: boolean } }`
