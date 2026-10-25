import { ogImage, OG_CONTENT_TYPE, OG_SIZE } from '@/lib/marketing/og'

export const size = OG_SIZE
export const contentType = OG_CONTENT_TYPE
export const alt = 'SchoolMule terms of service'

export default function Image() {
  return ogImage({ title: 'Terms of Service', sub: 'The terms that govern use of SchoolMule.' })
}
