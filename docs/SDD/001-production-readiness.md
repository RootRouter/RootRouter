# SDD 001 — RootRouter: salida a producción y mercado

**Estado:** borrador · **Alcance:** monorepo completo · **Origen:** revisión técnica de noviembre 2026 (ver `docs/decisions/0001-product-shape.md`, `docs/NEXT.md`)

Este documento organiza el trabajo en **slices de implementación** independientes y verificables. No fija tiempos. Cada slice tiene alcance, criterios de aceptación (AC), archivos ancla y métrica de salida. Un slice se considera cerrado cuando todos sus AC pasan y se registra un handoff con `docs/templates/slice-handoff.md`.

---

## 1. Contexto y diagnóstico

RootRouter hoy tiene tres superficies (SDK, proxy, MCP) sobre un motor compartido. La revisión identificó:

| Hallazgo | Evidencia | Consecuencia |
|---|---|---|
| El motor de selección (similitud + MMR + presupuesto + RepoGraph) y el proxy stateful son sólidos | `packages/sdk/src/select/`, `packages/proxy/src/server.ts`, `selections.jsonl` | Es el producto real |
| La capa algebraica (cámaras, reflexión) está apagada por defecto en MCP y proxy | `ROOTROUTER_USE_CHAMBERS=false` en `packages/mcp/src/server.ts` | El pitch no describe lo que se usa |
| No existe métrica de calidad de selección | `docs/BENCHMARKS.md` lo reconoce | % ahorrado es vanidoso sin recall |
| Selección ruidosa en monorepos con TF‑IDF | 3/13 chunks irrelevantes en query de arquitectura (`GridScan.tsx`, `_generated/*.d.ts`) | Default de embeddings y excludes insuficientes |
| RootRouter añade overhead fijo en Cursor | 6 tool defs + regla `alwaysApply` ~90 líneas en cada turno | Paga siempre, ahorra solo en cold |
| Trimming del proxy puede invalidar prompt cache | `filterMessages` recorta por request | Ahorro de tokens puede costar más que no recortar |
| Celo/ERC‑8004 es telemetría auto‑reportada | `RootRouterTelemetry.sol` confía en `msg.sender` | No aporta confianza verificable; distrae |
| Mercado de Cursor ya cubierto por el IDE | Indexación semántica nativa, compactación | El hueco real son agentes headless y swarms |

## 2. Objetivos

- **O1.** Reposicionar RootRouter como *proxy de contexto con memoria para agentes autoalojados y swarms*, con MCP como camino secundario.
- **O2.** Que ninguna mejora del motor se mergee sin métrica de calidad (recall@k / precision@k) en CI.
- **O3.** Que el proxy sea instalable en un comando, observable con métricas estándar y seguro para producción (fail‑open, cache‑aware, regresiones cubiertas).
- **O4.** Reducir el costo fijo del camino MCP en Cursor/Codex.
- **O5.** Convertir el Agent Topology Graph en el diferenciador de primera clase para swarms.
- **O6.** Congelar lo que no sirve al cliente objetivo (Celo, cámaras, dashboard 3D) sin borrarlo.

## 3. No objetivos

- Reescribir el motor de selección o cambiar de lenguaje.
- Eliminar código de cámaras, reflexión o Celo; pasan a experimental/congelado.
- Competir con la indexación nativa de Cursor como caso principal.
- Soporte de nuevos proveedores de LLM fuera de los ya cubiertos (OpenAI‑compat, Venice, OpenRouter, NIM).

## 4. Arquitectura objetivo

```
 Agentes headless / swarms          Cursor / Codex (secundario)
   (OpenClaw, Hermes, custom)
           │ base_url                       │ MCP stdio
           ▼                                ▼
   @rootrouter/proxy  ◄──── mismo store ────►  @rootrouter/mcp
   · trim cache‑aware                         · select en modo puntero
   · recall entre sesiones                    · tool defs mínimas
   · routing por tier
   · /context /metrics
           │
           ▼
   rootrouter (SDK) — motor compartido
   ContextEngine · MMR · RepoGraph · FileContextStore
   AgentTopologyGraph (1ª clase) · ModelRouter · IRP
   ─────────────────────────────────────────────────
   experimental (flag): cámaras · reflexión · Celo
           │
           ▼
   Observabilidad: selections.jsonl · /metrics Prometheus · dashboard ligero
```

