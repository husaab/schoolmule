'use client'

// The parent's Classes page. With "All children" chosen it is "This week in
// class": what needs the parent and a card per child (Parent-Classes board).
// With one child chosen in the sidebar it is the lens: that child's classes,
// read-only, the way the child sees them (Parent-Lens board). Choosing a child
// anywhere in the portal moves this page between the two.

import { Suspense, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AcademicCapIcon } from '@heroicons/react/24/outline'
import ParentChildLens from '@/components/parent/classes/ParentChildLens'
import ParentClassesOverview from '@/components/parent/classes/ParentClassesOverview'
import ParentPageShell from '@/components/parent/ParentPageShell'
import { markParentClassesSeen } from '@/lib/parentClassesSeen'
import { parentClassesHref } from '@/lib/portalRoutes'
import { ALL_CHILDREN, useChildStoreHydrated, useSelectedChildStore } from '@/store/useSelectedChildStore'

function ParentClassesContent() {
  const router = useRouter()
  const hydrated = useChildStoreHydrated()
  const kids = useSelectedChildStore((s) => s.children)
  const selectedChildId = useSelectedChildStore((s) => s.selectedChildId)
  const selectChild = useSelectedChildStore((s) => s.selectChild)

  // Opening the page clears the "New" pill in the sidebar.
  useEffect(() => {
    markParentClassesSeen()
  }, [])

  const child = selectedChildId === ALL_CHILDREN ? null : (kids.find((c) => c.studentId === selectedChildId) ?? null)
  // The sidebar loads the children; until it has, a remembered child is not yet known.
  const waitingForChildren = selectedChildId !== ALL_CHILDREN && !child && kids.length === 0

  return (
    <ParentPageShell title="Classes" badge={{ icon: AcademicCapIcon, label: 'Parent' }}>
      {!hydrated || waitingForChildren ? (
        <div className="h-64 animate-pulse rounded-[18px] bg-stone-100" aria-label="Loading" />
      ) : child ? (
        <ParentChildLens key={child.studentId} child={child} />
      ) : (
        <ParentClassesOverview
          onOpenChild={(id) => {
            selectChild(id)
            router.replace(parentClassesHref())
          }}
        />
      )}
    </ParentPageShell>
  )
}

export default function ParentClassesPage() {
  return (
    <Suspense fallback={null}>
      <ParentClassesContent />
    </Suspense>
  )
}
