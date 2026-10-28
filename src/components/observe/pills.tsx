// src/components/observe/pills.tsx
// Small coloured labels. Colour is semantic (see chartTheme).
import type { AlertTier } from '@/services/types/observe'
import { TIER_LABEL } from '@/lib/observeAlerts'

const base = 'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase'

export const StatusPill = ({ status }: { status: number }) => {
  const cls = status >= 500 ? 'bg-rose-400/15 text-rose-300' : status >= 400 ? 'bg-amber-400/15 text-amber-300' : status >= 300 ? 'bg-white/[0.06] text-slate-400' : 'bg-emerald-400/15 text-emerald-300'
  return <span className={`${base} font-mono ${cls}`}>{status}</span>
}

export const MethodTag = ({ method }: { method: string }) => (
  <span className={`${base} font-mono bg-white/[0.05] text-slate-400`}>{method}</span>
)

const ROLE: Record<string, string> = { ADMIN: 'bg-cyan-400/15 text-cyan-300', TEACHER: 'bg-sky-400/15 text-sky-300', PARENT: 'bg-amber-400/15 text-amber-300' }
export const RolePill = ({ role }: { role: string | null }) => (role ? <span className={`${base} ${ROLE[role] ?? 'bg-white/[0.06] text-slate-400'}`}>{role.toLowerCase()}</span> : null)

export const SchoolPill = ({ school }: { school: string | null }) => (school ? <span className={`${base} bg-white/[0.05] text-slate-400 normal-case`}>{school.toLowerCase()}</span> : null)

export const SourcePill = ({ source }: { source: 'server' | 'client' }) => (
  <span className={`${base} ${source === 'server' ? 'bg-violet-400/15 text-violet-300' : 'bg-pink-400/15 text-pink-300'}`}>{source}</span>
)

const OUTCOME: Record<string, string> = { success: 'bg-emerald-400/15 text-emerald-300', bad_password: 'bg-amber-400/15 text-amber-300', unknown_email: 'bg-rose-400/15 text-rose-300', archived: 'bg-white/[0.06] text-slate-400', not_verified: 'bg-sky-400/15 text-sky-300', google_unverified_email: 'bg-amber-400/15 text-amber-300' }
export const OutcomePill = ({ outcome }: { outcome: string }) => <span className={`${base} ${OUTCOME[outcome] ?? 'bg-white/[0.06] text-slate-400'}`}>{outcome.replaceAll('_', ' ')}</span>

const DEPLOY: Record<string, string> = { SUCCESS: 'bg-emerald-400/15 text-emerald-300', FAILED: 'bg-rose-400/15 text-rose-300', CRASHED: 'bg-rose-400/15 text-rose-300', BUILDING: 'bg-sky-400/15 text-sky-300', DEPLOYING: 'bg-sky-400/15 text-sky-300', REMOVED: 'bg-white/[0.06] text-slate-500', SLEEPING: 'bg-white/[0.06] text-slate-400' }
export const DeployPill = ({ status }: { status: string }) => <span className={`${base} ${DEPLOY[status] ?? 'bg-white/[0.06] text-slate-400'}`}>{status.toLowerCase()}</span>

const PATTERN: Record<string, string> = { timer: 'bg-amber-400/15 text-amber-300', duplicate: 'bg-rose-400/15 text-rose-300', burst: 'bg-violet-400/15 text-violet-300' }
/** Scanner cadence label: timer = steady poll, duplicate = same fetch from several mounts, burst = some sub-2 s gaps. */
export const PatternPill = ({ pattern }: { pattern: string | null }) =>
  pattern ? <span className={`${base} ${PATTERN[pattern] ?? 'bg-white/[0.06] text-slate-400'}`}>{pattern}</span> : <span className="text-slate-600">—</span>

export const ImpersonationMark = () => <span className={`${base} bg-violet-400/15 text-violet-300`} title="Admin preview session">preview</span>

const TIER: Record<string, string> = { critical: 'bg-rose-400/15 text-rose-300', warning: 'bg-amber-400/15 text-amber-300', info: 'bg-sky-400/15 text-sky-300' }
export const TierPill = ({ tier }: { tier: AlertTier }) => <span className={`${base} ${TIER[tier] ?? 'bg-white/[0.06] text-slate-400'}`}>{TIER_LABEL[tier] ?? tier}</span>

export const IncidentStatusPill = ({ status, held = false }: { status: 'open' | 'resolved'; held?: boolean }) =>
  status === 'open' ? (
    <span className={`${base} gap-1.5 ${held ? 'bg-amber-400/15 text-amber-300' : 'bg-rose-400/15 text-rose-300'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${held ? 'bg-amber-300' : 'bg-rose-300 observe-live-dot'}`} />
      {held ? 'held till 7 am' : 'firing'}
    </span>
  ) : (
    <span className={`${base} bg-emerald-400/15 text-emerald-300`}>recovered</span>
  )

const RULE_STATE: Record<string, [string, string]> = {
  firing: ['bg-rose-400/15 text-rose-300', 'tripping'],
  ok: ['bg-emerald-400/15 text-emerald-300', 'ok'],
  muted: ['bg-amber-400/15 text-amber-300', 'muted'],
  watch: ['bg-violet-400/15 text-violet-300', 'watch only'],
  off: ['bg-white/[0.06] text-slate-500', 'off'],
  external: ['bg-white/[0.06] text-slate-400', 'railway'],
  'no-data': ['bg-white/[0.06] text-slate-400', 'no data'],
}
export const RuleStatePill = ({ state }: { state: string }) => {
  const [cls, label] = RULE_STATE[state] ?? RULE_STATE['no-data']
  return <span className={`${base} ${cls}`}>{label}</span>
}
