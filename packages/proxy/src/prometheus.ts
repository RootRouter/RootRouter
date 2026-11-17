import { getContextMeterSnapshot } from './contextMeter.js';
import { exportTopologyJson } from './topologyTracker.js';

let requestCounter = 0;
let errorCounter = 0;
let totalTokensIn = 0;
let totalTokensSaved = 0;
let totalCachedTokens = 0;

export function recordPrometheusRequest(input: {
  tokensBefore: number;
  tokensSaved: number;
  cachedTokens?: number;
  error?: boolean;
}): void {
  requestCounter += 1;
  totalTokensIn += input.tokensBefore;
  totalTokensSaved += input.tokensSaved;
  if (input.cachedTokens) totalCachedTokens += input.cachedTokens;
  if (input.error) errorCounter += 1;
}

export function renderPrometheusMetrics(contextBudget: number, minTokens: number): string {
  const snap = getContextMeterSnapshot({ contextBudget, minTokensToFilter: minTokens });
  const topo = exportTopologyJson();
  const lines = [
    '# HELP rootrouter_requests_total Chat completion requests through proxy',
    '# TYPE rootrouter_requests_total counter',
    `rootrouter_requests_total ${requestCounter}`,
    '# HELP rootrouter_errors_total Upstream or handler errors',
    '# TYPE rootrouter_errors_total counter',
    `rootrouter_errors_total ${errorCounter}`,
    '# HELP rootrouter_tokens_in_total Prompt tokens before trim',
    '# TYPE rootrouter_tokens_in_total counter',
    `rootrouter_tokens_in_total ${totalTokensIn}`,
    '# HELP rootrouter_tokens_saved_total Tokens removed by filter',
    '# TYPE rootrouter_tokens_saved_total counter',
    `rootrouter_tokens_saved_total ${totalTokensSaved}`,
    '# HELP rootrouter_cached_tokens_total Upstream cache-read tokens (when reported)',
    '# TYPE rootrouter_cached_tokens_total counter',
    `rootrouter_cached_tokens_total ${totalCachedTokens}`,
    '# HELP rootrouter_session_requests Session requests since process start',
    '# TYPE rootrouter_session_requests gauge',
    `rootrouter_session_requests ${snap.session.requests}`,
    '# HELP rootrouter_topology_agents Agent nodes observed',
    '# TYPE rootrouter_topology_agents gauge',
    `rootrouter_topology_agents ${topo.nodes.length}`,
  ];
  return lines.join('\n') + '\n';
}