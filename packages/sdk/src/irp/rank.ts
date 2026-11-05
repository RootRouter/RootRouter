import { randomUUID } from 'crypto';
import type { ModelTier } from '../types';
import type { ModelCapability } from '../models/types';
import {
  detectCapabilities,
  estimateMessagesTokens,
  lastUserMessageText,
  type RoutableMessage,
} from '../models';
import type {
  IrpCandidate,
  IrpProblem,
  IrpRankResult,
  IrpRankedCandidate,
} from './types';

export const DEFAULT_MAX_TOKENS = 1024;
export const MAX_OUTPUT_TOKENS = 200_000;
export const MAX_CANDIDATES = 500;
export const MAX_MESSAGES = 2_000;
export const DEFAULT_COST_QUALITY_TRADEOFF = 5;
export const DEFAULT_ROUTER_ID = 'rootrouter';

const TIER_RANK: Record<ModelTier, number> = { fast: 0, balanced: 1, powerful: 2 };

/** Cheap heuristics: model names are the only signal IRP gives us per candidate. */
const FAST_MODEL_RE =
  /(mini|nano|flash|haiku|small|lite|turbo|\b[1-9]b\b|\b1[0-9]b\b)/;
const POWERFUL_MODEL_RE =
  /(opus|ultra|large|\bmax\b|pro\b|70b|72b|120b|235b|405b|550b|reason|think|r1\b|o3\b|o4\b)/;
const NOT_FAST_RE = /(reason|think|r1\b|o3\b|o4\b|opus|ultra)/;

const CAPABILITY_RE: Record<Exclude<ModelCapability, 'embedding'>, RegExp> = {
  chat: /.*/,
  vision: /(vision|vl\b|multimodal|gemini|gpt-4o|claude|llava)/,
  code: /(code|coder|deepseek|qwen|glm|starcoder|codestral|swe)/,
  reasoning: /(reason|think|r1\b|o3\b|o4\b|qwq|deepseek-r)/,
  'long-context': /(long|128k|200k|1m)/,
};

export interface RankCandidatesOptions {
  routerId?: string;
  routerVersion?: string;
  now?: number;
  defaultMaxTokens?: number;
  /** Deterministic ranking id, used by tests. */
  rankingId?: string;
}

interface ParsedRank {
  messages: RoutableMessage[];
  maxTokens: number;
  tradeoff: number;
  candidates: IrpCandidate[];
}

interface ParseFailure {
  ok: false;
  status: 400 | 422;
  problem: IrpProblem;
}

function problem(status: number, type: string, title: string, detail?: string): IrpProblem {
  return { type, title, status, ...(detail ? { detail } : {}) };
}

