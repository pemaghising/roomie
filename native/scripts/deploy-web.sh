#!/usr/bin/env bash
# Builds the web version and publishes it to the roomie-app-v2 Vercel project.
# Vercel never uploads folders named node_modules, so the exported fonts and images that Expo puts under
# assets/node_modules are moved to assets/nm and the bundle is pointed at the new path.
set -euo pipefail
cd "$(dirname "$0")/.."
keep=$(mktemp -d)
[ -d dist-web/.vercel ] && cp -r dist-web/.vercel "$keep/"
cp dist-web/vercel.json "$keep/" 2>/dev/null || true
npx expo export --platform web --output-dir dist-web
cp -r "$keep/." dist-web/
if [ -d dist-web/assets/node_modules ]; then
  mv dist-web/assets/node_modules dist-web/assets/nm
  grep -rl "/assets/node_modules/" dist-web --include=*.js --include=*.html --include=*.json | while read -r f; do
    sed -i 's#/assets/node_modules/#/assets/nm/#g' "$f"
  done
fi
if grep -rq "/assets/node_modules/" dist-web --include=*.js; then echo "still references node_modules" >&2; exit 1; fi
(cd dist-web && npx vercel deploy --prod --yes)
