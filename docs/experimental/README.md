# Experimental features

Not on the production critical path (see [ADR 0001](../decisions/0001-product-shape.md)). Enabled only via flags or optional configuration. Quality is **not** gated in CI unless noted.

| Feature | Flag / config | Eval in CI | Status |
|---------|---------------|------------|--------|
| Weyl chambers + reflection boost | `ROOTROUTER_USE_CHAMBERS=true` | Slice B config `useChambers` (K1) | Default **off** |
| Root-pair PCA / `StructuredVectorSpace` | SDK `useChambers` | Same as chambers | Research |
| Celo batch telemetry / ERC-8004 | `CELO_*`, contract address | None | Frozen — no new features |
| Convex + Three.js dashboard | Dashboard env | None | Frozen — lite dashboard in slice G |
| IRP standalone service | `packages/sdk` IRP | Partial (proxy tests) | Preview |

## Docs

- [Algebraic layer (chambers, root pairs)](./algebraic-layer.md)
- [Celo on-chain telemetry](./celo-telemetry.md)

Papers and deep math remain in the main repo under `docs/` and `README.md#the-math` (relocated from the README hero in SDD slice A).