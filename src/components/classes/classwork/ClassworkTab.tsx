// src/components/classes/classwork/ClassworkTab.tsx
// The class's classwork (assessments, assignments, quizzes, materials by
// topic). T18 fills it in.
'use client'

import type { FC } from 'react'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import TabEmptyState from '@/components/classes/page/TabEmptyState'
import type { ClassTabProps } from '@/components/classes/page/tabs'

const ClassworkTab: FC<ClassTabProps> = () => (
  <TabEmptyState icon={ClipboardDocumentListIcon}>No classwork yet.</TabEmptyState>
)

export default ClassworkTab
