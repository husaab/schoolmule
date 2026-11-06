import { notFound } from 'next/navigation'
import PublicFormPage from '@/components/registration/PublicForm/PublicFormPage'

// The website's own sections are never a school, but this route matches any
// two-part path, so /for/anything or /about/anything rendered a "Loading
// form..." page with a 200. Send those to a real 404. Lowercased in case.
const WEBSITE_SECTIONS = new Set(['for', 'about', 'product', 'demo', 'contact', 'privacy', 'terms', 'delete-account'])

export default async function Page({ params }: { params: Promise<{ schoolSlug: string }> }) {
  const { schoolSlug } = await params
  if (WEBSITE_SECTIONS.has(schoolSlug.toLowerCase())) notFound()
  return <PublicFormPage />
}
