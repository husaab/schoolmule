export type SchoolYear = {
  schoolYearId: string;
  school?: string;
  schoolId?: string;
  label: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdFromYearId?: string | null;
};

export type RolloverPreviewStudent = {
  studentId: string;
  name: string;
  grade: string;
  proposedGrade: string | null;
  isGraduating: boolean;
};

export type RolloverPreviewClass = {
  classId: string;
  grade: string;
  subject: string;
  teacherName: string | null;
  termName: string | null;
};

export type RolloverPreviewTerm = {
  name: string;
  startDate: string;
  endDate: string;
  proposedStartDate: string;
  proposedEndDate: string;
};

export type RolloverPreview = {
  sourceYear: { schoolYearId: string; label: string };
  students: RolloverPreviewStudent[];
  classes: RolloverPreviewClass[];
  terms: RolloverPreviewTerm[];
};

export type RolloverRequest = {
  students: { mode: 'rollover' | 'skip'; excludeStudentIds: string[]; gradeOverrides: Record<string, string> };
  classes: { mode: 'duplicate' | 'skip'; excludeClassIds: string[] };
  terms: { name: string; startDate: string; endDate: string }[];
  copyPlanner: boolean;
  copyCalendar: boolean;
};

export type RolloverSummary = {
  termsCreated: number;
  studentsRolled: number;
  studentsGraduated: number;
  classesCreated: number;
  plannerCopied: boolean;
  calendarEventsCopied: number;
};

export type SchoolYearsResponse = { status: string; data: SchoolYear[] };
export type SchoolYearResponse = { status: string; data: SchoolYear };
export type RolloverPreviewResponse = { status: string; data: RolloverPreview };
export type RolloverResponse = { status: string; data: RolloverSummary };