Principios:

1. **Un store, un motor.** Proxy y MCP comparten `FileContextStore`; el índice de repo y la memoria conversacional se componen.
2. **Fail‑open siempre.** Ningún fallo de RootRouter bloquea la llamada al LLM.
3. **Nada sin número.** Todo cambio de selección pasa el eval; todo cambio del proxy pasa la suite de regresión.
4. **Flags antes que ramas.** Lo experimental vive detrás de env vars con eval propio, no en forks.

---

## 5. Slices de implementación

Las dependencias se indican con `→`. Los slices sin dependencia pueden ejecutarse en paralelo.

### Slice A — Posicionamiento y documentación

**Objetivo:** O1, O6.
**Depende de:** nada.

Alcance:
- Reescribir `README.md`: titular, sección "The Problem/Solution" y tabla de superficies centradas en el proxy y agentes headless. Cursor/MCP como sección secundaria.
- Mover "The Math", papers E8, y sección Celo a `docs/experimental/` con una nota de estado (flag, sin eval todavía).
- Retirar las cifras ~96 % / ~73 % del titular; dejarlas solo en `docs/BENCHMARKS.md` con su baseline. Añadir la comparación pendiente del Slice B.
- Actualizar `apps/dashboard/public/SKILL.md` y `docs/SKILL.md` con la nueva jerarquía (proxy primero).
- Crear `docs/decisions/0002-positioning.md` registrando la decisión.

AC:
- [ ] A1. README sin referencia a E8, Weyl o Celo en las primeras 100 líneas.
- [ ] A2. `docs/experimental/README.md` lista cada feature experimental con su flag y su estado de eval.
- [ ] A3. Cifras de ahorro solo en `docs/BENCHMARKS.md`, cada una con baseline nombrado.
- [ ] A4. `rootrouter init` y `doctor` imprimen el proxy como camino por defecto para agentes headless.

Anchors: `README.md`, `docs/architecture.md`, `docs/SKILL.md`, `apps/dashboard/public/SKILL.md`, `packages/sdk/src/cli/`.

---

### Slice B — Eval de calidad de selección

**Objetivo:** O2.
**Depende de:** nada. Bloquea C, D, E.

Alcance:
- Dataset `packages/sdk/evals/selection/*.json`: 50 queries sobre este repo con lista de archivos/chunks esperados (etiquetados a mano). Incluir queries de arquitectura, "dónde vive X", bugfix localizado y spec‑driven.
- Runner `npm run eval:selection` que indexa el repo en un store temporal, corre cada query con la config dada, y reporta recall@k, precision@k, nDCG y tokens.
- Soporte para comparar dos configs (A/B): embeddings, excludes, `mmrLambda`, `useChambers`, presupuesto.
- Baseline "agente sin RootRouter": estimación de tokens de un recorrido `Grep` + `Read` para llegar a los mismos archivos (heurística documentada).
- Job de CI que falla si recall@10 cae por debajo del umbral comprometido.

AC:
- [ ] B1. `npm run eval:selection` produce un JSON con recall@5/10, precision@5/10, nDCG y tokens por query y agregado.
- [ ] B2. El runner acepta `--config a.json --config b.json` y emite un diff.
- [ ] B3. CI ejecuta el eval y bloquea el merge bajo umbral.
- [ ] B4. `docs/BENCHMARKS.md` incluye la tabla de eval y la comparación contra el baseline agéntico.
- [ ] B5. Resultado comprometido en `benchmarks/results/eval-selection-latest.json`.

