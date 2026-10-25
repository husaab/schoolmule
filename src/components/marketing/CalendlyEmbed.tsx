'use client'
import { useEffect, useRef, useState } from 'react'
import { CALENDLY_URL } from '@/lib/marketing/site'

// The booking calendar. Calendly's widget script loads when the calendar is
// about to come on screen, and the widget is started explicitly, so it also
// appears after moving between pages inside the site (the script's own
// on-load scan only runs once per visit).

declare global {
  interface Window {
    Calendly?: { initInlineWidget: (opts: { url: string; parentElement: HTMLElement }) => void }
  }
}

const SCRIPT_SRC = 'https://assets.calendly.com/assets/external/widget.js'
const URL_WITH_OPTIONS = `${CALENDLY_URL}?hide_gdpr_banner=1`

function loadScript(): Promise<void> {
  if (window.Calendly) return Promise.resolve()
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
  return new Promise((resolve, reject) => {
    const script = existing ?? document.createElement('script')
    script.addEventListener('load', () => resolve(), { once: true })
    script.addEventListener('error', () => reject(new Error('Calendly failed to load')), { once: true })
    if (!existing) {
      script.src = SCRIPT_SRC
      script.async = true
      document.body.appendChild(script)
    }
  })
}

export default function CalendlyEmbed() {
  const box = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle')

  useEffect(() => {
    const el = box.current
    if (!el) return
    let started = false
    const start = () => {
      if (started) return
      started = true
      setState('loading')
      loadScript()
        .then(() => {
          el.innerHTML = ''
          window.Calendly?.initInlineWidget({ url: URL_WITH_OPTIONS, parentElement: el })
          setState('ready')
        })
        .catch(() => setState('failed'))
    }
    const io = new IntersectionObserver(([entry]) => entry.isIntersecting && start(), { rootMargin: '600px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="relative">
      {/* Not marked .calendly-inline-widget, so the script's own scan leaves it to initInlineWidget. */}
      <div ref={box} className="h-[700px] min-w-[280px] overflow-hidden" />
      {state !== 'ready' && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-6 text-center">
          {state === 'failed' ? (
            <p className="pointer-events-auto text-slate-600">
              The calendar didn’t load.{' '}
              <a href={CALENDLY_URL} target="_blank" rel="noopener" className="font-semibold text-brand-ink underline">
                Open it in a new tab
              </a>
              .
            </p>
          ) : (
            <p className="text-slate-600">Loading the calendar…</p>
          )}
        </div>
      )}
    </div>
  )
}
