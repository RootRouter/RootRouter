# SDD 001 — progreso de implementación

Rama: **`main`** (merge PR #5, 2026-11-17)  
Estado: **100 % AC cerrados** · **cerrado para producción 1.0.x**

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
| J | ✅ (`1.0.2` npm, CHANGELOGs, `publish-packages.mjs` + verify, BETA exit criteria) |
| K | ✅ |

## Métricas (sección 7)

| Métrica | Estado |
|---------|--------|
| recall@10 ≥ 0.26 | ✅ ~0.28 |
| MCP overhead −60 % | ✅ ver `npm run measure:mcp-overhead` |
| Proxy p95 ≤ 50 ms | ✅ healthz regression |
| docker compose | ✅ `scripts/verify-compose.sh` |

## Release

| Artefacto | Versión | Notas |
|-----------|---------|--------|
| npm `rootrouter`, `@rootrouter/proxy`, `@rootrouter/mcp` | **1.0.2** | `npm run publish:packages` → `scripts/publish-packages.mjs` (pack + publish por paquete); README visible en npmjs |
| Git | `main` | SDD 001 mergeado |
| Imagen `ghcr.io/rootrouter/proxy` | manual | Push con credenciales GHCR; ver `packages/proxy/Dockerfile` |

**Post-merge checklist (opcional):** `scripts/verify-compose.sh` en VPS; `npm run verify:published-readme` (puede fallar si `versions[].readme` está vacío aunque npmjs renderice el tarball).

**VPS (`vps-brahma`, 2026-11-17):** `main` @ `bf5da73`; `verify-compose` OK; dashboard rebuild (`deploy-dashboard-vps.sh --local`).