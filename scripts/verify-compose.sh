#!/usr/bin/env bash
# SDD G1 — verify docker compose proxy + echo agent
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/deploy/compose"
docker compose up -d --build
for i in $(seq 1 30); do
  if curl -sf http://localhost:8787/healthz >/dev/null; then break; fi
  sleep 2
done
curl -sf http://localhost:8787/healthz | grep -q '"ok":true'
RESP=$(curl -sf -X POST http://localhost:8787/v1/chat/completions \
  -H 'content-type: application/json' \
  -H 'x-rootrouter-agent-id: compose-verify' \
  -d '{"model":"echo","messages":[{"role":"user","content":"ping"}]}')
echo "$RESP" | grep -q 'assistant'
HDR=$(curl -si -X POST http://localhost:8787/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"echo","messages":[{"role":"user","content":"ping"}]}' | tr -d '\r')
echo "$HDR" | grep -qi 'x-rootrouter-agent-id'
echo "compose verify OK"
docker compose down