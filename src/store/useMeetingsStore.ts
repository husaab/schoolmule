import { create } from 'zustand'
import { getMyMeetings, getParentMeetings, listMeetingEvents } from '@/services/meetingsService'
import type { MeetingEventSummary, ParentMeetingEvent, TeacherMeetingEvent } from '@/services/types/meetings'
import { useUserStore } from '@/store/useUserStore'

// Parent–teacher meetings, shared by the sidebar (the Meetings / My Meetings
// link shows only while there is something to book or meet) and the pages, so
// a page load makes one request. Parents get the open events of their
// children's teachers; staff get the events they meet families in. The
// office (whoever can open Admin Panel → Parent–Teacher Meetings) also gets
// the school's events, for its own Meetings link.

interface MeetingsState {
  parentEvents: ParentMeetingEvent[]
  teacherEvents: TeacherMeetingEvent[]
  loading: boolean
  loaded: boolean
  error: string | null
  /** The role the data was loaded for (a view switch reloads). */
  loadedFor: string | null
  inFlight: Promise<void> | null
  load: (force?: boolean) => Promise<void>
  setParentEvent: (event: ParentMeetingEvent) => void
  setTeacherEvent: (event: TeacherMeetingEvent) => void
  /** The school's events, for the office (GET /meetings/events). */
  officeEvents: MeetingEventSummary[]
  officeLoaded: boolean
  loadOffice: (force?: boolean) => Promise<void>
  clear: () => void
}

export const useMeetingsStore = create<MeetingsState>((set, get) => ({
  parentEvents: [],
  teacherEvents: [],
  loading: false,
  loaded: false,
  error: null,
  loadedFor: null,
  inFlight: null,
  officeEvents: [],
  officeLoaded: false,

  load: async (force = false) => {
    const role = useUserStore.getState().user?.role ?? null
    if (!role || role === 'STUDENT') return
    const { loaded, inFlight, loadedFor } = get()
    if (inFlight) return inFlight
    if (loaded && !force && loadedFor === role) return

    set({ loading: true, error: null })
    const request = (role === 'PARENT'
      ? getParentMeetings().then((res) => set({ parentEvents: res.data.events, teacherEvents: [] }))
      : getMyMeetings().then((res) => set({ teacherEvents: res.data.events, parentEvents: [] })))
      .then(() => set({ loaded: true, loadedFor: role }))
      .catch((err: unknown) => set({ error: err instanceof Error ? err.message : 'Could not load the meetings', loaded: true, loadedFor: role }))
      .finally(() => set({ loading: false, inFlight: null }))
    set({ inFlight: request })
    return request
  },

  setParentEvent: (event) =>
    set((s) => ({ parentEvents: s.parentEvents.map((e) => (e.eventId === event.eventId ? event : e)) })),

  setTeacherEvent: (event) =>
    set((s) => ({ teacherEvents: s.teacherEvents.map((e) => (e.eventId === event.eventId ? event : e)) })),

  loadOffice: async (force = false) => {
    if (get().officeLoaded && !force) return
    try {
      const res = await listMeetingEvents()
      set({ officeEvents: res.data.events, officeLoaded: true })
    } catch {
      set({ officeEvents: [], officeLoaded: true })
    }
  },

  clear: () => set({
    parentEvents: [], teacherEvents: [], loaded: false, loadedFor: null, error: null, inFlight: null, officeEvents: [], officeLoaded: false,
  }),
}))

/** Today in Toronto, 'YYYY-MM-DD' (meeting days are Toronto dates). */
export const torontoToday = (now = new Date()): string => now.toLocaleDateString('en-CA', { timeZone: 'America/Toronto' })

/** The office's events with days still ahead (or none yet): the sidebar shows Meetings while there's one. */
export const currentOfficeEvents = (events: MeetingEventSummary[], today = torontoToday()): MeetingEventSummary[] =>
  events.filter((e) => !e.lastDay || e.lastDay >= today)

/** Where the office's Meetings link goes: straight to the one event, else the list. */
export const officeMeetingsHref = (events: MeetingEventSummary[]): string =>
  events.length === 1 ? `/admin-panel/parent-teacher-meetings/${events[0].eventId}` : '/admin-panel/parent-teacher-meetings'

/** Meetings a teacher still has ahead (the sidebar's My Meetings count). */
export const upcomingMeetingCount = (events: TeacherMeetingEvent[]): number =>
  events.reduce((n, e) => n + e.days.reduce((m, d) => m + d.slots.filter((s) => s.booking && !s.past).length, 0), 0)
