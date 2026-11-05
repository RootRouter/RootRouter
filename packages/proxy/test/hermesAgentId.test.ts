/**
 * Hermes auto agentId resolution tests.
 */
import * as assert from 'assert';
import {
  clearHermesAgentIdCache,
  hermesSessionScopeEnabled,
  resolveProxyAgentId,
  sanitizeSessionId,
  withSessionAgentId,
} from '../src/hermesAgentId';

process.env.ROOTROUTER_HERMES_AUTO_PROJECT = 'false';
clearHermesAgentIdCache();

{
  const r = resolveProxyAgentId({ headerAgentId: 'hermes-coo:brahma101' });
  assert.strictEqual(r.agentId, 'hermes-coo:brahma101');
  assert.strictEqual(r.source, 'header');
}

process.env.ROOTROUTER_HERMES_AUTO_PROJECT = 'true';
clearHermesAgentIdCache();

{
  // With auto on, stale header is ignored in favor of Hermes active (or default).
  const r = resolveProxyAgentId({
    headerAgentId: 'hermes-coo:brahma101',
    lockHeader: true,
  });
  assert.strictEqual(r.agentId, 'hermes-coo:brahma101');
  assert.strictEqual(r.source, 'header');
}

{
  const r = resolveProxyAgentId({ headerAgentId: 'stale' });
  assert.ok(r.agentId.startsWith('hermes-coo:'));
  assert.ok(r.source === 'hermes-active' || r.source === 'hermes-default');
  console.log('resolved', r);
}

{
  assert.strictEqual(sanitizeSessionId('20260822_134405_25a3a010'), '20260822_134405_25a3a010');
  assert.strictEqual(sanitizeSessionId('  abc/../evil  '), 'abc-..-evil');
  assert.strictEqual(sanitizeSessionId(''), null);
  assert.strictEqual(sanitizeSessionId('!!!'), null);
  assert.strictEqual(
    withSessionAgentId('hermes-coo:motusdao', '20260822_134405_25a3a010'),
    'hermes-coo:motusdao:20260822_134405_25a3a010'
  );
  assert.strictEqual(withSessionAgentId('hermes-coo:motusdao', null), 'hermes-coo:motusdao');
}

{
  const prev = process.env.ROOTROUTER_SESSION_SCOPE;
  delete process.env.ROOTROUTER_SESSION_SCOPE;
  assert.strictEqual(hermesSessionScopeEnabled(), true);
  process.env.ROOTROUTER_SESSION_SCOPE = 'false';
  assert.strictEqual(hermesSessionScopeEnabled(), false);
  if (prev === undefined) delete process.env.ROOTROUTER_SESSION_SCOPE;
  else process.env.ROOTROUTER_SESSION_SCOPE = prev;
}

console.log('hermesAgentId tests passed');
