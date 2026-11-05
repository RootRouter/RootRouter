/**
 * Resolve Hermes COO project scope from ~/.hermes/projects.db.
 * Used so workspace switches update x-rootrouter-agent-id without a manual sync.
 */
import { execFileSync } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const PERSONA = 'hermes-coo';
const CACHE_MS = 1500;

let cached: { at: number; slug: string | null } | null = null;

export function hermesAutoProjectEnabled(): boolean {
  const v = (process.env.ROOTROUTER_HERMES_AUTO_PROJECT ?? '').toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export function hermesHome(): string {
  return process.env.HERMES_HOME?.trim() || path.join(os.homedir(), '.hermes');
}

/** Active Hermes project slug, or null if unavailable. Cached briefly. */
export function readHermesActiveProjectSlug(): string | null {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) return cached.slug;

  const dbPath = path.join(hermesHome(), 'projects.db');
  if (!fs.existsSync(dbPath)) {
    cached = { at: now, slug: null };
    return null;
  }

  try {
    const activeId = execFileSync(
      'sqlite3',
      [dbPath, "SELECT value FROM project_meta WHERE key='active_id' LIMIT 1;"],
      { encoding: 'utf8', timeout: 500 }
    ).trim();
    if (!activeId) {
      cached = { at: now, slug: null };
      return null;
    }
    const slug = execFileSync(
      'sqlite3',
      [dbPath, `SELECT slug FROM projects WHERE id='${activeId.replace(/'/g, "''")}' LIMIT 1;`],
      { encoding: 'utf8', timeout: 500 }
    ).trim();
    const out = slug || null;
    cached = { at: now, slug: out };
    return out;
  } catch {
    cached = { at: now, slug: null };
    return null;
  }
}

/**
 * When auto is on: always use hermes-coo:<active-slug> (or :default).
 * Header lock: x-rootrouter-agent-id-lock: true keeps the client header.
 */
export function resolveProxyAgentId(input: {
  headerAgentId: string;
  lockHeader?: boolean;
}): { agentId: string; source: 'header' | 'hermes-active' | 'hermes-default' } {
  if (!hermesAutoProjectEnabled() || input.lockHeader) {
    return { agentId: input.headerAgentId || 'default', source: 'header' };
  }

  const slug = readHermesActiveProjectSlug();
  if (slug) {
    return { agentId: `${PERSONA}:${slug}`, source: 'hermes-active' };
  }
  return { agentId: `${PERSONA}:default`, source: 'hermes-default' };
}

/** Session-scoped auto-recall. Default on. Set ROOTROUTER_SESSION_SCOPE=false to revert. */
export function hermesSessionScopeEnabled(): boolean {
  const v = (process.env.ROOTROUTER_SESSION_SCOPE ?? 'true').toLowerCase();
  return v !== '0' && v !== 'false' && v !== 'no' && v !== 'off';
}

/** Hermes session ids look like 20260822_134405_25a3a010. */
export function sanitizeSessionId(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const cleaned = String(raw)
    .trim()
    .slice(0, 80)
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || null;
}

/** hermes-coo:motusdao + session → hermes-coo:motusdao:<session>. */
export function withSessionAgentId(projectAgentId: string, sessionId: string | null): string {
  if (!sessionId) return projectAgentId;
  return `${projectAgentId}:${sessionId}`;
}

/** Test helper */
export function clearHermesAgentIdCache(): void {
  cached = null;
}
