'use client'

// One admin tool: its icon in the group's hue, its name, and one live line
// (lib/adminOverview), or what the tool is for when there's nothing live to
// say. A count pill shows what in it needs someone. The star pins the tool to
// the top; with a mouse it shows on hover, on touch it is always there.

import React from 'react'
import Link from 'next/link'
import { ChevronRightIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import type { AdminTool, AdminToolTone } from '@/lib/adminTools'
import type { ToolStatus } from '@/lib/adminOverview'
import { STATUS_TEXT, TONE_CHIP, TOOL_ICONS } from './toolIcons'

interface ToolRowProps {
  tool: AdminTool
  tone: AdminToolTone
  status: ToolStatus | null
  /** The overview is still on its way: a placeholder where the live line goes. */
  loading: boolean
  /** How many things in this tool need someone. */
  count: number
  pinned: boolean
  onTogglePin: (tool: AdminTool) => void
  /** In search results, the group the tool sits in. */
  groupLabel?: string
}

/** A tool's icon on its group's hue. */
export const ToolChip = ({ tool, tone, size = 'md' }: { tool: AdminTool; tone: AdminToolTone; size?: 'sm' | 'md' }) => {
  const Icon = TOOL_ICONS[tool.icon]
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-lg ${size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'} ${TONE_CHIP[tone]}`}>
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  )
}

/** How many things in a tool need someone. */
export const CountPill = ({ count }: { count: number }) => (
  <span
    className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold tabular-nums text-amber-800 ring-1 ring-inset ring-amber-200"
    aria-label={`${count} need${count === 1 ? 's' : ''} attention`}
  >
    {count}
  </span>
)

const ToolRow: React.FC<ToolRowProps> = ({ tool, tone, status, loading, count, pinned, onTogglePin, groupLabel }) => {
  return (
    <li className="group flex items-center gap-1 pr-2">
      <Link
        href={tool.href}
        data-tool-link
        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500"
      >
        <ToolChip tool={tool} tone={tone} />
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="truncate text-sm font-medium text-slate-900">{tool.label}</span>
            {groupLabel && <span className="shrink-0 text-xs text-slate-400">{groupLabel}</span>}
          </span>
          {loading && !status ? (
            <span className="mt-1.5 block h-2.5 w-40 max-w-full rounded-full bg-slate-100 motion-safe:animate-pulse" aria-hidden />
          ) : (
            <span className={`mt-0.5 block truncate text-xs ${status ? STATUS_TEXT[status.tone] : 'text-slate-500'}`}>
              {status?.line ?? tool.description}
            </span>
          )}
        </span>
        {count > 0 && <CountPill count={count} />}
        <ChevronRightIcon
          className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-slate-500 motion-safe:group-hover:translate-x-0.5"
          aria-hidden
        />
      </Link>
      <button
        type="button"
        onClick={() => onTogglePin(tool)}
        aria-pressed={pinned}
        aria-label={pinned ? `Unpin ${tool.label}` : `Pin ${tool.label} to the top`}
        title={pinned ? 'Unpin' : 'Pin to the top'}
        className={`shrink-0 cursor-pointer rounded-lg p-2 transition focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 pointer-coarse:p-3 ${
          pinned
            ? 'text-cyan-600 hover:bg-cyan-50'
            : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100'
        }`}
      >
        {pinned ? <StarSolidIcon className="h-4 w-4" /> : <StarIcon className="h-4 w-4" />}
      </button>
    </li>
  )
}

export default ToolRow
