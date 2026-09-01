'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline'
import { useSelectedChildStore } from '@/store/useSelectedChildStore'
import { ChildSummary } from '@/services/types/parentPortal'
import { childColor, childInitial, gradeTextColor } from './childColors'

const QUICK_LINKS = [
  { label: 'Grades', icon: BookOpenIcon, path: '/parent/grades' },
  { label: 'Attendance', icon: ClipboardDocumentCheckIcon, path: '/parent/attendance' },
  { label: 'Feedback', icon: ChatBubbleLeftRightIcon, path: '/parent/feedback' },
]

/** One child's headline numbers on the parent dashboard. */
const ChildOverviewCard: React.FC<{ summary: ChildSummary }> = ({ summary }) => {
  const router = useRouter()
  const selectChild = useSelectedChildStore((s) => s.selectChild)
  const color = childColor(summary.studentId)

  // Deep links carry the child through, so the destination page opens
  // already filtered to them rather than to "All children".
  const goTo = (path: string) => {
    selectChild(summary.studentId)
    router.push(path)
  }

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

      {/* Quick links */}
      <div className="flex flex-wrap gap-2">
        {QUICK_LINKS.map(({ label, icon: Icon, path }) => (
          <button
            key={label}
            onClick={() => goTo(path)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 bg-stone-50 border border-stone-200 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-800 transition-colors cursor-pointer"
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default ChildOverviewCard
