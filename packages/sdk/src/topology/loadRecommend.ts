import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface TopologyRecommendResult {
  agentId: string;
  evidence: string;
}

export function defaultTopologyPath(): string {
  return (
    process.env.ROOTROUTER_TOPOLOGY_PATH?.trim() ||
    path.join(os.homedir(), '.rootrouter', 'proxy-topology.json')
  );
}

export function recommendAgentFromTopologyFile(query: string): TopologyRecommendResult | null {
  const file = defaultTopologyPath();
  if (!fs.existsSync(file)) return null;
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as {
      ranking?: Array<{ agentId: string; interactions?: number; avgNorm?: number }>;
      nodes?: Array<{ agentId: string; requests?: number }>;
    };
    const ranking = parsed.ranking ?? [];
    if (ranking.length > 0) {
      const best = ranking[0];
      return {
        agentId: best.agentId,
        evidence: `topology file; interactions=${best.interactions ?? '?'}; query="${query.slice(0, 60)}"`,
      };
    }
    const nodes = parsed.nodes ?? [];
    if (nodes.length > 0) {
      const top = [...nodes].sort((a, b) => (b.requests ?? 0) - (a.requests ?? 0))[0];
      return {
        agentId: top.agentId,
        evidence: `topology file requests=${top.requests ?? 0}`,
      };
    }
  } catch {
    return null;
  }
  return null;
}