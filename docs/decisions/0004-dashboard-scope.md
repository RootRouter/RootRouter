# 0004 — Dashboard scope (frozen path)

- **Status:** Accepted
- **Date:** 2026-11-17

## Decision

Keep `apps/dashboard` in-repo but **off the production critical path**. Slice G provides proxy `/metrics` + optional Grafana JSON. Three.js (`GridScan`), Convex, and Celo views are experimental/frozen — no new features until a dedicated lite dashboard reads `/context` and `/topology`.

## Consequences

- Production deploy recipe: `deploy/compose/docker-compose.yml` (proxy-first).
- Full dashboard remains for demos at `npm run dashboard`.

## References

- SDD slice K, G