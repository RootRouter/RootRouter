# Publishing RootRouter packages

Three npm packages ship from this monorepo (publish **in this order**):

| Package | Bin | Purpose |
|---------|-----|---------|
| `rootrouter` | `rootrouter` | SDK + CLI (`index`, `init`, `snapshot`) |
| `@rootrouter/proxy` | `rootrouter-proxy` | Transparent OpenAI-compatible proxy |
| `@rootrouter/mcp` | `rootrouter-mcp` | MCP server for Codex, Cursor, etc. |

## One-liner install (after publish)

```bash
npm install rootrouter @rootrouter/proxy @rootrouter/mcp
npx rootrouter index ./my-repo
npx rootrouter init codex --project-store
npx -p @rootrouter/proxy rootrouter-proxy
npx -p @rootrouter/mcp rootrouter-mcp
```

## Local monorepo usage

```bash
npm run build:all
npm run index -w rootrouter -- index ./my-repo
node packages/mcp/dist/server.js
node packages/proxy/dist/server.js
```

## Publish from maintainer machine

1. Log in: `npm login`
2. Ensure `@rootrouter` scope access on npm (org or user)
3. From repo root:

```bash
npm run publish:packages
```

This builds all three packages and publishes each with the **`beta`** dist-tag (so `latest` stays on the previous stable until you ship 1.0).

Verify after publish:

```bash
npm view rootrouter dist-tags
npm view @rootrouter/proxy version
npm view @rootrouter/mcp version
```

## Versioning

Current release: **1.0.1** (SDD 001 — see [BETA.md](../BETA.md) and [docs/SDD/PROGRESS.md](./SDD/PROGRESS.md)).

npm maintainer: **gerryalvrz** (`rootrouter` and `@rootrouter/*`).

Bump versions together in:

- `packages/sdk/package.json` (`rootrouter`)
- `packages/proxy/package.json`
- `packages/mcp/package.json`

Proxy and MCP depend on `rootrouter@^<same pre-release>`.

Legal files (`LICENSE`, `NOTICE`, `COMMERCIAL.md`, `BETA.md`) live at the repo root and are synced into each package before publish:

```bash
npm run legal:sync
```

## Agent setup (no publish required)

```bash
npx rootrouter@beta init cursor   # writes .cursor/mcp.json (MCP via npx -p @rootrouter/mcp@beta)
npx rootrouter@beta init codex    # appends ~/.codex/config.toml
```

Optional proxy env snippet is printed after `init cursor`.

## Dashboard (Vercel — not an npm package)

The dashboard lives in `apps/dashboard` (`@rootrouter/dashboard`, **`"private": true`**). It is **not** published with `rootrouter`, `@rootrouter/proxy`, or `@rootrouter/mcp`.

| Concern | How it is enforced |
|---------|-------------------|
| Accidental npm publish | `"private": true` on dashboard; `publish:packages` script has no dashboard step |
| SDK tarball contents | `rootrouter` `files`: `["dist", "templates", …]` only — no `apps/` |
| Vercel deploy path | Root Directory = `apps/dashboard` — see [`apps/dashboard/README.md`](../apps/dashboard/README.md) |

**Keep in this repo or split?** Default: **keep here** (shared docs, `SKILL.md`, one PR for product changes). Split to a second repo only if you need separate access, billing, or release cadence — the npm/git boundaries already isolate shipping channels.

## Dashboard selection stats

Push context-engine stats to the topology dashboard:

```bash
export ROOTROUTER_STORE_PATH=~/.rootrouter/store.json
export DASHBOARD_URL=http://localhost:3000
npx rootrouter@beta snapshot
```

Demos also attach `selectionStats` + `repoGraph` when `ROOTROUTER_STORE_PATH` is set.
