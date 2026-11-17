#!/usr/bin/env bash
# Restart Antseed API gateway + buyer on VPS (keeps seller separate).
# Usage on vps-brahma: bash ~/RootRouter/scripts/antseed-gateway-restart.sh
set -euo pipefail
export PATH="${HOME}/.nvm/versions/node/v22.23.4/bin:${PATH}"
pkill -f "antseed gateway start" 2>/dev/null || true
pkill -f "antseed buyer start" 2>/dev/null || true
sleep 2
nohup antseed gateway start >>"${HOME}/.antseed/gateway.log" 2>&1 &
sleep 15
ss -tlnp | grep -E '8377|8379' || { tail -20 "${HOME}/.antseed/gateway.log"; exit 1; }
echo "Gateway: http://127.0.0.1:8379/v1  Console: http://127.0.0.1:8379/console"
antseed gateway console-link 2>/dev/null || true