// src/services/types/meetings.ts
// Parent–teacher meetings (backend services/meetings/views.js). Times are
// minutes from midnight, Toronto (930 = 3:30 PM); dates 'YYYY-MM-DD';
// instants ISO strings.

export type MeetingPhase = 'draft' | 'scheduled' | 'open' | 'closed' | 'finished'
export type MeetingStatus = 'draft' | 'scheduled' | 'open'
/** How a meeting happens: at the school, or the teacher phones the family. */
export type MeetingMode = 'in_person' | 'phone'

/** How a booked meeting happens: in person in `room`, or a phone call to `phone`. */
export interface MeetingHow {
  mode: MeetingMode
  /** The number the teacher calls (phone calls only). */
  phone: string | null
  /** Where an in-person meeting is (null for a phone call). */
  room: string | null
}

export interface TimeRange {
  start: number
  end: number
}

export interface MeetingEventBase {
  eventId: string
  title: string
  status: MeetingStatus
  phase: MeetingPhase
  slotMinutes: number
  opensAt: string | null
  openedAt: string | null
  cutoffMin: number | null
  useGradeRoom: boolean
  siblingsShare: boolean
  teachersEditHours: boolean
  emailInvite: boolean
  emailLastCall: boolean
  lastCallAt: string | null
  lastCallSentAt: string | null
  emailReminder: boolean
  reminderMin: number
  emailTeacherList: boolean
  /** Families may choose a phone call instead of coming in. */
  allowPhone: boolean
}

export interface MeetingDayBase {
  dayId: string
  date: string
  start: number
  end: number
  everyone: boolean
  cutoffAt: string
  bookable: boolean
}

export interface MeetingBreak {
  breakId: string
  start: number
  end: number
  label: string | null
}

// ── Parent ─────────────────────────────────────────────────

export interface ParentMeetingDay extends MeetingDayBase {
  window: TimeRange | null
}

export interface ParentMeetingChild {
  studentId: string
  name: string
  firstName: string
  grade: string | null
  gradeLabel: string
  room: string | null
}

export interface ParentMeetingTeacher {
  teacherId: string
  name: string
  studentIds: string[]
  subjects: Record<string, string>
  /** A class of theirs with each child (null for homeroom only), for Message. */
  classIds: Record<string, string | null>
  room: string | null
  slotMinutes: number
  days: { dayId: string; works: boolean; total: number; open: TimeRange[] }[]
}

export interface ParentBooking extends MeetingHow {
  /** A phone call: the number the teacher calls from (their meetings number or account's), if they have one. */
  callFrom?: string | null
  bookingId: string
  teacherId: string
  teacherName: string
  dayId: string
  start: number
  end: number
  studentIds: string[]
  canChange: boolean
  byOffice: boolean
}

export interface ParentMeetingEvent extends MeetingEventBase {
  /** The number a phone call suggests: the one they gave last, else theirs on file. */
  phone: string | null
  days: ParentMeetingDay[]
  children: ParentMeetingChild[]
  teachers: ParentMeetingTeacher[]
  bookings: ParentBooking[]
}

export interface BookingItem {
  teacherId: string
  dayId: string
  startMin: number
  studentIds: string[]
  mode?: MeetingMode
  phone?: string | null
}

/** A change to a booked meeting: a new time and/or how it happens. Left out = unchanged. */
export interface BookingChange {
  dayId?: string
  startMin?: number
  mode?: MeetingMode
  phone?: string | null
}

// ── Teacher ────────────────────────────────────────────────

export interface TeacherBookingStudent {
  studentId: string
  name: string
  firstName: string
  grade: string | null
  gradeLabel: string
  homeroom: boolean
  subjects: string[]
  classes: { classId: string; subject: string | null }[]
}

export interface TeacherBooking extends MeetingHow {
  bookingId: string
  byOffice: boolean
  students: TeacherBookingStudent[]
  guardians: string[]
}

export interface TeacherSlot extends TimeRange {
  closed: boolean
  closedBreakId: string | null
  closedLabel: string | null
  past: boolean
  booking: TeacherBooking | null
}

export interface TeacherMeetingDay extends MeetingDayBase {
  works: boolean
  ownHours: boolean
  hoursStart: number
  hoursEnd: number
  breaks: MeetingBreak[]
  ownBreaks: MeetingBreak[]
  slots: TeacherSlot[]
  booked: number
  open: number
}

