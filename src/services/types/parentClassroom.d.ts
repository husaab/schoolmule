// src/services/types/parentClassroom.d.ts
// The parent's Classes page and lens (/api/parent-portal/classroom/... and
// /api/parent-portal/students/:studentId/classroom/...). The lens returns the
// student portal's shapes (studentPortal.d.ts) for a child the parent owns.

import type { AvatarSpec } from './profile';
import type { GradeCode } from './studentAccount';
import type { GradeItem, StudentAnnouncement } from './studentPortal';

/** A post that asks the parent for a "Got it". */
export interface NeedsYouAck {
  kind: 'ack';
  announcementId: string;
  title: string;
  classSubject: string | null;
  authorName: string;
  publishedAt: string;
  /** The parent's children the post reaches. */
  studentIds: string[];
}

/** Work a child has not handed in. */
export interface NeedsYouMissing {
  kind: 'missing';
  itemId: string | null;
  assessmentId: string | null;
  title: string;
  classId: string;
  classSubject: string;
  teacher: { userId: string; name: string; avatar: AvatarSpec | null } | null;
  studentId: string;
  dueAt: string | null;
  /** 'YYYY-MM-DD' for a dated in-class assessment with no due time. */
  date: string | null;
}

export type NeedsYouItem = NeedsYouAck | NeedsYouMissing;

export interface ChildClassroomSummary {
  studentId: string;
  name: string;
  grade: GradeCode;
  avatar: AvatarSpec | null;
  /** The child can sign in to the student portal (an account, consent, the grade gate). */
  signsIn: boolean;
  classCount: number;
  dueThisWeek: number;
  missingCount: number;
  /** Grades published in the last 7 days. */
  newGradeCount: number;
  latestGrade: GradeItem | null;
  homeroomTeacherName: string | null;
  /** The two newest posts the child's audience got. */
  recentPosts: StudentAnnouncement[];
}

/** GET /api/parent-portal/classroom/summary. */
export interface ParentClassroomSummary {
  needsYou: NeedsYouItem[];
  children: ChildClassroomSummary[];
}

export type SummaryFrequency = 'weekly' | 'daily';

/** A day of the week, 0 (Sunday) to 6 (Saturday). */
export type SummaryDay = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/**
 * GET and PUT /api/parent-portal/notification-prefs: the parent's own email
 * choices. `summaryDow` is the effective day (theirs, else the school's);
 * `schoolDefaultDow` is the school's.
 */
export interface NotificationPrefs {
  weeklySummary: boolean;
  summaryFrequency: SummaryFrequency;
  summaryDow: SummaryDay;
  missingAlerts: boolean;
  schoolDefaultDow: SummaryDay;
}

/** What a PUT may carry: any of these; the rest keep their saved value. `summaryDow: null` follows the school's day. */
export type NotificationPrefsChange = Partial<Pick<NotificationPrefs, 'weeklySummary' | 'summaryFrequency' | 'missingAlerts'>> & {
  summaryDow?: SummaryDay | null;
};
