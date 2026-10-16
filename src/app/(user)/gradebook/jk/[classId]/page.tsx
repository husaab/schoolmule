// File: src/app/(user)/gradebook/jk/[classId]/page.tsx
// The gradebook now lives in each class (Classes → a class → Grades); this
// old URL redirects there (see legacyGradebookRedirect).
'use client'

import LegacyGradebookRedirect from '@/components/gradebook/LegacyGradebookRedirect'

export default function LegacyGradebookPage() {
  return <LegacyGradebookRedirect />
}
