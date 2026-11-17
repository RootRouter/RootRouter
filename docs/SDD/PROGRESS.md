# SDD 001 — progreso de implementación

Rama: `sdd/001-production-readiness`  
Estado: **100 % AC cerrados** (2026-11-17)

| Slice | Estado |
|-------|--------|
| A | ✅ |
| B | ✅ |
| C | ✅ |
| D | ✅ (`docs/insights/mcp-overhead-measurement.json`, regla corta) |
| E | ✅ (opt-in trim + `docs/experiments/cache-trim-cost.md`, cached tokens en `/context`) |
| F | ✅ (`test/regression.test.ts`, p95 healthz) |
| G | ✅ (`deploy/compose`, Dockerfile, Grafana JSON, `scripts/verify-compose.sh`) |
| H | ✅ (`/topology`, `demo:swarm-proxy`, MCP `recommend_agent`) |
| I | ✅ (`rootrouter store *`, admin `/store`, TTL env, `docs/privacy.md`) |
| J | ✅ (`1.0.0`, CHANGELOGs, `publish:packages` gates, BETA exit criteria) |
| K | ✅ |

## Métricas (sección 7)

| Métrica | Estado |
|---------|--------|
| recall@10 ≥ 0.26 | ✅ ~0.28 |
| MCP overhead −60 % | ✅ ver `npm run measure:mcp-overhead` |
| Proxy p95 ≤ 50 ms | ✅ healthz regression |
| docker compose | ✅ `scripts/verify-compose.sh` |

Release: **1.0.0** en npm (`publish:packages` desde mantenedor). Imagen: `packages/proxy/Dockerfile` → `ghcr.io/rootrouter/proxy` (push manual con credenciales).