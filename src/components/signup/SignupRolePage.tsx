'use client'

// One component behind /signup/[school]/parent and /teacher: resolves the
// school from the URL and renders the fixed-role form with that role's copy.

import { FC } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { findSignupSchoolBySlug } from '@/lib/schoolUtils'
import type { SignupRole } from '@/services/types/adminApproval'
import SignupShell, { UnknownSchool } from './SignupShell'
import SignupForm from './SignupForm'
import { SIGNUP_ROLE_PAGES } from './signupCopy'

const SignupRolePage: FC<{ role: SignupRole }> = ({ role }) => {
  const params = useParams<{ schoolSlug: string }>()
  const slug = params?.schoolSlug ?? ''
  const school = findSignupSchoolBySlug(slug)
  const page = SIGNUP_ROLE_PAGES[role]

  if (!school) return <UnknownSchool />

  return (
    <SignupShell school={school} variant={page.variant} back={{ href: `/signup/${slug}`, label: page.backLabel }}>
      <SignupForm school={school} role={role} />
      <p className="mt-4 text-center text-xs text-slate-400">
        {page.altPrompt}{' '}
        <Link href={`/signup/${slug}/${page.altSegment}`} className="font-medium text-slate-500 hover:text-slate-700">
          {page.altLabel}
        </Link>
      </p>
    </SignupShell>
  )
}

export default SignupRolePage
