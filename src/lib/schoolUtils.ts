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