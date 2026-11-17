import * as fs from 'fs';
import * as path from 'path';
import type { ContextItem } from '../select/types';
import { FileContextStore } from '../select/store/fileStore';

export interface StoreCliOptions {
  storePath: string;
  agentId?: string;
}

function resolveStore(storePath: string): FileContextStore {
  return new FileContextStore({ filePath: path.resolve(storePath) });
}

export async function runStoreLs(opts: StoreCliOptions): Promise<void> {
  const store = resolveStore(opts.storePath);
  await store.load();
  const items = store.all(opts.agentId);
  for (const it of items) {
  const pathMeta = (it.metadata as { path?: string })?.path ?? '';
    console.log(`${it.id}\t${it.kind ?? '-'}\t${it.agentId ?? '-'}\t${pathMeta}`);
  }
  console.error(`(${items.length} item(s))`);
}

export async function runStoreShow(opts: StoreCliOptions & { itemId: string }): Promise<void> {
  const store = resolveStore(opts.storePath);
  await store.load();
  const item = store.get(opts.itemId);
  if (!item) {
    console.error('not found');
    process.exit(1);
  }
  console.log(JSON.stringify(item, null, 2));
}

export async function runStoreRm(opts: StoreCliOptions & { itemId: string }): Promise<void> {
  const store = resolveStore(opts.storePath);
  await store.load();
  store.delete(opts.itemId);
  await store.save();
  console.error('removed');
}

export async function runStoreExport(opts: StoreCliOptions & { outPath: string }): Promise<void> {
  const store = resolveStore(opts.storePath);
  await store.load();
  const items: ContextItem[] = store.all(opts.agentId);
  fs.writeFileSync(opts.outPath, JSON.stringify({ items }, null, 2));
  console.error(`exported ${items.length} item(s) -> ${opts.outPath}`);
}

export async function runStorePurge(opts: StoreCliOptions): Promise<void> {
  const store = resolveStore(opts.storePath);
  await store.load();
  const items = store.all(opts.agentId);
  for (const it of items) store.delete(it.id);
  await store.save();
  console.error(`purged ${items.length} item(s)`);
}