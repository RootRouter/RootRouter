# rootrouter

**Context proxy with memory for self-hosted agents and swarms** — plus SDK, CLI, and repo indexing.

Default path: point agents at **`@rootrouter/proxy`** (OpenAI-compatible `base_url`). Use **`@rootrouter/mcp`** for IDE cold slices (Cursor, Codex). This package is the shared engine: RepoGraph, MMR selection, file store, and CLI.

Experimental (off by default): Weyl chambers, Celo telemetry — see [docs/experimental](https://github.com/RootRouter/RootRouter/tree/main/docs/experimental).

MIT · [BETA.md](./BETA.md) · Full docs: [github.com/RootRouter/RootRouter](https://github.com/RootRouter/RootRouter)

## Quick start

```bash
npm install rootrouter @rootrouter/proxy @rootrouter/mcp
# or npx without install:
npx rootrouter index ./my-repo
npx rootrouter init cursor --project-store --project-agent-id my-app
npx -p @rootrouter/proxy rootrouter-proxy   # http://localhost:8787
```

**Headless agents:** set `base_url` to the proxy — no code changes.

**Cursor/Codex:** `init cursor --project-store` → MCP `index_repo` + `select_context` on cold slices only.

```bash
rootrouter doctor
rootrouter store ls --store ~/.rootrouter/<slug>/cursor-store.json
```

## Surfaces

| Package | Role |
|---------|------|
| `rootrouter` (this) | SDK + CLI (`index`, `init`, `doctor`, `store`, evals) |
| `@rootrouter/proxy` | Trims chat history, cross-session recall, `/metrics`, `/topology` |
| `@rootrouter/mcp` | MCP tools (`index_repo`, `select_context` pointers mode, `recommend_agent`) |

Do not stack proxy trimming and SDK `RootRouter.chat()` on the same LLM request.

## Links

- [Architecture](https://github.com/RootRouter/RootRouter/blob/main/docs/architecture.md)
- [Deployment matrix](https://github.com/RootRouter/RootRouter/blob/main/docs/deployment-matrix.md)
- [Benchmarks](https://github.com/RootRouter/RootRouter/blob/main/docs/BENCHMARKS.md)