export interface TeacherMeetingEvent extends MeetingEventBase {
  termId: string | null
  takingPart: boolean
  canEditHours: boolean
  teacher: { teacherId: string; name: string } | null
  ownSlotMinutes: number | null
  teacherSlotMinutes: number
  room: string | null
  /** "Number I'll call from" for these meetings (null = the account's number). */
  callFrom?: string | null
  /** The number on their account (Settings). */
  myPhone?: string | null
  days: TeacherMeetingDay[]
}

// ── Office ─────────────────────────────────────────────────

export interface MeetingEventSummary extends MeetingEventBase {
  firstDay: string | null
  lastDay: string | null
  dayCount: number
  bookings: number
}

export interface SetupDay extends MeetingDayBase {
  label: string
  breaks: MeetingBreak[]
  timesPerTeacher: number
  teacherIds: string[]
  bookings: number
}

export interface SetupTeacherDay {
  dayId: string
  works: boolean
  ownHours: boolean
  start: number
  end: number
  times: number
  breaks: MeetingBreak[]
}

export interface SetupTeacher {
  teacherId: string
  name: string
  teaches: string
  families: number
  students: number
  takingPart: boolean
  slotMinutes: number | null
  room: string | null
  /** "Number I'll call from" for these meetings, and the number on their account. */
  callFrom?: string | null
  phone?: string | null
  times: number
  perTime: number | null
  bookings: number
  days: SetupTeacherDay[]
}

export interface MeetingSetup extends MeetingEventBase {
  days: SetupDay[]
  teachers: SetupTeacher[]
  stats: {
    families: number
    /** Families with a parent whose account works: they book with one tap. */
    oneTap: number
    /** Families whose parents have an address but no working account: they create one first. */
    createAccount: number
    /** Families with no address on file: no invitation; the office books for them. */
    noEmail?: number
    times: number
    bookings: number
    familiesBooked: number
  }
}

export interface BoardCell extends TimeRange {
  kind: 'booked' | 'open' | 'closed'
  booking?: MeetingHow & {
    bookingId: string
    byOffice: boolean
    studentIds: string[]
    family: string
    kids: string
  }
}

export interface BoardColumn {
  teacherId: string
  name: string
  teaches: string
  hoursLabel: string | null
  slotMinutes: number
  booked: number
  open: number
  cells: BoardCell[]
}

export interface MeetingBoard extends MeetingEventBase {
  days: (MeetingDayBase & { bookings: number })[]
  day: (MeetingDayBase & { label: string }) | null
  breaks: MeetingBreak[]
  columns: BoardColumn[]
  times: number[]
  stats: { bookings: number }
}

export interface MeetingFamily {
  familyKey: string
  label: string
  guardians: string[]
  children: { studentId: string; name: string; firstName: string; grade: string | null; gradeLabel: string }[]
  teachers: { teacherId: string; name: string; studentIds: string[]; bookedStudentIds: string[] }[]
  bookings: number
  /** A number for a phone call: the family's last, else one on file. */
  phone: string | null
}

/** A teacher's own settings, as the hours window sends them. */
export interface TeacherHoursChange {
  takingPart?: boolean
  slotMinutes?: number | null
  room?: string | null
  /** The office only: "Number they'll call from"; null = the account's number. */
  callFrom?: string | null
  days?: {
    dayId: string
    works: boolean
    start: number | null
    end: number | null
    breaks?: { start: number; end: number; label?: string | null }[]
  }[]
}

export interface MeetingSettingsChange {
  title?: string
  slotMinutes?: number
  cutoffMin?: number | null
  useGradeRoom?: boolean
  siblingsShare?: boolean
  teachersEditHours?: boolean
  emailInvite?: boolean
  emailLastCall?: boolean
  lastCallAt?: string | null
  emailReminder?: boolean
  reminderMin?: number
  emailTeacherList?: boolean
  allowPhone?: boolean
  opensAt?: string | null
}

export interface MeetingsEnvelope<T> {
  status: 'success'
  data: T
}

/** A 409 when a change would leave booked families without a time. */
export interface BookedTimesError {
  code: 'BOOKED_TIMES'
  message: string
  bookings?: { bookingId: string; label: string }[]
}
