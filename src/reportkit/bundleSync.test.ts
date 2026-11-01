import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { reportkitEngineVersion, reportkitSourceHash } from '../../scripts/reportkit-source.mjs';

/**
 * The backend prints reports with a copy of this engine (vendor/reportkit).
 * When the sibling backend checkout is present, its copy must be built from
 * exactly these sources: run `npm run sync:reportkit` and commit both repos.
 */
const webRoot = resolve(__dirname, '../..');
const backend = resolve(webRoot, process.env.REPORTKIT_BACKEND_DIR ?? '../schoolmule-backend');
const manifestPath = join(backend, 'vendor/reportkit/manifest.json');

describe('backend reportkit bundle', () => {
  it.skipIf(!existsSync(manifestPath))('is built from these sources', () => {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    expect(manifest.sourceHash, 'Run npm run sync:reportkit and commit both repos').toBe(reportkitSourceHash(webRoot));
    expect(manifest.engineVersion).toBe(reportkitEngineVersion(webRoot));
  });
});
