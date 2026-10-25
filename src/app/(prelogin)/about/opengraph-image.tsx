import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/marketing/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'About SchoolMule'

export default function Image() {
  return ogImage({ title: 'Built for schools', accent: 'like yours.', sub: 'School management for small independent schools in Ontario.' })
}
