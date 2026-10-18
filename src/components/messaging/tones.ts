// Three looks, one component set. Parent surfaces keep the portal's stone/amber
// warmth; staff surfaces keep the app's slate with the cyan-teal brand; the
// student portal is slate with an indigo accent. Every class string is a full
// literal so Tailwind v4 sees it at build time.

export type Tone = 'staff' | 'parent' | 'student'

export interface ToneClasses {
  /** Page / pane background. */
  page: string
  /** Card chrome. */
  card: string
  /** Hairline dividers. */
  divider: string
  /** Primary action button. */
  primary: string
  /** Secondary (outlined) button. */
  secondary: string
  /** Active filter chip. */
  chipActive: string
  chipIdle: string
  /** Selected list row. */
  rowSelected: string
  rowSelectedBar: string
  /** The caller's own bubble; everyone else's. */
  bubbleMine: string
  bubbleTheirs: string
  /**
   * A student's message as the staff and parents read it (indigo, the colour
   * the student sees their own messages in), and a parent's message as the
   * student reads it (amber, so "who said it" is clear at a glance).
   */
  bubbleStudent: string
  bubbleParent: string
  /** Unread count pill. */
  badge: string
  /** Small accent text (links, labels). */
  accentText: string
  /** Context card (score strip). */
  context: string
  contextLabel: string
  contextValue: string
  /** Focus ring on inputs. */
  focus: string
}

const STAFF: ToneClasses = {
  page: 'bg-slate-50',
  card: 'bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
  divider: 'border-slate-100',
  primary:
    'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm hover:from-cyan-600 hover:to-teal-600',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100',
  chipActive: 'bg-cyan-50 border-cyan-200 text-cyan-800 font-medium',
  chipIdle: 'border-slate-200 text-slate-500 hover:bg-slate-50',
  rowSelected: 'bg-cyan-50/60',
  rowSelectedBar: 'bg-cyan-600',
  bubbleMine: 'bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100 text-slate-900',
  bubbleTheirs: 'bg-slate-50 border border-slate-200 text-slate-900',
  bubbleStudent: 'bg-indigo-50 border border-indigo-100 text-slate-900',
  bubbleParent: 'bg-slate-50 border border-slate-200 text-slate-900',
  badge: 'bg-cyan-600 text-white',
  accentText: 'text-cyan-700',
  context: 'bg-gradient-to-r from-cyan-50 to-teal-50 border border-cyan-100',
  contextLabel: 'text-cyan-700',
  contextValue: 'text-cyan-800',
  focus: 'focus:ring-cyan-200 focus:border-cyan-300',
}

const PARENT: ToneClasses = {
  page: 'bg-stone-50',
  card: 'bg-white rounded-2xl border border-stone-200/70 shadow-sm',
  divider: 'border-stone-100',
  primary: 'bg-amber-700 text-white shadow-sm hover:bg-amber-800',
  secondary: 'border border-stone-200 bg-white text-slate-700 hover:bg-stone-50',
  chipActive: 'bg-amber-50 border-amber-200 text-amber-800 font-medium',
  chipIdle: 'border-stone-200 text-slate-500 hover:bg-stone-50',
  rowSelected: 'bg-amber-50/70',
  rowSelectedBar: 'bg-amber-700',
  bubbleMine: 'bg-amber-50 border border-amber-200 text-slate-900',
  bubbleTheirs: 'bg-white border border-stone-200 text-slate-900',
  bubbleStudent: 'bg-indigo-50 border border-indigo-100 text-slate-900',
  bubbleParent: 'bg-white border border-stone-200 text-slate-900',
  badge: 'bg-amber-700 text-white',
  accentText: 'text-amber-700',
  context: 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100',
  contextLabel: 'text-amber-700',
  contextValue: 'text-amber-800',
  focus: 'focus:ring-amber-200 focus:border-amber-300',
}

const STUDENT: ToneClasses = {
  page: 'bg-slate-50',
  card: 'bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_2px_rgba(15,23,42,0.04)]',
  divider: 'border-slate-100',
  primary: 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  chipActive: 'bg-indigo-50 border-indigo-200 text-indigo-800 font-medium',
  chipIdle: 'border-slate-200 text-slate-500 hover:bg-slate-50',
  rowSelected: 'bg-indigo-50',
  rowSelectedBar: 'bg-indigo-600',
  bubbleMine: 'bg-indigo-50 border border-indigo-100 text-slate-900',
  bubbleTheirs: 'bg-white border border-slate-200 text-slate-900',
  bubbleStudent: 'bg-indigo-50 border border-indigo-100 text-slate-900',
  bubbleParent: 'bg-amber-50 border border-amber-200 text-slate-900',
  badge: 'bg-indigo-600 text-white',
  accentText: 'text-indigo-700',
  context: 'bg-indigo-50 border border-indigo-100',
  contextLabel: 'text-indigo-700',
  contextValue: 'text-indigo-800',
  focus: 'focus:ring-indigo-200 focus:border-indigo-300',
}

export const toneClasses = (tone: Tone): ToneClasses => (tone === 'parent' ? PARENT : tone === 'student' ? STUDENT : STAFF)
