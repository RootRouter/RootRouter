#!/usr/bin/env bash
# npmjs.com uses versions[latest].readme — not the top-level packument readme field.
set -euo pipefail
PKG="${1:-rootrouter}"
VER="${2:-$(npm view "$PKG" version)}"
sleep 2
LEN="$(
  node -e "
    const https = require('https');
    const pkg = process.argv[1];
    const ver = process.argv[2];
    https.get('https://registry.npmjs.org/' + encodeURIComponent(pkg) + '/' + ver, (r) => {
      let d = '';
      r.on('data', (c) => (d += c));
      r.on('end', () => {
        const j = JSON.parse(d);
        process.stdout.write(String((j.readme || '').length));
      });
    }).on('error', () => process.stdout.write('0'));
  " "$PKG" "$VER"
)"
if [ "${LEN:-0}" -lt 200 ]; then
  echo "::error::$PKG@$VER versions[].readme is only ${LEN} bytes — npmjs shows 'no README'." >&2
  echo "Republish with: npm run publish:packages (from repo root, with npm login + OTP)" >&2
  exit 1
fi
echo "OK: $PKG@$VER readme ${LEN} bytes in version manifest (npmjs should render)"