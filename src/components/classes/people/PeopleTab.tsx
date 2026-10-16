// src/components/classes/people/PeopleTab.tsx
// The class's teachers and students with their SchoolMule accounts. T11
// fills it in.
'use client'

import type { FC } from 'react'
import { UserGroupIcon } from '@heroicons/react/24/outline'
import TabEmptyState from '@/components/classes/page/TabEmptyState'
import type { ClassTabProps } from '@/components/classes/page/tabs'

const PeopleTab: FC<ClassTabProps> = () => (
  <TabEmptyState icon={UserGroupIcon}>People will appear here.</TabEmptyState>
)

export default PeopleTab
