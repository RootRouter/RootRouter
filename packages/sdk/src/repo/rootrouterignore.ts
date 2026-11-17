import * as fs from 'fs';
import * as path from 'path';

/**
 * Minimal gitignore-style matcher for `.rootrouterignore` at repo root.
 * Supports *, **, ?, and negation with leading ! (last match wins per path).
 */
export function loadRootrouterIgnore(repoRoot: string): (relPosix: string) => boolean {
  const ignoreFile = path.join(repoRoot, '.rootrouterignore');
  if (!fs.existsSync(ignoreFile)) {
    return () => false;
  }
  const lines = fs
    .readFileSync(ignoreFile, 'utf8')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith('#'));

  const rules = lines.map((line) => {
    const negate = line.startsWith('!');
    const pattern = negate ? line.slice(1).trim() : line;
    return { negate, re: patternToRegExp(pattern) };
  });

  return (relPosix: string) => {
    const normalized = relPosix.replace(/\\/g, '/');
    let ignored = false;
    for (const { negate, re } of rules) {
      if (re.test(normalized) || re.test(path.basename(normalized))) {
        ignored = !negate;
      }
    }
    return ignored;
  };
}

function patternToRegExp(pattern: string): RegExp {
  let p = pattern.replace(/\\/g, '/');
  if (p.startsWith('/')) p = p.slice(1);
  const escaped = p
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '{{GLOBSTAR}}')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '[^/]')
    .replace(/{{GLOBSTAR}}/g, '.*');
  return new RegExp(`(^|/)${escaped}$`);
}

export const DEFAULT_PATH_EXCLUDES = [
  '**/_generated/**',
  '**/*.d.ts',
  '**/dist/**',
  '**/.next/**',
  '**/coverage/**',
  '**/benchmarks/results/**',
  '**/*.lock',
  '**/package-lock.json',
  '**/pnpm-lock.yaml',
  '**/yarn.lock',
  'apps/dashboard/**',
  'docs/insights/**',
];

export function loadDefaultPathExcludes(repoRoot: string): (relPosix: string) => boolean {
  const matchers = DEFAULT_PATH_EXCLUDES.map((p) => ({
    re: patternToRegExp(p),
  }));
  return (relPosix: string) => {
    const normalized = relPosix.replace(/\\/g, '/');
    return matchers.some(({ re }) => re.test(normalized));
  };
}

const SECRET_PATTERNS: RegExp[] = [
  /(?:api[_-]?key|secret|token)\s*[:=]\s*['"]?[a-zA-Z0-9_\-]{20,}/i,
  /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/,
  /sk-[a-zA-Z0-9]{20,}/,
  /AKIA[0-9A-Z]{16}/,
];

export function contentLooksLikeSecret(text: string): boolean {
  return SECRET_PATTERNS.some((re) => re.test(text));
}