# SDD 001 — progreso de implementación

Rama: `sdd/001-production-readiness`  
Referencia: [001-production-readiness.md](./001-production-readiness.md)

| Slice | Estado | Notas |
|-------|--------|-------|
| A — Posicionamiento | **cerrado** | README, experimental/, 0002, SKILL, doctor/init |
| B — Eval selección | **cerrado** | 53 queries, CI threshold 0.26, `npm run eval:selection` |
| C — Higiene índice | **cerrado** | `.rootrouterignore`, excludes, secret heuristic, security dirs |
| D — MCP bajo costo | **parcial** | pointers mode, tool defs cortos; regla MCP corta pendiente medición D3 |
| E — Proxy cache-aware | **parcial** | `trimSession` opt-in default off; doc 0003 |
| F — Suite proxy | **parcial** | fail-open `x-rootrouter-degraded`; ampliar mock suite pendiente |
| G — Proxy instalable | **parcial** | Dockerfile, compose, `/metrics`, `/topology` |
| H — Topology graph | **parcial** | proxy `/topology`, delegación header; MCP recommend stub |
| I — Memoria usuario | **parcial** | `rootrouter store *` CLI; proxy admin DELETE pendiente |
| J — Release hygiene | **parcial** | CI eval; BETA criterios — npm stable publish en rama |
| K — Congelar experimental | **cerrado** | experimental/README, eval chambers config, 0004 dashboard |

Última actualización: 2026-11-17

## Commits (push para rollback)

Push rama `sdd/001-production-readiness` tras cada commit; ver `git log` en GitHub.

## AC globales (sección 7)

| Métrica | Umbral | Estado |
|---------|--------|--------|
| recall@10 | ≥ 0.26 | ✅ ~0.28 |
| MCP tool defs + regla | −60 % | 🔶 medición pendiente (D3) |
| Proxy p95 | ≤ 50 ms | 🔶 test carga F2 pendiente |
| docker compose up | primera llamada OK | 🔶 validar local |