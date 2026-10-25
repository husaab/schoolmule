import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/marketing/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'SchoolMule: your whole school, in one place'

export default function Image() {
  return ogImage({ title: 'Your whole school,', accent: 'in one place.', pill: 'For Ontario independent schools, JK to Grade 8', sub: 'Attendance, grades, report cards and parent messages, with a view for the office, teachers, parents and students.' })
}
