'use client'

import { FC, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getSchoolName, getSchoolSlug, SIGNUP_SCHOOLS, type SignupSchool } from '@/lib/schoolUtils'
import SchoolPickerGrid from '@/components/signup/SchoolPickerGrid'
import NavBar from '@/components/prenavbar/navbar/Navbar'
import { MagnifyingGlassIcon, CheckIcon } from '@heroicons/react/24/outline'

const benefits = [
  'Easy student and class management',
  'Automated report card generation',
  'Real-time grade tracking',
  'Seamless parent communication',
  'Comprehensive attendance tracking'
]

/**
 * Step 1 of signup: a searchable directory of schools. Sourced from the static
 * SIGNUP_SCHOOLS list (the schools API is auth-gated and this page is pre-auth).
 * Picking a school deep-links to /signup/[schoolSlug] to create the account.
 */
const SignupDirectoryPage: FC = () => {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SIGNUP_SCHOOLS
    return SIGNUP_SCHOOLS.filter(s =>
      (s.name || getSchoolName(s.schoolCode)).toLowerCase().includes(q)
    )
  }, [query])

  const handleSelect = (school: SignupSchool) => {
    router.push(`/signup/${getSchoolSlug(school.schoolCode)}`)
  }

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

      {/* Right Side - Directory */}
      <div className="w-full lg:w-7/12 lg:ml-[41.666667%] flex flex-col min-h-screen">
        <div className="lg:hidden bg-gradient-to-r from-emerald-600 to-teal-600 pt-40 pb-6 px-6">
          <h1 className="text-2xl font-bold text-white">
            Join thousands of<span className="text-emerald-200"> educators</span>
          </h1>
        </div>

        <div className="flex-1 flex items-start lg:items-center justify-center px-6 pt-6 pb-8 lg:pt-32 lg:px-12 bg-slate-50">
          <div className="w-full max-w-xl">
            <div className="text-center lg:text-left mb-6">
              <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 mb-2">
                Find your school
              </h2>
              <p className="text-slate-600 text-sm lg:text-base">
                Select your school to create your account
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search schools..."
                aria-label="Search schools"
                className="w-full pl-12 pr-4 py-3 text-slate-800 bg-white border-2 border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-0 focus:outline-none transition-colors placeholder:text-slate-400"
              />
            </div>

            <SchoolPickerGrid
              schools={filtered}
              hasQuery={query.trim().length > 0}
              onSelect={handleSelect}
            />

            <p className="text-center mt-8 text-sm text-slate-600">
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

export default SignupDirectoryPage
