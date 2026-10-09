'use client'

import React from 'react'
import Link from 'next/link'
import {
  ArrowRightIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import { useSelectedChildStore } from '@/store/useSelectedChildStore'
import { ChildSummary } from '@/services/types/parentPortal'
import { childColor, childInitial, gradeTextColor } from './childColors'

/**
 * Where each card link goes, with a one-line hint built from the numbers
 * already on the card so a parent knows what is waiting before they tap.
 */
const navLinks = (s: ChildSummary) => {
  const missedDays = s.attendance ? s.attendance.totalDays - s.attendance.presentDays : null
  return [
    {
      label: 'View grades',
      icon: BookOpenIcon,
      path: '/parent/grades',
      hint:
        s.overallAvg != null
          ? `Every mark by class · ${s.overallAvg}% overall`
          : s.classCount > 0
            ? 'Every mark by class · nothing published yet'
            : 'Every mark by class',
    },
    {
      label: 'View attendance',
      icon: ClipboardDocumentCheckIcon,
      path: '/parent/attendance',
      hint:
        missedDays == null
          ? 'Day-by-day record'
          : missedDays === 0
            ? 'Day-by-day record · no days missed'
            : `Day-by-day record · ${missedDays} ${missedDays === 1 ? 'day' : 'days'} missed`,
    },
    {
      label: 'Read teacher feedback',
      icon: ChatBubbleLeftRightIcon,
      path: '/parent/feedback',
      hint: s.latestFeedback?.subject
        ? `Report card comments · latest from ${s.latestFeedback.subject}`
        : 'Report card comments and notes',
    },
  ]
}

/** One child's headline numbers on the parent dashboard. */
const ChildOverviewCard: React.FC<{ summary: ChildSummary }> = ({ summary }) => {
  const selectChild = useSelectedChildStore((s) => s.selectChild)
  const color = childColor(summary.studentId)

  return (
    <div className="h-full bg-white rounded-2xl shadow-sm border border-stone-200/70 p-6">
      {/* Child identity */}
      <div className="flex items-center gap-4 mb-6">
        <span
          className={`w-12 h-12 rounded-full bg-gradient-to-br ${color.solid} flex items-center justify-center text-white text-lg font-semibold flex-shrink-0`}
        >
          {childInitial(summary.name)}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 truncate">{summary.name}</h3>
          <p className="text-sm text-slate-500">
            {summary.grade != null && `Grade ${summary.grade}`}
            {summary.homeroomTeacher && ` · ${summary.homeroomTeacher}`}
          </p>
        </div>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl bg-stone-50 border border-stone-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
            Overall Average
          </p>
          <p className={`text-2xl font-bold ${gradeTextColor(summary.overallAvg)}`}>
            {summary.overallAvg != null ? `${summary.overallAvg}%` : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {summary.classCount > 0
              ? `across ${summary.classCount} ${summary.classCount === 1 ? 'class' : 'classes'}`
              : 'no classes this term'}
          </p>
        </div>
        <div className="rounded-xl bg-stone-50 border border-stone-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
            Attendance
          </p>
          <p className="text-2xl font-bold text-slate-900">
            {summary.attendance?.pct != null ? `${summary.attendance.pct}%` : '—'}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {summary.attendance
              ? `${summary.attendance.presentDays} of ${summary.attendance.totalDays} days`
              : 'no records yet'}
          </p>
        </div>
      </div>

      {/* Latest feedback */}
      {summary.latestFeedback?.comment && (
        <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-4 mb-4">
          <p className="text-xs font-medium uppercase tracking-wider text-amber-600 mb-1">
            Latest Teacher Feedback
          </p>
          <p className="text-sm text-slate-700 line-clamp-2">
            &ldquo;{summary.latestFeedback.comment}&rdquo;
          </p>
          <p className="text-xs text-slate-500 mt-1.5">
            {summary.latestFeedback.subject}
            {summary.latestFeedback.teacherName && ` · ${summary.latestFeedback.teacherName}`}
          </p>
        </div>
      )}

      {/* Where to go next. Real links (verb label, hint, arrow) so it is
          clear these leave the dashboard. Selecting the child first means the
          destination opens already filtered to them, not to "All children". */}
      <nav aria-label={`${summary.name} pages`} className="rounded-xl border border-stone-200 divide-y divide-stone-100 overflow-hidden">
        {navLinks(summary).map(({ label, icon: Icon, path, hint }) => (
          <Link
            key={path}
            href={path}
            onClick={() => selectChild(summary.studentId)}
            className="group flex items-center gap-3 px-3.5 py-3 bg-white hover:bg-amber-50/70 transition-colors"
          >
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-100">
              <Icon className="w-[18px] h-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-slate-900">{label}</span>
              <span className="block truncate text-xs text-slate-500">{hint}</span>
            </span>
            <ArrowRightIcon className="w-4 h-4 flex-shrink-0 text-amber-600 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </nav>
    </div>
  )
}

export default ChildOverviewCard
