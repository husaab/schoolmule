'use client'

// An in-app "Back" that returns to a list page exactly as the user left it:
// the href carries the page's remembered filters (see useRememberedHref), so
// hover, cmd-click and plain click all land on the filtered list. Use it in
// place of a hard-coded <Link href="/classes">.

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { useRememberedHref } from '@/hooks/useFilterParams'

type BackLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  /** The bare list path to return to, e.g. "/classes". */
  to: string
}

const BackLink = ({ to, ...rest }: BackLinkProps) => <Link href={useRememberedHref(to)} {...rest} />

export default BackLink
