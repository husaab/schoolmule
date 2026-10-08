'use client'

import { FC, Suspense, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { findSignupSchoolBySlug } from '@/lib/schoolUtils'
import SignupShell, { UnknownSchool } from '@/components/signup/SignupShell'
import RoleChooser from '@/components/signup/RoleChooser'

/**
 * Step 2 of signup: pick a role for the school in the URL. Each role has its
 * own page (/parent, /teacher) so a school can hand out a link that goes
 * straight to the right form. `?role=parent|teacher` still works and
 * forwards there, for links that were shared before the split.
 */
const SchoolSignupChooser: FC = () => {
  const params = useParams<{ schoolSlug: string }>()
  const router = useRouter()
  const searchParams = useSearchParams()
  const slug = params?.schoolSlug ?? ''
  const school = findSignupSchoolBySlug(slug)
  const legacyRole = searchParams?.get('role')?.toLowerCase()
  const forwardTo = legacyRole === 'parent' || legacyRole === 'teacher' ? legacyRole : null

  useEffect(() => {
    if (school && forwardTo) router.replace(`/signup/${slug}/${forwardTo}`)
  }, [school, forwardTo, router, slug])

  if (!school) return <UnknownSchool />
  if (forwardTo) return null

  return (
    <SignupShell school={school} variant="chooser" back={{ href: '/signup', label: 'All schools' }}>
      <RoleChooser basePath={`/signup/${slug}`} />
    </SignupShell>
  )
}

// useSearchParams needs a Suspense boundary in production builds.
const SchoolSignupPage: FC = () => (
  <Suspense fallback={null}>
    <SchoolSignupChooser />
  </Suspense>
)

export default SchoolSignupPage
