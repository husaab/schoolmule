import type { Metadata } from 'next'
import { CHAPTERS, CONTACT_EMAIL, FILM, FOUNDER, SITE_URL } from './site'

// Per-page metadata for the marketing website. Each page gets its own
// canonical (the root layout used to point every page at the homepage) and
// shares the Open Graph image its route generates (opengraph-image.tsx).
export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const url = `${SITE_URL}${path === '/' ? '' : path}`
  return {
    title: path === '/' ? { absolute: title } : title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, siteName: 'SchoolMule', type: 'website', locale: 'en_CA' },
    twitter: { card: 'summary_large_image', title, description },
  }
}

const ORG_ID = `${SITE_URL}/#organization`

export const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'SchoolMule',
  url: SITE_URL,
  logo: `${SITE_URL}/logo/trimmedlogo.png`,
  email: CONTACT_EMAIL,
  founder: { '@type': 'Person', name: FOUNDER.name },
  areaServed: { '@type': 'AdministrativeArea', name: 'Ontario, Canada' },
}

// No price and no rating: the site shows neither, so the markup doesn't either.
export const softwareSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SchoolMule',
  applicationCategory: 'BusinessApplication',
  applicationSubCategory: 'School management software',
  operatingSystem: 'Web browser',
  url: SITE_URL,
  description:
    'School management for independent schools: attendance, gradebook, report cards and parent messaging, with a view for the office, teachers, parents and students.',
  publisher: { '@id': ORG_ID },
}

// The film, with its chapters as key moments.
export function filmSchema(pagePath: string) {
  const page = `${SITE_URL}${pagePath === '/' ? '/' : pagePath}`
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: 'SchoolMule: one school, every view',
    description:
      'A 101-second tour of SchoolMule with a demo school: a teacher takes attendance and publishes grades, a student sees the grade and feedback, a parent asks the teacher about it, and the office runs the rest.',
    thumbnailUrl: [`${SITE_URL}${FILM.poster}`],
    uploadDate: FILM.uploadDate,
    duration: `PT1M${FILM.seconds - 60}S`,
    contentUrl: `${SITE_URL}${FILM.src1080}`,
    publisher: { '@id': ORG_ID },
    hasPart: CHAPTERS.map((c) => ({
      '@type': 'Clip',
      name: c.label,
      startOffset: c.start,
      endOffset: c.end,
      url: `${page}#t=${c.start}`,
    })),
  }
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '/' }, ...items].map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.path === '/' ? '/' : item.path}`,
    })),
  }
}

export function faqSchema(items: { q: string; a: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((i) => ({ '@type': 'Question', name: i.q, acceptedAnswer: { '@type': 'Answer', text: i.a } })),
  }
}
