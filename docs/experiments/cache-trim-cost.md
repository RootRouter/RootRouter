# Cache-aware trimming experiment (slice E)

## Setup

```bash
export ROOTROUTER_CACHE_AWARE_TRIM=true
# vs false (default)
```

Run 40-turn scripted chat through proxy with fixed upstream; compare provider-reported `cached_tokens` and total cost.

## Decision (E3)

Default remains **`ROOTROUTER_CACHE_AWARE_TRIM=false`** until a live provider run shows USD ≤ baseline. Trimming stays available opt-in via `trimSession.ts`.

## Metrics

`GET /context` exposes `cachedTokensSession` and `cachedTokensLast` when upstream returns OpenAI/Anthropic usage fields.