function invalid(detail: string): ParseFailure {
  return {
    ok: false,
    status: 400,
    problem: problem(400, 'urn:irp:problem:invalid-request', 'Invalid request', detail),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonNegativeFinite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

function parseRankRequest(input: unknown): { ok: true; value: ParsedRank } | ParseFailure {
  if (!isRecord(input)) return invalid('Body must be a JSON object.');

  const request = input.request;
  if (!isRecord(request)) return invalid('`request` must be an object.');
  const messages = request.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return invalid('`request.messages` must be a non-empty array.');
  }
  if (messages.length > MAX_MESSAGES) {
    return invalid(`\`request.messages\` exceeds ${MAX_MESSAGES} entries.`);
  }
  for (const [i, message] of messages.entries()) {
    if (!isRecord(message) || typeof message.role !== 'string' || message.role.length === 0) {
      return invalid(`\`request.messages[${i}].role\` must be a non-empty string.`);
    }
  }

  let maxTokens = DEFAULT_MAX_TOKENS;
  if (request.max_tokens !== undefined) {
    if (
      typeof request.max_tokens !== 'number' ||
      !Number.isInteger(request.max_tokens) ||
      request.max_tokens <= 0 ||
      request.max_tokens > MAX_OUTPUT_TOKENS
    ) {
      return invalid(`\`request.max_tokens\` must be an integer between 1 and ${MAX_OUTPUT_TOKENS}.`);
    }
    maxTokens = request.max_tokens;
  }

  const routing = input.routing;
  if (!isRecord(routing)) return invalid('`routing` must be an object.');

  let tradeoff = DEFAULT_COST_QUALITY_TRADEOFF;
  if (routing.cost_quality_tradeoff !== undefined) {
    const value = routing.cost_quality_tradeoff;
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 10) {
      return invalid('`routing.cost_quality_tradeoff` must be an integer between 0 and 10.');
    }
    tradeoff = value;
  }

  const rawCandidates = routing.candidates;
  if (!Array.isArray(rawCandidates) || rawCandidates.length === 0) {
    return invalid('`routing.candidates` must be a non-empty array.');
  }
  if (rawCandidates.length > MAX_CANDIDATES) {
    return invalid(`\`routing.candidates\` exceeds ${MAX_CANDIDATES} entries.`);
  }

  // Malformed candidates are dropped: one bad entry should not fail the turn.
  const byId = new Map<string, IrpCandidate>();
  for (const raw of rawCandidates) {
    if (!isRecord(raw)) continue;
    const id = raw.id;
    const model = raw.model;
    const pricing = raw.pricing;
    if (typeof id !== 'string' || id.length === 0 || id.length > 256) continue;
    if (typeof model !== 'string' || model.length === 0) continue;
    if (!isRecord(pricing)) continue;
    if (!isNonNegativeFinite(pricing.input) || !isNonNegativeFinite(pricing.output)) continue;
    if (pricing.cache_read !== undefined && !isNonNegativeFinite(pricing.cache_read)) continue;

    let cacheReadTokens = 0;
    const expected = raw.expected_usage;
    if (isRecord(expected) && expected.cache_read_tokens !== undefined) {
      if (!isNonNegativeFinite(expected.cache_read_tokens)) continue;
      cacheReadTokens = expected.cache_read_tokens;
    }

    if (byId.has(id)) continue;
    byId.set(id, {
      id,
      model,
      pricing: {
        input: pricing.input,
        output: pricing.output,
        ...(pricing.cache_read !== undefined ? { cache_read: pricing.cache_read } : {}),
      },
      ...(cacheReadTokens > 0
        ? { expected_usage: { cache_read_tokens: cacheReadTokens } }
        : {}),
    });
  }

  if (byId.size === 0) {
    return {
      ok: false,
      status: 422,
      problem: problem(
        422,
        'urn:irp:problem:no-scorable-candidate',
        'No scorable candidate',
        'No candidate had a usable id, model and pricing.'
      ),
    };
  }

  return {
    ok: true,
    value: {
      messages: messages as RoutableMessage[],
      maxTokens,
      tradeoff,
      candidates: Array.from(byId.values()),
    },
  };
}

/** Task difficulty estimate: same heuristics used by the lightweight proxy router. */
export function requiredTier(
  messages: RoutableMessage[],
  contextTokens: number,
  capabilities: ModelCapability[]
): ModelTier {
  const queryLength = lastUserMessageText(messages).length;
  if (capabilities.includes('long-context')) return 'powerful';
  if (capabilities.includes('reasoning') && contextTokens > 3_000) return 'powerful';
  if (capabilities.includes('code') && contextTokens > 4_000) return 'powerful';
  if (contextTokens > 12_000 || queryLength > 2_000) return 'powerful';
  if (
    contextTokens < 1_500 &&
    queryLength < 200 &&
    !capabilities.includes('vision') &&
    !capabilities.includes('code')
  ) {
    return 'fast';
  }
  if (contextTokens < 800 && queryLength < 80) return 'fast';
  return 'balanced';
}

/** Infer a candidate tier from its model name. Heuristic and documented as such. */
export function candidateTier(model: string): ModelTier {
  const name = model.toLowerCase();
  if (FAST_MODEL_RE.test(name) && !NOT_FAST_RE.test(name)) return 'fast';
  if (POWERFUL_MODEL_RE.test(name)) return 'powerful';
  return 'balanced';
}

