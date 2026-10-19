'use client'

import React from 'react'
import Link from 'next/link'
import type { StudentContext } from '@/services/types/messaging'
import Avatar from '@/components/avatar/Avatar'
import { toneClasses, type Tone } from './tones'

/**
 * Staff-side strip for a general thread: who the student is, their homeroom
 * and recent attendance, with a jump to their profile. Replaces the score
 * card, which has nothing to show when there is no assessment.
 */
const StudentContextCard: React.FC<{ student: StudentContext; tone: Tone }> = ({ student, tone }) => {
  const t = toneClasses(tone)
  const meta = [
    student.grade != null ? `Grade ${student.grade}` : null,
    student.homeroomTeacherName ? `Homeroom ${student.homeroomTeacherName}` : null,
    student.attendancePct != null ? `Attendance ${student.attendancePct}%` : null,
  ].filter(Boolean)

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3">
      <Avatar name={student.name} avatar={student.studentAvatar ?? null} size={40} />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Student</p>
        <p className="truncate text-sm font-medium text-slate-900">{student.name}</p>
        <p className="truncate text-xs text-slate-500">{meta.join(' · ')}</p>
      </div>
      <Link href={`/students?q=${encodeURIComponent(student.name)}`} className={`rounded-lg px-3 py-1.5 text-xs font-medium ${t.secondary} whitespace-nowrap`}>
        Student profile
      </Link>
    </div>
  )
}

export default StudentContextCard
