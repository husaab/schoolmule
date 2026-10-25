import { FC } from 'react'
import Link from 'next/link'
import Logo from '@/components/marketing/Logo'
import { CONTACT_EMAIL, PRODUCT_LINKS, SCHOOL_LINKS } from '@/lib/marketing/site'

// The website's footer. Also used by the sign-in and sign-up pages.
const COLUMNS = [
  { title: 'Product', links: PRODUCT_LINKS.map(({ href, label }) => ({ href, label })) },
  { title: 'Schools', links: SCHOOL_LINKS },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/demo', label: 'Book a demo' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    title: 'Already a SchoolMule school',
    links: [
      { href: '/login', label: 'Log in' },
      { href: '/signup', label: 'Sign up' },
    ],
  },
]

const Footer: FC = () => {
  const year = new Date().getFullYear()
  return (
    <footer className="mk border-t border-hairline bg-white">
      <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.3fr_2fr] lg:px-8">
        <div className="grid content-start gap-4">
          <Logo />
          <p className="max-w-xs leading-relaxed text-slate-600">
            The school system for small independent schools in Ontario, from JK to Grade 8.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="w-fit rounded-sm font-semibold text-brand-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="mb-3 text-sm font-semibold text-ink">{col.title}</h2>
              <ul className="grid gap-2">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-slate-600 transition-colors duration-150 hover:text-ink">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="border-t border-hairline">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-sm text-slate-600 sm:px-6 lg:px-8">
          <p>© {year} SchoolMule</p>
          <div className="flex gap-5">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
