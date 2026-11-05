/**
 * HTTP tests for the IRP suggest-only routing service.
 * Run: tsx test/irpServer.test.ts
 */
import type { AddressInfo } from 'net';
import { createIrpServer } from '../src/irp/server.js';

const API_KEY = 'test-key';
let failed = 0;

function check(condition: boolean, name: string): void {
  if (condition) {
    console.log(`  PASS: ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL: ${name}`);
  }
}

async function listen(server: ReturnType<typeof createIrpServer>): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return `http://127.0.0.1:${port}`;
}

async function close(server: ReturnType<typeof createIrpServer>): Promise<void> {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

const rankBody = JSON.stringify({
  request: {
    messages: [{ role: 'user', content: 'hello world' }],
    max_tokens: 100,
  },
  routing: {
    cost_quality_tradeoff: 5,
    candidates: [
      { id: 'pricey', model: 'claude-opus-4.6', pricing: { input: 15, output: 75 } },
      { id: 'cheap', model: 'gpt-4o-mini', pricing: { input: 0.15, output: 0.6 } },
    ],
  },
});

async function main(): Promise<void> {
  const server = createIrpServer({
    apiKey: API_KEY,
    routerVersion: '9.9.9',
    now: () => 1_700_000_000_000,
  });
  const base = await listen(server);

  console.log('\n=== Health ===');
  const health = await fetch(`${base}/healthz`);
  const healthBody = (await health.json()) as Record<string, unknown>;
  check(health.status === 200, 'healthz returns 200');
  check(healthBody.service === 'rootrouter-irp', 'healthz names the service');

  console.log('\n=== Auth ===');
  const noAuth = await fetch(`${base}/v1/routing/models`);
  check(noAuth.status === 401, 'models without token is 401');
  check(
    (noAuth.headers.get('content-type') ?? '').includes('application/problem+json'),
    '401 is a problem document'
  );
  const noAuthBody = (await noAuth.json()) as Record<string, unknown>;
  check(
    noAuthBody.type === 'urn:irp:problem:unauthorized',
    '401 problem type is unauthorized'
  );
  const wrongKey = await fetch(`${base}/v1/routing/models`, {
    headers: { authorization: 'Bearer nope' },
  });
  check(wrongKey.status === 401, 'wrong token is 401');

  console.log('\n=== Models ===');
  const models = await fetch(`${base}/v1/routing/models`, {
    headers: { authorization: `Bearer ${API_KEY}` },
  });
  const modelsBody = (await models.json()) as { object?: string; data?: Array<{ id?: string }> };
  check(models.status === 200, 'models with token is 200');
  check(modelsBody.object === 'list', 'models object is a list');
  check(modelsBody.data?.[0]?.id === '*', 'wildcard model advertised');
  check(models.headers.get('cache-control') === 'no-store', 'models are not cached');

  console.log('\n=== Rank ===');
  const rank = await fetch(`${base}/v1/routing/rank`, {
    method: 'POST',
    headers: { authorization: `Bearer ${API_KEY}`, 'content-type': 'application/json' },
    body: rankBody,
  });
  const ranking = (await rank.json()) as {
    object?: string;
    created?: number;
    router?: { id?: string; version?: string };
    ranked?: Array<{ candidate_id?: string; expected_cost_usd?: number }>;
  };
  check(rank.status === 200, 'rank returns 200');
  check(ranking.object === 'routing.ranking', 'rank returns a routing.ranking');
  check((ranking.ranked?.length ?? 0) === 2, 'rank returns every scorable candidate');
  check(ranking.created === 1_700_000_000, 'rank uses the server clock');
  check(ranking.router?.version === '9.9.9', 'rank reports the server version');
  check(
    typeof ranking.ranked?.[0]?.expected_cost_usd === 'number',
    'ranked entries carry expected_cost_usd'
  );
  check(rank.headers.get('cache-control') === 'no-store', 'rankings are not cached');

  const rankNoAuth = await fetch(`${base}/v1/routing/rank`, { method: 'POST', body: rankBody });
  check(rankNoAuth.status === 401, 'rank without token is 401');

  console.log('\n=== Errors ===');
  const badJson = await fetch(`${base}/v1/routing/rank`, {
    method: 'POST',
    headers: { authorization: `Bearer ${API_KEY}`, 'content-type': 'application/json' },
    body: '{not json',
  });
  const badJsonBody = (await badJson.json()) as Record<string, unknown>;
  check(badJson.status === 400, 'invalid JSON is 400');
  check(
    badJsonBody.type === 'urn:irp:problem:invalid-request',
    'invalid JSON problem type'
  );

  const empty = await fetch(`${base}/v1/routing/rank`, {
    method: 'POST',
    headers: { authorization: `Bearer ${API_KEY}` },
    body: '',
  });
  check(empty.status === 400, 'empty body is 400');

  const unscorable = await fetch(`${base}/v1/routing/rank`, {
    method: 'POST',
    headers: { authorization: `Bearer ${API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      request: { messages: [{ role: 'user', content: 'hi' }] },
      routing: { candidates: [{ id: 'x', model: 'y' }] },
    }),
  });
  const unscorableBody = (await unscorable.json()) as Record<string, unknown>;
  check(unscorable.status === 422, 'no scorable candidate is 422');
  check(
    unscorableBody.type === 'urn:irp:problem:no-scorable-candidate',
    '422 problem type'
  );

  const notFound = await fetch(`${base}/v1/unknown`, {
    headers: { authorization: `Bearer ${API_KEY}` },
  });
  check(notFound.status === 404, 'unknown path is 404');

  console.log('\n=== Body limit ===');
  const smallServer = createIrpServer({ apiKey: API_KEY, maxBodyBytes: 128 });
  const smallBase = await listen(smallServer);
  const tooLarge = await fetch(`${smallBase}/v1/routing/rank`, {
    method: 'POST',
    headers: { authorization: `Bearer ${API_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ padding: 'x'.repeat(512) }),
  });
  check(tooLarge.status === 413, 'oversized body is 413');
  await close(smallServer);

  await close(server);

  console.log(`\n${failed === 0 ? 'All IRP server tests passed.' : `${failed} FAILED`}\n`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
