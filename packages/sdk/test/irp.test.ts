/**
 * IRP suggest-only ranking tests.
 * Run: tsx test/irp.test.ts
 */
import {
  rankCandidates,
  listIrpModels,
  estimateCandidateCostUsd,
  candidateTier,
  estimateMessagesTokens,
  type IrpCandidate,
} from '../src';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function okOrThrow(result: ReturnType<typeof rankCandidates>) {
  if (!result.ok) {
    throw new Error(`Expected success, got ${result.status}: ${result.problem.detail ?? result.problem.title}`);
  }
  return result.ranking;
}

const simpleMessages = [{ role: 'user', content: 'hello world' }];
const baseCandidate: IrpCandidate = {
  id: 'candidate-a',
  model: 'gpt-5.5',
  pricing: { input: 1, output: 2 },
};

function rankRequest(messages: Array<{ role: string; content: unknown }>, candidates: unknown[], extra?: {
  max_tokens?: number;
  cost_quality_tradeoff?: number;
}) {
  return {
    request: { messages, ...(extra?.max_tokens !== undefined ? { max_tokens: extra.max_tokens } : {}) },
    routing: {
      ...(extra?.cost_quality_tradeoff !== undefined
        ? { cost_quality_tradeoff: extra.cost_quality_tradeoff }
        : {}),
      candidates,
    },
  };
}

console.log('\n=== IRP models ===');
const models = listIrpModels();
assert(models.object === 'list', 'models object is a list');
assert(models.data.length === 1, 'models has one entry');
assert(models.data[0].id === '*', 'wildcard model advertised');
assert(models.data[0].object === 'model', 'model object type');
assert(listIrpModels() !== models, 'models returns a fresh object');
console.log('  PASS: wildcard model list');

console.log('\n=== Cost estimation ===');
const inputTokens = estimateMessagesTokens(simpleMessages);
const cost = estimateCandidateCostUsd({
  inputTokens,
  outputTokens: 100,
  candidate: baseCandidate,
});
const expectedCost = (inputTokens / 1_000_000) * 1 + (100 / 1_000_000) * 2;
assert(Math.abs(cost - expectedCost) < 1e-12, 'plain input/output cost');
const cachedCost = estimateCandidateCostUsd({
  inputTokens,
  outputTokens: 100,
  candidate: {
    ...baseCandidate,
    pricing: { input: 10, cache_read: 1, output: 10 },
    expected_usage: { cache_read_tokens: inputTokens },
  },
});
assert(cachedCost < 0.00101, 'cache read reduces the billable input');
console.log('  PASS: cost math and cache-read pricing');

console.log('\n=== Ranking shape ===');
const ranking = okOrThrow(
  rankCandidates(rankRequest(simpleMessages, [baseCandidate], { max_tokens: 100 }), {
    rankingId: 'fixed',
    now: 1_700_000_000_000,
    routerId: 'rootrouter-test',
    routerVersion: '9.9.9',
  })
);
assert(ranking.id === 'rank_fixed', 'deterministic ranking id');
assert(ranking.object === 'routing.ranking', 'object type');
assert(ranking.created === 1_700_000_000, 'unix seconds');
assert(ranking.router.id === 'rootrouter-test', 'router id');
assert(ranking.router.version === '9.9.9', 'router version');
assert(ranking.ranked.length === 1, 'one ranked candidate');
assert(ranking.ranked[0].candidate_id === 'candidate-a', 'candidate id preserved');
assert(ranking.ranked[0].expected_cost_usd > 0, 'positive expected cost');
console.log('  PASS: ranking shape, ids and timestamps');

console.log('\n=== Cost/quality tradeoff ===');
const complexContent =
  'implement typescript function ' + 'x '.repeat(4000);
