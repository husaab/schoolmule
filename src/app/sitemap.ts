import { MetadataRoute } from 'next'
import { MARKETING_PAGES, SITE_URL } from '@/lib/marketing/site'

// The public website. Sign-in and account pages are left out on purpose:
// they aren't pages anyone should land on from a search.
const PRIORITY: Record<string, number> = { '/': 1, '/product': 0.9, '/demo': 0.9 }

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date()
  return [
    ...MARKETING_PAGES.map((path) => ({
      url: `${SITE_URL}${path === '/' ? '' : path}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: PRIORITY[path] ?? (path.startsWith('/for/') ? 0.8 : 0.7),
    })),
    { url: `${SITE_URL}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
