# Algebraic layer (experimental)

RootRouter can fit **Weyl chambers** over stored embeddings (PCA on root-pair directions) and boost items in the same or adjacent chambers during selection. **Reflection retrieval** reflects queries through chamber hyperplanes to surface complementary context.

## Enable

```bash
export ROOTROUTER_USE_CHAMBERS=true
```

MCP, proxy, and `ContextEngine` respect this env var. Default is `false` — production selection uses TF-IDF or local/API embeddings with RepoGraph signals and MMR only.

## When to use

- Long-running SDK sessions with hundreds of stored interaction items.
- Experiments comparing chamber boost vs pure similarity (see `npm run eval:selection` with `useChambers: true`).

## When not to use

- Cold repo indexing (MCP/proxy default).
- Claims of production savings without eval B nDCG comparison (slice K).

## References

- `packages/sdk/src/core/vectorSpace.ts`, `packages/sdk/src/core/contextFilter.ts`
- Working papers linked from [README — The Math](../../README.md#the-math)