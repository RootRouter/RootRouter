# 0003 — Cache-aware trimming (opt-in)

- **Status:** Accepted
- **Date:** 2026-11-17
- **Default:** `ROOTROUTER_CACHE_AWARE_TRIM=false`

## Decision

Discrete trim levels per `x-rootrouter-agent-id` stabilize prompt prefixes for provider prompt cache. Enable only after slice E cost experiment shows neutral or positive USD impact.

## Enable

```bash
export ROOTROUTER_CACHE_AWARE_TRIM=true
```

## References

- `packages/proxy/src/trimSession.ts`
- SDD slice E