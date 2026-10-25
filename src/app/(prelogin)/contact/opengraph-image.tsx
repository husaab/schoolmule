import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/marketing/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'Contact SchoolMule'

export default function Image() {
  return ogImage({ title: 'Ask us', accent: 'anything.', sub: 'Pricing for your school, switching, or how something works.' })
}