const complexMessages = [{ role: 'user', content: complexContent }];
const complexTokens = estimateMessagesTokens(complexMessages);
assert(complexTokens > 4000, 'complex prompt exceeds the code threshold');
const cheapFast = {
  id: 'cheap-fast',
  model: 'gpt-4o-mini',
  pricing: { input: 0.15, output: 0.6 },
};
const priceyPowerful = {
  id: 'pricey-powerful',
  model: 'claude-opus-4.6',
  pricing: { input: 15, output: 75 },
};
const qualityFirst = okOrThrow(
  rankCandidates(
    rankRequest(complexMessages, [cheapFast, priceyPowerful], {
      cost_quality_tradeoff: 0,
      max_tokens: 500,
    })
  )
);
assert(qualityFirst.ranked[0].candidate_id === 'pricey-powerful', 'quality-first picks powerful');
const costFirst = okOrThrow(
  rankCandidates(
    rankRequest(complexMessages, [cheapFast, priceyPowerful], {
      cost_quality_tradeoff: 10,
      max_tokens: 500,
    })
  )
);
assert(costFirst.ranked[0].candidate_id === 'cheap-fast', 'cost-first picks cheap');
console.log('  PASS: tradeoff 0 vs 10 changes the winner');

console.log('\n=== Tier heuristics ===');
assert(candidateTier('gpt-4o-mini') === 'fast', 'mini is fast');
assert(candidateTier('qwen3-4b') === 'fast', '4b is fast');
assert(candidateTier('claude-opus-4.6') === 'powerful', 'opus is powerful');
assert(candidateTier('qwen3-235b-a22b-thinking') === 'powerful', 'thinking is powerful');
assert(candidateTier('gpt-5.5') === 'balanced', 'unknown is balanced');
console.log('  PASS: candidate tier heuristics');

console.log('\n=== Validation and dedupe ===');
const deduped = okOrThrow(
  rankCandidates(
    rankRequest(simpleMessages, [
      baseCandidate,
      { ...baseCandidate, model: 'another-model' },
    ])
  )
);
assert(deduped.ranked.length === 1, 'duplicate candidate id is dropped');

const droppedInvalid = okOrThrow(
  rankCandidates(
    rankRequest(simpleMessages, [baseCandidate, { id: 'broken', model: 'no-pricing' }])
  )
);
assert(droppedInvalid.ranked.length === 1, 'candidate without pricing is dropped');

const noScorable = rankCandidates(
  rankRequest(simpleMessages, [{ id: 'broken', model: 'no-pricing' }])
);
assert(!noScorable.ok && noScorable.status === 422, 'all-invalid candidates are a 422');
if (!noScorable.ok) {
  assert(
    noScorable.problem.type === 'urn:irp:problem:no-scorable-candidate',
    'no-scorable-candidate problem type'
  );
}

const malformed = [
  null,
  {},
  { request: { messages: [] }, routing: { candidates: [baseCandidate] } },
  { request: { messages: simpleMessages }, routing: {} },
  rankRequest(simpleMessages, []),
  rankRequest(simpleMessages, [baseCandidate], { cost_quality_tradeoff: 11 }),
  rankRequest(simpleMessages, [baseCandidate], { max_tokens: 0 }),
];
for (const [i, body] of malformed.entries()) {
  const result = rankCandidates(body);
  assert(!result.ok && result.status === 400, `malformed body #${i} is a 400`);
  if (!result.ok) {
    assert(
      result.problem.type === 'urn:irp:problem:invalid-request',
      `malformed body #${i} problem type`
    );
  }
}
console.log('  PASS: 400/422 validation paths');

console.log('\n=== Determinism ===');
const a = okOrThrow(
  rankCandidates(rankRequest(complexMessages, [cheapFast, priceyPowerful], { max_tokens: 500 }), {
    now: 1_700_000_000_000,
    rankingId: 'same',
  })
);
const b = okOrThrow(
  rankCandidates(rankRequest(complexMessages, [cheapFast, priceyPowerful], { max_tokens: 500 }), {
    now: 1_700_000_000_000,
    rankingId: 'same',
  })
);
assert(
  JSON.stringify(a.ranked) === JSON.stringify(b.ranked),
  'same input produces the same ranking'
);
console.log('  PASS: deterministic output');

console.log('\nAll IRP tests passed.\n');
