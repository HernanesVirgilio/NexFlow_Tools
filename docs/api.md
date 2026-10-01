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

## Intelligence — `/api/intelligence` (auth, rate-limited)

| Method | Path        | Body                              | Returns |
| ------ | ----------- | ---------------------------------- | ------- |
| POST   | `/generate` | `{ message, mode }` — `mode` ∈ `ask \| think \| programming \| analysis \| image \| video \| presentation \| automation` | `{ type: "answer", content }` or `{ type: "workflow_proposal", title, description, definition, issues, runnable }` |

Only `ask`, `think`, `programming` and `automation` are implemented today —
every other `mode` value is accepted by the schema but answers
`501 INTELLIGENCE_MODE_NOT_IMPLEMENTED` honestly rather than faking a result.
`automation` never creates or runs anything: `definition` is the same builder
graph as `POST /workflows`, already checked against `validateDefinition()` —
the frontend only persists it if the user explicitly confirms (reusing
`POST /workflows`, no separate "apply proposal" endpoint). Capped at 12
requests/minute/user (`429 RATE_LIMITED`). Without `GEMINI_API_KEY` configured,
every mode answers `501 INTELLIGENCE_NOT_CONFIGURED` instead of a fake answer.

## Integrations — `/api/integrations` (auth except the OAuth callback)

| Method | Path                | Notes |
| ------ | ------------------- | ----- |
| GET    | `/`                 | → `{ configured, integrations: [{ provider: "google", connected, accountEmail? }] }` |
| GET    | `/google/connect`   | → `{ url }` — the real Google consent URL; `501 INTEGRATION_NOT_CONFIGURED` without `GOOGLE_CLIENT_ID/SECRET` |
| GET    | `/google/callback`  | Google's own redirect target — no Bearer token possible here, so a signed `state` (10 min TTL) carries identity instead. Always ends in a redirect to `${APP_WEB_URL}/integrations?status=connected\|denied\|error` |
| DELETE | `/google`           | Revokes the stored connection — `204` |

The only provider today is Google, and the connection is authentication-only —
reading Gmail/Drive/Sheets data is not implemented. The refresh token is
encrypted at rest (`utils/crypto.ts`, AES-256-GCM); never returned to the
frontend. Never fakes a "Connected" state: with no OAuth credentials
configured, every endpoint says so plainly instead of simulating success.

## Health

`GET /api/health` → `{ status: "ok", automation: { n8n: boolean } }`
