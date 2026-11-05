# 🌿 RootRouter

### Context infrastructure, routing, and telemetry for AI agents and swarms

**Give agents a bounded, relevant, auditable working context—through an SDK,
transparent proxy, or MCP tools—without discarding the algebraic and graph-based
routing layer that adapts as agents work.**

*Early beta · Self-hosted MIT · See [BETA.md](./BETA.md)*

*Verifiable on-chain analytics on Celo · ERC-8004 compatible*

[![Celo Hackathon](https://img.shields.io/badge/Celo-Hackathon_2026-35D07F?style=for-the-badge&logo=celo)](https://celo.org)
[![Track](https://img.shields.io/badge/Track-Best_Agent_Infra-blue?style=for-the-badge)](https://github.com/RootRouter/RootRouter)
[![npm version](https://img.shields.io/npm/v/rootrouter?style=for-the-badge&logo=npm&color=CB3837)](https://www.npmjs.com/package/rootrouter)
[![npm downloads](https://img.shields.io/npm/dm/rootrouter?style=for-the-badge&logo=npm)](https://www.npmjs.com/package/rootrouter)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](https://github.com/RootRouter/RootRouter/blob/main/LICENSE)
[![Live Demo](https://img.shields.io/badge/Live-rootrouter.motusdao.org-black?style=for-the-badge)](https://rootrouter.motusdao.org)

> 📄 Backed by two working papers on algebraic AI architecture and graph-theoretic agent topology — see [The Math](#the-math)

---

## The Problem

AI agents are expensive. Every autonomous agent burns tokens sending **full conversation history** on every LLM call. A typical agent session accumulates 50K+ tokens of context, but most of it is irrelevant to the current query.

**OpenRouter** routes between models but doesn't optimize *what gets sent*.  
**Agent frameworks** orchestrate tasks but don't structure the interaction space.  
**Nobody** uses the mathematical properties of the interaction graph itself.

The result: agents often send large amounts of irrelevant context on every call, use expensive models for simple tasks, and may lack a verifiable record of their decision-making.

---

## The Solution

RootRouter is an early-beta context-management and routing platform. A shared TypeScript engine combines practical repository selection—semantic relevance, RepoGraph expansion, MMR deduplication, and strict token budgets—with an experimental adaptive layer based on root-pair telemetry, PCA-derived chambers, interaction graphs, and agent topology.

Use the same engine in three ways:

| Surface | Best for | Behavior |
|---|---|---|
| **`rootrouter` SDK + CLI** | Applications and custom agent runtimes | Direct context selection, LLM orchestration, model routing, graphs, telemetry, and repository indexing |
| **`@rootrouter/proxy`** | Existing OpenAI-compatible agents | Automatically trims growing chat history and recalls relevant cross-session context with no agent code changes |
| **`@rootrouter/mcp`** | Cursor, Codex, OpenClaw, Hermes, and other MCP clients | Lets an agent explicitly index a repository, record context, select a budgeted slice, and audit savings |

The dashboard visualizes interaction telemetry, graph topology, savings metrics, agent onboarding, and optional Celo data. The proxy exposes its own process-local context-health endpoint. RootRouter does three things across these surfaces:

### 1. 📡 Root-Pair Telemetry

Every interaction produces a **root pair**: the gap between what was intended (query embedding) and what was executed (response embedding). The root vector `r = intent − execution` is RootRouter's operational proxy for semantic alignment. It is a geometric signal, not an independent correctness grade. Collect enough root pairs and the implementation uses their principal directions to organize interaction history.

### 2. 🔬 Multi-Layer Context Filtering

The adaptive SDK builds a **three-layer representation** of interaction history. The production context engine can also operate without chambers, using semantic selection, RepoGraph signals, MMR, and a strict token budget from the first indexed item.

**Layer 1 — Algebraic (Weyl Chambers)**  
PCA identifies the *root directions* — principal axes of variation in the interaction space. These define **Weyl chambers**: regions where the agent performs similarly. Context from the same or adjacent chambers is most relevant to the current query.

**Layer 2 — Topological (Interaction Knowledge Graph)**  
Every interaction becomes a node. Edges encode semantic relatedness, chamber adjacency, and temporal proximity. The resulting knowledge graph typically reaches ~81 edges and ~4.0 average degree per session. **Graph traversal** surfaces contextually related history that pure vector similarity misses — capturing second-order and third-order relational structure that linear retrieval cannot.

**Layer 3 — Geometric (Reflection Retrieval)**  
Algebraically reflecting the query through root direction hyperplanes finds *complementary* information across chamber boundaries — context that contrasts with the current query in structured ways.

Together these replace "send everything" with a bounded selection whose contents and token savings can be inspected. MCP and proxy selection use chambers only when explicitly enabled; local TF-IDF is the zero-dependency default, with local or API embeddings available.

### 3. 🧠 Intelligent Model Routing

Each chamber has a historical difficulty score (average root norm). Easy chambers → fast, cheap models. Hard chambers → powerful, expensive models.

For **multi-agent swarms**, RootRouter builds an **Agent Topology Graph**: a directed graph where nodes are agents and weighted edges encode delegation relationships and chamber specializations. Each agent accumulates a *chamber profile* over time. The current router can recommend the agent with the best historical root norm for a query's chamber, while the graph retains delegation and specialization data for richer swarm routing.

Telemetry is written locally by default. When Celo credentials and the telemetry contract are configured, RootRouter can batch-log compressed interaction telemetry on-chain.

---

## Results

RootRouter has two complementary context-saving paths. They use different baselines and should be reported separately.

| Path | Result | Evidence |
|---|---:|---|
| **NVIDIA NIM live swarm** | **46% chat context saved** | 134,226 accumulated-history tokens → 72,450 selected across 24 steps and 3 agents using real `nvidia/nemotron-3-ultra-550b-a55b` completions |
| **Cursor MCP cold slice** | **~96% repository context saved** | Audited `index_repo` + `select_context` call: about 134k indexed-corpus tokens → about 6k selected for a spec-driven slice |
| **Offline SDK benchmark** | **~49% simulated cost savings** | Seeded 50-query TF-IDF + simulated-LLM benchmark |

The **46%** result measures automatic filtering as a multi-agent history grows. The **~96%** result measures explicit repository selection against the full indexed corpus at cold-slice kickoff. Neither percentage is a universal per-request guarantee, and token reduction alone is not an answer-quality metric.

See [Benchmark evidence and methodology](docs/BENCHMARKS.md), the committed [NVIDIA NIM swarm result](benchmarks/results/nim-live-swarm-2026-07-01T22-10-18.json), and the [Cursor workflow review](docs/insights/001-cursor-agent-slice-workflow-feedback.md).

---

## Install

```bash
npm install rootrouter@beta
```

> Also available on npm: [npmjs.com/package/rootrouter](https://www.npmjs.com/package/rootrouter)

The published package includes the built SDK (`dist/`), TypeScript types, and this README. Demos and dashboard live in the [GitHub repo](https://github.com/RootRouter/RootRouter); run them after cloning.

## Usage

```typescript
import { RootRouter } from 'rootrouter';

const router = new RootRouter({
  llmBaseUrl: 'https://openrouter.ai/api/v1',
  llmApiKey: process.env.OPENROUTER_KEY,
  celoRpcUrl: process.env.CELO_RPC_URL,
  celoPrivateKey: process.env.CELO_PRIVATE_KEY,
  telemetryContractAddress: process.env.TELEMETRY_CONTRACT_ADDRESS,
});

const result = await router.chat({
  agentId: 'my-agent',
  messages: [{ role: 'user', content: 'Write a sorting algorithm' }],
});

console.log(result.response);
console.log(`Saved ${result.telemetry.tokensSaved} tokens ($${result.telemetry.costSaved.toFixed(4)})`);
console.log(`Chamber: ${result.telemetry.chamberUsed}, Model: ${result.telemetry.modelUsed}`);
```

Wire in your LLM, then use `router.chat()` instead of calling the provider directly. Context filtering, routing, and local telemetry happen in the SDK pipeline. Celo logging is optional and runs only when its credentials and telemetry contract are configured.

---

## Quick Start

```bash
git clone https://github.com/RootRouter/RootRouter.git
cd RootRouter
npm install

# Offline demos (no API keys needed)
npm run demo:basic           # 40 interactions, single agent
npm run demo:swarm           # multi-agent topology routing
npm run demo:benchmark       # baseline vs RootRouter comparison
```

### Choose an integration

#### MCP: explicit repository context for agents

Use MCP for cold starts, unfamiliar repositories, cross-module work, and spec-driven slices. RootRouter complements the spec and anchor files; it does not replace reading them.

```bash
# Run inside the project you want to configure
npx rootrouter@beta init cursor --project-store --project-agent-id my-project
npx rootrouter@beta init codex --project-store --write-agents-md --project-agent-id my-project
```

`--project-store` isolates repositories under `~/.rootrouter/<project>/` so chunks from unrelated codebases do not contaminate selection. Add `--local-embeddings` for local MiniLM embeddings; otherwise RootRouter uses zero-dependency TF-IDF.

The MCP server exposes six tools:

| Tool | Purpose |
|---|---|
| `index_repo` | Chunk a repository and build its import/directory RepoGraph |
| `record_context` | Persist file chunks, prior turns, tool output, or documentation |
| `select_context` | Return a relevant, deduplicated slice within a token budget |
| `select_for_spec` | Build and execute a selection query from an active spec |
| `stats` | Inspect store size and cumulative selection savings |
| `list_selections` | Read the append-only selection audit log |

The intended loop is **cold task → index once → select a slice → read spec and anchors → implement**. For a warm, localized single-file change, read and edit directly instead of invoking MCP on every turn. See [`packages/mcp/README.md`](packages/mcp/README.md).

#### Proxy: automatic context management

Use the OpenAI-compatible proxy when the agent should not need to call RootRouter tools:

```bash
npx -p @rootrouter/proxy@beta rootrouter-proxy
```

Point the agent's existing `base_url` at `http://localhost:8787` while preserving the provider path. The proxy:

- records turns in a file-backed, per-agent context store;
- trims prior plain-text turns only after the configurable threshold is reached;
- recalls relevant context across requests and sessions;
- preserves system, tool/function, multimodal, and final-user messages;
- streams upstream responses unchanged and fails open to the original request;
- optionally performs lightweight model-tier routing for Venice, OpenRouter, or configured models.

Inspect managed-context health at `GET /context` (or `/v1/context`): last-request tokens before/after, trim delta, budget fill, session totals, and per-agent rollups. See [`packages/proxy/README.md`](packages/proxy/README.md).

#### Hermes and other runtimes

```bash
npx rootrouter@beta init hermes --project-slug my-project
npx rootrouter@beta doctor
```

Hermes setup wires its OpenAI-compatible provider to the proxy and scopes context with `x-rootrouter-agent-id`. Cursor currently uses the MCP path; Codex can use MCP and the proxy/shared store; OpenClaw and generic stdio MCP clients can run `rootrouter-mcp` directly. The supported combinations and storage policies are documented in [`docs/deployment-matrix.md`](docs/deployment-matrix.md).

### Benchmarks

The benchmark uses **aligned token accounting** (same context definition for baseline and RootRouter) and **explicit metrics**: `raw_input_tokens`, `filtered_context_tokens`, `effective_billed_tokens`. Results are exported to `benchmarks/results/{timestamp}.json`.

| Run | Command |
|-----|--------|
| **Quick** (15 queries) | `DEMO_QUICK=true npm run demo:benchmark` |
| **Full** (50 queries) | `npm run demo:benchmark` |
| **Reproducible** (same seed ⇒ same numbers) | `npx tsx demo/benchmark.ts --seed 42` (from `packages/sdk`) |
| **NVIDIA NIM live swarm** (24 steps, 3 agents) | `npm run demo:benchmark-live:swarm` |

Regression tests: `npm run test` runs `math.test.ts` and `benchmark.test.ts` (consistency and seed reproducibility).

The live swarm command requires `NVIDIA_NIM_API_KEY` (or `LLM_API_KEY`). It writes a timestamped artifact and updates `benchmarks/results/nim-latest.json`. See [docs/BENCHMARKS.md](docs/BENCHMARKS.md) for baselines and reporting rules.

To see **live telemetry from Celo**, use the [dashboard](#dashboard).

### Configuration

**Offline demos** require no API keys — demos use a simulated LLM.

**Real LLM + Celo:** Copy `.env.example` to `.env` and set at least:
- `LLM_BASE_URL`, `LLM_API_KEY` (e.g. OpenAI or OpenRouter)
- `CELO_RPC_URL`, `CELO_PRIVATE_KEY`, `TELEMETRY_CONTRACT_ADDRESS`

For mainnet, use `CELO_RPC_URL_MAINNET`, `CELO_PRIVATE_KEY_MAINNET`, and `TELEMETRY_CONTRACT_ADDRESS_MAINNET`. Deployed mainnet contract: [`0x91aB56AbB4577B2B61Eed9A727cCb0D39896f0Ab`](https://explorer.celo.org/mainnet/address/0x91aB56AbB4577B2B61Eed9A727cCb0D39896f0Ab).

**Lighter / cheaper runs:** Set `DEMO_QUICK=true` to reduce interactions. Use a single cheap model for all tiers (e.g. `MODEL_FAST=gpt-4o-mini`) to keep real-LLM tests affordable.

**Using both xAI and OpenAI:** Set OpenRouter as `LLM_BASE_URL` and pick models per tier (e.g. `MODEL_FAST=x-ai/grok-3-mini`, `MODEL_POWERFUL=openai/gpt-4o`).

---

## Dashboard

```bash
npm run dashboard
```

Open <http://localhost:3000>, enter the **agent address**, and click **Load from Celo** to fetch stats and recent entries from the contract.

Or visit the live deployment: **[rootrouter.motusdao.org](https://rootrouter.motusdao.org)**

The dashboard shows:
- **Chamber distribution** — which Weyl chambers the agent has operated in
- **Knowledge graph** — interaction nodes and edges visualized
- **Agent topology** — swarm delegation graph (Topology tab)
- **Cost savings** — token budget breakdown per session
- **Agent onboarding** — setup paths for Hermes, OpenClaw, Codex, Cursor, and direct SDK use

### Convex (optional — Topology view)

- **Shared backend:** Use the project's Convex deployment (`NEXT_PUBLIC_CONVEX_URL` in repo). No setup.
- **Private DB:** Run `npx convex dev` once. Your snapshots stay in your own project.

---

## Architecture

```
 Application agents and swarms
              │
     ┌────────┼─────────┐
     │         │         │
 SDK + CLI    HTTP proxy    MCP server
     │         │         │
     └────────┴────┬────────┘
                      │
          ┌──────────▼──────────┐
          │ Shared RootRouter engine │
          ├── ContextEngine + MMR ──┤
          ├── RepoGraph / indexRepo ─┤
          ├── Persistent stores     ─┤
          ├── Root pairs + chambers ─┤
          ├── Interaction graph     ─┤
          ├── Agent topology        ─┤
          └── Model routing          ─┘
                      │
       ┌──────────┼───────────┐
       │          │           │
 Local audit    Dashboard    Optional Celo
 and metrics    + Convex     telemetry
```

### Key Components

| Component | What It Does | Mathematical Basis |
|---|---|---|
| **Context Engine** | Ranks candidates, removes redundancy with MMR, and enforces a token budget | Information retrieval |
| **RepoGraph** | Chunks repositories and maps imports, directories, communities, and node importance | Static analysis + graph theory |
| **Persistent Stores** | Isolates and recalls context by repository and agent across sessions | Stateful retrieval |
| **Root Pair Collector** | Records intent/execution vectors per interaction | Root-system-inspired geometry |
| **Structured Vector Space** | PCA → principal directions → sign-pattern chambers | Algebraic model |
| **Interaction Knowledge Graph** | Builds semantic + temporal relationships over interactions | Graph theory |
| **Agent Topology Graph** | Tracks swarm specializations and delegation relationships | Network analysis |
| **Model Router** | Maps estimated difficulty and capabilities to model tiers | Adaptive routing |
| **Audit + Celo Telemetry** | Records local selection evidence and optional on-chain summaries | Distributed systems |

---

## The Math

RootRouter is built on three mathematical layers that each contribute something the others cannot.

### Layer 1: Algebraic Geometry — Root Systems & Weyl Chambers

Inspired by **root systems** from Lie algebra — mathematical structures used in theoretical physics to describe symmetry. The key insight:

1. **Root vectors** `r = intent − execution` live in a high-dimensional space
2. **PCA** finds the principal directions of variation ≈ *simple roots*
3. **Sign patterns** relative to these directions define **Weyl chambers**
4. **Reflections** through root direction hyperplanes find complementary information
5. Chambers are non-arbitrary — they have well-defined algebraic adjacency and reflection operations

### Layer 2: Graph Theory — Repository, Interaction & Agent Graphs

Three graphs describe different parts of the operating environment:

**RepoGraph** — code chunks and files are connected through imports, directories, and inferred communities. Selection uses these relationships to expand beyond direct vector similarity and boost structurally important context.

**Interaction Knowledge Graph** — every query-response pair is a node. Edges encode semantic similarity, chamber adjacency, and temporal proximity. Graph traversal retrieves contextually related history that vector similarity misses, capturing multi-hop relational structure in the conversation that linear retrieval cannot access.

**Agent Topology Graph** — agents are nodes and delegation relationships are weighted edges. Each agent accumulates a chamber-performance profile. The current router recommends the agent with the best historical root norm for the query's chamber; the graph retains delegation and specialization data for richer topology-aware routing as the implementation develops.

### Layer 3: Distributed Systems — Verifiable Decentralized Telemetry

Given the same interaction history and numerical implementation, chamber classifications are reproducible from PCA sign patterns. Selection audits are written locally by default. When configured, the Celo contract stores compressed telemetry summaries; ERC-8004 support provides an agent identity and capability-registration path.

### Reference Papers

| Document | Description |
|---|---|
| [**E8 Systems Framework** (version 2)](docs/E8_Systems_Framework_Paper%20(version%202).pdf) | *Algebraic Structures of Collective Consciousness* — root systems, Weyl chambers, and graph-theoretic models of collective intelligence |
| [**E8 AI Architecture**](docs/E8_AI_Architecture_Paper.pdf) | *Root-Structured Intelligence: An E8 Framework for Symmetry-Aware AI* — applied architecture for multi-layer agent context filtering |

Both papers are in [`docs/`](docs/).

---

## Celo Integration

### Why Celo?

RootRouter uses Celo as an optional verification layer because low transaction costs make batched telemetry practical and because its mobile-first ecosystem aligns with MotusDAO's deployment goals. Local telemetry remains the default; using RootRouter does not require a wallet or blockchain connection.

### On-Chain Data

- Chamber classification per interaction
- Root norm (performance metric)
- Model tier used
- Tokens saved
- Graph edge count per session

### ERC-8004 Compatibility

The SDK includes an optional ERC-8004-compatible registration client and agent-card metadata with these capabilities:

- `context-optimization`: Algebraic context filtering
- `model-routing`: Chamber-based model selection
- `telemetry-logging`: Verifiable performance analytics

---

## Tech Stack

- **TypeScript** — core math and graph algorithms implemented in the SDK
- **PCA, K-Means** — implemented with power iteration (no NumPy/sklearn)
- **TF-IDF / MiniLM / BGE-small / API embeddings** — zero-dependency default with optional semantic providers
- **Graph algorithms** — custom knowledge graph and agent topology graph implementations
- **Model Context Protocol** — explicit repository indexing and budgeted selection for agent clients
- **OpenAI-compatible HTTP** — transparent stateful proxy with streaming passthrough
- **ethers.js** — Celo blockchain interaction
- **Solidity** — RootRouterTelemetry contract (`contracts/`)
- **Next.js** — Dashboard for live on-chain telemetry
- **Convex** — Optional real-time topology and graph visualization

---

## Project Structure

Monorepo — **one git repo**, **three npm packages**, **one private web app**:

```
RootRouter/
├── packages/
│   ├── sdk/                 # npm: rootrouter (CLI + library)
│   │   ├── src/             # Context engine, RepoGraph, routing, Celo, CLI
│   │   ├── demo/            # basic, swarm, benchmark
│   │   └── dist/            # Built on publish (not committed)
│   ├── proxy/               # npm: @rootrouter/proxy (automatic HTTP path)
│   └── mcp/                 # npm: @rootrouter/mcp (six stdio tools)
├── apps/
│   └── dashboard/           # Next.js app — NOT on npm (private workspace)
│       ├── app/             # Routes: /, /dashboard, /dashboard/topology
│       ├── public/SKILL.md  # Agent playbook → /SKILL.md on Vercel
│       ├── convex/          # Topology snapshot backend
│       └── Dockerfile       # VPS Docker image (standalone Next.js)
├── contracts/
│   └── RootRouterTelemetry.sol
├── docs/                    # Architecture, benchmarks, playbooks, insights
├── benchmarks/results/      # Committed reproducibility artifacts
├── deploy/                  # VPS, Docker, and Caddy deployment
└── scripts/                 # deploy, setup, legal, and publish helpers
```

### What ships where

| Artifact | In git? | On npm? | Hosted where? |
|----------|---------|---------|---------------|
| `packages/sdk` (`rootrouter`) | Yes | Yes (`npm publish`) | — |
| `packages/proxy` | Yes | Yes | Self-host / Docker |
| `packages/mcp` | Yes | Yes | Cursor / Codex via npx |
| `apps/dashboard` | Yes | **No** (`"private": true`) | [VPS](https://rootrouter.motusdao.org) (`deploy/README.md`) |

The SDK **does not bundle** the dashboard. Its `package.json` `files` field only includes `dist`, `templates`, and legal docs. Demos and `rootrouter snapshot` optionally **POST to** a running dashboard via `DASHBOARD_URL` — that is an HTTP integration, not a package dependency.

**Build commands (from repo root):**

```bash
npm run build              # SDK only → packages/sdk/dist/
npm run build:all          # SDK + proxy + MCP
npm run dashboard:build    # Next.js → apps/dashboard/.next/
npm run publish:packages   # SDK + proxy + MCP only (never dashboard)
```

**Vercel:** optional if repo is public + Pro plan. **Default:** VPS — see [`deploy/README.md`](./deploy/README.md).

**Split repo?** Not required. Keeping the dashboard here shares docs, `SKILL.md`, and release context with the SDK. Split only if you need a separate team, access control, or deploy cadence — the npm boundary already prevents accidental publishing.

---

## Current Status and Roadmap

| Area | Current state | Next work |
|---|---|---|
| **Context selection** | Persistent stores, strict budgets, MMR, path filters, RepoGraph expansion, audit logs | Selection-quality evaluation, stronger turn-to-file links, ANN/index scale |
| **Agent integrations** | Cursor, Codex, Hermes, generic MCP, OpenAI-compatible proxy | Harden OpenClaw deployment and reduce setup friction across runtimes |
| **Proxy** | Stateful recall, streaming passthrough, context meter, lightweight model routing | Full SDK/chamber routing parity and broader regression coverage |
| **Swarm intelligence** | Interaction graph, agent topology, chamber profiles and recommendations | Richer delegation-path and topology-aware routing |
| **Observability** | Local JSON/JSONL evidence, dashboard, optional Convex and Celo telemetry | Unified live context-health and selection-quality views |

See [`docs/NEXT.md`](docs/NEXT.md) for the detailed execution plan and decision log. RootRouter is beta software: interfaces, defaults, and deployment recipes may change before a stable release.

---

## Real-World Usage

[MotusDAO](https://app.motusdao.org) uses RootRouter in internal agent and repository workflows, including per-project Cursor stores and Hermes/proxy integration. The broader goal is an agent routing layer for its Spanish-language mental-health ecosystem; sensitive application data requires separate privacy, consent, and clinical-safety controls beyond RootRouter's context-selection layer.

---

## Team

**Gerry Alvarez** — Independent researcher in systems psychology and applied mathematics. Mexico City. Building [MotusDAO](https://motusdao.org) (decentralized mental health) and the E8 Systems Framework (algebraic and graph-theoretic models of collective intelligence).

---

## License

MIT — see [LICENSE](./LICENSE). Third-party notices in [NOTICE](./NOTICE). Beta terms in [BETA.md](./BETA.md). Future commercial surfaces in [COMMERCIAL.md](./COMMERCIAL.md).
