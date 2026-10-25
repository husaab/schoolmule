// Screenshot a marketing site the same way for every teardown, and record what's on it.
//
//   node docs/research/landing-revamp/tools/shoot.mjs <url> <out-dir> <slug>
//
// Writes into <out-dir>:
//   <slug>-desktop-fold.jpg   1440×900, what a visitor sees in the first five seconds
//   <slug>-desktop-full.jpg   the whole page at half scale (720px wide)
//   <slug>-mobile-fold.jpg    390×844 at 2× (an iPhone 14-class phone)
//   <slug>-mobile-full.jpg    the whole phone page, capped at 9000px tall
//   <slug>.json               title, meta, h1/h2s, nav labels, hero CTAs, video/iframe use
//
// Playwright comes from the film's capture kit (remotion/capture/node_modules); set
// CHROME_PATH if its pinned Chromium isn't installed.
import { createRequire } from 'node:module'
import { mkdirSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const require = createRequire(path.resolve(here, '../../../../remotion/capture/package.json'))
const { chromium } = require('playwright')

const [url, outDir, slug] = process.argv.slice(2)
if (!url || !outDir || !slug) {
  console.error('usage: shoot.mjs <url> <out-dir> <slug>')
  process.exit(2)
}
mkdirSync(outDir, { recursive: true })

function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const cache = path.join(homedir(), 'Library/Caches/ms-playwright')
  if (!existsSync(cache)) return undefined
  const dirs = readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse()
  for (const d of dirs) {
    const p = path.join(cache, d, 'chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing')
    if (existsSync(p)) return p
  }
  return undefined
}

const UA_DESKTOP =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36'
const UA_MOBILE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'

async function dismissConsent(page) {
  const labels = /^(accept( all)?( cookies)?|allow all|i agree|agree|got it|ok(ay)?|close|dismiss|continue)$/i
  for (const frame of page.frames()) {
    try {
      const buttons = frame.getByRole('button', { name: labels })
      const n = await buttons.count()
      for (let i = 0; i < Math.min(n, 2); i++) {
        await buttons.nth(i).click({ timeout: 1500 }).catch(() => {})
      }
    } catch {}
  }
}

async function settle(page) {
  // Scroll the page in steps so lazy images and scroll-triggered sections render, then return to top.
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.8
    const max = Math.min(document.documentElement.scrollHeight, 30000)
    for (let y = 0; y < max; y += step) {
      window.scrollTo(0, y)
      await new Promise((r) => setTimeout(r, 120))
    }
    window.scrollTo(0, 0)
  })
  await page.waitForTimeout(800)
}

async function inspect(page) {
  return page.evaluate(() => {
    const txt = (el) => (el?.innerText || el?.getAttribute?.('aria-label') || '').replace(/\s+/g, ' ').trim()
    const vis = (el) => {
      const r = el.getBoundingClientRect()
      const s = getComputedStyle(el)
      return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'
    }
    const header = document.querySelector('header') || document.querySelector('nav')
    const navLabels = header
      ? [...header.querySelectorAll('a, button')].filter(vis).map(txt).filter(Boolean).slice(0, 40)
      : []
    const fold = window.innerHeight
    const heroCtas = [...document.querySelectorAll('a, button')]
      .filter((el) => vis(el) && el.getBoundingClientRect().top < fold && !(header && header.contains(el)))
      .map(txt)
      .filter((t) => t && t.length < 60)
      .slice(0, 20)
    const videos = [...document.querySelectorAll('video')].map((v) => ({
      autoplay: v.autoplay,
      muted: v.muted,
      loop: v.loop,
      controls: v.controls,
      poster: !!v.poster,
      aboveFold: v.getBoundingClientRect().top < fold,
      src: (v.currentSrc || v.querySelector('source')?.src || '').slice(0, 160),
    }))
    const iframes = [...document.querySelectorAll('iframe')]
      .map((f) => f.src)
      .filter((s) => /youtube|vimeo|wistia|loom|vidyard|calendly|chilipiper|hubspot|typeform|cal\.com|savvycal/i.test(s))
      .map((s) => s.slice(0, 160))
    const headings = (sel) => [...document.querySelectorAll(sel)].map(txt).filter(Boolean).slice(0, 25)
    return {
      title: document.title,
      metaDescription: document.querySelector('meta[name="description"]')?.content || null,
      ogImage: document.querySelector('meta[property="og:image"]')?.content || null,
      h1: headings('h1'),
      h2: headings('h2'),
      navLabels,
      heroCtas,
      videos,
      embeds: iframes,
      jsonLdTypes: [...document.querySelectorAll('script[type="application/ld+json"]')]
        .map((s) => {
          try {
            const j = JSON.parse(s.textContent)
            return [j].flat().map((x) => x['@type']).join(',')
          } catch {
            return 'unparseable'
          }
        }),
      pageHeight: document.documentElement.scrollHeight,
    }
  })
}

const browser = await chromium.launch({ headless: true, executablePath: findChrome() })
const result = { url, capturedAt: new Date().toISOString() }
try {
  // Desktop
  const desk = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent: UA_DESKTOP,
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
  })
  const page = await desk.newPage()
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
  result.status = resp?.status() ?? null
  result.finalUrl = page.url()
  await page.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {})
  await page.waitForTimeout(2500)
  await dismissConsent(page)
  await page.waitForTimeout(500)
  await page.screenshot({ path: path.join(outDir, `${slug}-desktop-fold.jpg`), type: 'jpeg', quality: 72 })
  result.desktop = await inspect(page)
  await settle(page)
  await dismissConsent(page)
  // Half-scale full page keeps the files small enough to commit.
  const cdp = await desk.newCDPSession(page)
  const height = Math.min(await page.evaluate(() => document.documentElement.scrollHeight), 16000)
  await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 0.5, mobile: false })
  await page.screenshot({
    path: path.join(outDir, `${slug}-desktop-full.jpg`),
    type: 'jpeg',
    quality: 58,
    fullPage: height <= 16000,
    clip: height > 16000 ? { x: 0, y: 0, width: 1440, height: 16000 } : undefined,
  })
  await desk.close()

  // Phone
  const phone = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: UA_MOBILE,
    locale: 'en-CA',
    timezoneId: 'America/Toronto',
  })
  const m = await phone.newPage()
  await m.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 })
  await m.waitForLoadState('networkidle', { timeout: 12000 }).catch(() => {})
  await m.waitForTimeout(2500)
  await dismissConsent(m)
  await m.waitForTimeout(500)
  await m.screenshot({ path: path.join(outDir, `${slug}-mobile-fold.jpg`), type: 'jpeg', quality: 72 })
  result.mobile = await inspect(m)
  await settle(m)
  const mh = Math.min(await m.evaluate(() => document.documentElement.scrollHeight), 9000)
  const mcdp = await phone.newCDPSession(m)
  await mcdp.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await m.screenshot({
    path: path.join(outDir, `${slug}-mobile-full.jpg`),
    type: 'jpeg',
    quality: 58,
    clip: { x: 0, y: 0, width: 390, height: mh },
    fullPage: true,
  })
  await phone.close()
  result.ok = true
} catch (err) {
  result.ok = false
  result.error = String(err?.message || err).slice(0, 500)
} finally {
  await browser.close()
  writeFileSync(path.join(outDir, `${slug}.json`), JSON.stringify(result, null, 2))
  console.log(JSON.stringify({ slug, ok: result.ok, status: result.status, error: result.error }, null, 0))
}
