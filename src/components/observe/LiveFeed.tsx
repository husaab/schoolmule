// src/components/observe/LiveFeed.tsx
import type { FeedItem } from '@/services/types/observe'
import { fmtTime } from './format'
import { ImpersonationMark, MethodTag, StatusPill } from './pills'
import UserChip from './UserChip'

export default function LiveFeed({ items }: { items: FeedItem[] }) {
  if (items.length === 0) return <p className="text-xs text-slate-500 py-6 text-center">No requests yet</p>
  return (
    <ul className="divide-y divide-white/[0.04] -mx-5">
      {items.map((it) => (
        <li key={`${it.requestId}-${it.ts}`} className="px-5 py-2 flex items-center gap-3 text-xs">
          <span className="font-mono text-slate-500 tabular-nums w-16 shrink-0">{fmtTime(it.ts)}</span>
          <StatusPill status={it.status} />
          <MethodTag method={it.method} />
          <span className="font-mono text-slate-300 truncate min-w-0 flex-1" title={it.path}>{it.route}</span>
          {it.impersonated && <ImpersonationMark />}
          <span className="font-mono text-slate-500 tabular-nums w-14 text-right shrink-0 hidden 2xl:inline">{it.durationMs} ms</span>
          <span className="w-28 shrink-0 min-w-0"><UserChip user={it.user} compact /></span>
          {it.errorMessage && <span className="hidden xl:inline text-rose-300/90 truncate max-w-[220px]" title={it.errorMessage}>{it.errorMessage}</span>}
        </li>
      ))}
    </ul>
  )
}
