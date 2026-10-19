// services/types/classroom.d.ts
// A class's look (banner, icon, color), its options and the teacher's
// classroom endpoints (/api/classroom/classes/:classId/...).

export type { AvatarSpec, AvatarStyle, PersonLite } from './profile'

export type ClassFamily =
  | 'quran' | 'arabic' | 'islamic' | 'french' | 'computer' | 'english' | 'science'
  | 'math' | 'social' | 'pe' | 'art' | 'kindergarten' | 'default'

export type ClassColor =
  | 'teal' | 'blue' | 'emerald' | 'lime' | 'yellow' | 'orange' | 'rose' | 'pink' | 'purple' | 'sky' | 'slate'

export interface ClassIdentity {
  family: ClassFamily
  /** null when an upload is in use. */
  bannerKey: ClassFamily | null
  /** '/class-banners/<key>.svg', or the public URL of the upload. */
  bannerUrl: string
  bannerIsUpload: boolean
  iconKey: ClassFamily
  /** '/class-icons/<key>.svg' */
  iconUrl: string
  color: ClassColor
  /** True for each part still on the subject default. */
  isDefault: { banner: boolean; icon: boolean; color: boolean }
}

/** PATCH identity: a field left out is untouched, a field set to null goes back to the default. */
export interface ClassIdentityPatch {
  bannerKey?: ClassFamily | null
  iconKey?: ClassFamily | null
  color?: ClassColor | null
}

export interface ClassOptions {
  acceptLate: boolean
  emailNewPosts: boolean
  showClassAverage: boolean
}

export interface ClassroomEnvelope<T> {
  status: 'success'
  data: T
}

export interface ClassIdentityResult {
  classId: string
  identity: ClassIdentity
}

export interface ClassOptionsResult {
  classId: string
  options: ClassOptions
}

export interface ClassArchiveResult {
  classId: string
  /** ISO time, or null after unarchiving. */
  archivedAt: string | null
}

export interface StudentAvatarResult {
  studentId: string
  avatar: import('./profile').AvatarSpec | null
}

// ---------------------------------------------------------------------------
// The Classes home and the class page (GET /api/classroom/classes[/:classId]).

export type ItemKind = 'assessment' | 'assignment' | 'quiz' | 'material'

export interface ClassCardTeacher {
  userId: string
  name: string
  role: 'lead' | 'co'
  avatar: import('./profile').AvatarSpec | null
}

/** What a class card shows next: the next dated assessment until classwork items exist (T14). */
export interface ClassCardNext {
  itemId: string | null
  assessmentId: string | null
  title: string
  kind: ItemKind
  /** ISO time of a turn-in item's due date. */
  dueAt: string | null
  /** 'YYYY-MM-DD' (Toronto) of an in-class assessment. */
  date: string | null
}

export interface ClassCard {
  classId: string
  subject: string
  grade: import('./studentAccount').GradeCode
  termId: string | null
  termName: string | null
  teacherId: string | null
  teacherName: string | null
  /** Lead first, then co-teachers. */
  teachers: ClassCardTeacher[]
  studentCount: number
  identity: ClassIdentity
  /** ISO time, or null for an active class. */
  archivedAt: string | null
  /** Turned-in work waiting for a grade. */
  toReviewCount: number
  next: ClassCardNext | null
}

export interface ComingUpRow {
  itemId: string | null
  assessmentId: string | null
  classId: string
  /** "Grade 5 Science", "JK Science". */
  classLabel: string
  title: string
  kind: ItemKind
  /** 'YYYY-MM-DD' (Toronto). */
  date: string
  dueAt: string | null
  inClass: boolean
  /** Students who still have to turn it in (turn-in items only). */
  stillToTurnIn: number | null
}

/** A To review row (T16 fills these). */
export interface ToReviewRow {
  itemId: string
  classId: string
  classLabel: string
  iconUrl: string
  title: string
  turnedInCount: number
}

/** A Drafts & scheduled row (T14 fills these). */
export interface DraftOrScheduledRow {
  itemId: string
  classId: string
  classLabel: string
  title: string
  status: 'draft' | 'scheduled'
  /** ISO time a scheduled item posts. */
  publishAt: string | null
}

export interface ClassCardsData {
  classes: ClassCard[]
  toReview: ToReviewRow[]
  comingUp: ComingUpRow[]
  draftsAndScheduled: DraftOrScheduledRow[]
}

export interface ClassPageTeacher {
  userId: string
  name: string
  role: 'lead' | 'co'
  avatar: import('./profile').AvatarSpec | null
  photoUrl: string | null
  /** The grade this teacher is homeroom teacher of, if any. */
  homeroomGrade: string | null
}

export interface ClassPagePermissions {
  /** False for a teacher viewing a past school year's class (read-only). */
  canEdit: boolean
  canDelete: boolean
  isAdmin: boolean
}

/** GET /classroom/classes/:classId: the class header and Settings data. */
export interface ClassPageData {
  class: ClassCard & { options: ClassOptions }
  teachers: ClassPageTeacher[]
  permissions: ClassPagePermissions
  settings: { parentsReadPrivateComments: boolean; studentPhotos: boolean; enabled: boolean }
}

// ---------------------------------------------------------------------------
// The class Stream (GET /api/classroom/classes/:classId/stream).

/**
 * A live assignment, quiz or material the Stream shows beside the posts.
 * `turnedInCount` and `total` come with turn-in work only.
 */
export interface StreamNotice {
  itemId: string
  kind: ItemKind
  title: string
  /** ISO time the item went live. */
  postedAt: string
  /** ISO time the work is due, or null. */
  dueAt: string | null
  turnedInCount?: number
  total?: number
}

export interface StreamAudience {
  /** Students who would be EMAILED (the school's student-email switch and their grade permitting). */
  students: number
  /** Guardians with an account, an invite pending or only an address on file. */
  guardians: number
}

export interface ClassStreamData {
  /** This class's own posts, pinned first then newest, posts to chosen students of the class included. */
  announcements: import('./announcement').AnnouncementItem[]
  notices: StreamNotice[]
  /** Dated classwork in the next two weeks, earliest first. */
  upcoming: ComingUpRow[]
  audience: StreamAudience
}

// ---------------------------------------------------------------------------
// The class People tab (GET /api/classroom/classes/:classId/people).

export interface PeopleParent {
  name: string
  relation: string | null
  /** A linked SchoolMule account exists. */
  hasAccount: boolean
}

export interface PeopleStudentAccount {
  status: import('./studentAccount').AccountStatus
  /** The student's login, when there is one. */
  userId: string | null
  lastSeenAt: string | null
  /** A QR card can be printed (invited or active, and in a QR grade). */
  qrEligible: boolean
}

export interface PeopleStudent {
  studentId: string
  name: string
  avatar: import('./profile').AvatarSpec | null
  photoUrl: string | null
  account: PeopleStudentAccount
  parents: PeopleParent[]
  /** Items the student can see in this class that count as missing. */
  missingCount: number
}

export interface PeopleCounts {
  students: number
  /** Not invited or invited, not yet signed in. */
  notSignedIn: number
  /** Students with at least one missing item. */
  missingWork: number
}

export interface ClassPeopleData {
  teachers: ClassPageTeacher[]
  students: PeopleStudent[]
  counts: PeopleCounts
  /** Admins only: inviting is the school's call. */
  canInvite: boolean
  canManageAccounts: boolean
}
