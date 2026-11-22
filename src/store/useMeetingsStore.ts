import { create } from 'zustand'
import { getMyMeetings, getParentMeetings } from '@/services/meetingsService'
import type { ParentMeetingEvent, TeacherMeetingEvent } from '@/services/types/meetings'
import { useUserStore } from '@/store/useUserStore'

// Parent–teacher meetings, shared by the sidebar (the Meetings / My Meetings
// link shows only while there is something to book or meet) and the pages, so
// a page load makes one request. Parents get the open events of their
// children's teachers; staff get the events they meet families in.

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

  clear: () => set({ parentEvents: [], teacherEvents: [], loaded: false, loadedFor: null, error: null, inFlight: null }),
}))

/** Meetings a teacher still has ahead (the sidebar's My Meetings count). */
export const upcomingMeetingCount = (events: TeacherMeetingEvent[]): number =>
  events.reduce((n, e) => n + e.days.reduce((m, d) => m + d.slots.filter((s) => s.booking && !s.past).length, 0), 0)
