'use client'

import { FC } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import SchoolCard from './SchoolCard'
import RequestSchoolCard from './RequestSchoolCard'
import type { SignupSchool } from '@/lib/schoolUtils'

interface SchoolPickerGridProps {
  /** Already-filtered list of schools to display. */
  schools: SignupSchool[]
  /** Whether the user has typed a search query (drives the empty state). */
  hasQuery: boolean
  onSelect: (school: SignupSchool) => void
}

const gridClass = 'grid grid-cols-2 sm:grid-cols-3 gap-4'

/**
 * Responsive grid of selectable schools, always capped with a
 * "Request your school" tile. When a search yields nothing, shows an
 * empty state but still offers the request path.
 */
const SchoolPickerGrid: FC<SchoolPickerGridProps> = ({ schools, hasQuery, onSelect }) => {
  if (hasQuery && schools.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <MagnifyingGlassIcon className="w-6 h-6 text-slate-400" />
        </div>
        <p className="text-slate-700 font-medium">No schools match your search</p>
        <p className="text-slate-500 text-sm mt-1 mb-5">
          Try a different name, or request access below.
        </p>
        <div className="max-w-[200px] mx-auto">
          <RequestSchoolCard />
        </div>
      </div>
    )
  }

  return (
    <div className={gridClass}>
      {schools.map(school => (
        <SchoolCard key={school.schoolCode} school={school} onSelect={onSelect} />
      ))}
      <RequestSchoolCard />
    </div>
  )
}

export default SchoolPickerGrid
