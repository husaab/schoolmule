'use client'

// The student portal's home. Phase 0: a greeting while classes, work and
// grades are still to come (the classes and to-do sections replace the body).

import StudentShell from '@/components/studentPortal/StudentShell'
import { useStudentMe } from '@/components/studentPortal/useStudentMe'
import { studentTone } from '@/components/studentPortal/studentTone'
import { longDateLine } from '@/lib/studentAccounts'
import { useUserStore } from '@/store/useUserStore'
import { AcademicCapIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

export default function StudentHomePage() {
  const { me, error, loading, reload } = useStudentMe()
  const username = useUserStore((s) => s.user.username)

  return (
    <StudentShell title="Home">
      {error ? (
        <section
          role="alert"
          className="flex flex-col items-start gap-4 rounded-[18px] border border-rose-100 bg-white p-6 md:flex-row md:items-center md:p-8"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-50">
            <ExclamationCircleIcon className="h-6 w-6 text-rose-600" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-semibold text-slate-900">We couldn&apos;t open your page</h2>
            <p className="mt-1 text-sm text-slate-600">{error.message}</p>
          </div>
          <button
            type="button"
            onClick={reload}
            className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold ${studentTone.primary}`}
          >
            Try again
          </button>
        </section>
      ) : (
        <section className="rounded-[18px] border border-slate-200/70 bg-white p-6 md:p-8">
          {loading || !me ? (
            <div className="animate-pulse space-y-3" aria-label="Loading">
              <div className="h-4 w-40 rounded bg-slate-100" />
              <div className="h-9 w-56 rounded-lg bg-slate-100" />
              <div className="h-4 w-72 max-w-full rounded bg-slate-100" />
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500">{longDateLine()}</p>
              <h2 className="mt-1 font-display text-[30px] font-semibold leading-tight text-slate-900 md:text-[34px]">
                Hi, {me.student.firstName || username}
              </h2>
              <div className="mt-6 flex items-center gap-3 rounded-2xl border border-dashed border-indigo-200 bg-indigo-50/50 px-4 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white">
                  <AcademicCapIcon className="h-5 w-5 text-indigo-600" aria-hidden="true" />
                </span>
                <p className="text-base text-slate-700">Your classes will show up here soon.</p>
              </div>
            </>
          )}
        </section>
      )}
    </StudentShell>
  )
}
