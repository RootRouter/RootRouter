/**
 * SDD slice H — swarm agents through real proxy (requires proxy + upstream).
 * ROOTROUTER_PROXY_URL=http://localhost:8787 npm run demo:swarm-proxy
 */
const PROXY = (process.env.ROOTROUTER_PROXY_URL ?? 'http://localhost:8787').replace(/\/$/, '');
const agents = ['planner', 'coder', 'researcher'];

async function call(agentId: string, content: string, delegatedFrom?: string): Promise<void> {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
    'x-rootrouter-agent-id': agentId,
  };
  if (delegatedFrom) headers['x-rootrouter-delegated-from'] = delegatedFrom;
  const res = await fetch(`${PROXY}/v1/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: 'demo',
      messages: [{ role: 'user', content }],
    }),
  });
  if (!res.ok) throw new Error(`${agentId} ${res.status}`);
}

async function main(): Promise<void> {
  const health = await fetch(`${PROXY}/healthz`);
  if (!health.ok) throw new Error(`proxy unhealthy at ${PROXY}`);
  for (let round = 0; round < 5; round++) {
    for (const agent of agents) {
      await call(agent, `${agent} task round ${round}`, round > 0 ? 'planner' : undefined);
    }
  }
  const topo = await fetch(`${PROXY}/topology`);
  console.log(await topo.json());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});