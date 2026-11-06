import { MetadataRoute } from 'next'
import { MARKETING_PAGES, PAGE_UPDATED, SITE_URL } from '@/lib/marketing/site'

// The public website. Sign-in and account pages are left out on purpose:
// they aren't pages anyone should land on from a search. No priority or
// changefreq: Google ignores both. lastmod is each page's real edit date.
export default function sitemap(): MetadataRoute.Sitemap {
  const pages = [...MARKETING_PAGES, '/privacy', '/terms'] as const
  return pages.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    lastModified: PAGE_UPDATED[path],
  }))
}
