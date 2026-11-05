#!/usr/bin/env node
/**
 * RootRouter IRP routing service (suggest-only).
 *
 * Serves `GET /v1/routing/models` and `POST /v1/routing/rank` for an Antseed
 * `irp-router` seller plugin. Stateless: no store, no prompt logging.
 */
import { createRequire } from 'module';
import { createIrpServer } from './irp/server.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version?: string };

const PORT = Number(process.env.IRP_PORT ?? 8788);
const HOST = process.env.IRP_HOST ?? '127.0.0.1';
const server = createIrpServer({
  routerVersion: process.env.IRP_ROUTER_VERSION ?? pkg.version ?? '0.0.0',
});

server.listen(PORT, HOST, () => {
  console.error(`[rootrouter-irp] listening on http://${HOST}:${PORT}`);
  console.error(
    `[rootrouter-irp] auth=${process.env.IRP_ROUTER_API_KEY ? 'bearer' : 'none'} ` +
      'store=none retention=0'
  );
});

function shutdown(signal: string): void {
  console.error(`[rootrouter-irp] ${signal} received, closing`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
