#!/usr/bin/env node
/**
 * RootRouter MCP server.
 *
 * Exposes RootRouter's context-selection engine over the Model Context Protocol so any
 * MCP client (Codex, Cursor, OpenClaw, Hermes, ...) can:
 *   - record_context: stash candidate context (file chunks, prior turns, tool output)
 *   - select_context: get back the minimal relevant slice within a token budget
 *   - select_for_spec: one-call selection from ROOTROUTER_ACTIVE_SPEC / spec path
 *   - stats: inspect store size and cumulative token savings
 *   - list_selections: read persistent audit log of past selections
 *
 * State is persisted to a JSON file (ROOTROUTER_STORE_PATH, default ~/.rootrouter/store.json)
 * so it survives the per-session process lifecycle that MCP hosts use.
 */
import * as os from 'os';
import * as path from 'path';
import { randomUUID } from 'crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  ContextEngine,
  FileContextStore,
  buildEmbeddingProviderFromEnv,
  buildSelectionFromSpec,
  indexRepo,
  listSelectionAudit,
  recommendAgentFromTopologyFile,
  resolveActiveSpecPath,
  summarizeSelectionAudit,
  type ContextItem,
  type SelectionBaseline,
  type SelectionResult,
} from 'rootrouter';

function resolveStorePath(): string {
  const fromEnv = process.env.ROOTROUTER_STORE_PATH;
  if (fromEnv && fromEnv.trim()) return fromEnv;
  return path.join(os.homedir(), '.rootrouter', 'store.json');
}

/** Project agent scope from init cursor/codex; falls back to legacy "repo". */
function resolveDefaultAgentId(): string {
  const fromEnv = process.env.ROOTROUTER_DEFAULT_AGENT_ID?.trim();
  return fromEnv || 'repo';
}

function buildEngine(): ContextEngine {
  const store = new FileContextStore({
    filePath: resolveStorePath(),
    maxItems: Number(process.env.ROOTROUTER_MAX_ITEMS ?? 0) || undefined,
  });
  return new ContextEngine({
    store,
    provider: buildEmbeddingProviderFromEnv(),
    useChambers: (process.env.ROOTROUTER_USE_CHAMBERS ?? 'false').toLowerCase() === 'true',
  });
}

const engine = buildEngine();
const defaultAgentId = resolveDefaultAgentId();

function pointerForItem(item: ContextItem): {
  pointer: string;
  preview: string;
  path: string | null;
  startLine: number | null;
  endLine: number | null;
} {
  const meta = item.metadata as {
    path?: string;
    startLine?: number;
    endLine?: number;
  };
  const header = item.text.match(/^\/\/ ([^:]+):(\d+)-(\d+)/);
  const path = meta?.path ?? (header ? header[1] : null);
  const startLine = meta?.startLine ?? (header ? Number(header[2]) : null);
  const endLine = meta?.endLine ?? (header ? Number(header[3]) : null);
  const body = item.text.replace(/^\/\/[^\n]+\n/, '');
  const preview =
    body
      .split('\n')
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? '';
  const pointer =
    path && startLine != null && endLine != null
      ? `${path}:${startLine}-${endLine}`
      : item.id;
  return { pointer, preview: preview.slice(0, 160), path, startLine, endLine };
}

function defaultTokenBudget(): number {
  const spec = resolveActiveSpecPath();
  if (spec) return Number(process.env.ROOTROUTER_ACTIVE_SPEC_BUDGET ?? 4000);
  return Number(process.env.ROOTROUTER_POINTER_BUDGET ?? 2000);
}

