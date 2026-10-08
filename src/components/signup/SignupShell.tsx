'use client'

// Shared frames for the signup flow. SignupFrame is the branding panel plus a
// content column; SignupShell adds the per-school lockup. Pages only decide
// the copy variant and the content.

import { FC, ReactNode } from 'react'
import Link from 'next/link'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import SchoolLogo from '@/components/branding/SchoolLogo'
import { getSchoolName, type SignupSchool } from '@/lib/schoolUtils'
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline'
import { SIGNUP_COPY, type SignupVariant } from './signupCopy'

interface SignupFrameProps {
  variant: SignupVariant
  /** Width of the right-hand column. */
  maxWidth?: 'max-w-lg' | 'max-w-xl'
  children: ReactNode
}

/**
 * The frame every signup step shares: branding panel on the left, content on
 * the right, "already have an account" underneath. The directory uses it
 * directly; per-school pages wrap it with SignupShell to add the school lockup.
 */
export const SignupFrame: FC<SignupFrameProps> = ({ variant, maxWidth = 'max-w-lg', children }) => {
  const copy = SIGNUP_COPY[variant]
  return (
    <div className="min-h-screen flex bg-slate-50">
      <NavBar />

      {/* Left: branding */}
      <div className="hidden lg:flex lg:w-5/12 fixed left-0 top-0 bottom-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-teal-300/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            {copy.heading}
            <br />
            <span className="text-emerald-200">{copy.accent}</span>
          </h1>
          <p className="text-lg text-emerald-100 mb-10 max-w-md leading-relaxed">{copy.blurb}</p>
          <div className="space-y-4">
            {copy.benefits.map((benefit) => (
              <div key={benefit} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckIcon className="w-4 h-4 text-emerald-200" />
                </div>
                <span className="text-white/90">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: content */}
      <div className="w-full lg:w-7/12 lg:ml-[41.666667%] flex flex-col min-h-screen">
        <div className="lg:hidden bg-gradient-to-r from-emerald-600 to-teal-600 pt-40 pb-6 px-6">
          <h1 className="text-2xl font-bold text-white">
            {copy.heading} <span className="text-emerald-200">{copy.accent}</span>
          </h1>
        </div>

        <div className="flex-1 flex items-start lg:items-center justify-center px-6 pt-6 pb-8 lg:pt-32 lg:px-12 bg-slate-50">
          <div className={`w-full ${maxWidth}`}>
            {children}

            <p className="text-center mt-6 text-sm text-slate-600">
              Already have an account?{' '}
              <Link href="/login" className="text-cyan-600 hover:text-cyan-700 font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface SignupShellProps {
  school: SignupSchool
  variant: SignupVariant
  /** Where the back link goes and what it says. */
  back: { href: string; label: string }
  children: ReactNode
}

/** SignupFrame plus the back link and the school lockup, for per-school pages. */
const SignupShell: FC<SignupShellProps> = ({ school, variant, back, children }) => {
  const copy = SIGNUP_COPY[variant]
  const schoolName = school.name?.trim() || getSchoolName(school.schoolCode)

  return (
    <SignupFrame variant={variant}>
      <Link
        href={back.href}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium mb-5"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        {back.label}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <SchoolLogo schoolCode={school.schoolCode} size={56} />
        <div>
          {copy.eyebrow && (
            <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">{copy.eyebrow}</p>
          )}
          <h2 className="text-xl lg:text-2xl font-bold text-slate-900 leading-tight">{schoolName}</h2>
        </div>
      </div>

      {children}
    </SignupFrame>
  )
}

export default SignupShell

/** The "we couldn't find that school" state, shared by every slug page. */
export const UnknownSchool: FC = () => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <NavBar />
    <div className="flex-1 flex items-center justify-center px-6 pt-32 pb-12">
      <div className="text-center max-w-md">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">We couldn&apos;t find that school</h2>
        <p className="text-slate-600 text-sm mb-6">
          The link may be out of date. Pick your school from the directory to continue.
        </p>
        <Link
          href="/signup"
          className="inline-block py-2.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all"
        >
          Browse schools
        </Link>
      </div>
    </div>
  </div>
)
