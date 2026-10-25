import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/marketing/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Book a SchoolMule demo'

export default function Image() {
  return ogImage({ title: 'Book a', accent: '15-minute demo.', sub: 'See SchoolMule for a school like yours, with the person who builds it.' })
}
