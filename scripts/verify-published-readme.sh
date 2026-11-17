#!/usr/bin/env bash
# npmjs.com uses versions[ver].readme — not the top-level packument readme field.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG="${1:-rootrouter}"
EXPECTED_VER="${2:-$(node -p "require('$ROOT/packages/sdk/package.json').version")}"
POLL_SECS="${POLL_SECS:-180}"

readme_len() {
  local ver="$1"
  node -e "
    const https = require('https');
    const pkg = process.argv[1];
    const ver = process.argv[2];
    https
      .get('https://registry.npmjs.org/' + encodeURIComponent(pkg) + '/' + ver, (r) => {
        let d = '';
        r.on('data', (c) => (d += c));
        r.on('end', () => {
          if (r.statusCode === 404) {
            process.stdout.write('-1');
            return;
          }
          const j = JSON.parse(d);
          process.stdout.write(String((j.readme || '').length));
        });
      })
      .on('error', () => process.stdout.write('0'));
  " "$PKG" "$ver"
}

echo "Waiting for $PKG@$EXPECTED_VER on registry (up to ${POLL_SECS}s)..."
elapsed=0
while [ "$elapsed" -lt "$POLL_SECS" ]; do
  LEN="$(readme_len "$EXPECTED_VER")"
  if [ "$LEN" = "-1" ]; then
    sleep 5
    elapsed=$((elapsed + 5))
    continue
  fi
  if [ "${LEN:-0}" -ge 200 ]; then
    echo "OK: $PKG@$EXPECTED_VER readme ${LEN} bytes in version manifest (npmjs should render)"
  latest="$(npm view "$PKG" version 2>/dev/null || true)"
    if [ "$latest" != "$EXPECTED_VER" ]; then
      echo "Note: dist-tag latest is still $latest — may take a few more minutes to flip."
    fi
    exit 0
  fi
  sleep 5
  elapsed=$((elapsed + 5))
done

LEN="$(readme_len "$EXPECTED_VER")"
if [ "$LEN" = "-1" ]; then
  echo "::error::$PKG@$EXPECTED_VER not on registry yet (npm may still be processing the publish)." >&2
  echo "Check: npm view $PKG versions && npm whoami" >&2
  exit 1
fi
echo "::error::$PKG@$EXPECTED_VER versions[].readme is only ${LEN} bytes — npmjs shows 'no README'." >&2
echo "Republish with: node scripts/publish-packages.mjs" >&2
exit 1