Anchors: `packages/sdk/src/select/contextEngine.ts`, `packages/sdk/src/select/selector.ts`, `packages/sdk/src/repo/indexRepo.ts`, `packages/sdk/demo/benchmark.ts`, `docs/BENCHMARKS.md`.

---

### Slice C — Higiene del índice y embeddings por defecto

**Objetivo:** O2.
**Depende de:** B.

Alcance:
- Soporte de `.rootrouterignore` en la raíz del repo (sintaxis gitignore) leído por `walkRepo`.
- Excludes por defecto ampliados: `**/_generated/**`, `*.d.ts`, `dist/`, `.next/`, `coverage/`, `benchmarks/results/`, assets binarios, lockfiles.
- Exclusión de secretos por defecto: `.env*`, `*.pem`, `*.key`, archivos con patrones de llave API (heurística + allowlist).
- `EMBEDDING_PROVIDER=local` (MiniLM) como default cuando el modelo está disponible en disco; TF‑IDF como fallback explícito con warning. `init cursor/codex` descarga el modelo o deja instrucciones.
- Endurecer `resolveJailedPath` y límites de tamaño ya existentes en `packages/sdk/src/repo/security.ts` con tests negativos.

AC:
- [ ] C1. Un `.rootrouterignore` excluye archivos en `index_repo` (MCP), CLI y proxy.
- [ ] C2. Eval B: recall@10 no baja y precision@10 sube respecto al baseline comprometido en B5 con los nuevos excludes.
- [ ] C3. Eval B: MiniLM supera a TF‑IDF en nDCG sobre el dataset; si no, el default no cambia y se documenta.
- [ ] C4. Test que indexa un fixture con `.env` y llaves falsas y verifica que ningún chunk las contiene.
- [ ] C5. Test de path traversal (`../`, symlinks fuera del repo) rechazado.

Anchors: `packages/sdk/src/repo/walk.ts`, `packages/sdk/src/repo/security.ts`, `packages/sdk/src/select/embedding/`, `packages/sdk/src/cli/`.

---

### Slice D — MCP de bajo costo

**Objetivo:** O4.
**Depende de:** B.

Alcance:
- Modo puntero en `select_context` / `select_for_spec`: parámetro `mode: "pointers" | "full"`. En `pointers` devuelve `path:startLine-endLine`, score, primera línea no vacía y tokens estimados; sin texto completo. Default `pointers` cuando no hay spec activa.
- Presupuesto por defecto: 2000 sin spec, 4000 con `ROOTROUTER_ACTIVE_SPEC`.
- Descripciones de las seis tools reducidas a una línea cada una; el detalle vive en la skill `.cursor/skills/rootrouter/SKILL.md`.
- Regla `rootrouter-mcp.mdc` reducida al árbol de decisión (≤15 líneas) y marcada `alwaysApply`; el resto pasa a una regla `agent-requested` o a la skill. Actualizar `docs/templates/cursor-rootrouter-mcp-rule.mdc` y lo que escribe `init cursor`.
- Medir tokens fijos antes/después (tool defs + regla) y registrarlo en `docs/insights/`.

AC:
- [ ] D1. `select_context` con `mode: "pointers"` devuelve ≤ 25 % de los tokens del modo `full` para la misma query en el eval B.
- [ ] D2. Eval B en modo puntero + `Read` de los top‑k mantiene recall@10 del modo full.
- [ ] D3. Suma de tokens de tool defs + regla `alwaysApply` reducida al menos 60 % respecto al estado actual (medido y documentado).
- [ ] D4. `init cursor --project-store` escribe la regla corta y la skill; `doctor` lo verifica.

Anchors: `packages/mcp/src/server.ts`, `.cursor/rules/rootrouter-mcp.mdc`, `.cursor/skills/rootrouter/SKILL.md`, `docs/templates/cursor-rootrouter-mcp-rule.mdc`, `packages/sdk/src/cli/`.

---

### Slice E — Proxy cache‑aware

**Objetivo:** O3.
**Depende de:** B (para medir que el recall no cae) y de la suite F.

