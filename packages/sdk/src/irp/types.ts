/**
 * Inference Routing Protocol (IRP), suggest-only mode.
 *
 * A routing service ranks the buyer's candidate destinations for one user turn.
 * It never runs inference and never receives credentials for the upstream
 * providers. See https://github.com/inference-routing/spec.
 */

export interface IrpMessage {
  role: string;
  content: unknown;
}

/** Prices in USD per 1M tokens. */
export interface IrpPricing {
  input: number;
  cache_read?: number;
  output: number;
}

export interface IrpCandidate {
  id: string;
  model: string;
  pricing: IrpPricing;
  expected_usage?: {
    cache_read_tokens?: number;
  };
}

export interface IrpRankRequest {
  request: {
    messages: IrpMessage[];
    max_tokens?: number;
  };
  routing: {
    /** 0 = best quality, 10 = cheapest acceptable candidate. Default 5. */
    cost_quality_tradeoff?: number;
    candidates: IrpCandidate[];
  };
}

export interface IrpRankedCandidate {
  candidate_id: string;
  expected_cost_usd: number;
}

export interface IrpRanking {
  id: string;
  object: 'routing.ranking';
  /** Unix seconds. */
  created: number;
  router: {
    id: string;
    version: string;
  };
  ranked: IrpRankedCandidate[];
}

export interface IrpModel {
  id: string;
  object: 'model';
}

export interface IrpModelList {
  object: 'list';
  data: IrpModel[];
}

/** RFC 7807-style problem document used by IRP. */
export interface IrpProblem {
  type: string;
  title: string;
  status: number;
  detail?: string;
}

export interface IrpRankSuccess {
  ok: true;
  ranking: IrpRanking;
}

export interface IrpRankFailure {
  ok: false;
  status: 400 | 422;
  problem: IrpProblem;
}

export type IrpRankResult = IrpRankSuccess | IrpRankFailure;
