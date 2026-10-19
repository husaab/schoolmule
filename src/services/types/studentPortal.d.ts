// src/services/types/studentPortal.d.ts
// The student portal API (/api/student). Every call is the signed-in
// student's own data; nothing here takes a student id from the client.

import type { GradeCode } from './studentAccount';
import type { PersonLite } from './profile';
import type { ClassIdentity, ItemKind } from './classroom';
import type { Attachment } from './classwork';

/** GET /api/student/me: who is signed in, for the portal shell. */
export interface StudentMe {
  /**
   * `avatar` is the one the teacher picked for the student (R12), shown until the student picks their own. Optional:
   * older servers send it only on /student/home.
   */
  student: { studentId: string; name: string; firstName: string; grade: GradeCode; avatar?: import('./profile').AvatarSpec | null };
  /** `avatar` is the student's own pick (null until they choose one); `photoUrl` is null while the school has student photos off. */
  user: {
    userId: string
    email: string | null
    avatar?: import('./profile').AvatarSpec | null
    photoUrl?: string | null
  };
  school: { code: string; name: string };
  settings: { studentPhotos: boolean };
  schoolYear: { schoolYearId: string; label: string | null };
}

export interface StudentPortalEnvelope<T> {
  status: 'success' | 'failed';
  message?: string;
  code?: string;
  data: T;
}

// ---------------------------------------------------------------------------
// Home, classes, the class Stream and published grades. The parent's lens
// (parentClassroom.d.ts) reads the same shapes for a child it owns.

/** A teacher on a class: the lead first, then co-teachers. */
export interface ClassTeacher extends PersonLite {
  role: 'lead' | 'co';
}

/** What a class card shows next: an item still ahead for the student. */
export interface StudentClassNext {
  /** null for a dated in-class assessment that has no classwork item. */
  itemId: string | null;
  title: string;
  kind: ItemKind;
  dueAt: string | null;
  /** 'YYYY-MM-DD' of the gradebook date, when there is no due time. */
  date: string | null;
}

/** One class on the home page, the sidebar and the parent lens' class list. */
export interface StudentClassCard {
  classId: string;
  subject: string;
  grade: GradeCode;
  termName: string | null;
  identity: ClassIdentity;
  teacher: ClassTeacher | null;
  teachers: ClassTeacher[];
  next: StudentClassNext | null;
  /** Derived and confirmed missing work in this class. */
  missingCount: number;
  /** A class post from the last 7 days that the reader has not opened. */
  hasNewPost: boolean;
}

/** The top of a class page. */
export interface StudentClassHeader {
  classId: string;
  subject: string;
  grade: GradeCode;
  termName: string | null;
  identity: ClassIdentity;
  teachers: ClassTeacher[];
  /** The lead teacher: who the "Message" button writes to. Null when the class has none. */
  messageTeacher: PersonLite | null;
}

export type WorkStatus = 'assigned' | 'missing' | 'turned_in' | 'graded' | 'excused' | 'no_turn_in' | 'material';

/** How an assignment is handed in: a photo or file, a typed answer, a tap on "Mark as done", or not online. */
export type SubmissionMode = 'file' | 'text' | 'done' | 'none';

/** One piece of work, as the To-do, home and the class page list it. */
export interface TodoItem {
  itemId: string;
  classId: string;
  subject: string;
  teacherName: string | null;
  iconUrl: string;
  title: string;
  kind: ItemKind;
  submissionMode: SubmissionMode | null;
  dueAt: string | null;
  date: string | null;
  status: WorkStatus;
  isLate: boolean;
  questionCount: number | null;
  turnedInAt: string | null;
  publishedAt: string | null;
}