Alcance:
- Trimming en bloques estables: recortar solo al cruzar umbrales discretos (`MIN_TOKENS_TO_FILTER`, luego cada N tokens), y de forma determinista para una misma sesión, de modo que el prefijo del prompt se mantenga igual entre requests consecutivos.
- Preservar íntegro el prefijo cacheable (system + primeros K mensajes) y recortar solo el bloque medio; el bloque final (últimos M turnos) nunca se toca.
- Leer `usage.prompt_tokens_details.cached_tokens` (OpenAI) y `cache_read_input_tokens` (Anthropic) de la respuesta upstream y exponerlos en `/context` y headers.
- Experimento controlado: misma conversación de 40 turnos con proxy en modo actual, modo cache‑aware y sin proxy; comparar costo real reportado por el proveedor.
- Decisión documentada en `docs/decisions/0003-cache-aware-trimming.md`.

AC:
- [ ] E1. En una sesión de 40 turnos, el prefijo enviado upstream es idéntico byte a byte entre requests consecutivos salvo en los puntos de umbral.
- [ ] E2. `/context` reporta `cachedTokens` por request y acumulado cuando el upstream lo devuelve.
- [ ] E3. El experimento muestra costo real (USD reportado por proveedor) menor o igual que sin proxy; si no, el trimming se desactiva por defecto y se documenta.
- [ ] E4. Mensajes system, tool/function, multimodal y últimos M turnos nunca se recortan (tests).

Anchors: `packages/proxy/src/filter.ts`, `packages/proxy/src/server.ts`, `packages/proxy/src/contextMeter.ts`, `packages/proxy/src/messageStore.ts`.

---

### Slice F — Suite de regresión del proxy

**Objetivo:** O3.
**Depende de:** nada. Bloquea E, G.

Alcance:
- Upstream mock OpenAI‑compat en tests (streaming SSE, no‑streaming, errores 4xx/5xx, timeouts, cortes a mitad de stream).
- Casos: passthrough de streaming byte‑exacto; tool calls y `tool_choice`; multimodal; `n>1`; fail‑open cuando el store o el engine fallan; concurrencia (50 requests paralelos, sin mezcla de estado entre `x-rootrouter-agent-id`); headers hop‑by‑hop; `content-encoding`.
- Test de carga mínimo con umbral de latencia añadida p95.

AC:
- [ ] F1. `npm run test -w @rootrouter/proxy` cubre todos los casos listados y corre en CI.
- [ ] F2. Latencia añadida p95 por el proxy ≤ 50 ms en el test de carga local (sin upstream real).
- [ ] F3. Un fallo inyectado en `FileContextStore` produce respuesta upstream normal y un header `x-rootrouter-degraded: true`.

Anchors: `packages/proxy/src/server.ts`, `packages/proxy/src/engine.ts`, `packages/proxy/src/filter.ts`, `packages/proxy/src/hermesAgentId.ts`.

---

### Slice G — Proxy como producto instalable y observable

**Objetivo:** O3.
**Depende de:** F.

Alcance:
- Imagen Docker oficial multi‑arch publicada (`ghcr.io/rootrouter/proxy`), `docker compose` con proxy + agente de ejemplo (OpenClaw o Hermes) + volumen de store.
- `GET /metrics` Prometheus: requests, tokens in/out/saved, cached tokens, recall hits, latencia, errores, por `agentId`.
- Publicar `@rootrouter/proxy` estable en npm (sin `@beta`), con `rootrouter-proxy --help` completo.
- Dashboard reducido: una página que lee `/context` y `/metrics` del proxy (o un `docker compose` con Grafana + dashboard JSON provisto). Sin Three.js, sin Convex, sin Celo en el camino crítico.
- `deploy/` con una receta única: VPS + Docker + Caddy, verificada de extremo a extremo.

