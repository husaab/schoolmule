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

/** Anchor id for a child's section — shared with ChildJumpNav. */
export const childSectionId = (studentId: string) => `child-section-${studentId}`

interface ChildSectionsProps {
  renderChild: (child: ChildLite) => React.ReactNode
  /** Hide the per-child avatar headers when the rendered card is already self-identifying */
  withHeaders?: boolean
}

/**
 * The single place "All children vs one child" behavior lives: renders one
 * section per visible child, with an avatar header per section whenever more
 * than one child is shown. Sections carry anchor ids so ChildJumpNav can
 * scroll to them.
 */
const ChildSections: React.FC<ChildSectionsProps> = ({ renderChild, withHeaders = true }) => {
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

  return (
    <div className="space-y-10">
      {visible.map((child) => (
        <section key={child.studentId} id={childSectionId(child.studentId)} className="scroll-mt-36">
          {showHeaders && <ChildSectionHeader child={child} />}
          {renderChild(child)}
        </section>
      ))}
    </div>
  )
}

export default ChildSections
