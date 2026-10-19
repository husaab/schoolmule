// src/components/classes/stream/WhoGetsEmailsCard.tsx
// "Who gets emails": who a new post in this class reaches by email. The
// student count is the students who would be emailed (a working login, the
// school's student-email switch and their grade permitting), so it can be
// lower than the roster: the card never says "all" of them (smoke S4).
'use client'

import { emailAudienceKind, whoGetsEmailsCounts } from '@/lib/classStream'
import type { StreamAudience } from '@/services/types/classroom'

const Strong = ({ children }: { children: React.ReactNode }) => <strong className="font-semibold text-slate-900">{children}</strong>

export default function WhoGetsEmailsCard({ audience }: { audience: StreamAudience }) {
  const kind = emailAudienceKind(audience)
  const counts = whoGetsEmailsCounts(audience)
  return (
    <section className="flex flex-col gap-2 rounded-2xl border border-slate-200/70 bg-white p-[18px]">
      <h2 className="text-[15px] font-semibold text-slate-900">Who gets emails</h2>
      <p className="text-[13px] leading-relaxed text-slate-600">
        {kind === 'both' && (
          <>
            Posts here email <Strong>{counts.students}</Strong> and <Strong>{counts.guardians}</Strong>.
          </>
        )}
        {kind === 'parents' && (
          <>
            Posts here email <Strong>{counts.guardians}</Strong> in this class. Students see them in SchoolMule.
          </>
        )}
        {kind === 'students' && (
          <>
            Posts here email <Strong>{counts.students}</Strong>. No parent email is on file yet.
          </>
        )}
        {kind === 'none' && 'Nobody in this class has an email on file yet, so posts here will not send any email.'}
      </p>
    </section>
  )
}
