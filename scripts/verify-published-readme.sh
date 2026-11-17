#!/usr/bin/env bash
# After publish: registry packument must expose readme text for latest.
set -euo pipefail
PKG="${1:-rootrouter}"
VER="${2:-$(npm view "$PKG" version)}"
sleep 3
LEN="$(npm view "$PKG" readme 2>/dev/null | wc -c | tr -d ' ')"
if [ "${LEN:-0}" -lt 200 ]; then
  echo "::error::$PKG@$VER readme on registry is only ${LEN} bytes — npmjs may show 'no README'." >&2
  echo "Republish with: npm run publish:packages" >&2
  exit 1
fi
echo "OK: $PKG readme ~${LEN} bytes on registry (latest $VER)"