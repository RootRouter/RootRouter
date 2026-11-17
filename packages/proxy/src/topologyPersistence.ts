import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { exportTopologyJson } from './topologyTracker.js';

export function topologyFilePath(): string {
  return (
    process.env.ROOTROUTER_TOPOLOGY_PATH?.trim() ||
    path.join(os.homedir(), '.rootrouter', 'proxy-topology.json')
  );
}

export function persistTopology(): void {
  try {
    const file = topologyFilePath();
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ savedAt: Date.now(), ...exportTopologyJson() }, null, 2));
  } catch {
    /* ignore */
  }
}

export function loadTopologySnapshot(): ReturnType<typeof exportTopologyJson> | null {
  try {
    const file = topologyFilePath();
    if (!fs.existsSync(file)) return null;
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8'));
    delete parsed.savedAt;
    return parsed;
  } catch {
    return null;
  }
}