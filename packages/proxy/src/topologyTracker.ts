import { AgentTopologyGraph } from 'rootrouter';
const graph = new AgentTopologyGraph();

export function initTopologyFromSnapshot(
  ranking: Array<{ agentId: string }> | undefined
): void {
  if (!ranking) return;
  for (const row of ranking) graph.registerAgent(row.agentId);
}

export interface AgentRequestStat {
  agentId: string;
  requests: number;
  tokensIn: number;
  tokensSaved: number;
  errors: number;
  lastModel?: string;
}

const stats = new Map<string, AgentRequestStat>();

function rollup(agentId: string): AgentRequestStat {
  let row = stats.get(agentId);
  if (!row) {
    row = { agentId, requests: 0, tokensIn: 0, tokensSaved: 0, errors: 0 };
    stats.set(agentId, row);
  }
  return row;
}

export function recordTopologyRequest(input: {
  agentId: string;
  delegatedFrom?: string;
  tokensBefore: number;
  tokensSaved: number;
  model?: string;
  error?: boolean;
}): void {
  const row = rollup(input.agentId);
  row.requests += 1;
  row.tokensIn += input.tokensBefore;
  row.tokensSaved += input.tokensSaved;
  if (input.model) row.lastModel = input.model;
  if (input.error) row.errors += 1;

  graph.registerAgent(input.agentId);
  if (input.delegatedFrom) {
    const stub = {
      id: `proxy-${Date.now()}`,
      timestamp: Date.now(),
      agentId: input.agentId,
      modelUsed: input.model ?? 'unknown',
      query: '',
      response: '',
      intentVector: [0],
      executionVector: [0],
      rootVector: [0],
      rootNorm: 0.5,
      inputTokens: input.tokensBefore,
      outputTokens: 0,
      totalTokens: input.tokensBefore,
      estimatedCostUsd: 0,
      latencyMs: 0,
      chamberId: null,
      graphNodeId: null,
    };
    graph.recordDelegation(input.delegatedFrom, input.agentId, stub);
  }
}

export function exportTopologyJson(): {
  nodes: AgentRequestStat[];
  ranking: ReturnType<AgentTopologyGraph['getAgentRanking']>;
  delegations: ReturnType<AgentTopologyGraph['exportForSnapshot']>;
} {
  return {
    nodes: [...stats.values()].sort((a, b) => a.agentId.localeCompare(b.agentId)),
    ranking: graph.getAgentRanking(),
    delegations: graph.exportForSnapshot(),
  };
}

export function recommendAgentForQuery(query: string): { agentId: string; evidence: string } {
  const ranking = graph.getAgentRanking();
  if (ranking.length === 0) {
    return { agentId: 'default', evidence: 'no history' };
  }
  const best = ranking[0];
  return {
    agentId: best.agentId,
    evidence: `lowest avg root norm proxy proxy-tracked; interactions=${best.interactions}`,
  };
}