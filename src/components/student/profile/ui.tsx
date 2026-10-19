'use client'

// Small building blocks shared by the student profile tabs.

import React from 'react'
import Link from 'next/link'
import { AcademicCapIcon } from '@heroicons/react/24/outline'
import type { AssessmentCellStatus } from '@/services/types/analytics'
import type { ProfileEnrollment } from '@/services/types/studentProfile'
import { gradeBar } from '@/lib/studentProfile'

/** Where a class's gradebook lives for this viewer, or null when they can't open it. */
export type GradebookLink = (enrollment: Pick<ProfileEnrollment, 'classId' | 'grade' | 'teacherId'>) => string | null

export const Card = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  flush = false,
}: {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  /** Drop the body padding (tables and lists that run edge to edge). */
  flush?: boolean
}) => {
  const hasHeader = Boolean(title || action)
  return (
    <section className={`rounded-2xl border border-slate-100 bg-white shadow-sm ${className}`}>
      {hasHeader && (
        <header className="flex items-start justify-between gap-3 px-6 pt-5">
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-slate-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </header>
      )}
      <div className={flush ? (hasHeader ? 'pt-3' : '') : hasHeader ? 'px-6 pb-6 pt-4' : 'p-6'}>{children}</div>
    </section>
  )
}

export const EmptyState = ({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  title: string
  children?: React.ReactNode
}) => (
  <div className="py-8 text-center">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
      <Icon className="h-6 w-6 text-slate-400" />
    </div>
    <p className="text-sm font-semibold text-slate-700">{title}</p>
    {children && <p className="mx-auto mt-1 max-w-sm text-sm text-slate-500">{children}</p>}
  </div>
)

const CELL_PILL: Record<AssessmentCellStatus, [string, string]> = {
  graded: ['graded', 'bg-emerald-50 text-emerald-600'],
  missing: ['missing', 'bg-rose-50 text-rose-600'],
  excused: ['excused', 'bg-slate-100 text-slate-500'],
  blank: ['not yet graded', 'bg-stone-100 text-stone-500'],
}

/** The resolved state of one mark, worded like the gradebook and analytics. */
export const CellStatusPill = ({ status }: { status: AssessmentCellStatus }) => {
  const [label, cls] = CELL_PILL[status]
  return <span className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase ${cls}`}>{label}</span>
}

/** A 0–100 bar with an optional tick for the class average. */
export const GradeBar = ({ pct, average }: { pct: number | null; average?: number | null }) => (
  <div className="relative h-2 w-full rounded-full bg-slate-100">
    {pct != null && (
      <div className={`h-2 rounded-full ${gradeBar(pct)}`} style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
    )}
    {average != null && (
      <div
        aria-hidden="true"
        className="absolute -top-1 h-4 w-0.5 rounded-full bg-slate-500/70"
        style={{ left: `calc(${Math.min(100, Math.max(0, average))}% - 1px)` }}
        title={`Class average ${average}%`}
      />
    )}
  </div>
)

export const linkClass = 'text-sm font-medium text-cyan-600 hover:text-cyan-700'

/** Classes as plain rows with a gradebook link: JK/SK, or a term with nothing graded yet. */
export const ClassLinkList = ({
  classes,
  gradebookLink,
  linkLabel,
  fallback,
}: {
  classes: ProfileEnrollment[]
  gradebookLink: GradebookLink
  linkLabel: string
  /** Shown instead of the link when the viewer can't open that gradebook. */
  fallback?: string
}) =>
  classes.length === 0 ? (
    <EmptyState icon={AcademicCapIcon} title="No classes this term">
      Enrol the student in a class to see their work here.
    </EmptyState>
  ) : (
    <ul className="divide-y divide-slate-50 pb-2">
      {classes.map((c) => {
        const href = gradebookLink(c)
        return (
          <li key={c.classId} className="flex items-center justify-between gap-4 px-6 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{c.subject}</p>
              <p className="truncate text-xs text-slate-500">{c.teacherName ?? 'No teacher'}</p>
            </div>
            {href ? (
              <Link href={href} className={`${linkClass} whitespace-nowrap`}>
                {linkLabel}
              </Link>
            ) : fallback ? (
              <span className="text-xs text-slate-400">{fallback}</span>
            ) : null}
          </li>
        )
      })}
    </ul>
  )