AC:
- [ ] G1. `docker compose up` desde `deploy/compose/` levanta proxy + agente de ejemplo y la primera llamada pasa por el proxy con headers RootRouter.
- [ ] G2. `/metrics` scrapeable por Prometheus; dashboard Grafana provisto como JSON en `deploy/grafana/`.
- [ ] G3. `npx -p @rootrouter/proxy rootrouter-proxy` funciona sin tag beta.
- [ ] G4. `docs/deployment-matrix.md` tiene una fila "Recomendado" que apunta a esta receta.

Anchors: `packages/proxy/`, `deploy/README.md`, `apps/dashboard/Dockerfile`, `scripts/deploy-dashboard-vps.sh`, `docs/deployment-matrix.md`.

---

### Slice H — Agent Topology Graph como feature de primera clase

**Objetivo:** O5.
**Depende de:** F, G (el proxy es la fuente de telemetría por agente).

Alcance:
- El proxy alimenta `AgentTopologyGraph` desde `x-rootrouter-agent-id` y un header opcional `x-rootrouter-delegated-from` para registrar delegaciones reales entre agentes.
- Perfil por agente persistido en el store: tipos de tarea atendidos (clusterizados por embedding, no por cámara), tokens, latencia, tasa de error, modelo usado.
- Endpoint `GET /topology` (JSON) y tool MCP `recommend_agent(query)` que devuelve el agente con mejor historial para el tipo de tarea, con la evidencia.
- Routing opcional en el proxy: `ROOTROUTER_SWARM_ROUTING=suggest|enforce`; en `suggest` solo añade header `x-rootrouter-recommended-agent`.
- Demo `npm run demo:swarm` actualizado para usar el proxy real en lugar de la simulación.

AC:
- [ ] H1. Tras 3 agentes × 20 llamadas por el proxy, `/topology` devuelve nodos, aristas de delegación y perfil por agente.
- [ ] H2. `recommend_agent` elige correctamente al especialista en un fixture con especializaciones conocidas (test determinista).
- [ ] H3. El modo `suggest` no altera la petición upstream; `enforce` solo cambia `model`/destino cuando hay configuración explícita.
- [ ] H4. El dashboard ligero (G) muestra el grafo de topología desde `/topology`.

Anchors: `packages/sdk/src/core/agentGraph.ts`, `packages/proxy/src/server.ts`, `packages/proxy/src/hermesAgentId.ts`, `packages/sdk/demo/swarm.ts`, `packages/mcp/src/server.ts`.

---

### Slice I — Memoria con control del usuario

**Objetivo:** O3, O5.
**Depende de:** G.

Alcance:
- CLI `rootrouter store ls|show|rm|export|purge --agent <id>` sobre `FileContextStore`.
- Endpoints del proxy `GET /store/:agentId`, `DELETE /store/:agentId/:itemId`, `DELETE /store/:agentId` protegidos por token (`ROOTROUTER_ADMIN_TOKEN`).
- TTL opcional por ítem y por agente (`ROOTROUTER_STORE_TTL_DAYS`).
- Documento `docs/privacy.md`: qué se guarda, dónde, cómo borrarlo, qué nunca se guarda (secretos del Slice C).

AC:
- [ ] I1. `rootrouter store export --agent x` produce JSON reimportable; `purge` deja el agente sin ítems.
- [ ] I2. Endpoints admin rechazan sin token y funcionan con token (tests).
- [ ] I3. Ítems más viejos que el TTL no se seleccionan ni se recuerdan.

Anchors: `packages/sdk/src/select/store/`, `packages/proxy/src/server.ts`, `packages/sdk/src/cli/`.

---

### Slice J — Higiene de release

**Objetivo:** O3, O6.
**Depende de:** A.

Alcance:
- Semver estricto para los tres paquetes; `CHANGELOG.md` por paquete generado desde commits convencionales.
- Política de breaking changes y de deprecación en `docs/PUBLISH.md`.
- `BETA.md` con criterios de salida de beta: AC de B, E, F, G cerrados.
- Pipeline de publish único (`npm run publish:packages`) que corre build, tests, eval B y suite F antes de publicar.

