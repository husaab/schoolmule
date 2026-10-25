import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/marketing/og'
import { ROLE_PAGES, rolePage } from '@/lib/marketing/roles'
import { chapter } from '@/lib/marketing/site'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'SchoolMule for each view of the school'

export function generateStaticParams() {
  return ROLE_PAGES.map((r) => ({ role: r.slug }))
}

const ACCENT = { leaders: '#0b3b52', teachers: '#0e7490', parents: '#b45309', students: '#4338ca' } as const
const SUB = {
  leaders: 'Report cards, timetables, staff hours and every family conversation.',
  teachers: 'A gradebook that saves as you type, and families told in one click.',
  parents: 'Grades with feedback, a summary of the week, and a line to the teacher.',
  students: 'Classwork, quizzes and feedback, on a computer or a phone.',
} as const

export default async function Image({ params }: { params: Promise<{ role: string }> }) {
  const data = rolePage((await params).role) ?? ROLE_PAGES[0]
  return ogImage({
    title: data.title.plain.trim(),
    accent: data.title.accent,
    pill: data.pill,
    sub: SUB[data.view],
    image: chapter(data.chapter).poster,
    accentColour: ACCENT[data.view],
  })
}
