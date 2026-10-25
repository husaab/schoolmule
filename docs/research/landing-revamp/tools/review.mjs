// Screenshot the marketing pages at the three review sizes.
//
//   node docs/research/landing-revamp/tools/review.mjs <base-url> <out-dir> [path ...]
//
// For each path and size it writes <slug>-<size>-fold.jpg and <slug>-<size>-full.jpg,
// and prints console errors and any horizontal overflow it finds.
import { createRequire } from 'node:module'
import { mkdirSync, readdirSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

const require = createRequire(path.resolve(process.env.CAPTURE_DIR || path.join(process.cwd(), '../../remotion/capture'), 'package.json'))
const { chromium } = require('playwright')

const [base, outDir, ...paths] = process.argv.slice(2)
const PATHS = paths.length
  ? paths
  : ['/', '/product', '/for/school-leaders', '/for/teachers', '/for/parents', '/for/students', '/for/islamic-schools', '/about', '/demo', '/contact', '/privacy', '/terms']
const SIZES = [
  { name: 'desktop', width: 1440, height: 900, scale: 1, mobile: false },
  { name: 'tablet', width: 768, height: 1024, scale: 1, mobile: true },
  { name: 'phone', width: 390, height: 844, scale: 2, mobile: true },
]
mkdirSync(outDir, { recursive: true })

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const cache = path.join(homedir(), 'Library/Caches/ms-playwright')
  if (!existsSync(cache)) return undefined
  for (const d of readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()) {
    const p = path.join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')
    if (existsSync(p)) return p
  }
}

const browser = await chromium.launch({ headless: true, executablePath: findChrome() })
for (const size of SIZES) {
  const ctx = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: size.scale,
    isMobile: size.mobile,
    hasTouch: size.mobile,
    locale: 'en-CA',
  })
  for (const p of PATHS) {
    const page = await ctx.newPage()
    const errors = []
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)))
    page.on('pageerror', (e) => errors.push(String(e).slice(0, 200)))
    const slug = p === '/' ? 'home' : p.replace(/^\//, '').replace(/\//g, '-')
    await page.goto(base + p, { waitUntil: 'networkidle', timeout: 60000 }).catch((e) => errors.push('goto: ' + e.message))
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(outDir, `${slug}-${size.name}-fold.jpg`), type: 'jpeg', quality: 70 })
    const overflow = await page.evaluate(() => {
      const w = document.documentElement.clientWidth
      return [...document.querySelectorAll('body *')]
        .filter((el) => el.getBoundingClientRect().right > w + 1 && getComputedStyle(el).position !== 'fixed')
        .slice(0, 5)
        .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)} right=${Math.round(el.getBoundingClientRect().right)}`)
    })
    // Scroll through so lazy images load, then take the whole page.
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += window.innerHeight * 0.8) {
        window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 150))
      }
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(600)
    await page.screenshot({ path: path.join(outDir, `${slug}-${size.name}-full.jpg`), type: 'jpeg', quality: 60, fullPage: true })
    const docOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
    console.log(JSON.stringify({ page: p, size: size.name, errors, docOverflow, overflow: docOverflow ? overflow : [] }))
    await page.close()
  }
  await ctx.close()
}
await browser.close()
