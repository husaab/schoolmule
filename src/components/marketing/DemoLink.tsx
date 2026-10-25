'use client'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { trackEvent } from './film/filmEvents'
import { ArrowDisc, buttonStyles, cx } from './ui'

/** The site's one call to action. Counts clicks by where they came from. */
export default function DemoLink({
  from,
  children = 'Book a demo',
  className,
}: {
  from: string
  children?: ReactNode
  className?: string
}) {
  return (
    <Link href="/demo" onClick={() => trackEvent('demo_click', { from })} className={cx(buttonStyles.primary, className)}>
      {children}
      <ArrowDisc />
    </Link>
  )
}
