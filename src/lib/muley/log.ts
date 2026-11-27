// src/lib/muley/log.ts
// Admin Panel → Muley activity: the school's log of changes prepared through
// Muley (GET /api/assistant/log). The filters, what each status is called,
// and each entry's timeline in words. Pure, so the web page and the app's
// screen say the same thing (muley.test.ts).

export type MuleyLogStatus = 'pending' | 'applying' | 'applied' | 'undoing' | 'undone' | 'rejected' | 'expired' | 'failed'

export type MuleyLogEntry = {
  id: string
  kind: string
  kindLabel: string
  status: MuleyLogStatus
  title: string
  changes: { name: string; now: string | null; next: string | null }[]
  written: number | null
  error: string | null
  preparedBy: string
  preparedAs: string | null
  preparedAt: string
  savedBy: string | null
  savedAt: string | null
  undoneBy: string | null
  undoneAt: string | null
  expiresAt: string | null
}

export const LOG_FILTERS: { key: string; label: string; status: MuleyLogStatus | null }[] = [
  { key: 'all', label: 'All', status: null },
  { key: 'applied', label: 'Saved', status: 'applied' },
  { key: 'undone', label: 'Undone', status: 'undone' },
  { key: 'pending', label: 'Waiting', status: 'pending' },
  { key: 'rejected', label: 'Dismissed', status: 'rejected' },
  { key: 'expired', label: 'Expired', status: 'expired' },
]

export type LogTone = 'good' | 'info' | 'warn' | 'muted'

export const LOG_STATUS: Record<MuleyLogStatus, { label: string; tone: LogTone }> = {
  pending: { label: 'Waiting for Save', tone: 'warn' },
  applying: { label: 'Saving', tone: 'info' },
  applied: { label: 'Saved', tone: 'good' },
  undoing: { label: 'Undoing', tone: 'info' },
  undone: { label: 'Undone', tone: 'muted' },
  rejected: { label: 'Dismissed', tone: 'muted' },
  expired: { label: 'Expired', tone: 'muted' },
  failed: { label: 'Failed', tone: 'warn' },
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "27 Nov, 2:05 PM" in the device's own time, written the same on every runtime. */
export function logTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const h = d.getHours()
  return `${d.getDate()} ${MONTHS[d.getMonth()]}, ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`
}

const VIEW = { TEACHER: 'teacher', ADMIN: 'admin', PARENT: 'parent' } as Record<string, string>

/** The entry's story, one line each: prepared, then saved, then undone (whichever happened). */
export function logTimeline(entry: MuleyLogEntry): string[] {
  const as = entry.preparedAs && VIEW[entry.preparedAs] ? ` (${VIEW[entry.preparedAs]})` : ''
  const lines = [`Asked for by ${entry.preparedBy}${as}, ${logTime(entry.preparedAt)}`]
  if (entry.savedAt) {
    const count = entry.written === null ? '' : entry.written === 0 ? ' · nothing needed changing' : ` · ${entry.written} ${entry.written === 1 ? 'value' : 'values'} written`
    lines.push(`Saved by ${entry.savedBy || entry.preparedBy}, ${logTime(entry.savedAt)}${count}`)
  }
  if (entry.undoneAt) lines.push(`Undone by ${entry.undoneBy || entry.preparedBy}, ${logTime(entry.undoneAt)}`)
  if (entry.status === 'pending' && entry.expiresAt) lines.push(`Not saved yet · expires ${logTime(entry.expiresAt)}`)
  if (entry.error) lines.push(entry.error)
  return lines
}
