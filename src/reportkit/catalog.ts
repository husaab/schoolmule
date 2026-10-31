import type { ExtraFieldDef } from './types';

/**
 * Every value a template can print ({{path}}) or test in a show/hide rule,
 * with the words an admin sees. `kind` drives the rule builder's operators.
 */
export type FieldKind = 'text' | 'number' | 'grade' | 'date' | 'list';

export interface CatalogField {
  path: string;
  label: string;
  group: 'Student' | 'School' | 'Report' | 'Page' | 'Lists' | 'Extra fields';
  kind: FieldKind;
  /** Usable as {{path}} in text. */
  printable: boolean;
  /** Usable in a show/hide rule. */
  testable: boolean;
}

export const FIELD_CATALOG: CatalogField[] = [
  { path: 'student.name', label: 'Student name', group: 'Student', kind: 'text', printable: true, testable: false },
  { path: 'student.firstName', label: 'First name', group: 'Student', kind: 'text', printable: true, testable: false },
  { path: 'student.lastName', label: 'Last name', group: 'Student', kind: 'text', printable: true, testable: false },
  { path: 'student.grade', label: 'Grade', group: 'Student', kind: 'grade', printable: true, testable: true },
  { path: 'student.gradeLabel', label: 'Grade (in words)', group: 'Student', kind: 'text', printable: true, testable: false },
  { path: 'student.gradeNumber', label: 'Grade number (JK −1, SK 0)', group: 'Student', kind: 'number', printable: false, testable: true },
  { path: 'student.oen', label: 'OEN', group: 'Student', kind: 'text', printable: true, testable: true },
  { path: 'student.homeroomTeacher', label: 'Homeroom teacher', group: 'Student', kind: 'text', printable: true, testable: true },
  { path: 'student.teacherAssistant', label: 'Teacher assistant', group: 'Student', kind: 'text', printable: true, testable: true },
  { path: 'student.daysAbsent', label: 'Days absent', group: 'Student', kind: 'number', printable: true, testable: true },
  { path: 'school.name', label: 'School name', group: 'School', kind: 'text', printable: true, testable: false },
  { path: 'school.address', label: 'Address', group: 'School', kind: 'text', printable: true, testable: false },
  { path: 'school.phone', label: 'Phone', group: 'School', kind: 'text', printable: true, testable: false },
  { path: 'school.email', label: 'Email', group: 'School', kind: 'text', printable: true, testable: false },
  { path: 'school.website', label: 'Website', group: 'School', kind: 'text', printable: true, testable: false },
  { path: 'school.principal', label: 'Principal', group: 'School', kind: 'text', printable: true, testable: false },
  { path: 'school.board', label: 'Board', group: 'School', kind: 'text', printable: true, testable: false },
  { path: 'meta.term', label: 'Term', group: 'Report', kind: 'text', printable: true, testable: true },
  { path: 'meta.termNumber', label: 'Term number', group: 'Report', kind: 'number', printable: true, testable: true },
  { path: 'meta.termLabel', label: 'Term in words (FIRST TERM)', group: 'Report', kind: 'text', printable: true, testable: false },
  { path: 'meta.schoolYear', label: 'School year', group: 'Report', kind: 'text', printable: true, testable: true },
  { path: 'meta.reportDate', label: 'Report date', group: 'Report', kind: 'date', printable: true, testable: false },
  { path: 'meta.generatedDate', label: 'Date generated', group: 'Report', kind: 'date', printable: true, testable: false },
  { path: 'page.number', label: 'Page number', group: 'Page', kind: 'number', printable: true, testable: false },
  { path: 'page.count', label: 'Page count', group: 'Page', kind: 'number', printable: true, testable: false },
  { path: 'subjects', label: 'Number of subjects', group: 'Lists', kind: 'list', printable: false, testable: true },
  { path: 'skills', label: 'Number of skill groups', group: 'Lists', kind: 'list', printable: false, testable: true },
  { path: 'comments', label: 'Number of comment rows', group: 'Lists', kind: 'list', printable: false, testable: true },
  { path: 'learningSkills', label: 'Number of learning skills', group: 'Lists', kind: 'list', printable: false, testable: true },
];

/** The catalog plus the template's own extra fields. */
export function catalogFor(fields: ExtraFieldDef[] = []): CatalogField[] {
  return [
    ...FIELD_CATALOG,
    ...fields.map((f) => ({
      path: `extra.${f.key}`,
      label: f.label || f.key,
      group: 'Extra fields' as const,
      kind: (f.type === 'checkbox' ? 'text' : f.type === 'date' ? 'date' : 'text') as FieldKind,
      printable: true,
      testable: true,
    })),
  ];
}

export function fieldLabel(path: string, fields: ExtraFieldDef[] = []): string {
  return catalogFor(fields).find((f) => f.path === path)?.label ?? path;
}
