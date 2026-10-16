// src/components/classes/stream/StreamTab.tsx
// The class Stream (announcements and classwork notices). T11 fills it in.
'use client'

import type { FC } from 'react'
import { MegaphoneIcon } from '@heroicons/react/24/outline'
import TabEmptyState from '@/components/classes/page/TabEmptyState'
import type { ClassTabProps } from '@/components/classes/page/tabs'

const StreamTab: FC<ClassTabProps> = () => (
  <TabEmptyState icon={MegaphoneIcon}>Nothing posted yet. Announcements you post appear here.</TabEmptyState>
)

export default StreamTab
