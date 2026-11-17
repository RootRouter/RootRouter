#!/usr/bin/env node
/** SDD D3 — estimate MCP fixed overhead (tool defs + short rule). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function estTokens(text) {
  return Math.ceil(text.length / 4);
}

const shortRule = fs.readFileSync(
  path.join(root, 'docs/templates/cursor-rootrouter-mcp-rule.mdc'),
  'utf8'
);
const legacyPath = path.join(root, 'docs/insights/legacy-mcp-rule-baseline.txt');
const prevLong = fs.existsSync(legacyPath)
  ? fs.readFileSync(legacyPath, 'utf8')
  : ' '.repeat(3200);

const mcpSrc = fs.readFileSync(path.join(root, 'packages/mcp/src/server.ts'), 'utf8');
const descs = [...mcpSrc.matchAll(/description:\s*['"`]([^'"`]+)['"`]/g)].map((m) => m[1]);

const shortTokens = estTokens(shortRule);
const longTokens = estTokens(prevLong);
const toolTokens = descs.reduce((s, d) => s + estTokens(d), 0);

const result = {
  shortRuleTokens: shortTokens,
  legacyRuleTokensEst: longTokens,
  toolDescriptionTokens: toolTokens,
  shortCombined: shortTokens + toolTokens,
  legacyCombinedEst: longTokens + toolTokens,
  reductionPct: Math.round((1 - (shortTokens + toolTokens) / (longTokens + toolTokens)) * 100),
  measuredAt: new Date().toISOString(),
};

const out = path.join(root, 'docs/insights/mcp-overhead-measurement.json');
fs.writeFileSync(out, JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));