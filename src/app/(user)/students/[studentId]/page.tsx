// The student profile used to be its own page. It is now a modal that opens
// over whatever page you are on (components/student/profile), so links and
// bookmarks to /students/<id> land on the Students list with that student's
// profile open, keeping any old ?tab=, ?term= and ?class=.

import { redirect } from 'next/navigation'
import { hrefWithQuery, withStudentProfile } from '@/lib/studentProfileUrl'

type SearchParams = Record<string, string | string[] | undefined>

const one = (value: string | string[] | undefined): string | null => (typeof value === 'string' ? value : null)

export default async function StudentProfileRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ studentId: string }>
  searchParams: Promise<SearchParams>
}) {
  const { studentId } = await params
  const query = await searchParams
  redirect(
    hrefWithQuery(
      '/students',
      withStudentProfile('', studentId, { tab: one(query.tab), term: one(query.term), classId: one(query.class) })
    )
  )
}
