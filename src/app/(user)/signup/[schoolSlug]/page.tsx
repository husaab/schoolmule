'use client'

import { FC } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { findSignupSchoolBySlug, getSchoolName } from '@/lib/schoolUtils'
import SchoolLogo from '@/components/branding/SchoolLogo'
import SignupForm from '@/components/signup/SignupForm'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import { ArrowLeftIcon, CheckIcon } from '@heroicons/react/24/outline'

const benefits = [
  'Easy student and class management',
  'Automated report card generation',
  'Real-time grade tracking',
  'Seamless parent communication',
  'Comprehensive attendance tracking'
]

/**
 * Step 2 of signup: resolves the school slug from the URL (against the static
 * SIGNUP_SCHOOLS list, synchronously) and renders the role + account form
 * scoped to that school. Deep-linkable, e.g. /signup/alhaadiacademy.
 */
const SchoolSignupPage: FC = () => {
  const params = useParams<{ schoolSlug: string }>()
  const slug = params?.schoolSlug ?? ''
  const school = findSignupSchoolBySlug(slug)
  const schoolName = school ? school.name?.trim() || getSchoolName(school.schoolCode) : ''

  return (
    <div className="min-h-screen flex bg-slate-50">
      <NavBar />

      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-5/12 fixed left-0 top-0 bottom-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-400/20 rounded-full -translate-x-1/3 translate-y-1/3 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-64 h-64 bg-teal-300/10 rounded-full blur-2xl" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <h1 className="text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Join thousands of<br />
            <span className="text-emerald-200">educators</span>
          </h1>
          <p className="text-lg text-emerald-100 mb-10 max-w-md leading-relaxed">
            Create your free account and start managing your school more efficiently today.
          </p>
          <div className="space-y-4">
            {benefits.map(benefit => (
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

      {/* Right Side - Form */}
      <div className="w-full lg:w-7/12 lg:ml-[41.666667%] flex flex-col min-h-screen">
        <div className="lg:hidden bg-gradient-to-r from-emerald-600 to-teal-600 pt-40 pb-6 px-6">
          <h1 className="text-2xl font-bold text-white">
            Join thousands of<span className="text-emerald-200"> educators</span>
          </h1>
        </div>

        <div className="flex-1 flex items-start lg:items-center justify-center px-6 pt-6 pb-8 lg:pt-32 lg:px-12 bg-slate-50">
          <div className="w-full max-w-lg">
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 font-medium mb-5"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              All schools
            </Link>

            {!school ? (
              <div className="text-center py-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                  We couldn&apos;t find that school
                </h2>
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
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6">
                  <SchoolLogo schoolCode={school.schoolCode} size={56} />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-400 font-semibold">
                      Create your account
                    </p>
                    <h2 className="text-xl lg:text-2xl font-bold text-slate-900 leading-tight">
                      {schoolName}
                    </h2>
                  </div>
                </div>

                <SignupForm school={school} />

                <p className="text-center mt-6 text-sm text-slate-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-cyan-600 hover:text-cyan-700 font-semibold">
                    Sign in
                  </Link>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SchoolSignupPage
