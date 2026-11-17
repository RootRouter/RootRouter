/**
 * SDD slice F — proxy regression (mock upstream, concurrency, degrade header).
 */
import http from 'http';
import { spawn, type ChildProcess } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.join(__dirname, '..', 'dist', 'server.js');

let failed = 0;
const assert = (c: boolean, n: string) => {
  console.log(`  ${c ? 'PASS' : 'FAIL'}: ${n}`);
  if (!c) failed++;
};

const UP = 8920;
const PX = 8921;

function sseBody(): string {
  return (
    'data: {"id":"1","choices":[{"delta":{"content":"hi"}}]}\n\n' +
    'data: [DONE]\n\n'
  );
}

const upstream = http.createServer((req, res) => {
  const u = req.url ?? '';
  if (u.includes('/chat/completions')) {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      let stream = false;
      try {
        stream = !!JSON.parse(body).stream;
      } catch {
        /* noop */
      }
      if (stream) {
        res.writeHead(200, { 'content-type': 'text/event-stream' });
        res.end(sseBody());
        return;
      }
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(
        JSON.stringify({
          choices: [{ message: { role: 'assistant', content: 'ok' } }],
          usage: { prompt_tokens: 100, prompt_tokens_details: { cached_tokens: 42 } },
        })
      );
    });
    return;
  }
  if (u.includes('/error')) {
    res.writeHead(500);
    res.end('err');
    return;
  }
  res.writeHead(404);
  res.end();
});

let proxy: ChildProcess;

await new Promise<void>((r) => upstream.listen(UP, r));

proxy = spawn('node', [serverPath], {
  env: {
    ...process.env,
    PORT: String(PX),
    ROOTROUTER_UPSTREAM_ORIGIN: `http://127.0.0.1:${UP}`,
    ROOTROUTER_MIN_TOKENS_TO_FILTER: '999999',
    ROOTROUTER_STORE_PATH: `/tmp/rootrouter-regression-${process.pid}.json`,
    ROOTROUTER_ADMIN_TOKEN: 'test-admin',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

async function waitReady(): Promise<void> {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PX}/healthz`);
      if (r.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 50));
  }
  throw new Error('proxy not ready');
}

await waitReady();

console.log('\n=== Streaming SSE passthrough ===');
{
  const resp = await fetch(`http://127.0.0.1:${PX}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      stream: true,
      model: 'x',
      messages: [{ role: 'user', content: 'hello' }],
    }),
  });
  const text = await resp.text();
  assert(resp.ok, 'stream status ok');
  assert(text.includes('[DONE]'), 'stream contains DONE');
}

console.log('\n=== Cached tokens on JSON completion ===');
{
  const resp = await fetch(`http://127.0.0.1:${PX}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: 'x',
      messages: [{ role: 'user', content: 'hello' }],
    }),
  });
  assert(resp.ok, 'json completion');
  const ctx = await fetch(`http://127.0.0.1:${PX}/context`);
  const snap = (await ctx.json()) as { cachedTokensSession?: number };
  assert((snap.cachedTokensSession ?? 0) >= 42, 'cached tokens recorded in /context');
}

console.log('\n=== Concurrent health checks (p95) ===');
{
  const n = 50;
  const starts: number[] = [];
  await Promise.all(
    Array.from({ length: n }, async () => {
      const t0 = performance.now();
      const r = await fetch(`http://127.0.0.1:${PX}/healthz`);
      starts.push(performance.now() - t0);
      assert(r.ok, 'health concurrent');
    })
  );
  starts.sort((a, b) => a - b);
  const p95 = starts[Math.floor(n * 0.95)] ?? 0;
  console.log(`  p95 latency ${p95.toFixed(1)}ms`);
  assert(p95 <= 50, 'p95 <= 50ms on healthz');
}

console.log('\n=== /metrics and /topology ===');
{
  const m = await fetch(`http://127.0.0.1:${PX}/metrics`);
  const body = await m.text();
  assert(m.ok && body.includes('rootrouter_requests_total'), 'prometheus metrics');
  const t = await fetch(`http://127.0.0.1:${PX}/topology`);
  assert(t.ok, 'topology json');
}

console.log('\n=== Store admin auth ===');
{
  const deny = await fetch(`http://127.0.0.1:${PX}/store/default`);
  assert(deny.status === 401, 'store without token 401');
  const allow = await fetch(`http://127.0.0.1:${PX}/store/default`, {
    headers: { 'x-rootrouter-admin-token': 'test-admin' },
  });
  assert(allow.ok, 'store with token 200');
}

proxy.kill();
upstream.close();

console.log(`\nRegression: ${failed === 0 ? 'ALL PASSED' : `${failed} FAILED`}`);
process.exit(failed ? 1 : 0);