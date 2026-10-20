'use client'

// /signup/[school]/student: a student asks the school for an account. Same
// frame as the parent and teacher pages; the form makes no account itself.

import { FC } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { findSignupSchoolBySlug } from '@/lib/schoolUtils'
import SignupShell, { UnknownSchool } from './SignupShell'
import StudentRequestForm from './StudentRequestForm'

const StudentRequestPage: FC = () => {
  const params = useParams<{ schoolSlug: string }>()
  const slug = params?.schoolSlug ?? ''
  const school = findSignupSchoolBySlug(slug)

  if (!school) return <UnknownSchool />

  return (
    <SignupShell school={school} variant="student" back={{ href: `/signup/${slug}`, label: 'Not a student?' }}>
      <StudentRequestForm school={school} />
      <p className="mt-4 text-center text-xs text-slate-400">
        Already got your invite?{' '}
        <Link href="/login" className="font-medium text-slate-500 hover:text-slate-700">
          Sign in with Google or your school email
        </Link>
      </p>
    </SignupShell>
  )
}

export default StudentRequestPage
