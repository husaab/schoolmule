import type { Participant, SenderRole } from '@/services/types/messaging'

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** "2:14 PM" */
export const formatTime = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })
}

/** "Today" / "Yesterday" / "Oct 3" / "Oct 3, 2025" */
export const formatDayLabel = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (sameDay(d, now)) return 'Today'
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (sameDay(d, yesterday)) return 'Yesterday'
  return d.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    ...(d.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  })
}

/** Compact stamp for list rows: time today, weekday this week, else a date. */
export const formatListStamp = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const now = new Date()
  if (sameDay(d, now)) return formatTime(iso)
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000)
  if (diffDays < 7) return d.toLocaleDateString('en-CA', { weekday: 'short' })
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

/** "1.2 MB" */
export const formatBytes = (n: number) => {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('') || '?'

/** "Layla Test (Mother)" for guardians, plain name for staff. */
export const displayName = (p: { name: string; role: SenderRole; relation?: string | null }) =>
  p.role === 'PARENT' && p.relation ? `${p.name} (${p.relation})` : p.name

/** One line naming who else is in the thread, for headers and the composer. */
export const othersLabel = (participants: Participant[], myId: string | null) => {
  const others = participants.filter((p) => p.userId !== myId)
  if (others.length === 0) return ''
  const names = others.map((p) => (p.role === 'PARENT' ? p.name.split(' ')[0] : p.name))
  if (names.length <= 2) return names.join(' and ')
  return `${names.slice(0, 2).join(', ')} and ${names.length - 2} more`
}

export const isImage = (mimeType: string) => mimeType.startsWith('image/')

/** Mirrors the backend allow-list so a rejected file never leaves the browser. */
export const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  '.jpg': ['image/jpeg'],
  '.jpeg': ['image/jpeg'],
  '.png': ['image/png'],
  '.gif': ['image/gif'],
  '.webp': ['image/webp'],
  '.pdf': ['application/pdf'],
  '.doc': ['application/msword'],
  '.docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}
export const ACCEPT_ATTR = Object.keys(ALLOWED_EXTENSIONS).join(',')
export const MAX_FILE_BYTES = 10 * 1024 * 1024
export const MAX_FILES = 5
export const MAX_BODY = 5000

/** Returns a human reason when a file must be refused, else null. */
export const fileProblem = (file: File): string | null => {
  const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
  const allowed = ALLOWED_EXTENSIONS[ext]
  if (!allowed || (file.type && !allowed.includes(file.type))) {
    return `${file.name}: only images, PDF and Word documents are allowed`
  }
  if (file.size > MAX_FILE_BYTES) return `${file.name} is larger than 10 MB`
  return null
}
