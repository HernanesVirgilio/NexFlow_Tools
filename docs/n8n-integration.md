# n8n integration

**NexFlow Tools is the product. n8n is the automation engine.** The app talks to
`AutomationService`, never to n8n directly.

```
workflow.service  →  automationService.trigger(engine, { engineRef })
                        │
                        ▼
                   N8nProvider              src/automation/providers/n8n/
                        │
        ┌───────────────┴───────────────┐
   POST {N8N_BASE_URL}/webhook/{ref}    GET /api/v1/executions/{id}   (X-N8N-API-KEY)
   (start a run)                        (poll status)
```

## Why a webhook for triggering

n8n's public REST API has no generic "run this workflow" endpoint. Phase 1
workflows therefore start with a **Webhook** node; the workflow's `engineRef` is
that webhook's path. Status polling uses the authenticated REST API
(`/executions/{id}`).

## Configuration (backend only — never shipped to the browser)

| Var             | Meaning |
| --------------- | ------- |
| `N8N_BASE_URL`  | e.g. `http://localhost:5678` |
| `N8N_API_KEY`   | issued in n8n → Settings → n8n API |
| `N8N_TIMEOUT_MS`| request timeout (default 15000) |

## Failure handling

`AutomationError.kind` → HTTP status (in `AutomationService`):

| kind               | status | user message |
| ------------------ | ------ | ------------ |
| `UNAVAILABLE`      | 502    | engine unavailable |
| `TIMEOUT`          | 504    | engine did not respond in time |
| `AUTH`             | 502    | engine rejected our credentials |
| `NOT_FOUND`        | 404    | resource not found |
| `INVALID_WORKFLOW` | 422    | workflow can't be executed yet |
| `EXECUTION_ERROR`  | 502    | engine reported an error |

On a failed trigger the `WorkflowExecution` row is marked `FAILED` with the
message, so history stays accurate even when n8n is down.

## Adding another engine later

1. `src/automation/providers/<engine>/` implementing `AutomationProvider`.
2. Register it in `providers` in `AutomationService.ts`.
3. Set `Workflow.engine` to the new name. No app/UI changes needed.
