'use client'
import type { ReactNode } from 'react'
import { FILM } from '@/lib/marketing/site'
import { openFilm } from './filmEvents'
import { buttonStyles, cx } from '../ui'

/** "Watch the tour 1:41": opens the full film with sound. */
export default function WatchFilmButton({
  start = 0,
  from,
  variant = 'button',
  children = 'Watch the tour',
  showLength = true,
  className,
}: {
  start?: number
  from: string
  variant?: 'button' | 'link'
  children?: ReactNode
  showLength?: boolean
  className?: string
}) {
  if (variant === 'link') {
    return (
      <button
        type="button"
        onClick={() => openFilm(start, from)}
        className={cx(
          'inline-flex items-center gap-2 rounded-sm font-semibold text-brand-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30',
          className,
        )}
      >
        {children} {showLength && <span className="font-medium text-slate-600">{FILM.length}</span>}
      </button>
    )
  }
  return (
    <button type="button" onClick={() => openFilm(start, from)} className={cx(buttonStyles.secondary, className)}>
      <span aria-hidden className="grid size-9 place-items-center rounded-full bg-brand-ink text-white">
        <svg viewBox="0 0 10 12" className="ml-0.5 size-3 fill-current">
          <path d="M0 0l10 6-10 6z" />
        </svg>
      </span>
      {children}
      {showLength && <span className="font-medium text-slate-600">{FILM.length}</span>}
    </button>
  )
}