AC:
- [ ] J1. Cada paquete tiene `CHANGELOG.md` actualizado en el último release.
- [ ] J2. `publish:packages` falla si eval B o suite F fallan.
- [ ] J3. `BETA.md` enumera los criterios de salida y su estado.

Anchors: `docs/PUBLISH.md`, `BETA.md`, `scripts/`, `package.json` raíz.

---

### Slice K — Congelar experimental

**Objetivo:** O6.
**Depende de:** A, B.

Alcance:
- Cámaras y reflexión: mantener detrás de `ROOTROUTER_USE_CHAMBERS`; añadir al eval B una config con el flag activo. Criterio de archivo documentado: si no mejoran nDCG sobre el dataset, se mueven a `packages/sdk/src/experimental/` y salen del `index.ts` público en el siguiente major.
- Celo / ERC‑8004: sin nuevas features; `CeloTelemetry` y `ERC8004Registration` siguen exportados pero marcados `@experimental` en JSDoc y README. El contrato no se redepliega.
- `apps/dashboard`: decidir en `docs/decisions/0004-dashboard-scope.md` entre repo propio o reducción al dashboard ligero de G. Eliminar Three.js (`GridScan.tsx`) y Convex del camino crítico.

AC:
- [ ] K1. Eval B incluye la config `useChambers=true` y su resultado está en `benchmarks/results/`.
- [ ] K2. README y JSDoc marcan Celo y cámaras como experimental.
- [ ] K3. Decisión del dashboard registrada y ejecutada (repo separado o reducción).

Anchors: `packages/sdk/src/core/contextFilter.ts`, `packages/sdk/src/core/vectorSpace.ts`, `packages/sdk/src/celo/`, `apps/dashboard/`.

---

## 6. Grafo de dependencias

```
A ──────────────┐
B ──┬── C       ├── J
    ├── D       │
    ├── E ◄── F │
    └── K       │
F ──┬── G ── H  │
    │     └── I │
    └───────────┘
```

Paralelizables desde el inicio: **A, B, F**.

## 7. Métricas de salida (definición de "listo para producción")

| Métrica | Fuente | Umbral comprometido en |
|---|---|---|
| recall@10 / precision@10 / nDCG de selección | Eval B | B5 |
| Tokens fijos MCP (tool defs + regla) | Slice D medición | D3 |
| Costo real USD por sesión con/sin proxy, con cache | Experimento E | E3 |
| Latencia añadida p95 del proxy | Suite F | F2 |
| Cobertura de la suite F | CI | F1 |
| Tiempo a primera llamada exitosa desde `docker compose up` | Slice G | G1 |

## 8. Riesgos

| Riesgo | Mitigación |
|---|---|
| El eval B muestra que MiniLM no mejora o que las cámaras sí lo hacen | Se acepta el dato; C3 y K1 están escritos para ambos resultados |
| El experimento E muestra que trimming encarece con cache | E3 desactiva el trimming por defecto; el proxy sigue valiendo por recall y routing |
| Reposicionar aleja a quienes llegaron por la narrativa algebraica | `docs/experimental/` conserva papers y flags; nada se borra |
| Agentes headless cambian de API rápido (OpenClaw, Hermes) | Proxy depende solo de OpenAI‑compat; integraciones específicas quedan en `init` y docs |
| Sobrecarga de mantener dashboard + Convex + Celo | Slice K lo congela y reduce |

## 9. Fuera de este SDD (backlog)

- ANN index para stores grandes (`packages/sdk/src/select/ann/`).
- IRP como servicio independiente (`docs/irp.md`).
- Integración de Graphify como importador opcional.
- Soporte multi‑tenant del proxy (múltiples stores por proceso).

## 10. Referencias

- `docs/decisions/0001-product-shape.md`
- `docs/NEXT.md`
- `docs/BENCHMARKS.md`
- `docs/insights/003-how-rootrouter-works-problem-and-fix.md`
- `docs/templates/slice-handoff.md`
