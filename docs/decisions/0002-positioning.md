# 0002 — Positioning: proxy-first for headless agents

- **Status:** Accepted (SDD slice A)
- **Date:** 2026-11-17
- **Supersedes (marketing only):** README hero prior to SDD 001

## Context

ADR 0001 already states the algebraic research track is not on the production critical path. Public docs and badges still led with Weyl chambers, Celo, and Cursor MCP savings. Runtime defaults use similarity + MMR with `ROOTROUTER_USE_CHAMBERS=false`.

## Decision

1. **Primary surface:** `@rootrouter/proxy` for self-hosted and swarm agents (OpenAI-compatible `base_url`).
2. **Secondary surface:** `@rootrouter/mcp` for IDE cold slices (Cursor, Codex).
3. **SDK/CLI:** shared engine, indexing, store tooling, and demos.
4. **Experimental:** chambers, reflection, Celo/ERC-8004 — documented under `docs/experimental/` with explicit flags.
5. **Claims:** token savings percentages only in `docs/BENCHMARKS.md` with named baselines; selection quality gated by eval B (recall/precision).

## Consequences

- `rootrouter doctor` and `init` recommend the proxy path for headless agents before MCP setup details.
- README first sections describe proxy + store; algebra and on-chain telemetry link to experimental docs.
- Dashboard marketing SKILL files list proxy before MCP.

## References

- [SDD 001](../SDD/001-production-readiness.md)
- [ADR 0001](./0001-product-shape.md)