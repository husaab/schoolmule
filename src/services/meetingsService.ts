// src/services/meetingsService.ts
// Parent–teacher meetings. Office calls need `scheduling`; teacher calls act
// on the signed-in teacher only; parent calls are checked on the server
// against the parent's own children.

import apiClient from './apiClient'
import type {
  BookingChange,
  BookingItem,
  MeetingBoard,
  MeetingEventSummary,
  MeetingFamily,
  MeetingSettingsChange,
  MeetingSetup,
  MeetingsEnvelope,
  ParentMeetingEvent,
  TeacherHoursChange,
  TeacherMeetingEvent,
} from './types/meetings'

const baseURL = process.env.NEXT_PUBLIC_BASE_URL
const ev = (eventId: string) => `/meetings/events/${encodeURIComponent(eventId)}`

// ── Parent ─────────────────────────────────────────────────

export const getParentMeetings = () =>
  apiClient<MeetingsEnvelope<{ events: ParentMeetingEvent[] }>>('/parent-portal/meetings')

/** Book one or more meetings at once (Plan my visit books several): all or none. */
export const bookMeetings = (eventId: string, items: BookingItem[]) =>
  apiClient<MeetingsEnvelope<{ bookingIds: string[]; event: ParentMeetingEvent }>>(
    `/parent-portal/meetings/${encodeURIComponent(eventId)}/bookings`,
    { method: 'POST', body: { items } },
  )

/** Change a meeting: a new time and/or in person ↔ phone call (or a new number). */
export const changeMyMeeting = (eventId: string, bookingId: string, change: BookingChange) =>
  apiClient<MeetingsEnvelope<{ event: ParentMeetingEvent }>>(
    `/parent-portal/meetings/${encodeURIComponent(eventId)}/bookings/${encodeURIComponent(bookingId)}`,
    { method: 'PATCH', body: change },
  )

export const cancelMyMeeting = (eventId: string, bookingId: string) =>
  apiClient<MeetingsEnvelope<{ event: ParentMeetingEvent }>>(
    `/parent-portal/meetings/${encodeURIComponent(eventId)}/bookings/${encodeURIComponent(bookingId)}`,
    { method: 'DELETE' },
  )

// ── Teacher ────────────────────────────────────────────────

export const getMyMeetings = () => apiClient<MeetingsEnvelope<{ events: TeacherMeetingEvent[] }>>('/meetings/mine')

export const setMyHours = (eventId: string, change: TeacherHoursChange) =>
  apiClient<MeetingsEnvelope<TeacherMeetingEvent>>(`${ev(eventId)}/my-hours`, { method: 'PUT', body: change })


export const closeMyTimes = (eventId: string, body: { dayId: string; start: number; end: number; label?: string | null }) =>
  apiClient<MeetingsEnvelope<{ breakId: string }>>(`${ev(eventId)}/my-closed`, { method: 'POST', body })

export const reopenMyTimes = (eventId: string, breakId: string) =>
  apiClient<MeetingsEnvelope<{ breakId: string }>>(`${ev(eventId)}/my-closed/${encodeURIComponent(breakId)}`, { method: 'DELETE' })

/** Print my day: one PDF, the schedule then each family's Student summary. The office may pass a teacher. */
export const printMeetingDay = async (eventId: string, dayId: string, teacherId?: string): Promise<Blob> => {
  const token = typeof window === 'undefined' ? null : localStorage.getItem('auth_token')
  const { useSchoolYearStore } = await import('@/store/useSchoolYearStore')
  const yearId = useSchoolYearStore.getState().selectedYearId
  const query = new URLSearchParams({ dayId, ...(teacherId ? { teacherId } : {}) })
  const res = await fetch(`${baseURL}${ev(eventId)}/print?${query}`, {
    method: 'POST',
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(yearId && { 'X-School-Year': yearId }),
    },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.message || 'Could not make the PDF')
  }
  return res.blob()
}

// ── Office ─────────────────────────────────────────────────

export const listMeetingEvents = () =>
  apiClient<MeetingsEnvelope<{ events: MeetingEventSummary[]; suggestions: { date: string; title: string }[] }>>('/meetings/events')

export const createMeetingEvent = (body: { title?: string; slotMinutes?: number; days: { date: string; start: number; end: number }[] }) =>
  apiClient<MeetingsEnvelope<{ eventId: string }>>('/meetings/events', { method: 'POST', body })

export const getMeetingSetup = (eventId: string) => apiClient<MeetingsEnvelope<MeetingSetup>>(ev(eventId))

