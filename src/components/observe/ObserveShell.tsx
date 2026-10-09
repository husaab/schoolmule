// src/components/observe/ObserveShell.tsx
'use client'
// The console's own chrome: a dark rail, a window picker and a live toggle.
// It replaces Navbar/Sidebar entirely; the back link is the only way out.
import { ReactNode, Suspense, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  Squares2X2Icon, PresentationChartLineIcon, UsersIcon, RectangleStackIcon, ExclamationTriangleIcon,
  KeyIcon, ServerStackIcon, ArrowUturnLeftIcon,
} from '@heroicons/react/24/outline'
import { useObserveStore, WINDOW_KEYS, isWindowKey } from '@/store/useObserveStore'
import { useUserStore } from '@/store/useUserStore'
import { timeAgo } from './format'

const NAV = [
  { href: '/observe', label: 'Overview', icon: Squares2X2Icon, exact: true },
  { href: '/observe/activity', label: 'Activity', icon: PresentationChartLineIcon },
  { href: '/observe/users', label: 'Users', icon: UsersIcon },
  { href: '/observe/features', label: 'Features', icon: RectangleStackIcon },
  { href: '/observe/errors', label: 'Errors', icon: ExclamationTriangleIcon },
  { href: '/observe/logins', label: 'Logins', icon: KeyIcon },
  { href: '/observe/infra', label: 'Infra', icon: ServerStackIcon },
]

function WindowPicker() {
  const window = useObserveStore((s) => s.window)
  const setWindow = useObserveStore((s) => s.setWindow)
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  // URL is the source of truth on first paint so a shared link opens the same window.
  useEffect(() => {
    const q = params.get('window')
    if (isWindowKey(q) && q !== window) setWindow(q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const choose = (k: typeof window) => {
    setWindow(k)
    const next = new URLSearchParams(params.toString())
    next.set('window', k)
    router.replace(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="flex items-center rounded-xl bg-white/[0.04] border border-white/[0.06] p-0.5">
      {WINDOW_KEYS.map((k) => (
        <button
          key={k}
          onClick={() => choose(k)}
          className={`px-3 py-1.5 rounded-[10px] text-xs font-semibold tracking-wide transition-colors ${
            window === k ? 'bg-cyan-400/15 text-cyan-300 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.35)]' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {k}
        </button>
      ))}
    </div>
  )
}

function LiveToggle() {
  const live = useObserveStore((s) => s.live)
  const setLive = useObserveStore((s) => s.setLive)
  const lastRefreshed = useObserveStore((s) => s.lastRefreshed)
  return (
    <div className="flex items-center gap-3">
      <span className="hidden sm:inline text-[11px] text-slate-500 tabular-nums">
        {lastRefreshed ? `updated ${timeAgo(new Date(lastRefreshed).toISOString())}` : ''}
      </span>
      <button
        onClick={() => setLive(!live)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
          live ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:text-slate-200'
        }`}
        title={live ? 'Auto-refresh every 30 s (on)' : 'Auto-refresh (off)'}
      >
        <span className={`h-2 w-2 rounded-full ${live ? 'bg-emerald-400 observe-live-dot' : 'bg-slate-500'}`} />
        {live ? 'Live' : 'Paused'}
      </button>
    </div>
  )
}

export default function ObserveShell({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const user = useUserStore((s) => s.user)
  const current = NAV.find((n) => (n.exact ? pathname === n.href : pathname.startsWith(n.href)))

  return (
    <div className="observe-root min-h-dvh flex font-sans">
      <aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-white/[0.06] bg-slate-950/80 sticky top-0 h-dvh">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 shrink-0 rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-[0_0_24px_-8px_rgba(34,211,238,0.9)]">
              <Image src="/logo/trimmedlogo.png" alt="SchoolMule" width={36} height={36} unoptimized className="h-full w-full object-contain p-0.5" />
            </span>
            <div>
              <p className="font-display text-base font-semibold leading-none text-white">Observe</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500 mt-1">SchoolMule</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors ${
                  active ? 'bg-white/[0.06] text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? 'text-cyan-300' : ''}`} />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 pb-5 pt-3 border-t border-white/[0.06]">
          <p className="px-3 text-[11px] text-slate-500 truncate">{user.email}</p>
          <Link href="/dashboard" className="mt-1 flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-white/[0.03]">
            <ArrowUturnLeftIcon className="h-4 w-4" /> Back to SchoolMule
          </Link>
        </div>
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-slate-950/70 backdrop-blur-md">
          <div className="flex items-center justify-between gap-3 px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/dashboard" className="md:hidden text-slate-400 hover:text-white"><ArrowUturnLeftIcon className="h-5 w-5" /></Link>
              <h1 className="font-display text-lg font-semibold text-white truncate">{current?.label ?? 'Observe'}</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Suspense fallback={null}>
                <WindowPicker />
              </Suspense>
              <LiveToggle />
            </div>
          </div>
          <nav className="md:hidden flex gap-1 overflow-x-auto px-3 pb-2">
            {NAV.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href)
              return (
                <Link key={href} href={href} className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap ${active ? 'bg-white/[0.08] text-white' : 'text-slate-400'}`}>
                  {label}
                </Link>
              )
            })}
          </nav>
        </header>
        <main className="flex-1 px-4 sm:px-6 py-5 max-w-[1600px] w-full mx-auto">{children}</main>
      </div>
    </div>
  )
}
