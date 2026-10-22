// scripts/render-avatar-pngs.mjs
// Renders every avatar (6 styles x 6 skin tones x 8 backgrounds) plus the
// neutral one to 96x96 PNGs in public/email/avatars/, for emails, which can't
// draw inline SVG. The drawing comes from src/lib/avatar.ts, the same code
// the app renders with, so the two can't drift. Re-run after changing
// src/lib/avatarShapes.json and commit the output:
//
//   npm run avatars:render     (node scripts/render-avatar-pngs.mjs)
//
// Needs Node 20+ plus `jiti` and `sharp` in node_modules. Neither is a
// declared dependency: jiti ships with the Tailwind/ESLint toolchain and sharp
// with Next. If an upgrade drops either, `npm i -D jiti sharp` first.
//
// The backend links them as `${EMAIL_ASSET_BASE_URL}/email/avatars/<style>-<skin>-<bg>.png`
// (utils/avatar.js avatarPngUrl).

import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createJiti } from 'jiti'
import sharp from 'sharp'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'public', 'email', 'avatars')

// jiti loads the TypeScript module (and its JSON import) without a build step.
const jiti = createJiti(import.meta.url)
const { AVATAR_STYLES, AVATAR_SKINS, AVATAR_BGS, avatarSvgString } = await jiti.import(
  path.join(root, 'src', 'lib', 'avatar.ts'),
)

const render = (svg, file) =>
  sharp(Buffer.from(svg)).resize(96, 96).png({ compressionLevel: 9 }).toFile(path.join(outDir, file))

await mkdir(outDir, { recursive: true })

const jobs = [render(avatarSvgString(null), 'neutral.png')]
for (const { id } of AVATAR_STYLES) {
  for (let skin = 0; skin < AVATAR_SKINS.length; skin++) {
    for (let bg = 0; bg < AVATAR_BGS.length; bg++) {
      jobs.push(render(avatarSvgString({ style: id, skin, bg }), `${id}-${skin}-${bg}.png`))
    }
  }
}
await Promise.all(jobs)
console.log(`Wrote ${jobs.length} avatars to ${path.relative(root, outDir)}`)
