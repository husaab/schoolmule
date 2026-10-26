import { FC } from 'react'
import Link from 'next/link'

export type FooterLink = { href: string; label: string }

const FooterColumn: FC<{ title: string; links: FooterLink[] }> = ({ title, links }) => (
  <div>
    <h2 className="mb-3 text-sm font-semibold text-ink">{title}</h2>
    <ul className="grid gap-2">
      {links.map((l) => (
        <li key={l.href}>
          <Link href={l.href} className="text-slate-600 transition-colors duration-150 hover:text-ink">
            {l.label}
          </Link>
        </li>
      ))}
    </ul>
  </div>
)

export default FooterColumn