function formatSelectionResponse(
  result: SelectionResult,
  extraHeader?: string,
  mode: 'pointers' | 'full' = 'pointers'
) {
  const header =
    (extraHeader ? `${extraHeader}\n` : '') +
    `Selected ${result.selected.length} item(s), ${result.tokensOut} tokens ` +
    `(saved ${result.tokensSaved} tokens, ${result.percentSaved.toFixed(1)}% vs baseline).`;

  if (mode === 'pointers') {
    const lines = result.selected.map((item, i) => {
      const score = result.scores[item.id]?.relevance ?? 0;
      const { pointer, preview } = pointerForItem(item);
      return `${i + 1}. ${pointer} score=${score.toFixed(3)} | ${preview}`;
    });
    const text =
      result.selected.length > 0
        ? `${header}\nmode=pointers\n\n${lines.join('\n')}`
        : `${header}\n\n(no context recorded yet)`;
    return {
      content: [{ type: 'text' as const, text }],
      structuredContent: {
        mode: 'pointers',
        selected: result.selected.map((item) => {
          const score = result.scores[item.id]?.relevance ?? 0;
          const p = pointerForItem(item);
          return { ...p, id: item.id, kind: item.kind ?? null, relevance: score };
        }),
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut,
        tokensSaved: result.tokensSaved,
        percentSaved: result.percentSaved,
        reasoning: result.reasoning,
        breakdown: result.breakdown,
      },
    };
  }

  const formatted = result.selected
    .map((item, i) => {
      const score = result.scores[item.id]?.relevance ?? 0;
      const tag = item.kind ? `[${item.kind}]` : '';
      return `--- #${i + 1} ${tag} (id=${item.id}, relevance=${score.toFixed(3)}) ---\n${item.text}`;
    })
    .join('\n\n');

  return {
    content: [
      {
        type: 'text' as const,
        text: result.selected.length > 0 ? `${header}\n\n${formatted}` : `${header}\n\n(no context recorded yet)`,
      },
    ],
    structuredContent: {
      mode: 'full',
      selected: result.selected.map((item) => ({
        id: item.id,
        text: item.text,
        kind: item.kind ?? null,
        relevance: result.scores[item.id]?.relevance ?? 0,
      })),
      tokensIn: result.tokensIn,
      tokensOut: result.tokensOut,
      tokensSaved: result.tokensSaved,
      percentSaved: result.percentSaved,
      reasoning: result.reasoning,
      breakdown: result.breakdown,
    },
  };
}

const server = new McpServer({
  name: 'rootrouter',
  version: '0.2.0-beta.1',
});

// ─── record_context ───
server.registerTool(
  'record_context',
  {
    title: 'Record context',
    description: 'Persist context chunks for later select_context.',
    inputSchema: {
      items: z
        .array(
          z.object({
            id: z.string().optional().describe('Stable id; auto-generated if omitted'),
            text: z.string().describe('The context text'),
            kind: z.enum(['message', 'file', 'tool_result', 'doc']).optional(),
            agentId: z.string().optional().describe('Owning agent, used to scope retrieval'),
            metadata: z.record(z.string(), z.unknown()).optional(),
          })
        )
        .describe('Context items to record'),
    },
  },
  async ({ items }) => {
    const toRecord: ContextItem[] = items.map((it) => ({
      id: it.id ?? randomUUID(),
      text: it.text,
      kind: it.kind,
      agentId: it.agentId ?? defaultAgentId,
      metadata: it.metadata as Record<string, unknown> | undefined,
      timestamp: Date.now(),
    }));
    engine.record(toRecord);
    await engine.save();
    const stats = engine.stats();
    return {
      content: [
        {
          type: 'text',
          text: `Recorded ${toRecord.length} item(s). Store now holds ${stats.items} item(s).`,
        },
      ],
      structuredContent: { recorded: toRecord.length, totalItems: stats.items },
    };
  }
);

// ─── index_repo ───
server.registerTool(
  'index_repo',
  {
    title: 'Index repository',
    description: 'Index a repo once per cold slice; builds RepoGraph chunks in the store.',
    inputSchema: {
      path: z.string().describe('Absolute or relative path to the repository root'),
      agentId: z.string().optional().describe('Agent id scope for indexed chunks (default ROOTROUTER_DEFAULT_AGENT_ID or "repo")'),
    },
  },
  async ({ path: repoPath, agentId }) => {
    const result = indexRepo({ rootPath: repoPath, agentId: agentId ?? defaultAgentId });
    engine.record(result.items);
    await engine.save();
    const stats = engine.stats();
    return {
      content: [
        {
          type: 'text',
          text:
            `Indexed ${result.stats.chunksIndexed} chunks from ${result.stats.filesScanned} files ` +
            `(${result.stats.edgesCreated} edges, ${result.stats.communities} communities). ` +
            `Store now holds ${stats.items} item(s). agentId=${agentId ?? defaultAgentId}`,
        },
      ],
      structuredContent: { ...result.stats, storeItems: stats.items, agentId: agentId ?? defaultAgentId },
    };
  }
);

