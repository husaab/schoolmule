'use client'

// "Not sent" / "2 of 13 sent" / "Live" pill. Renders as a button when a click
// handler is given and there is something to manage; a "Not sent" badge is
// plain text so the click falls through to whatever the header does.

import React from 'react'
import { CheckIcon } from '@heroicons/react/24/outline'
import {
  publicationLabel,
  publicationTitle,
  type PublicationSummary,
} from '@/lib/publicationSummary'

interface PublishStateBadgeProps {
  summary: PublicationSummary
  /** `header` is the compact column-header pill; `chip` is the larger modal chip. */
  variant: 'header' | 'chip'
  /** Opens the publish/manage flow. Ignored while nothing is published. */
  onClick?: () => void
}

const TONE: Record<PublicationSummary['state'], { header: string; chip: string }> = {
  none: {
    header: 'bg-slate-100 text-slate-400',
    chip: 'bg-white text-slate-500 ring-1 ring-slate-200',
  },
  partial: {
    header: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
    chip: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/70',
  },
  all: {
    header: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
    chip: 'bg-emerald-50 text-emerald-700',
  },
}

const PublishStateBadge: React.FC<PublishStateBadgeProps> = ({ summary, variant, onClick }) => {
  const label = publicationLabel(summary, variant === 'chip' ? 'long' : 'short')
  const tone = TONE[summary.state][variant]
  const shape =
    variant === 'header'
      ? 'inline-block mt-1 px-1.5 py-0.5 text-xs font-medium rounded'
      : 'inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium'
  const interactive = Boolean(onClick) && summary.state !== 'none'

  const content = (
    <>
      {variant === 'chip' && summary.state === 'all' && <CheckIcon className="h-4 w-4" />}
      {label}
    </>
  )

  if (interactive) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onClick?.()
        }}
        className={`${shape} ${tone} cursor-pointer`}
        title={publicationTitle(summary)}
      >
        {content}
      </button>
    )
  }
  return (
    <span className={`${shape} ${tone}`} title={publicationTitle(summary)}>
      {content}
    </span>
  )
}

export default PublishStateBadge
