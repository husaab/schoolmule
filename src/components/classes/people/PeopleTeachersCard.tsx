// src/components/classes/people/PeopleTeachersCard.tsx
// The People tab's Teachers section: the lead teacher and co-teachers with
// their avatars and roles. There is no Message button (teachers do not
// message each other in SchoolMule); who teaches the class is changed in
// Settings.
'use client'

import Link from 'next/link'
import Avatar from '@/components/avatar/Avatar'
import { classHref } from '@/lib/classroomRoutes'
import { teacherRoleLine } from '@/lib/classPeople'
import type { ClassPageTeacher } from '@/services/types/classroom'

interface PeopleTeachersCardProps {
  classId: string
  teachers: ClassPageTeacher[]
}

export default function PeopleTeachersCard({ classId, teachers }: PeopleTeachersCardProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <h2 className="font-display text-[22px] font-semibold text-slate-900">Teachers</h2>
        <Link href={classHref(classId, 'settings', {}, '#teachers')} className="text-sm font-medium text-cyan-700 hover:text-cyan-900">
          Add or remove in Settings
        </Link>
      </div>
      {teachers.length === 0 ? (
        <p className="text-sm text-slate-500">No teacher is assigned to this class yet.</p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(320px,100%),1fr))] gap-3">
          {teachers.map((t) => (
            <li key={t.userId} className="flex items-center gap-3.5 rounded-[14px] border border-slate-200/70 bg-white px-4 py-3.5">
              <Avatar name={t.name} avatar={t.avatar} photoUrl={t.photoUrl} size={48} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[15px] font-medium text-slate-900">{t.name}</span>
                <span className="text-[13px] text-slate-500">{teacherRoleLine(t)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
