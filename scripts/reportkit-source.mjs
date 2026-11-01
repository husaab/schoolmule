/**
 * What identifies a reportkit build: a hash of every engine source (tests
 * excluded), font and built-in image, and the engine version. Shared by
 * scripts/build-reportkit.mjs and src/reportkit/bundleSync.test.ts.
 */
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ASSET_FILE = /\.(png|jpe?g|svg|webp|gif)$/i;

function walk(dir) {
  return readdirSync(dir)
    .flatMap((name) => {
      const p = join(dir, name);
      return statSync(p).isDirectory() ? walk(p) : [p];
    })
    .sort();
}

export function reportkitSourceHash(webRoot) {
  const h = createHash('sha256');
  const files = [
    ...walk(join(webRoot, 'src/reportkit')).filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts')),
    ...walk(join(webRoot, 'public/report-fonts')).filter((f) => f.endsWith('.woff2')),
    ...walk(join(webRoot, 'public/report-assets')).filter((f) => ASSET_FILE.test(f)),
  ];
  for (const f of files) {
    h.update(relative(webRoot, f));
    h.update(readFileSync(f));
  }
  return h.digest('hex');
}

/** ENGINE_VERSION from src/reportkit/index.ts (throws if it can't be read). */
export function reportkitEngineVersion(webRoot) {
  const src = readFileSync(join(webRoot, 'src/reportkit/index.ts'), 'utf8');
  const m = /export const ENGINE_VERSION = (\d+);/.exec(src);
  if (!m) throw new Error('ENGINE_VERSION not found in src/reportkit/index.ts');
  return Number(m[1]);
}

export { ASSET_FILE };
