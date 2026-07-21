'use client'

import React from 'react'
import { UserGroupIcon } from '@heroicons/react/24/outline'
import {
  ChildLite,
  useVisibleChildren,
  useSelectedChildStore,
  ALL_CHILDREN,
} from '@/store/useSelectedChildStore'
import ChildSectionHeader from './ChildSectionHeader'
import ParentEmptyState from './ParentEmptyState'

interface ChildSectionsProps {
  renderChild: (child: ChildLite) => React.ReactNode
  /** Hide the per-child avatar headers when the rendered card is already self-identifying */
  withHeaders?: boolean
  /** 'grid' shows children side by side on large screens instead of stacked */
  layout?: 'stack' | 'grid'
}

/**
 * The single place "All children vs one child" behavior lives: renders one
 * section per visible child, with an avatar header per section whenever more
 * than one child is shown.
 */
const ChildSections: React.FC<ChildSectionsProps> = ({
  renderChild,
  withHeaders = true,
  layout = 'stack',
}) => {
  const visible = useVisibleChildren()
  const selectedChildId = useSelectedChildStore((s) => s.selectedChildId)
  const showHeaders = withHeaders && selectedChildId === ALL_CHILDREN && visible.length > 1

  if (visible.length === 0) {
    return (
      <ParentEmptyState
        icon={UserGroupIcon}
        title="No Children Linked"
        message="No children are linked to your account yet. Please contact the school office to get set up."
      />
    )
  }

  const wrapperClass =
    layout === 'grid' && visible.length > 1
      ? 'grid grid-cols-1 lg:grid-cols-2 gap-6 items-start'
      : 'space-y-10'

  return (
    <div className={wrapperClass}>
      {visible.map((child) => (
        <section key={child.studentId} className="min-w-0">
          {showHeaders && <ChildSectionHeader child={child} />}
          {renderChild(child)}
        </section>
      ))}
    </div>
  )
}

export default ChildSections
