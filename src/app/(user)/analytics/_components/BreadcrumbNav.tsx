'use client'

import React from 'react'
import { ChevronRightIcon } from '@heroicons/react/24/outline'
import { UseAnalyticsParams } from '../_hooks/useAnalyticsParams'

interface BreadcrumbNavProps {
  params: UseAnalyticsParams
  classLabel?: string | null
  studentLabel?: string | null
}

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({ params, classLabel, studentLabel }) => {
  const crumbs: Array<{ label: string; onClick?: () => void }> = [
    {
      label: 'School Overview',
      onClick: params.view !== 'school' ? () => params.drillTo('school') : undefined,
    },
  ]

  if (params.grade) {
    crumbs.push({
      label: `Grade ${params.grade}`,
      // Narrowing up to a grade drops any subject filter (whole-cohort view).
      onClick:
        params.view !== 'grade'
          ? () => params.drillTo('grade', { grade: params.grade, subject: null })
          : undefined,
    })
  }
  if (params.subject) {
    crumbs.push({
      label: params.grade ? `${params.subject}` : params.subject,
      onClick:
        params.view !== 'subject'
          ? () => params.drillTo('subject', { subject: params.subject })
          : undefined,
    })
  }
  // A class belongs to a subject, so when a subject crumb is already shown the
  // class crumb would be redundant with it (and the page title). Only show the
  // class crumb when there's no subject context.
  if (params.classId && !params.subject) {
    crumbs.push({
      label: classLabel || 'Class',
      onClick:
        params.view !== 'class'
          ? () => params.drillTo('class', { classId: params.classId })
          : undefined,
    })
  }
  if (params.studentId) {
    crumbs.push({ label: studentLabel || 'Student' })
  }

  return (
    <nav aria-label="Analytics breadcrumb" className="flex items-center flex-wrap gap-1 text-sm">
      {crumbs.map((crumb, i) => (
        <React.Fragment key={`${crumb.label}-${i}`}>
          {i > 0 && <ChevronRightIcon className="w-3.5 h-3.5 text-slate-300" />}
          {crumb.onClick ? (
            <button
              onClick={crumb.onClick}
              className="text-cyan-600 hover:text-cyan-700 hover:underline font-medium"
            >
              {crumb.label}
            </button>
          ) : (
            <span className="text-slate-900 font-semibold">{crumb.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

export default BreadcrumbNav
