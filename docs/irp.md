# IRP routing service (suggest-only)

RootRouter can act as an [Inference Routing Protocol](https://github.com/inference-routing/spec)
(IRP) **routing service**: it ranks the buyer's candidate destinations for one
turn and never runs inference. This is the surface Antseed's `irp-router`
provider plugin forwards to.

- Protocol: `irp-suggest`
- Endpoints: `GET /v1/routing/models`, `POST /v1/routing/rank`
- State: none. No store, no queue, no prompt logging.
- Upstream calls: none. Ranking is local and deterministic.

## Run it

```bash
npm run build:all
IRP_ROUTER_API_KEY=<key> npm run irp:start -w @rootrouter/proxy
# listening on http://127.0.0.1:8788
```

| Variable | Default | Meaning |
|---|---|---|
| `IRP_PORT` | `8788` | Listen port |
| `IRP_HOST` | `127.0.0.1` | Bind address. Keep loopback unless a reverse proxy fronts it |
| `IRP_ROUTER_API_KEY` | unset | When set, requires `Authorization: Bearer <key>` |
| `IRP_ROUTER_ID` | `rootrouter` | Router id reported in rankings |
| `IRP_ROUTER_VERSION` | `0.0.0` | Router version reported in rankings |

## Endpoints

### `GET /v1/routing/models`

Advertises IRP's wildcard model, because RootRouter can score any candidate it
is sent:

```json
{ "object": "list", "data": [{ "id": "*", "object": "model" }] }
```

### `POST /v1/routing/rank`

```json
{
  "request": {
    "messages": [{ "role": "user", "content": "Refactor this function" }],
    "max_tokens": 4096
  },
  "routing": {
    "cost_quality_tradeoff": 3,
    "candidates": [
      {
        "id": "openai:gpt-5.5@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "model": "gpt-5.5",
        "pricing": { "input": 1.25, "cache_read": 0.125, "output": 10 },
        "expected_usage": { "cache_read_tokens": 900 }
      }
    ]
  }
}
```

Response:

```json
{
  "id": "rank_6f1c...",
  "object": "routing.ranking",
  "created": 1790000000,
  "router": { "id": "rootrouter", "version": "0.2.0-beta.1" },
  "ranked": [
    { "candidate_id": "openai:gpt-5.5@aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", "expected_cost_usd": 0.0041 }
  ]
}
```

All scorable candidates are returned, best first. Duplicate ids are dropped.
Candidate ids are echoed untouched.

## How the ranking is computed

1. **Token estimate** from the messages (`words × 1.3`, the same estimator used
   by the proxy) plus `max_tokens` (default `1024`).
2. **Cost per candidate**, USD:
   `(billable_input × input + cache_read × cache_read_price + output × output) / 1e6`,
   where `cache_read` is clamped to the estimated input.
3. **Task fit**, from capability detection (code, reasoning, vision, long
   context) and a difficulty tier (`fast` / `balanced` / `powerful`). Candidate
   tiers and capabilities are inferred from the model name — a documented
   heuristic, not a model evaluation.
4. **Blend** with `cost_quality_tradeoff` (0 = quality, 10 = cost). Both signals
   keep a floor so neither extreme ignores the other side completely.

The output is deterministic for the same input and clock.

## Errors

`application/problem+json`, with IRP problem types:

| Status | Type | When |
|---|---|---|
| 400 | `urn:irp:problem:invalid-request` | Malformed JSON, missing messages/candidates, bad tradeoff or `max_tokens` |
| 401 | `urn:irp:problem:unauthorized` | Missing/wrong bearer token when a key is configured |
| 404 | `urn:irp:problem:not-found` | Unknown path |
| 413 | `urn:irp:problem:payload-too-large` | Body above 1 MiB |
| 422 | `urn:irp:problem:no-scorable-candidate` | Every candidate lacked a usable id, model or pricing |
| 500 | `urn:irp:problem:internal-error` | Unexpected handler error |

Malformed **candidates** (for example, missing pricing) are dropped rather than
failing the turn; the request only fails if none remain.

## Privacy

- The request body is parsed, ranked in memory and discarded.
- No prompts, completions, candidate ids or model names are logged. Log lines
  contain method, path, status, duration and ranking counts only.
- No persistence, no database, no queue, no outbound network calls.
- Responses are `Cache-Control: no-store`.
- Bind to loopback by default; auth is optional but recommended as soon as the
  service is reachable from another host.

## Antseed wiring

Antseed ships an `irp-router` provider plugin that forwards the two endpoints to
your router unchanged. A seller announces it as an `irp-suggest` service:

```bash
antseed config seller add-provider router \
  --plugin irp-router \
  --base-url http://127.0.0.1:8788
antseed config seller add-service router rootrouter --input 0 --output 0
IRP_ROUTER_API_KEY=<key> IRP_ROUTER_PRICE_USD=0.001 antseed seller start
```

IRP paths name no service, so a seller offers at most one `irp-suggest` service.
Billing happens in Antseed per well-formed ranking; this service does not handle
payments.
