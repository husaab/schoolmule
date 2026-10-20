'use client'

// A link that only links for those who can open its page (lib/permissions):
// anyone else sees the same text without a link, never one that bounces them
// home with "You don't have access to that page".

import React from 'react'
import Link from 'next/link'
import { useAccess } from '@/hooks/useAccess'

type Props = { href: string; className?: string; children: React.ReactNode }

const GatedLink: React.FC<Props> = ({ href, className, children }) => {
  const { canOpen } = useAccess()
  return canOpen(href)
    ? <Link href={href} className={className}>{children}</Link>
    : <span className={className}>{children}</span>
}

export default GatedLink