// ─── select_context ───
server.registerTool(
  'select_context',
  {
    title: 'Select context',
    description: 'Budgeted context slice for a shaped query; default mode=pointers (path:lines, no full text).',
    inputSchema: {
      query: z.string().describe(
        'Task query: slice + acceptance criteria + module + anchor file names (not "read everything")'
      ),
      mode: z
        .enum(['pointers', 'full'])
        .optional()
        .describe('pointers (default): paths only; full: inline chunk text'),
      tokenBudget: z.number().int().positive().optional().describe('Max tokens (default 2000, 4000 with active spec)'),
      agentId: z.string().optional().describe('Restrict to this agent\'s recorded items'),
      mmrLambda: z.number().min(0).max(1).optional().describe('Relevance vs diversity trade-off (default 0.7)'),
      baseline: z.enum(['all', 'window']).optional().describe('Savings baseline (default all)'),
      pathPrefix: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .describe('Keep file chunks under these repo-relative path prefixes (e.g. "apps/academy")'),
      excludePaths: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .describe('Drop file chunks under these prefixes (e.g. "apps/waap")'),
    },
  },
  async ({ query, mode, tokenBudget, agentId, mmrLambda, baseline, pathPrefix, excludePaths }) => {
    const result = await engine.select(query, {
      tokenBudget: tokenBudget ?? defaultTokenBudget(),
      agentId: agentId ?? defaultAgentId,
      mmrLambda,
      baseline: baseline as SelectionBaseline | undefined,
      pathPrefix,
      excludePaths,
    });
    await engine.save();

    const effectiveMode = mode ?? (resolveActiveSpecPath() ? 'full' : 'pointers');
    return formatSelectionResponse(result, undefined, effectiveMode);
  }
);

// ─── select_for_spec ───
server.registerTool(
  'select_for_spec',
  {
    title: 'Select context for active spec',
    description: 'Build query from active spec file and select context (default budget 4000).',
    inputSchema: {
      specPath: z
        .string()
        .optional()
        .describe('Path to spec markdown; defaults to ROOTROUTER_ACTIVE_SPEC or MOTUS_ACTIVE_SPEC env'),
      mode: z.enum(['pointers', 'full']).optional().describe('Default full when spec-driven'),
      tokenBudget: z.number().int().positive().optional().describe('Max tokens (default 4000)'),
      agentId: z.string().optional().describe('Restrict to this agent\'s recorded items'),
      pathPrefix: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .describe('Override inferred path prefix from spec anchor files'),
      excludePaths: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .describe('Drop file chunks under these prefixes'),
      useInferredPathPrefix: z
        .boolean()
        .optional()
        .describe('Apply pathPrefix inferred from spec anchors (default true)'),
    },
  },
  async ({ specPath, mode, tokenBudget, agentId, pathPrefix, excludePaths, useInferredPathPrefix }) => {
    const resolvedSpec = resolveActiveSpecPath(specPath);
    if (!resolvedSpec) {
      return {
        content: [
          {
            type: 'text',
            text:
              'No spec path: pass specPath or set ROOTROUTER_ACTIVE_SPEC (or MOTUS_ACTIVE_SPEC) in MCP env.',
          },
        ],
        isError: true,
      };
    }

    const hints = buildSelectionFromSpec(resolvedSpec);
    const applyPrefix = useInferredPathPrefix !== false;
    const effectivePrefix =
      pathPrefix ?? (applyPrefix && hints.pathPrefix ? hints.pathPrefix : undefined);

    const result = await engine.select(hints.query, {
      tokenBudget: tokenBudget ?? 4000,
      agentId: agentId ?? defaultAgentId,
      pathPrefix: effectivePrefix,
      excludePaths,
      specPaths: hints.specPaths,
    });
    await engine.save();

    const header =
      `Spec: ${hints.specPath}\n` +
      `Query: ${hints.query}\n` +
      (effectivePrefix ? `pathPrefix: ${effectivePrefix}\n` : '') +
      `Anchors: ${hints.specPaths.length}`;

    const effectiveMode = mode ?? 'full';
    const formatted = formatSelectionResponse(result, header, effectiveMode);
    return {
      ...formatted,
      structuredContent: {
        ...formatted.structuredContent,
        specPath: hints.specPath,
        query: hints.query,
        pathPrefix: effectivePrefix ?? null,
        anchorPaths: hints.specPaths,
        title: hints.parsed.title,
        acceptanceCriteria: hints.parsed.acceptanceCriteria,
      },
    };
  }
);