export const updateMeetingSettings = (eventId: string, change: MeetingSettingsChange) =>
  apiClient<MeetingsEnvelope<MeetingSetup>>(ev(eventId), { method: 'PUT', body: change })

export const deleteMeetingEvent = (eventId: string) =>
  apiClient<MeetingsEnvelope<{ cancelled: number }>>(ev(eventId), { method: 'DELETE' })

/** Open booking at `opensAt`, or now when it's omitted or past. */
export const scheduleMeetingEvent = (eventId: string, opensAt: string | null) =>
  apiClient<MeetingsEnvelope<MeetingSetup>>(`${ev(eventId)}/schedule`, { method: 'POST', body: { opensAt } })

export const unscheduleMeetingEvent = (eventId: string) =>
  apiClient<MeetingsEnvelope<MeetingSetup>>(`${ev(eventId)}/unschedule`, { method: 'POST', body: {} })

export const addMeetingDay = (eventId: string, body: { date: string; start?: number; end?: number; everyone?: boolean; teacherIds?: string[] }) =>
  apiClient<MeetingsEnvelope<{ dayId: string }>>(`${ev(eventId)}/days`, { method: 'POST', body })

export const updateMeetingDay = (eventId: string, dayId: string, body: { date?: string; start?: number; end?: number; everyone?: boolean }) =>
  apiClient<MeetingsEnvelope<{ dayId: string }>>(`${ev(eventId)}/days/${encodeURIComponent(dayId)}`, { method: 'PUT', body })

export const deleteMeetingDay = (eventId: string, dayId: string) =>
  apiClient<MeetingsEnvelope<{ dayId: string }>>(`${ev(eventId)}/days/${encodeURIComponent(dayId)}`, { method: 'DELETE' })

export const addMeetingBreak = (eventId: string, dayId: string, body: { start: number; end: number; label?: string | null }) =>
  apiClient<MeetingsEnvelope<{ breakId: string }>>(`${ev(eventId)}/days/${encodeURIComponent(dayId)}/breaks`, { method: 'POST', body })

/** Removes an everyone break, or (office) any teacher's break or closed time. */
export const deleteMeetingBreak = (eventId: string, breakId: string) =>
  apiClient<MeetingsEnvelope<{ breakId: string }>>(`${ev(eventId)}/breaks/${encodeURIComponent(breakId)}`, { method: 'DELETE' })

export const setMeetingTeacher = (eventId: string, teacherId: string, change: TeacherHoursChange) =>
  apiClient<MeetingsEnvelope<MeetingSetup>>(`${ev(eventId)}/teachers/${encodeURIComponent(teacherId)}`, { method: 'PUT', body: change })

export const closeTeacherTimes = (eventId: string, teacherId: string, body: { dayId: string; start: number; end: number; label?: string | null }) =>
  apiClient<MeetingsEnvelope<{ breakId: string }>>(`${ev(eventId)}/teachers/${encodeURIComponent(teacherId)}/closed`, { method: 'POST', body })

export const getMeetingBoard = (eventId: string, dayId?: string) =>
  apiClient<MeetingsEnvelope<MeetingBoard>>(`${ev(eventId)}/board${dayId ? `?dayId=${encodeURIComponent(dayId)}` : ''}`)

export const searchMeetingFamilies = (eventId: string, q: string) =>
  apiClient<MeetingsEnvelope<MeetingFamily[]>>(`${ev(eventId)}/families?q=${encodeURIComponent(q)}`)

export const officeBookMeeting = (eventId: string, item: BookingItem) =>
  apiClient<MeetingsEnvelope<{ bookingIds: string[] }>>(`${ev(eventId)}/bookings`, { method: 'POST', body: item })

export const officeChangeMeeting = (eventId: string, bookingId: string, change: BookingChange) =>
  apiClient<MeetingsEnvelope<{ bookingId: string }>>(`${ev(eventId)}/bookings/${encodeURIComponent(bookingId)}`, {
    method: 'PATCH',
    body: change,
  })

export const officeCancelMeeting = (eventId: string, bookingId: string) =>
  apiClient<MeetingsEnvelope<{ bookingId: string }>>(`${ev(eventId)}/bookings/${encodeURIComponent(bookingId)}`, { method: 'DELETE' })

/** "Times are still open" to every family with no meetings, now. */
export const sendMeetingsLastCall = (eventId: string) =>
  apiClient<MeetingsEnvelope<{ queued: number }>>(`${ev(eventId)}/last-call`, { method: 'POST', body: {} })
