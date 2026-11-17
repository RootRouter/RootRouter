/**
 * SDD slice E — discrete trim thresholds so prompt prefixes stay stable between requests.
 */
const levels = new Map<string, number>();

export function cacheAwareTrimEnabled(): boolean {
  return (process.env.ROOTROUTER_CACHE_AWARE_TRIM ?? 'false').toLowerCase() === 'true';
}

export function shouldTrimAtTokens(agentId: string, tokensBefore: number, minTokens: number): boolean {
  if (!cacheAwareTrimEnabled()) {
    return tokensBefore >= minTokens;
  }
  const step = Math.max(minTokens, 1000);
  const level = Math.floor(tokensBefore / step);
  const prev = levels.get(agentId) ?? 0;
  if (level <= prev) return false;
  if (tokensBefore < minTokens) return false;
  levels.set(agentId, level);
  return true;
}

export function resetTrimSession(agentId?: string): void {
  if (agentId) levels.delete(agentId);
  else levels.clear();
}