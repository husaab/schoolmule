// src/lib/schoolUtils.ts

export const schoolDisplayNames: Record<string, string> = {
  PLAYGROUND:       'Playground School',
  ALHAADIACADEMY:   'Al Haadi Academy',
  ALRASOOLACADEMY:  'Al Rasool Academy',
  JCC:              'Jaafari Community Centre',
  // add more enum→name mappings here as needed
};

/**
 * Static public path to each school's logo (served from /public).
 * Used for app chrome (header lockup) where we want a synchronous, no-flicker
 * asset — distinct from the dynamic Supabase-bucket assets used on report cards.
 */
export const schoolLogos: Record<string, string> = {
  ALHAADIACADEMY: '/schools/alhaadiacademy/AlHaadiAcademyLogo.avif',
  // add more enum→logo-path mappings here as needed
};

/**
 * Get the static public path to a school's logo, or null if none is configured.
 */
export function getSchoolLogo(raw: string | null | undefined): string | null {
  if (!raw) return null;
  return schoolLogos[raw] ?? null;
}

/**
 * Convert a School enum value into its user-friendly display name.
 * Falls back to capitalizing and spacing the raw enum if no mapping exists.
 */
export function getSchoolName(raw: string): string {
  if (schoolDisplayNames[raw]) {
    return schoolDisplayNames[raw];
  }
  // fallback: e.g. "MY_SCHOOL_ENUM" → "My School Enum"
  return raw
    .toLowerCase()
    .split(/[_\s]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * A school as presented in the public signup directory. Kept deliberately
 * minimal (no API payload) because the directory is pre-auth: `GET /schools`
 * requires a token, so the signup surface is sourced from this static list.
 */
export interface SignupSchool {
  schoolCode: string;
  name: string;
}

/**
 * Schools offered on the public signup directory, in display order.
 * Onboard a new school: add a line here, and (optionally) its logo in
 * `schoolLogos` above — schools with no logo fall back to a branded initial.
 * Test/demo tenants (e.g. PLAYGROUND) are intentionally excluded.
 */
export const SIGNUP_SCHOOLS: SignupSchool[] = [
  { schoolCode: 'ALHAADIACADEMY',  name: 'Al Haadi Academy' },
  { schoolCode: 'ALRASOOLACADEMY', name: 'Al Rasool Academy' },
  { schoolCode: 'JCC',             name: 'Jaafari Community Centre (JCC)' },
];

/**
 * URL-friendly slug for a school, used in deep-linkable signup routes
 * (e.g. "ALHAADIACADEMY" → "alhaadiacademy"). Mirrors the /public/schools/<code>/
 * asset-folder convention.
 */
export function getSchoolSlug(code: string): string {
  return code.toLowerCase();
}

/**
 * Reverse-resolve a signup slug back to its school by matching against each
 * school's computed slug. Robust against codes containing separators, unlike a
 * naive toUpperCase(). Returns null when no school matches.
 */
export function findSignupSchoolBySlug(slug: string): SignupSchool | null {
  const target = slug.toLowerCase();
  return SIGNUP_SCHOOLS.find(s => getSchoolSlug(s.schoolCode) === target) ?? null;
}

// Grade types and utilities
export type GradeValue = 'JK' | 'SK' | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface GradeOption {
  value: GradeValue;
  label: string;
  numericValue?: number;
}

export const GRADE_OPTIONS: GradeOption[] = [
  { value: 'JK', label: 'JK', numericValue: -1 },
  { value: 'SK', label: 'SK', numericValue: 0 },
  { value: 1, label: '1', numericValue: 1 },
  { value: 2, label: '2', numericValue: 2 },
  { value: 3, label: '3', numericValue: 3 },
  { value: 4, label: '4', numericValue: 4 },
  { value: 5, label: '5', numericValue: 5 },
  { value: 6, label: '6', numericValue: 6 },
  { value: 7, label: '7', numericValue: 7 },
  { value: 8, label: '8', numericValue: 8 },
];

/**
 * Get all available grade options for dropdowns/selects
 */
export function getGradeOptions(): GradeOption[] {
  return GRADE_OPTIONS;
}

/**
 * Convert a grade value to its display label
 */
export function getGradeLabel(grade: GradeValue | number | null | undefined): string {
  if (grade === null || grade === undefined) return '';
  
  const option = GRADE_OPTIONS.find(opt => opt.value === grade);
  return option ? option.label : String(grade);
}

/**
 * Check if a grade is JK or SK (Junior/Senior Kindergarten)
 */
export function isJKSK(grade: GradeValue | string | number | null | undefined): boolean {
  return grade === 'JK' || grade === 'SK';
}

/**
 * Check if a grade is specifically JK (Junior Kindergarten)
 */
export function isJK(grade: GradeValue | string | number | null | undefined): boolean {
  return grade === 'JK';
}

/**
 * Check if a grade is specifically SK (Senior Kindergarten)
 */
export function isSK(grade: GradeValue | string | number | null | undefined): boolean {
  return grade === 'SK';
}

/**
 * Get the full display name for a grade.
 * JK → "Junior Kindergarten", SK → "Senior Kindergarten", 1 → "Grade 1", etc.
 * Use this instead of `Grade ${label}` to handle JK/SK properly.
 */
export function getGradeDisplayName(grade: GradeValue | string | number | null | undefined): string {
  if (grade === null || grade === undefined) return '';
  if (grade === 'JK') return 'Junior Kindergarten';
  if (grade === 'SK') return 'Senior Kindergarten';
  return `Grade ${grade}`;
}

/**
 * Convert a grade value to its numeric equivalent for sorting/comparison
 */
export function getGradeNumericValue(grade: GradeValue | number | string | null | undefined): number {
  if (grade === null || grade === undefined) return -999;
  
  // First try exact match
  let option = GRADE_OPTIONS.find(opt => opt.value === grade);
  
  // If no exact match and it's a string, try converting to number and matching again
  if (!option && typeof grade === 'string') {
    const numericGrade = parseInt(grade, 10);
    if (!isNaN(numericGrade)) {
      option = GRADE_OPTIONS.find(opt => opt.value === numericGrade);
    }
  }
  
  return option ? option.numericValue! : typeof grade === 'number' ? grade : -999;
}