'use client'

import { FC } from 'react'
import SchoolLogo from '@/components/branding/SchoolLogo'
import { getSchoolName, type SignupSchool } from '@/lib/schoolUtils'

interface SchoolCardProps {
  school: SignupSchool
  onSelect: (school: SignupSchool) => void
}

/**
 * A single selectable school in the signup directory. Renders the school's
 * brand mark (logo or gradient-initial fallback) over its display name.
 * Rendered as a button so it's keyboard-accessible.
 */
const SchoolCard: FC<SchoolCardProps> = ({ school, onSelect }) => {
  const name = school.name?.trim() || getSchoolName(school.schoolCode)

  return (
    <button
      type="button"
      onClick={() => onSelect(school)}
      aria-label={`Sign up for ${name}`}
      className="group flex flex-col items-center text-center gap-3 p-5 bg-white border-2 border-slate-200 rounded-2xl shadow-sm hover:border-cyan-400 hover:shadow-card hover:-translate-y-0.5 focus:outline-none focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-200 transition-all duration-200 cursor-pointer"
    >
      <SchoolLogo
        schoolCode={school.schoolCode}
        size={72}
        className="group-hover:scale-105 transition-transform duration-200"
      />
      <span className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
        {name}
      </span>
    </button>
  )
}

export default SchoolCard
