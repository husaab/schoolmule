// src/components/classes/page/tabs.ts
// The class page's tabs (the staff view), in page order, and what every tab
// body receives from the page.

import type { ClassTab } from '@/lib/classroomRoutes'
import type { ClassPageData } from '@/services/types/classroom'

export interface ClassTabItem {
  id: ClassTab
  label: string
}

export const CLASS_TABS: ClassTabItem[] = [
  { id: 'stream', label: 'Stream' },
  { id: 'classwork', label: 'Classwork' },
  { id: 'grades', label: 'Grades' },
  { id: 'people', label: 'People' },
  { id: 'settings', label: 'Settings' },
]

/** Props of every tab body. */
export interface ClassTabProps {
  classId: string
  data: ClassPageData
  /** Refetch the class header (after a change the header shows). */
  reload: () => Promise<void>
  /** Apply a change the server has already confirmed, without a refetch. */
  patchClass?: (patch: Partial<ClassPageData['class']>) => void
  /** Opens the page's banner, color and icon window. */
  onChangeBanner?: () => void
}
