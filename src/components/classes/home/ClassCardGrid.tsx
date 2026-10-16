// src/components/classes/home/ClassCardGrid.tsx
// The Classes home card grid. Teachers see one grid; admins (who may have
// sixty classes) see the cards under collapsible grade headers, as the list
// has always been grouped.
'use client'

import { useState } from 'react'
import { groupCardsByGrade } from '@/lib/classesHome'
import type { ClassCard as ClassCardData } from '@/services/types/classroom'
import ClassCard, { type ClassCardActions } from './ClassCard'
import GradeGroupHeader from './GradeGroupHeader'

interface ClassCardGridProps extends ClassCardActions {
  cards: ClassCardData[]
  /** Group the cards under grade headers (admins). */
  grouped: boolean
}

const GRID = 'grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr))]'

export default function ClassCardGrid({ cards, grouped, ...actions }: ClassCardGridProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  if (!grouped) {
    return (
      <div className={GRID}>
        {cards.map((card) => (
          <ClassCard key={card.classId} card={card} {...actions} />
        ))}
      </div>
    )
  }

  const toggle = (grade: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(grade)) next.delete(grade)
      else next.add(grade)
      return next
    })

  return (
    <div className="space-y-5">
      {groupCardsByGrade(cards).map((group) => {
        const isCollapsed = collapsed.has(group.grade)
        return (
          <section key={group.grade} className="space-y-3">
            <GradeGroupHeader
              label={group.label}
              count={group.cards.length}
              collapsed={isCollapsed}
              onToggle={() => toggle(group.grade)}
            />
            {!isCollapsed && (
              <div className={GRID}>
                {group.cards.map((card) => (
                  <ClassCard key={card.classId} card={card} {...actions} />
                ))}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