export interface StudentAttachment {
  attachmentId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

/** A class, grade, school or hand-picked post, with the reader's own read and "Got it" state. */
export interface StudentAnnouncement {
  announcementId: string;
  scope: 'class' | 'grade' | 'school' | 'custom';
  classId: string | null;
  classSubject: string | null;
  title: string;
  body: string;
  author: PersonLite;
  publishedAt: string;
  editedAt: string | null;
  isPinned: boolean;
  attachments: StudentAttachment[];
  read: boolean;
  ackRequested: boolean;
  ackedAt: string | null;
}

/** A posted assignment, quiz or material shown beside the posts. */
export interface ClassNotice {
  itemId: string;
  kind: ItemKind;
  title: string;
  postedAt: string;
  dueAt: string | null;
}

/** One published grade. Missing and excused carry no score. */
export interface GradeItem {
  assessmentId: string;
  /** Set only when the reader may open the item. */
  itemId: string | null;
  classId: string;
  subject: string;
  teacherName: string | null;
  title: string;
  kind: ItemKind;
  categoryName: string | null;
  score: number | null;
  maxScore: number | null;
  status: 'graded' | 'missing' | 'excused';
  publishedAt: string | null;
  /** The teacher's comment on the work, once it is published. */
  feedback: string | null;
  parentComment: string | null;
}

export interface ChildClassGrades {
  classId: string;
  subject: string;
  teacherName: string | null;
  identity: ClassIdentity;
  /** The class grade from published work; null until something counts. */
  finalPct: number | null;
  classAvg: number | null;
  gradedCount: number;
  missingCount: number;
  latestPublishedAt: string | null;
  /** Newest first. */
  items: GradeItem[];
}

export interface GradeTerm {
  termId: string;
  name: string;
  isActive: boolean;
}

export interface ChildGrades {
  studentId: string;
  /** False for JK and SK: those grades are skills on the report card, not marks. */
  usesMarks: boolean;
  termId: string | null;
  terms: GradeTerm[];
  classes: ChildClassGrades[];
}

/** GET /api/student/home. */
export interface StudentHome {
  student: { studentId: string; name: string; firstName: string; grade: GradeCode; avatar: import('./profile').AvatarSpec | null };
  /** Assigned work due within 7 days, soonest first. */
  dueSoon: TodoItem[];
  /** Missing work, newest due first. */
  missing: TodoItem[];
  newGrades: GradeItem[];
  classes: StudentClassCard[];
}

/** GET /api/student/classes/:classId and its parent-lens twin. */
export interface StudentClassPage {
  class: StudentClassHeader;
  /** What is coming up in the class, at most 3. */
  upcoming: TodoItem[];
}

export interface StudentClassStream {
  announcements: StudentAnnouncement[];
  notices: ClassNotice[];
}

// ---------------------------------------------------------------------------
// The To-do, an assignment page and a class's Classwork (T15, T16, T17). The
// parent's lens reads the same shapes for a child it owns, with every `can*`
// false.

/** GET /api/student/todo counts: what each tab holds (narrowed by `classId`). */
export interface TodoCounts {
  assigned: number;
  missing: number;
  done: number;
}

/** One group of a To-do tab: "Tomorrow", "Next week", "No due date", "Missing", "This week"… */
export interface TodoGroup {
  label: string;
  items: TodoItem[];
}

/** GET /api/student/todo?tab=&classId= */
export interface StudentTodo {
  counts: TodoCounts;
  groups: TodoGroup[];
}

/** A file the student added to their work. */
export interface SubmissionFile {
  fileId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
}

/** The student's own work on an assignment or quiz, with what they may do with it. */
export interface StudentSubmission {
  /** The work status (workStatus.js): assigned, turned_in, graded, missing, excused. */
  status: WorkStatus;
  isLate: boolean;
  turnedInAt: string | null;
  /** Text mode: the saved answer. */
  textAnswer: string | null;
  textSavedAt: string | null;
  files: SubmissionFile[];
  /** Files and the typed answer may change (not turned in, not closed, not graded). */
  canEdit: boolean;
  canTurnIn: boolean;
  canUnsubmit: boolean;
  /** Past due in a class that takes no late work. */
  closed: boolean;
}

/** The grade the student may see: published only (spec 0.8). Feedback alone has no score. */
export interface StudentItemGrade {
  score: number | null;
  maxScore: number | null;
  status: 'graded' | 'missing' | 'excused';
  feedback: string | null;
  publishedAt: string | null;
}

/** The thread about this work, once there is one. */
export interface ItemThreadInfo {
  conversationId: string;
  messageCount: number;
}

/** GET /api/student/items/:itemId and its parent-lens twin. */
export interface StudentItem {
  itemId: string;
  classId: string;
  subject: string;
  identity: ClassIdentity;
  kind: ItemKind;
  title: string;
  instructions: string | null;
  teacher: (PersonLite & { photoUrl: string | null }) | null;
  postedAt: string | null;
  dueAt: string | null;
  /** 'YYYY-MM-DD' of a dated in-class assessment. */
  date: string | null;
  points: number | null;
  /** How the work is handed in ('none' for a quiz, a material, an assessment and work done in class). */
  submissionMode: SubmissionMode;
  attachments: Attachment[];
  /** Null when there is nothing to turn in online (an assessment, a material, work done in class). */
  submission: StudentSubmission | null;
  grade: StudentItemGrade | null;
  /** Assignments and quizzes only; null in the lens when the school keeps the thread from guardians. */
  thread: ItemThreadInfo | null;
  /** The student's parents read the messages about this work (the school's "parents read private comments"). */
  parentsCanRead: boolean;
}

/** One row of a class's Classwork: a TodoItem with its topic, posted time and visible grade. */
export interface StudentItemSummary extends TodoItem {
  topicId: string | null;
  postedAt: string | null;
  grade: { score: number | null; maxScore: number | null } | null;
}

export interface ClassworkTopic {
  topicId: string;
  name: string;
  sortOrder: number;
  /** Items in the topic the reader can see. */
  itemCount: number;
}

/** GET /api/student/classes/:classId/classwork and its parent-lens twin. */
export interface StudentClasswork {
  topics: ClassworkTopic[];
  items: StudentItemSummary[];
  upcoming: TodoItem[];
}
