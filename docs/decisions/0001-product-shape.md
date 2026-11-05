# 0001 — Product shape: OSS infrastructure with commercial services

- **Status:** Accepted
- **Date:** 2026-11-05
- **Decision owners:** RootRouter maintainers

## Context

RootRouter is an independent, MIT-licensed project with its own brand and authorship.
It has three distribution surfaces (SDK/CLI, transparent proxy, MCP server) plus a
dashboard and optional on-chain telemetry. The project needs a commercial path that
does not turn it into a data-accumulating platform, and a technical path that does not
build infrastructure ahead of demand.

## Decisions

1. **Shape.** RootRouter remains open-source infrastructure under MIT. Commercial
   services (implementations, support, integration) are delivered by an independent
   services partner under a commercial agreement. No transfer of copyright, trademark,
   or project ownership. No third operating company is created at this stage.
2. **Distribution.** GitHub, npm, MCP clients, and inference marketplaces (Antseed
   routing services) are the distribution channels. A hosted multi-tenant API is out of
   scope until demand is demonstrated.
3. **Privacy by design.** Stateless processing is the default. Third-party prompts are
   not persisted by default. Persistence is opt-in, isolated per tenant, documented, and
   deletable. No prompt content is written to logs.
4. **Commercial horizon.** Revenue comes first from paid implementations and support,
   not from per-token or per-ranking revenue. Marketplace routing is a distribution and
   evidence channel, time-boxed and measured.
5. **Technical horizon.** Consolidate the SDK, MCP server, proxy, routing, and the
   algebraic research track. The research track (root-pair geometry, chambers, agent
   topology) is not on the production critical path.
6. **On-chain telemetry.** Optional. Celo telemetry stays available but is not a
   production dependency or a buyer-facing requirement.

## Consequences

- The proxy must default to stateless behavior; stateful recall requires an explicit,
  documented opt-in path.
- The MCP server may persist indexed repository chunks and explicitly recorded context;
  it must document retention and support purge.
- Routing services must process requests in memory, never log prompt content, and expose
  zero retention by default.
- The repository needs CI, a single source of truth, and reproducible releases before
  any production deployment.
- Claims about savings must be backed by reproducible artifacts and separated by path
  (SDK history filtering vs repository selection).

## Non-goals

- Building a hosted multi-tenant platform before measured demand.
- Storing customer prompts as a business asset.
- Making the algebraic research track load-bearing for production.
- Rewriting the architecture while the repository is being consolidated.
