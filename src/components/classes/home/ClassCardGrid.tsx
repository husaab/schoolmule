// src/components/classes/home/ClassCardGrid.tsx
// The Classes home card grid, laid out by layoutClasses: one grid in grade
// order for a teacher, collapsible grade sections for an admin (who may have
// sixty classes), and archived classes in their own section at the end.
'use client'

import type { CardLabel, ClassesLayout, GradeSection } from '@/lib/classGradeSections'
import type { ClassCard as ClassCardData } from '@/services/types/classroom'
import ClassCard, { type ClassCardActions } from './ClassCard'
import GradeGroupHeader from './GradeGroupHeader'

interface ClassCardGridProps extends ClassCardActions {
  layout: ClassesLayout<ClassCardData>
  labels: Map<string, CardLabel>
  collapsed: Set<string>
  onToggle: (key: string) => void
}

const GRID = 'grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr))]'
const NO_LABEL: CardLabel = { showTeacher: false, termChip: null, railSuffix: null }

export default function ClassCardGrid({ layout, labels, collapsed, onToggle, ...actions }: ClassCardGridProps) {
  const grid = (cards: ClassCardData[]) => (
    <div className={GRID}>
      {cards.map((card) => (
        <ClassCard key={card.classId} card={card} label={labels.get(card.classId) ?? NO_LABEL} {...actions} />
      ))}
    </div>
  )

  const section = (s: GradeSection<ClassCardData>, archived = false) => {
    const isCollapsed = collapsed.has(s.key)
    return (
      <section key={s.key} aria-label={s.label} className="flex flex-col gap-3">
        <GradeGroupHeader section={s} archived={archived} collapsed={isCollapsed} onToggle={() => onToggle(s.key)} />
        {!isCollapsed && grid(s.cards)}
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {layout.sectioned ? layout.sections.map((s) => section(s)) : layout.flat.length > 0 && grid(layout.flat)}
      {layout.archived && section(layout.archived, true)}
    </div>
  )
}