function capabilityFit(capabilities: ModelCapability[], model: string): number {
  const name = model.toLowerCase();
  const required = capabilities.filter(
    (capability) => capability !== 'chat' && capability !== 'embedding'
  );
  if (required.length === 0) return 1;
  const matched = required.filter((capability) =>
    CAPABILITY_RE[capability as Exclude<ModelCapability, 'embedding'>].test(name)
  ).length;
  return matched / required.length;
}

/** 0 = poor fit for the detected task, 1 = best fit. */
export function qualityFit(
  required: ModelTier,
  capabilities: ModelCapability[],
  model: string
): number {
  const tier = candidateTier(model);
  const tierFit = 1 - Math.abs(TIER_RANK[required] - TIER_RANK[tier]) / 2;
  return 0.7 * tierFit + 0.3 * capabilityFit(capabilities, model);
}

export function estimateCandidateCostUsd(params: {
  inputTokens: number;
  outputTokens: number;
  candidate: IrpCandidate;
}): number {
  const { inputTokens, outputTokens, candidate } = params;
  const cacheRead = Math.min(
    Math.max(0, candidate.expected_usage?.cache_read_tokens ?? 0),
    inputTokens
  );
  const billableInput = Math.max(0, inputTokens - cacheRead);
  const cachePrice = candidate.pricing.cache_read ?? candidate.pricing.input;
  return (
    (billableInput / 1_000_000) * candidate.pricing.input +
    (cacheRead / 1_000_000) * cachePrice +
    (outputTokens / 1_000_000) * candidate.pricing.output
  );
}

function roundCost(value: number): number {
  return Math.round(value * 1e8) / 1e8;
}

/**
 * Rank the buyer's candidates for one turn.
 *
 * Pure function: no I/O, no persistence, no outbound calls. The caller (HTTP
 * server) is responsible for transport and auth.
 */
export function rankCandidates(
  input: unknown,
  options: RankCandidatesOptions = {}
): IrpRankResult {
  const parsed = parseRankRequest(input);
  if (!parsed.ok) {
    return { ok: false, status: parsed.status, problem: parsed.problem };
  }

  const { messages, maxTokens, tradeoff, candidates } = parsed.value;
  const inputTokens = estimateMessagesTokens(messages);
  const capabilities = detectCapabilities(messages, inputTokens);
  const required = requiredTier(messages, inputTokens, capabilities);

  const scored = candidates.map((candidate) => {
    const cost = estimateCandidateCostUsd({
      inputTokens,
      outputTokens: maxTokens,
      candidate,
    });
    const quality = qualityFit(required, capabilities, candidate.model);
    return { candidate, cost, quality };
  });

  const costs = scored.map((entry) => entry.cost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);
  const span = maxCost - minCost;

  // 0 focuses on quality fit, 10 focuses on cost. Both signals keep a floor so
  // neither extreme degenerates into ignoring the other side completely.
  const costWeight = 0.05 + 0.9 * (tradeoff / 10);
  const qualityWeight = 1 - costWeight;

  const ranked: IrpRankedCandidate[] = scored
    .map((entry) => {
      const normalizedCost = span > 0 ? (entry.cost - minCost) / span : 0;
      const score =
        costWeight * normalizedCost + qualityWeight * (1 - entry.quality);
      return { id: entry.candidate.id, cost: entry.cost, score };
    })
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (a.cost !== b.cost) return a.cost - b.cost;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    })
    .map((entry) => ({
      candidate_id: entry.id,
      expected_cost_usd: roundCost(entry.cost),
    }));

  return {
    ok: true,
    ranking: {
      id: `rank_${options.rankingId ?? randomUUID()}`,
      object: 'routing.ranking',
      created: Math.floor((options.now ?? Date.now()) / 1000),
      router: {
        id: options.routerId ?? DEFAULT_ROUTER_ID,
        version: options.routerVersion ?? '0.0.0',
      },
      ranked,
    },
  };
}
