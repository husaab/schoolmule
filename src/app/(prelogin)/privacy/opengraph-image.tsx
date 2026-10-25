import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/marketing/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'SchoolMule privacy policy'

export default function Image() {
  return ogImage({ title: 'Privacy Policy', sub: 'What SchoolMule collects, why, and who processes it.' })
}
