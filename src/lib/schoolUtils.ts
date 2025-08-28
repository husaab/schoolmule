// src/lib/schoolUtils.ts

export const schoolDisplayNames: Record<string, string> = {
  PLAYGROUND:       'Playground School',
  ALHAADIACADEMY:   'Al Haadi Academy',
  // add more enum→name mappings here as needed
};

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
 * Convert a grade value to its numeric equivalent for sorting/comparison
 */
export function getGradeNumericValue(grade: GradeValue | number | null | undefined): number {
  if (grade === null || grade === undefined) return -999;
  
  const option = GRADE_OPTIONS.find(opt => opt.value === grade);
  return option ? option.numericValue! : typeof grade === 'number' ? grade : -999;
}