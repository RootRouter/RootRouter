# Privacy and retention

## What is stored

| Data | Where | Default |
|------|-------|---------|
| Indexed repo chunks | `ROOTROUTER_STORE_PATH` | Opt-in (index / proxy with store) |
| Chat turns (proxy stateful) | Same store | When proxy engine enabled |
| Selection audit | `selections.jsonl` | Local append-only |
| Topology rollups | Proxy process memory | Ephemeral |

## What is not stored

- Secret files matching `.env*`, `*.pem`, `*.key`, or heuristic API-key patterns (slice C).
- Upstream prompts when proxy fails open without persistence.

## Delete

```bash
rootrouter store purge --store ~/.rootrouter/<slug>/proxy-store.json --agent <id>
rootrouter store rm --store <file> --item <id>
```

Optional TTL: `ROOTROUTER_STORE_TTL_DAYS` (slice I — filter at selection time).

## Admin API

`ROOTROUTER_ADMIN_TOKEN` protects future `DELETE` store routes on the proxy (see SDD slice I).