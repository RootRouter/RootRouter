import * as http from 'http';
import { timingSafeEqual } from 'crypto';
import {
  DEFAULT_ROUTER_ID,
  listIrpModels,
  rankCandidates,
  type IrpProblem,
} from 'rootrouter';

const DEFAULT_MAX_BODY_BYTES = 1_048_576;

export interface IrpServerOptions {
  /** When set, every routing endpoint requires `Authorization: Bearer <key>`. */
  apiKey?: string;
  routerId?: string;
  routerVersion?: string;
  maxBodyBytes?: number;
  /** Injectable clock, used by tests. */
  now?: () => number;
}

class PayloadTooLargeError extends Error {}

function problem(
  status: number,
  type: string,
  title: string,
  detail?: string
): IrpProblem {
  return { type, title, status, ...(detail ? { detail } : {}) };
}

function sendJson(res: http.ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(body));
}

function sendProblem(
  res: http.ServerResponse,
  doc: IrpProblem,
  extraHeaders: Record<string, string> = {}
): void {
  res.writeHead(doc.status, {
    'content-type': 'application/problem+json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...extraHeaders,
  });
  res.end(JSON.stringify(doc));
}

function isAuthorized(header: string | undefined, apiKey: string): boolean {
  if (!apiKey) return true;
  if (!header) return false;
  const provided = Buffer.from(header);
  const expected = Buffer.from(`Bearer ${apiKey}`);
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

function readBody(req: http.IncomingMessage, limit: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let settled = false;

    req.on('data', (chunk: Buffer) => {
      if (settled) return;
      size += chunk.length;
      if (size > limit) {
        settled = true;
        reject(new PayloadTooLargeError('Payload too large'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks));
      }
    });
    req.on('error', (err) => {
      if (!settled) {
        settled = true;
        reject(err);
      }
    });
  });
}

/**
 * IRP suggest-only routing service.
 *
 * Stateless by design: the request body is parsed, ranked in memory and
 * discarded. Nothing is persisted and prompt content is never logged.
 */
export function createIrpServer(options: IrpServerOptions = {}): http.Server {
  const apiKey = (options.apiKey ?? process.env.IRP_ROUTER_API_KEY ?? '').trim();
  const routerId = options.routerId ?? process.env.IRP_ROUTER_ID ?? DEFAULT_ROUTER_ID;
  const routerVersion =
    options.routerVersion ?? process.env.IRP_ROUTER_VERSION ?? '0.0.0';
  const maxBodyBytes = options.maxBodyBytes ?? DEFAULT_MAX_BODY_BYTES;

  async function handle(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    pathname: string,
    ctx: { note: string }
  ): Promise<void> {
    if (req.method === 'GET' && pathname === '/healthz') {
      sendJson(res, 200, {
        ok: true,
        service: 'rootrouter-irp',
        router: { id: routerId, version: routerVersion },
      });
      return;
    }

    if (!isAuthorized(req.headers.authorization, apiKey)) {
      sendProblem(
        res,
        problem(401, 'urn:irp:problem:unauthorized', 'Unauthorized', 'Bearer token required.'),
        { 'www-authenticate': 'Bearer' }
      );
      return;
    }

    if (req.method === 'GET' && pathname === '/v1/routing/models') {
      sendJson(res, 200, listIrpModels());
      return;
    }

    if (req.method === 'POST' && pathname === '/v1/routing/rank') {
      let raw: Buffer;
      try {
        raw = await readBody(req, maxBodyBytes);
      } catch (err) {
        if (err instanceof PayloadTooLargeError) {
          sendProblem(
            res,
            problem(413, 'urn:irp:problem:payload-too-large', 'Payload too large')
          );
          req.resume();
          return;
        }
        throw err;
      }

      const text = raw.toString('utf8').trim();
      if (!text) {
        sendProblem(
          res,
          problem(400, 'urn:irp:problem:invalid-request', 'Invalid request', 'Empty body.')
        );
        return;
      }

      let body: unknown;
      try {
        body = JSON.parse(text);
      } catch {
        sendProblem(
          res,
          problem(
            400,
            'urn:irp:problem:invalid-request',
            'Invalid request',
            'Body must be valid JSON.'
          )
        );
        return;
      }

      const result = rankCandidates(body, {
        routerId,
        routerVersion,
        ...(options.now ? { now: options.now() } : {}),
      });

      if (!result.ok) {
        sendProblem(res, result.problem);
        return;
      }

      ctx.note = ` ranked=${result.ranking.ranked.length}`;
      sendJson(res, 200, result.ranking);
      return;
    }

    sendProblem(res, problem(404, 'urn:irp:problem:not-found', 'Not found'));
  }

  return http.createServer((req, res) => {
    const startedAt = Date.now();
    const method = req.method ?? 'GET';
    const pathname = (req.url ?? '/').split('?')[0];
    const ctx = { note: '' };

    res.on('finish', () => {
      // Metadata only: no prompt content, no candidate ids, no bodies.
      console.error(
        `[rootrouter-irp] ${method} ${pathname} ${res.statusCode} ` +
          `${Date.now() - startedAt}ms${ctx.note}`
      );
    });

    handle(req, res, pathname, ctx).catch((err) => {
      console.error(
        '[rootrouter-irp] handler error:',
        err instanceof Error ? err.message : String(err)
      );
      if (!res.headersSent) {
        sendProblem(res, problem(500, 'urn:irp:problem:internal-error', 'Internal error'));
      } else {
        res.end();
      }
    });
  });
}
