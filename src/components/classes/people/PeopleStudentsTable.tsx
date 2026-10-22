// src/components/classes/people/PeopleStudentsTable.tsx
// The People tab's students table (the Teacher-People board): student (avatar
// and name), SchoolMule account status, parents, missing work (rose when
// above zero), last active and the ⋮. It scrolls sideways on a phone rather
// than squeezing the columns.
'use client'

import Avatar from '@/components/avatar/Avatar'
import AccountStatusPill from '@/components/studentAccounts/AccountStatusPill'
import { parentsText, type StudentMenuAction } from '@/lib/classPeople'
import { lastSignedInText, peopleAccountLine } from '@/lib/studentAccounts'
import type { PeopleStudent } from '@/services/types/classroom'
import StudentAccountRowMenu from './StudentAccountRowMenu'

const GRID = 'grid grid-cols-[2.2fr_1.1fr_2fr_1fr_1fr_44px] items-center gap-3 px-4'

interface PeopleStudentsTableProps {
  students: PeopleStudent[]
  /** The student with a request in flight. */
  busyId: string | null
  onAction: (action: StudentMenuAction, student: PeopleStudent) => void
  /** False on a read-only class (a past school year): no account actions. */
  canEdit: boolean
}

export default function PeopleStudentsTable({ students, busyId, onAction, canEdit }: PeopleStudentsTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200/70 bg-white">
      <div className="flex min-w-[820px] flex-col">
        <div role="row" className={`${GRID} bg-slate-50 py-3 text-xs font-medium text-slate-600`}>
          <span role="columnheader">Student</span>
          <span role="columnheader">SchoolMule</span>
          <span role="columnheader">Parents</span>
          <span role="columnheader">Missing</span>
          <span role="columnheader">Last active</span>
          <span role="columnheader" className="sr-only">
            Options
          </span>
        </div>
        {students.length === 0 ? (
          <p className="border-t border-slate-100 px-4 py-8 text-center text-sm text-slate-500">No students match.</p>
        ) : (
          students.map((student) => {
            const parents = parentsText(student.parents)
            return (
              <div key={student.studentId} role="row" className={`${GRID} border-t border-slate-100 py-2.5 text-sm`}>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar student name={student.name} avatar={student.avatar} photoUrl={student.photoUrl} size={38} />
                  <span className="truncate font-medium text-slate-900">{student.name}</span>
                </span>
                <span className="min-w-0">
                  <AccountStatusPill status={student.account.status} />
                  {(() => {
                    const line = peopleAccountLine(student.account)
                    return line ? <span className="mt-1 block truncate text-xs text-slate-500">{line}</span> : null
                  })()}
                </span>
                <span className={`min-w-0 truncate ${parents ? 'text-slate-600' : 'text-slate-400'}`} title={parents || undefined}>
                  {parents || 'None on file'}
                </span>
                <span className={`font-medium ${student.missingCount > 0 ? 'text-rose-700' : 'text-slate-500'}`}>
                  {student.missingCount}
                </span>
                <span className="text-slate-500">{lastSignedInText(student.account.lastSeenAt)}</span>
                <StudentAccountRowMenu student={student} onSelect={onAction} busy={busyId === student.studentId} canEdit={canEdit} />
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