// ─── stats ───
server.registerTool(
  'stats',
  {
    title: 'RootRouter stats',
    description: 'Cumulative store + selection audit summary.',
    inputSchema: {},
  },
  async () => {
    const s = engine.stats();
    const audit = summarizeSelectionAudit();
    const last = listSelectionAudit({ limit: 1 })[0];
    return {
      content: [
        {
          type: 'text',
          text:
            `Items: ${s.items}\nSelections served: ${s.selections}\n` +
            `Total tokens saved: ${s.totalTokensSaved}\n` +
            `Audit log entries: ${audit.totalEntries} (${audit.logPath})\n` +
            (last
              ? `Last selection: saved ${last.tokensSaved} tokens (${last.percentSaved.toFixed(1)}%) — "${last.query.slice(0, 80)}${last.query.length > 80 ? '…' : ''}"\n`
              : '') +
            `Chambers: ${s.chambersEnabled ? (s.chambersFitted ? 'enabled, fitted' : 'enabled, not yet fitted') : 'disabled'}`,
        },
      ],
      structuredContent: {
        ...s,
        auditLogPath: audit.logPath,
        auditEntries: audit.totalEntries,
        auditTotalTokensSaved: audit.totalTokensSaved,
        lastSelection: last ?? null,
      },
    };
  }
);

// ─── recommend_agent ───
server.registerTool(
  'recommend_agent',
  {
    title: 'Recommend agent',
    description: 'Suggest agent id with best proxy topology history for a task query.',
    inputSchema: {
      query: z.string().describe('Task-shaped query'),
    },
  },
  async ({ query }) => {
    const fromTopo = recommendAgentFromTopologyFile(query);
    const rec =
      fromTopo ?? {
        agentId: defaultAgentId,
        evidence: `fallback MCP scope; store items=${engine.stats().items}`,
      };
    return {
      content: [{ type: 'text', text: `${rec.agentId} — ${rec.evidence}` }],
      structuredContent: { ...rec },
    };
  }
);

// ─── list_selections ───
server.registerTool(
  'list_selections',
  {
    title: 'List selection audit',
    description: 'Recent select_context audit entries from selections.jsonl.',
    inputSchema: {
      limit: z.number().int().positive().optional().describe('Max entries to return (default 20, max 100)'),
      agentId: z.string().optional().describe('Filter to this agent scope'),
      since: z.number().int().optional().describe('Only entries at or after this Unix ms timestamp'),
    },
  },
  async ({ limit, agentId, since }) => {
    const cap = Math.min(limit ?? 20, 100);
    const entries = listSelectionAudit({ limit: cap, agentId, since });
    const summary = summarizeSelectionAudit({ agentId, since });

    const lines =
      entries.length === 0
        ? '(no selections logged yet)'
        : entries
            .map((e, i) => {
              const when = new Date(e.ts).toISOString();
              const agent = e.agentId ?? 'default';
              const q =
                e.query.length > 100 ? `${e.query.slice(0, 97)}...` : e.query;
              return (
                `${i + 1}. ${when} | agent=${agent} | saved=${e.tokensSaved} (${e.percentSaved.toFixed(1)}%) | ` +
                `out=${e.tokensOut} | ${q}`
              );
            })
            .join('\n');

    return {
      content: [
        {
          type: 'text',
          text:
            `Audit log: ${summary.logPath}\n` +
            `Entries: ${summary.totalEntries} | Total saved: ${summary.totalTokensSaved}\n\n` +
            lines,
        },
      ],
      structuredContent: { summary, entries },
    };
  }
);

async function main() {
  await engine.load();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Log to stderr so we don't corrupt the stdio JSON-RPC channel.
  console.error(`[rootrouter-mcp] ready. store=${resolveStorePath()}`);
  const activeSpec = resolveActiveSpecPath();
  if (activeSpec) {
    console.error(`[rootrouter-mcp] active spec=${activeSpec}`);
  }
}

main().catch((err) => {
  console.error('[rootrouter-mcp] fatal:', err);
  process.exit(1);
});
