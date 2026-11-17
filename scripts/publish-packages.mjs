#!/usr/bin/env node
/**
 * Publish SDK, proxy, MCP from each package directory so npm attaches README.md
 * to the registry packument (npm publish -w from monorepo root often leaves readme empty).
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const order = [
  { dir: 'packages/sdk', name: 'rootrouter' },
  { dir: 'packages/proxy', name: '@rootrouter/proxy' },
  { dir: 'packages/mcp', name: '@rootrouter/mcp' },
];

for (const pkg of order) {
  const cwd = path.join(root, pkg.dir);
  const readme = path.join(cwd, 'README.md');
  if (!fs.existsSync(readme)) {
    console.error(`Missing ${readme} — aborting before publish ${pkg.name}`);
    process.exit(1);
  }
  const size = fs.statSync(readme).size;
  if (size < 100) {
    console.error(`README too small (${size}B) in ${pkg.dir}`);
    process.exit(1);
  }
  console.log(`\nPublishing ${pkg.name} from ${pkg.dir} (README ${size}B)...`);
  execSync('npm publish --access public', {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, npm_config_workspace: '' },
  });
}

console.log('\nDone. Verify: npm view rootrouter readme');
console.log('If npmjs.com still blank, wait 2–5 min and hard-refresh (readme is processed async).');