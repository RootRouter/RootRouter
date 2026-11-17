# Celo on-chain telemetry (experimental / frozen)

Optional batch logging of compressed interaction telemetry to Celo via `RootRouterTelemetry.sol`. **Self-reported** — `msg.sender` is trusted; not a verifiable audit trail for third parties.

## Status (SDD slice K)

- No new contract features or dashboard dependencies.
- SDK exports remain with `@experimental` JSDoc.
- Not required for proxy, MCP, or npm install.

## Enable (legacy)

Set `CELO_RPC_URL`, `CELO_PRIVATE_KEY`, and `TELEMETRY_CONTRACT_ADDRESS` on `RootRouter` SDK construction. See `packages/sdk/src/celo/` and `contracts/RootRouterTelemetry.sol`.

## References

- [ADR 0001 — on-chain telemetry](../decisions/0001-product-shape.md)