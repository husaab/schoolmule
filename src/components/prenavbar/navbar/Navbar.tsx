'use client'
import { FC, useEffect, useId, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronDown, Menu, X } from 'lucide-react'
import Logo from '@/components/marketing/Logo'
import { ArrowDisc, buttonStyles, cx } from '@/components/marketing/ui'
import { PRODUCT_LINKS, SCHOOL_LINKS, VIEW_COLOURS } from '@/lib/marketing/site'
import { trackEvent } from '@/components/marketing/film/filmEvents'

// The website's navbar: a floating bar with the one call to action, "Book a
// demo", always in reach (also on phones). Product opens a menu with the
// overview first, then the four views, then the school pages.
//
// Also used by the sign-in and sign-up pages, so it takes no props.

const NAV = [
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
]

const NavBar: FC = () => {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [productOpen, setProductOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const productRef = useRef<HTMLDivElement>(null)
  const menuId = useId()
  const productId = useId()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menus on navigation (adjusting state while rendering, not in an effect).
  const [shownPath, setShownPath] = useState(pathname)
  if (pathname !== shownPath) {
    setShownPath(pathname)
    setProductOpen(false)
    setMenuOpen(false)
  }

  // Product menu: close on outside click and Escape.
  useEffect(() => {
    if (!productOpen) return
    const onDown = (e: MouseEvent) => {
      if (!productRef.current?.contains(e.target as Node)) setProductOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setProductOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [productOpen])

  // Phone menu: lock the page behind it and close on Escape.
  useEffect(() => {
    if (!menuOpen) return
    const before = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = before
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const productActive = pathname === '/product' || pathname?.startsWith('/for/')
  const linkClass = (active: boolean) =>
    cx(
      'rounded-full px-3.5 py-2 text-[0.95rem] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30',
      active ? 'text-ink' : 'text-slate-600 hover:text-ink',
    )

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3 sm:px-4">
      <a
        href="#main"
        className="sr-only rounded-full bg-white px-4 py-2 font-semibold text-ink focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60]"
      >
        Skip to content
      </a>
      <nav
        aria-label="Main"
        className={cx(
          'mx-auto flex h-16 max-w-[1200px] items-center gap-2 rounded-full pl-3 pr-1.5 transition-[background-color,box-shadow] duration-300 ease-film sm:pl-5 sm:pr-2',
          scrolled || menuOpen
            ? 'bg-white/90 shadow-[0_10px_30px_-14px_rgba(11,19,36,0.22)] ring-1 ring-ink/[0.07] backdrop-blur-xl'
            : 'bg-white/95 ring-1 ring-ink/[0.05] backdrop-blur-md',
        )}
      >
        <Logo onClick={() => setMenuOpen(false)} />

        <div className="ml-6 hidden items-center gap-0.5 lg:flex">
          <div ref={productRef} className="relative">
            <button
              type="button"
              aria-expanded={productOpen}
              aria-controls={productId}
              onClick={() => setProductOpen((o) => !o)}
              className={cx(linkClass(!!productActive), 'inline-flex items-center gap-1')}
            >
              Product
              <ChevronDown
                aria-hidden
                strokeWidth={1.75}
                className={cx('size-4 transition-transform duration-200 ease-film', productOpen && 'rotate-180')}
              />
            </button>
            <div
              id={productId}
              hidden={!productOpen}
              className="absolute left-0 top-[calc(100%+12px)] w-[34rem] origin-top-left rounded-[1.4rem] bg-white p-2 shadow-[0_24px_60px_-20px_rgba(11,19,36,0.35)] ring-1 ring-ink/[0.07]"
            >
              <div className="grid grid-cols-[1.1fr_1fr] gap-1">
                <div className="grid gap-0.5">
                  {PRODUCT_LINKS.map((l) => (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setProductOpen(false)}
                      className="group grid grid-cols-[auto_1fr] items-start gap-3 rounded-2xl px-3 py-2.5 hover:bg-mist focus-visible:bg-mist focus-visible:outline-none"
                    >
                      <span
                        aria-hidden
                        className={cx('mt-1.5 size-2.5 rounded-full', l.view ? VIEW_COLOURS[l.view].dot : 'bg-ink')}
                      />
                      <span>
                        <span className="block font-semibold text-ink">{l.label}</span>
                        <span className="block text-sm text-slate-600">{l.blurb}</span>
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="grid content-start gap-2 rounded-[1.1rem] bg-mist p-4">
                  <p className="text-sm font-medium text-slate-600">By school</p>
                  {SCHOOL_LINKS.map((l) => (
                    <Link key={l.href} href={l.href} onClick={() => setProductOpen(false)} className="font-semibold text-ink hover:text-brand-ink">
                      {l.label}
                    </Link>
                  ))}
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    Built for small independent schools in Ontario, from JK to Grade 8.
                  </p>
                </div>
              </div>
            </div>
          </div>
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className={linkClass(pathname === l.href)}>
              {l.label}
            </Link>
          ))}
        </div>

        {/* Families and staff come here to log in or sign up as often as
            principals come for a demo, so all three sit side by side; on
            phones the demo moves into the menu (every hero has one too). */}
        <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
          <Link href="/login" className={cx(linkClass(pathname === '/login'), 'whitespace-nowrap px-2 sm:px-3.5')}>
            Log in
          </Link>
          <Link
            href="/signup"
            className={cx(
              'inline-flex min-h-9 items-center whitespace-nowrap rounded-full bg-white px-3 text-[0.92rem] font-semibold text-ink ring-1 ring-hairline sm:min-h-10 sm:px-4 sm:text-[0.95rem] transition-[box-shadow,transform] duration-200 ease-film hover:ring-slate-300 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30',
              pathname?.startsWith('/signup') && 'ring-slate-300',
            )}
          >
            Sign up
          </Link>
          <Link
            href="/demo"
            onClick={() => trackEvent('demo_click', { from: 'navbar' })}
            className="hidden min-h-10 items-center whitespace-nowrap rounded-full bg-brand-ink px-4 text-[0.95rem] font-semibold text-white transition-[background-color,transform] duration-200 ease-film hover:bg-brand-deep active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/35 sm:inline-flex"
          >
            Book a demo
          </Link>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-full text-ink hover:bg-mist sm:size-11 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30 lg:hidden"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? <X className="size-5" strokeWidth={1.75} /> : <Menu className="size-5" strokeWidth={1.75} />}
          </button>
        </div>
      </nav>

      {/* Phone and tablet menu */}
      <div
        id={menuId}
        hidden={!menuOpen}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('a')) setMenuOpen(false)
        }}
        className="fixed inset-x-0 bottom-0 top-[5.25rem] overflow-y-auto bg-white px-4 pb-10 pt-4 lg:hidden"
      >
        <div className="mx-auto grid max-w-lg gap-1">
          <Link
            href="/demo"
            onClick={() => trackEvent('demo_click', { from: 'navbar-menu' })}
            className={cx(buttonStyles.primary, 'mb-4 w-full sm:hidden')}
          >
            Book a demo
            <ArrowDisc />
          </Link>
          <p className="px-3 pb-1 text-sm font-medium text-slate-600">Product</p>
          {PRODUCT_LINKS.map((l, i) => (
            <Link
              key={l.href}
              href={l.href}
              style={{ animationDelay: `${40 + i * 35}ms` }}
              className="mk-rise flex items-center gap-3 rounded-2xl px-3 py-3 text-lg font-semibold text-ink hover:bg-mist"
            >
              <span aria-hidden className={cx('size-2.5 rounded-full', l.view ? VIEW_COLOURS[l.view].dot : 'bg-ink')} />
              {l.label}
            </Link>
          ))}
          {SCHOOL_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="mk-rise flex items-center gap-3 rounded-2xl px-3 py-3 text-lg font-semibold text-ink hover:bg-mist [animation-delay:220ms]">
              <span aria-hidden className="size-2.5 rounded-full bg-slate-300" />
              {l.label}
            </Link>
          ))}
          <div className="my-3 h-px bg-hairline" />
          {NAV.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-2xl px-3 py-3 text-lg font-semibold text-ink hover:bg-mist">
              {l.label}
            </Link>
          ))}
          <Link href="/login" className="rounded-2xl px-3 py-3 text-lg font-semibold text-ink hover:bg-mist">
            Log in
          </Link>
          <Link href="/signup" className="rounded-2xl px-3 py-3 text-lg font-semibold text-ink hover:bg-mist">
            Sign up
          </Link>
        </div>
      </div>
    </header>
  )
}

export default NavBar
