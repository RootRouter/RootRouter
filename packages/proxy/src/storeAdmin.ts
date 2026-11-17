import type http from 'http';
import type { ContextEngine } from 'rootrouter';

export function adminTokenOk(req: http.IncomingMessage): boolean {
  const expected = (process.env.ROOTROUTER_ADMIN_TOKEN ?? '').trim();
  if (!expected) return false;
  const got = (req.headers['x-rootrouter-admin-token'] ?? req.headers.authorization ?? '')
    .toString()
    .replace(/^Bearer\s+/i, '')
    .trim();
  return got === expected;
}

export async function handleStoreAdmin(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: string,
  engine: ContextEngine
): Promise<boolean> {
  if (!url.startsWith('/store/')) return false;

  if (!adminTokenOk(req)) {
    res.writeHead(401, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: 'unauthorized' }));
    return true;
  }

  const parts = url.split('/').filter(Boolean);
  const agentId = decodeURIComponent(parts[1] ?? '');
  const itemId = parts[2] ? decodeURIComponent(parts[2]) : undefined;

  if (req.method === 'GET' && agentId && !itemId) {
    const items = engine.getStore().all(agentId).map((it) => ({
      id: it.id,
      kind: it.kind,
      agentId: it.agentId,
      timestamp: it.timestamp,
      path: (it.metadata as { path?: string })?.path ?? null,
      tokensEst: Math.ceil(it.text.length / 4),
    }));
    res.writeHead(200, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ agentId, count: items.length, items }));
    return true;
  }

  if (req.method === 'DELETE' && agentId && itemId) {
    engine.getStore().delete?.(itemId);
    await engine.save();
    res.writeHead(204);
    res.end();
    return true;
  }

  if (req.method === 'DELETE' && agentId && !itemId) {
    for (const it of engine.getStore().all(agentId)) {
      engine.getStore().delete?.(it.id);
    }
    await engine.save();
    res.writeHead(204);
    res.end();
    return true;
  }

  res.writeHead(405, { 'content-type': 'application/json' });
  res.end(JSON.stringify({ error: 'method not allowed' }));
  return true;
}