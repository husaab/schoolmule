// src/components/observe/pills.tsx
// Small coloured labels. Colour is semantic (see chartTheme).
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

const OUTCOME: Record<string, string> = { success: 'bg-emerald-400/15 text-emerald-300', bad_password: 'bg-amber-400/15 text-amber-300', unknown_email: 'bg-rose-400/15 text-rose-300', archived: 'bg-white/[0.06] text-slate-400', not_verified: 'bg-sky-400/15 text-sky-300' }
export const OutcomePill = ({ outcome }: { outcome: string }) => <span className={`${base} ${OUTCOME[outcome] ?? 'bg-white/[0.06] text-slate-400'}`}>{outcome.replace('_', ' ')}</span>

const DEPLOY: Record<string, string> = { SUCCESS: 'bg-emerald-400/15 text-emerald-300', FAILED: 'bg-rose-400/15 text-rose-300', CRASHED: 'bg-rose-400/15 text-rose-300', BUILDING: 'bg-sky-400/15 text-sky-300', DEPLOYING: 'bg-sky-400/15 text-sky-300', REMOVED: 'bg-white/[0.06] text-slate-500', SLEEPING: 'bg-white/[0.06] text-slate-400' }
export const DeployPill = ({ status }: { status: string }) => <span className={`${base} ${DEPLOY[status] ?? 'bg-white/[0.06] text-slate-400'}`}>{status.toLowerCase()}</span>

export const ImpersonationMark = () => <span className={`${base} bg-violet-400/15 text-violet-300`} title="Admin preview session">preview</span>
