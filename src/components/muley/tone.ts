// The panel's colours: cyan and teal for staff, the parent portal's amber for
// a parent, so Muley looks at home in either portal.

export type MuleyTone = {
  header: string
  headerText: string
  bubble: string
  send: string
  starter: string
  launcherRing: string
}

const STAFF: MuleyTone = {
  header: 'border-cyan-100 bg-gradient-to-r from-cyan-50 to-teal-50',
  headerText: 'text-cyan-800',
  bubble: 'border-cyan-100 bg-gradient-to-br from-cyan-50 to-teal-50',
  send: 'bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600',
  starter: 'border-cyan-100 text-cyan-900 hover:border-cyan-300 hover:bg-cyan-50',
  launcherRing: 'ring-cyan-200 shadow-[0_6px_18px_rgba(8,145,178,0.28)]',
}

const PARENT: MuleyTone = {
  header: 'border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50',
  headerText: 'text-amber-800',
  bubble: 'border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50',
  send: 'bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600',
  starter: 'border-amber-100 text-amber-900 hover:border-amber-300 hover:bg-amber-50',
  launcherRing: 'ring-amber-200 shadow-[0_6px_18px_rgba(217,119,6,0.28)]',
}

export const muleyTone = (role: string | null | undefined): MuleyTone => (role === 'PARENT' ? PARENT : STAFF)
