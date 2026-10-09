// Builds a Markdown error report an engineer (or a coding agent) can act on.
// Deliberately omits names and emails: roles and schools are enough context
// for a fix, and the report tends to get pasted into other tools.
import type { ErrorGroupData, ErrorRangeData, ObserveUserRef } from '@/services/types/observe'

const fence = (s: string) => '```\n' + s.replace(/```/g, "'''") + '\n```'
const who = (u: ObserveUserRef | null) => (u ? `${(u.role ?? 'user').toLowerCase()} @ ${(u.school ?? 'unknown').toLowerCase()}` : 'anonymous')

const CONTEXT = `## Codebase context
- Backend: \`schoolmule-backend\` (Express 5, pg, pino). Pattern: routes → controllers → queries. Controllers catch their own errors and log with \`logger.error\`; the message above is that log line plus the thrown error.
- Frontend: \`schoolmule\` (Next 16 app router). Browser errors are reported from \`src/services/clientErrors.ts\`.
- \`request id\` matches the \`X-Request-Id\` response header and \`request_events.request_id\` in Postgres, where the request's route, status, user and duration are stored.

## Ask
Find the root cause, propose the smallest fix, and add a test that fails before and passes after.`

function distinctStacks(rows: { stack: string | null }[], max: number): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const r of rows) {
    if (!r.stack) continue
    const key = r.stack.split('\n').slice(0, 3).join('\n')
    if (seen.has(key)) continue
    seen.add(key)
    out.push(r.stack)
    if (out.length >= max) break
  }
  return out
}

export function buildGroupReport(d: ErrorGroupData): string {
  const g = d.group
  const stacks = distinctStacks(d.occurrences, 3)
  const affected = d.affectedUsers.map((a) => `${a.count}× ${who(a.user)}`).join(', ') || 'no signed-in users'
  const recent = d.occurrences.slice(0, 10).map((o) =>
    `- ${o.ts}${o.status !== null ? ` · HTTP ${o.status}` : ''}${o.requestId ? ` · request id ${o.requestId}` : ''} · ${who(o.user)}`
  )
  return [
    `# SchoolMule error report`,
    ``,
    `- **Fingerprint:** ${g.fingerprint}`,
    `- **Source:** ${g.source} (${g.source === 'server' ? 'backend log / crash' : 'browser'})`,
    `- **Where:** \`${g.location ?? 'unknown'}\``,
    `- **Message:** ${g.message}`,
    `- **Occurrences:** ${g.count} in the last ${d.window.key} (${d.window.from} → ${d.window.to})`,
    `- **First seen:** ${g.firstSeen} · **Last seen:** ${g.lastSeen}`,
    `- **Affected:** ${affected}`,
    ``,
    `## Stack trace${stacks.length > 1 ? 's (distinct)' : ''}`,
    stacks.length ? stacks.map(fence).join('\n\n') : '_No stack captured for this group._',
    ``,
    `## Recent occurrences`,
    recent.length ? recent.join('\n') : '_none in window_',
    ``,
    CONTEXT,
  ].join('\n')
}

export function buildSliceReport(r: ErrorRangeData): string {
  const groups = r.groups.map((g) => `- ${g.count}× [${g.source}] \`${g.location ?? 'unknown'}\` — ${g.message} (fingerprint ${g.fingerprint})`)
  const stacks = r.groups.slice(0, 3).map((g) => {
    const sample = r.errors.find((e) => e.fingerprint === g.fingerprint && e.stack)
    return sample ? `### ${g.message}\n${fence(sample.stack as string)}` : null
  }).filter(Boolean)
  return [
    `# SchoolMule error spike report`,
    ``,
    `- **Slice:** ${r.from} → ${r.to}`,
    `- **Errors in slice:** ${r.errors.length}${r.errors.length >= 200 ? ' (capped at 200)' : ''} across ${r.groups.length} groups`,
    ``,
    `## What broke, most frequent first`,
    groups.join('\n') || '_nothing_',
    ``,
    `## Sample stack traces`,
    stacks.join('\n\n') || '_No stacks captured in this slice._',
    ``,
    CONTEXT,
  ].join('\n')
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
