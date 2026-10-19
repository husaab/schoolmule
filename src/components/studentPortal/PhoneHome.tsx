// src/components/studentPortal/PhoneHome.tsx
// The student's Home below md (Student-Phone board, smoke S11): missing work
// as rose banners first, then the next thing turned in with a photo as its own
// card with a big "Take a photo & turn in", then the rest of what is due under
// the To-do's own week headings, then the newest grade. The desktop Home keeps
// its Due soon and New grades cards; this replaces them on a phone.
'use client'

import Link from 'next/link'
import { CameraIcon, ChevronRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { missingSubline, phoneDueSubline, phoneHomePlan, photoDueLine, scoreText } from '@/lib/classroomText'
import { studentGradesHref, studentItemHref, studentTodoHref } from '@/lib/portalRoutes'
import type { GradeItem, TodoItem } from '@/services/types/studentPortal'

interface PhoneHomeProps {
  missing: TodoItem[]
  dueSoon: TodoItem[]
  newGrades: GradeItem[]
  now?: Date
}

function IconTile({ item }: { item: TodoItem }) {
  // eslint-disable-next-line @next/next/no-img-element -- static class icon
  return <img src={item.iconUrl} alt="" className="h-11 w-11 flex-none rounded-xl" />
}

export default function PhoneHome({ missing, dueSoon, newGrades, now = new Date() }: PhoneHomeProps) {
  const plan = phoneHomePlan(missing, dueSoon, now)
  const grade = newGrades[0] ?? null
  if (plan.missing.length === 0 && !plan.photo && plan.groups.length === 0 && !grade) return null

  return (
    <div className="flex flex-col gap-3.5 md:hidden">
      {plan.missing.map((item) => (
        <Link
          key={item.itemId}
          href={studentItemHref(item.itemId)}
          className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-slate-900"
        >
          <ExclamationCircleIcon className="h-[22px] w-[22px] flex-none text-rose-700" aria-hidden="true" />
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-base font-medium">{item.title}</span>
            <span className="truncate text-[13px] text-rose-800">{missingSubline(item, now)}</span>
          </span>
          <ChevronRightIcon className="h-[18px] w-[18px] flex-none text-rose-700" aria-hidden="true" />
        </Link>
      ))}
      {plan.moreMissing > 0 && (
        <Link href={studentTodoHref({ tab: 'missing' })} className="-mt-1 px-1 text-sm font-medium text-rose-800">
          {plan.moreMissing} more missing
        </Link>
      )}

      {plan.photo && (
        <section className="flex flex-col gap-3 rounded-[18px] border border-slate-200 bg-white p-4">
          <Link href={studentItemHref(plan.photo.itemId)} className="flex items-center gap-3 text-slate-900">
            <IconTile item={plan.photo} />
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-base font-medium">{plan.photo.title}</span>
              <span className="text-[13px] font-medium text-amber-800">{photoDueLine(plan.photo, now)}</span>
            </span>
          </Link>
          <Link
            href={studentItemHref(plan.photo.itemId)}
            className="flex min-h-[52px] items-center justify-center gap-2.5 rounded-[14px] bg-indigo-600 px-4 text-base font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            <CameraIcon className="h-[22px] w-[22px]" aria-hidden="true" />
            Take a photo &amp; turn in
          </Link>
        </section>
      )}

      {plan.groups.map((group) => (
        <section key={group.label} className="flex flex-col gap-2.5">
          <h3 className="mx-0.5 mt-1.5 text-sm font-semibold text-slate-600">{group.label}</h3>
          {group.items.map((item) => (
            <Link
              key={item.itemId}
              href={studentItemHref(item.itemId)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 text-slate-900"
            >
              <IconTile item={item} />
              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-base font-medium">{item.title}</span>
                <span className="truncate text-[13px] text-slate-500">{phoneDueSubline(item, now)}</span>
              </span>
            </Link>
          ))}
        </section>
      ))}

      {grade && (
        <Link
          href={studentGradesHref({ classId: grade.classId })}
          className="flex items-center gap-3 rounded-2xl bg-indigo-50 p-3.5 text-slate-900"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[13px] font-medium text-indigo-800">New grade</span>
            <span className="truncate text-base font-medium">{grade.title}</span>
          </span>
          <span className="font-display text-2xl font-semibold text-indigo-800">{scoreText(grade)}</span>
        </Link>
      )}
    </div>
  )
}
