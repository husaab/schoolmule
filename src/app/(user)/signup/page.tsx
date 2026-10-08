'use client'

import { FC, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSchoolName, getSchoolSlug, SIGNUP_SCHOOLS, type SignupSchool } from '@/lib/schoolUtils'
import SchoolPickerGrid from '@/components/signup/SchoolPickerGrid'
import { SignupFrame } from '@/components/signup/SignupShell'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

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
    <SignupFrame variant="directory" maxWidth="max-w-xl">
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

    </SignupFrame>
  )
}

export default SignupDirectoryPage
