/**
 * Landing page evidence — keep every number tied to a committed artifact.
 * Baselines and caveats live next to the value, not in a footnote nobody reads.
 */

export type EvidenceMethod = 'audited' | 'simulated' | 'live-api';

export interface EvidenceMetric {
  id: string;
  path: string;
  value: string;
  label: string;
  detail: string;
  method: EvidenceMethod;
  footnote?: string;
}

export const evidenceMetrics: EvidenceMetric[] = [
  {
    id: 'sdk-benchmark',
    path: 'SDK benchmark · offline',
    value: '43.9%',
    label: 'fewer context tokens',
    detail:
      '50-query TF-IDF + simulated-LLM benchmark (seed 42). The same run models 73% lower cost.',
    method: 'simulated',
    footnote: 'Modeled cost at Claude-tier prices, not a billed reduction.',
  },
  {
    id: 'nim-live-api',
    path: 'NVIDIA NIM · live API',
    value: '46%',
    label: 'estimated context saved',
    detail:
      'Swarm profile: 24 steps, 3 agents, real nvidia/nemotron-3-ultra-550b-a55b completions.',
    method: 'live-api',
    footnote: 'Estimated over accumulated history; not an API-billed figure.',
  },
  {
    id: 'mcp-cold-slice',
    path: 'MCP · cold slice',
    value: '95.5%',
    label: 'context tokens saved',
    detail: '~134k indexed-corpus tokens → ~6k selected for a spec-driven slice.',
    method: 'audited',
    footnote: 'Best case for a cold, spec-driven slice; not an every-request result.',
  },
];

export const headline = {
  tokens: '43.9%',
  cost: '73%',
  baseline:
    '50-query SDK benchmark · seed 42 · TF-IDF + simulated LLM · modeled cost at Claude-tier prices, not billed',
};

export const methodLabels: Record<EvidenceMethod, string> = {
  audited: 'Audited',
  simulated: 'Simulated',
  'live-api': 'Live API',
};
