import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/marketing/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Everything a small school runs on, in SchoolMule'

export default function Image() {
  return ogImage({ title: 'Everything a small school', accent: 'runs on.', sub: 'Gradebook, attendance, report cards, parent messages, timetables, staff hours and more.' })
}
