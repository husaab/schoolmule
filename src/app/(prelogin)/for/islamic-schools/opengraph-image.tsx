import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/marketing/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'SchoolMule for Islamic schools in Ontario'

export default function Image() {
  return ogImage({ title: 'Ontario subjects and Islamic studies,', accent: 'in one system.', pill: 'For Islamic schools in Ontario', sub: 'Quran, Arabic and Islamic Studies graded beside Math and Science, on one report card.', image: '/videos/chapters/student.jpg' })
}
