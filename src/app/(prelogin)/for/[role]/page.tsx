import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import RolePage from '@/components/marketing/RolePage'
import { ROLE_PAGES, rolePage } from '@/lib/marketing/roles'
import { pageMetadata } from '@/lib/marketing/seo'

// /for/school-leaders, /for/teachers, /for/parents, /for/students.
// (/for/islamic-schools is its own page.)
export const dynamicParams = false

export function generateStaticParams() {
  return ROLE_PAGES.map((r) => ({ role: r.slug }))
}

type Props = { params: Promise<{ role: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = rolePage((await params).role)
  if (!data) return {}
  return pageMetadata({ title: data.metaTitle, description: data.metaDescription, path: `/for/${data.slug}` })
}

export default async function Page({ params }: Props) {
  const data = rolePage((await params).role)
  if (!data) notFound()
  return <RolePage data={data} />
}
