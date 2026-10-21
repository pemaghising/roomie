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
# desktop shows the app inside a phone frame (web/desktop-frame.js decides; phones load the app directly)
cp web/desktop-frame.js dist-web/desktop-frame.js
cp assets/brand/app-icon.png dist-web/app-icon.png
python -I -c "import qrcode,sys; q=qrcode.QRCode(border=1); q.add_data(sys.argv[1]); q.make_image(fill_color='#1F1B3A', back_color='#FCFBFF').save('dist-web/qr.png')" "${ROOMIE_URL:-https://roomie-app-v2-delta.vercel.app/}"
python -I - <<'PY'
import re
p = 'dist-web/index.html'; s = open(p, encoding='utf-8').read()
m = re.search(r'<script src="(/_expo/static/js/web/entry-[^"]+\.js)" defer></script>', s)
assert m, 'entry script not found'
s = s.replace(m.group(0), '<script>window.__ROOMIE_ENTRY = "%s";</script><script src="/desktop-frame.js"></script>' % m.group(1))
open(p, 'w', encoding='utf-8').write(s)
PY
(cd dist-web && npx vercel deploy --prod --yes)
