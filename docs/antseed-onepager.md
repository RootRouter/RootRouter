# RootRouter on Antseed

**Context-aware routing for agent workloads — live as an Antseed seller.**

## What it is

RootRouter is an IRP (Inference Routing Protocol) suggest-only router. A buyer sends a ranking request with its candidate sellers; RootRouter returns a ranked list by task fit and expected cost. The buyer then calls the chosen inference seller. RootRouter does **not** serve models or proxy inference.

## Seller details

| Field | Value |
|---|---|
| Peer ID | `59c6a970dc961efba8c5eeaaac8516b77feb0dbc` |
| Agent ID | `1165698` |
| Service | `rootrouter` (protocol `irp-suggest`) |
| Price | **$0.0001 per ranking** (1 `completed_requests` unit) + negligible token component |
| Status | Live · 37–57 ms routing latency |
| Website | https://rootrouter.brahma101.cyou |
| GitHub | https://github.com/RootRouter/RootRouter |
| Docs | [docs/irp.md](irp.md) |

## Why RootRouter

- Ranks candidates by task fit and expected cost, not just price.
- Provider-agnostic: works with any Antseed inference seller.
- Stateless and zero-retention: no prompt/response persistence; `store=none`, `retention=0`.
- Complements Antseed: buyers keep their payment channels; RootRouter only adds a ranking step.

## How to use it

Pin the router explicitly (recommended while the seller is new):

```bash
antseed buyer connection set --peer 59c6a970dc961efba8c5eeaaac8516b77feb0dbc
```

Or per request:

```text
model: 59c6a970dc961efba8c5eeaaac8516b77feb0dbc@rootrouter
```

If your buyer enforces the default `minTrustScore=60`, pinning bypasses the automatic gate. Only set `routingPreferences.minTrustScore=0` if you understand the tradeoff.

Example through the buyer proxy:

```bash
curl -s http://localhost:8377/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{
    "model": "59c6a970dc961efba8c5eeaaac8516b77feb0dbc@rootrouter",
    "messages": [{"role": "user", "content": "Say hello in exactly five words."}],
    "routing": {"cost_quality_tradeoff": 7},
    "max_tokens": 128
  }'
```

## Pricing

- **$0.0001 per ranking**; inference is billed separately by the chosen seller.
- 1,000 rankings = **$0.10**.
- No subscription, no minimum.

## Privacy

- The IRP service is stateless: it processes the ranking request in memory and does not persist prompts, responses or logs of message content (`store=none`, `retention=0`).
- The router sees the ranking request (messages + candidate metadata) to compute the ranking; it does not retain it.
- Inference privacy is between buyer and seller; RootRouter does not proxy or store inference traffic.
- The buyer proxy/MCP may store local state by design; see the repo docs.

## Trust and roadmap

- New seller: trust 5 today; identity verification and pool/staking are in progress.
- Until trust reaches the default 60, pin the peer or use a buyer with `minTrustScore=0`.
- Design partners: agent launchers running persistent OpenClaw/Hermes agents; paid pilots.

## Contact

- Website: https://rootrouter.brahma101.cyou
- GitHub: https://github.com/RootRouter/RootRouter
- Antseed peer: `59c6a970dc961efba8c5eeaaac8516b77feb0dbc`
