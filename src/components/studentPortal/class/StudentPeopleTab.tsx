// src/components/studentPortal/class/StudentPeopleTab.tsx
// The People tab of a student's class page: the class's teachers with their
// avatars. Classmates are never listed. Writing to a teacher is the "Message"
// button at the top of the page, not a button per person.
'use client'

import Avatar from '@/components/avatar/Avatar'
import type { ClassTeacher } from '@/services/types/studentPortal'

export default function StudentPeopleTab({ teachers }: { teachers: ClassTeacher[] }) {
  if (teachers.length === 0) {
    return <p className="rounded-2xl border border-slate-200/70 bg-white p-6 text-center text-[15px] text-slate-500">No teachers on this class yet.</p>
  }
  return (
    <section className="flex max-w-xl flex-col gap-1 rounded-2xl border border-slate-200/70 bg-white p-2">
      <h2 className="px-3 pb-1 pt-3 text-[15px] font-semibold text-slate-900">Teachers</h2>
      {teachers.map((t) => (
        <div key={t.userId ?? t.name} className="flex items-center gap-3.5 rounded-xl px-3 py-2.5">
          <Avatar name={t.name} avatar={t.avatar} photoUrl={t.photoUrl} size={48} />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-[15px] font-medium text-slate-900">{t.name}</span>
            <span className="text-[13px] text-slate-500">{t.role === 'lead' ? 'Lead teacher' : 'Co-teacher'}</span>
          </div>
        </div>
      ))}
    </section>
  )
}
