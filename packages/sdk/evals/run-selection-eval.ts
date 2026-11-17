#!/usr/bin/env tsx
/**
 * SDD slice B — selection quality eval.
 * Usage:
 *   npm run eval:selection
 *   npm run eval:selection -- --config evals/selection/configs/default.json --config evals/selection/configs/chambers.json
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { ContextEngine } from '../src/select/contextEngine';
import { TfIdfEmbeddingProvider } from '../src/select/embedding/tfidfProvider';
import { InMemoryContextStore } from '../src/select/store/inMemoryStore';
import { indexRepo } from '../src/repo/indexRepo';
import type { ContextItem } from '../src/select/types';

const EVAL_DIR = path.resolve(__dirname);
const REPO_ROOT_DEFAULT = path.resolve(EVAL_DIR, '../../..');

interface EvalQuery {
  id: string;
  query: string;
  expectedPaths: string[];
  category?: string;
}

interface EvalConfig {
  name?: string;
  tokenBudget?: number;
  useChambers?: boolean;
  mmrLambda?: number;
  embedding?: 'tfidf' | 'local';
}

interface QueryMetrics {
  id: string;
  recallAt5: number;
  recallAt10: number;
  precisionAt5: number;
  precisionAt10: number;
  ndcgAt10: number;
  tokensOut: number;
  hitsAt10: string[];
}

function itemPath(item: ContextItem): string | null {
  const meta = item.metadata as { path?: string } | undefined;
  if (meta?.path && typeof meta.path === 'string') return meta.path;
  const m = item.text.match(/^\/\/ ([^:]+):\d+/);
  return m ? m[1] : null;
}

function pathMatches(actual: string, expected: string): boolean {
  const a = actual.replace(/\\/g, '/');
  const e = expected.replace(/\\/g, '/');
  return a === e || a.endsWith(e) || e.endsWith(a) || a.includes(e) || e.includes(a);
}

function relevantInTop(rankedPaths: string[], expected: string[], k: number): string[] {
  const top = rankedPaths.slice(0, k);
  const found: string[] = [];
  for (const e of expected) {
    if (top.some((p) => pathMatches(p, e))) found.push(e);
  }
  return found;
}

function rankMetrics(
  rankedPaths: string[],
  expected: string[],
  k: number
): { recall: number; precision: number } {
  const top = rankedPaths.slice(0, k);
  const found = relevantInTop(rankedPaths, expected, k);
  const recall = expected.length ? found.length / expected.length : 0;
  let precisionHits = 0;
  for (const p of top) {
    if (expected.some((e) => pathMatches(p, e))) precisionHits++;
  }
  const precision = top.length ? precisionHits / top.length : 0;
  return { recall: Math.min(1, recall), precision: Math.min(1, precision) };
}

function ndcgAtK(rankedPaths: string[], expected: string[], k: number): number {
  const gains: number[] = [];
  for (let i = 0; i < Math.min(k, rankedPaths.length); i++) {
    const p = rankedPaths[i];
    const rel = expected.some((e) => pathMatches(p, e)) ? 1 : 0;
    gains.push(rel);
  }
  let dcg = 0;
  for (let i = 0; i < gains.length; i++) {
    dcg += gains[i] / Math.log2(i + 2);
  }
  const ideal = [...gains].sort((a, b) => b - a);
  let idcg = 0;
  for (let i = 0; i < ideal.length; i++) {
    idcg += ideal[i] / Math.log2(i + 2);
  }
  return idcg === 0 ? 0 : dcg / idcg;
}

async function runConfig(
  queries: EvalQuery[],
  config: EvalConfig,
  items: ContextItem[]
): Promise<{ aggregate: Record<string, number>; perQuery: QueryMetrics[] }> {
  const engine = new ContextEngine({
    store: new InMemoryContextStore(),
    provider: new TfIdfEmbeddingProvider(),
    useChambers: config.useChambers ?? false,
    auditSelections: false,
  });
  engine.record(items);

  const perQuery: QueryMetrics[] = [];
  for (const q of queries) {
    const result = await engine.select(q.query, {
      tokenBudget: config.tokenBudget ?? 4000,
      mmrLambda: config.mmrLambda,
    });
    const rankedRaw = result.selected
      .map((it) => itemPath(it))
      .filter((p): p is string => !!p);
    const ranked: string[] = [];
    const seen = new Set<string>();
    for (const p of rankedRaw) {
      if (seen.has(p)) continue;
      seen.add(p);
      ranked.push(p);
    }

    const r5 = rankMetrics(ranked, q.expectedPaths, 5);
    const r10 = rankMetrics(ranked, q.expectedPaths, 10);
    perQuery.push({
      id: q.id,
      recallAt5: r5.recall,
      recallAt10: r10.recall,
      precisionAt5: r5.precision,
      precisionAt10: r10.precision,
      ndcgAt10: ndcgAtK(ranked, q.expectedPaths, 10),
      tokensOut: result.tokensOut,
      hitsAt10: ranked.slice(0, 10),
    });
  }

  const n = perQuery.length || 1;
  const aggregate = {
    recallAt5: perQuery.reduce((s, q) => s + q.recallAt5, 0) / n,
    recallAt10: perQuery.reduce((s, q) => s + q.recallAt10, 0) / n,
    precisionAt5: perQuery.reduce((s, q) => s + q.precisionAt5, 0) / n,
    precisionAt10: perQuery.reduce((s, q) => s + q.precisionAt10, 0) / n,
    ndcgAt10: perQuery.reduce((s, q) => s + q.ndcgAt10, 0) / n,
    meanTokensOut: perQuery.reduce((s, q) => s + q.tokensOut, 0) / n,
  };
  return { aggregate, perQuery };
}

function parseArgs(): { configs: string[]; outPath: string; repoRoot: string } {
  const args = process.argv.slice(2);
  const configs: string[] = [];
  let outPath = path.join(REPO_ROOT_DEFAULT, 'benchmarks/results/eval-selection-latest.json');
  let repoRoot = REPO_ROOT_DEFAULT;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--config' && args[i + 1]) {
      const raw = args[++i];
      const abs = path.resolve(raw);
      const cfg =
        fs.existsSync(abs) ? abs : path.join(EVAL_DIR, 'selection/configs', path.basename(raw));
      configs.push(cfg);
    } else if (args[i] === '--out' && args[i + 1]) {
      outPath = path.resolve(args[++i]);
    } else if (args[i] === '--repo' && args[i + 1]) {
      repoRoot = path.resolve(args[++i]);
    }
  }
  if (configs.length === 0) {
    configs.push(path.join(EVAL_DIR, 'selection/configs/default.json'));
  }
  return { configs, outPath, repoRoot };
}

async function main(): Promise<void> {
  const { configs, outPath, repoRoot } = parseArgs();
  const queriesPath = path.join(EVAL_DIR, 'selection/queries.json');
  const queries = JSON.parse(fs.readFileSync(queriesPath, 'utf8')) as EvalQuery[];

  const index = indexRepo({ rootPath: repoRoot, agentId: 'eval' });
  const items = index.items;

  const results: Array<{
    configPath: string;
    config: EvalConfig;
    aggregate: Record<string, number>;
    perQuery: QueryMetrics[];
  }> = [];

  for (const configPath of configs) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as EvalConfig;
    const run = await runConfig(queries, config, items);
    results.push({ configPath, config, ...run });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    repoRoot,
    queries: queries.length,
    chunksIndexed: index.stats.chunksIndexed,
    configs: results,
    diff:
      results.length === 2
        ? {
            recallAt10: results[1].aggregate.recallAt10 - results[0].aggregate.recallAt10,
            ndcgAt10: results[1].aggregate.ndcgAt10 - results[0].aggregate.ndcgAt10,
          }
        : undefined,
  };

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  console.log(JSON.stringify(payload, null, 2));

  const thresholdPath = path.join(repoRoot, 'benchmarks/results/eval-selection-threshold.json');
  const defaultResult =
    results.find((r) => r.configPath.includes('default.json')) ?? results[0];
  if (fs.existsSync(thresholdPath) && defaultResult) {
    const threshold = JSON.parse(fs.readFileSync(thresholdPath, 'utf8')) as {
      recallAt10Min: number;
    };
    if (defaultResult.aggregate.recallAt10 < threshold.recallAt10Min) {
      console.error(
        `FAIL: recall@10 ${defaultResult.aggregate.recallAt10.toFixed(3)} < ${threshold.recallAt10Min}`
      );
      process.exit(1);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});