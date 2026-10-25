#!/bin/bash
# Lighthouse (mobile) on every marketing page of a running build.
#
#   docs/research/landing-revamp/tools/lighthouse.sh http://localhost:3457 <out-dir> [path ...]
#
# Prints performance, accessibility, best practices, SEO, LCP and CLS per page.
# Set CHROME_PATH, or it uses the newest Playwright Chromium.
set -euo pipefail
BASE="$1"; OUT="$2"; shift 2
PATHS=("$@")
[ ${#PATHS[@]} -eq 0 ] && PATHS=(/ /product /for/school-leaders /for/teachers /for/parents /for/students /for/islamic-schools /about /demo /contact /privacy /terms)
if [ -z "${CHROME_PATH:-}" ]; then
  CHROME_PATH="$(ls -d "$HOME"/Library/Caches/ms-playwright/chromium-*/chrome-mac-arm64/Google\ Chrome\ for\ Testing.app/Contents/MacOS/Google\ Chrome\ for\ Testing | sort -V | tail -1)"
  export CHROME_PATH
fi
mkdir -p "$OUT"
for p in "${PATHS[@]}"; do
  slug=$([ "$p" = "/" ] && echo home || echo "${p#/}" | tr '/' '-')
  npx -y lighthouse@12.6.0 "$BASE$p" --quiet --chrome-flags="--headless=new" --form-factor=mobile \
    --only-categories=performance,accessibility,best-practices,seo --output=json --output-path="$OUT/$slug.json" >/dev/null 2>&1 || true
  node -e "
    const r = require(process.argv[1]);
    const c = r.categories, s = (k) => Math.round(c[k].score * 100);
    console.log([process.argv[2].padEnd(22), 'perf', s('performance'), 'a11y', s('accessibility'), 'bp', s('best-practices'), 'seo', s('seo'),
      'LCP', r.audits['largest-contentful-paint'].displayValue, 'CLS', r.audits['cumulative-layout-shift'].displayValue].join(' '))
  " "$OUT/$slug.json" "$p"
done
