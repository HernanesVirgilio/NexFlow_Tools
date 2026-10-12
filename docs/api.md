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

## Intelligence — `/api/intelligence` (auth)

`POST /generate` proposes a workflow from natural language. It does **not**
create, activate, or execute a workflow. The API key stays on the server.

Body: `{ "prompt": "When I receive a new lead, notify my team" }` (`2–2000` chars).

`200` when the provider is configured:

```json
{
  "proposal": {
    "name": "Notify the team",
    "description": "Manual start, then an HTTP call.",
    "summary": "A draft the user can review before saving.",
    "definition": { "version": 1, "nodes": [], "edges": [] }
  },
  "issues": [{ "code": "CONFIG_INCOMPLETE", "message": "Node \"call\" is missing configuration: url", "nodeId": "call" }],
  "warnings": [{ "code": "COMING_SOON", "message": "Step \"email\" can be saved in a draft but cannot run yet." }]
}
```

`proposal` is `null` when the model returns a graph with no nodes (`issues` still
lists `EMPTY`). `definition` is checked with `workflowDefinitionSchema` and
`validateDefinition()`. A reply that is not a workflow graph is rejected.

| Status | Code | When |
| ------ | ---- | ---- |
| 401 | `UNAUTHORIZED` | Missing or invalid access token |
| 400 | `VALIDATION_ERROR` | Prompt missing, too short, or too long |
| 422 | `INTELLIGENCE_INVALID` | Provider reply is not a readable workflow. Nothing is saved. |
| 429 | `RATE_LIMITED` | More than `INTELLIGENCE_RATE_LIMIT` calls per user per minute (default 10) |
| 402 | `AI_QUOTA_EXHAUSTED` | The OpenAI account has no credit. Nothing is saved or run. |
| 502 | `AI_PROVIDER_ERROR` | Provider failed. The message does not include the key, the system prompt, or the raw reply. |
| 503 | `PROVIDER_UNAVAILABLE` | `OPENAI_API_KEY` is empty. No proposal is invented. |

Example — unconfigured:

```json
{ "error": { "code": "PROVIDER_UNAVAILABLE", "message": "NexFlow Intelligence is not configured." } }
```

Valid graph example (what a configured provider must return inside `definition`):

```json
{
  "version": 1,
  "nodes": [
    { "id": "start", "type": "manual", "position": { "x": 0, "y": 0 }, "config": {} },
    { "id": "call", "type": "http", "position": { "x": 280, "y": 0 }, "config": { "method": "POST", "url": "https://example.com/hook" } }
  ],
  "edges": [{ "id": "e1", "source": "start", "target": "call" }]
}
```

Invalid example: `{ "name": "Notify" }` with no `definition` → `422 INTELLIGENCE_INVALID`.

## Health

`GET /api/health` → `{ status: "ok", automation: { n8n: boolean } }`
