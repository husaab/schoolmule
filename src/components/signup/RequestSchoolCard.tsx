'use client'

import { FC } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'

/** Inbox that receives "my school isn't listed" requests. */
const REQUEST_SCHOOL_EMAIL = 'info@schoolmule.ca'

const REQUEST_MAILTO = `mailto:${REQUEST_SCHOOL_EMAIL}` +
  '?subject=' + encodeURIComponent('SchoolMule access request') +
  '&body=' + encodeURIComponent(
    "Hi SchoolMule team,\n\nI'd like to set up my school on SchoolMule.\n\n" +
    'School name:\nYour name:\nRole:\nApproximate number of students:\n\nThanks!'
  )

/**
 * Directory CTA for users whose school isn't onboarded yet. Styled to sit
 * alongside the SchoolCards as a dashed "add" tile.
 */
const RequestSchoolCard: FC = () => {
  return (
    <a
      href={REQUEST_MAILTO}
      aria-label="Request access for a school that isn't listed"
      className="group flex flex-col items-center justify-center text-center gap-3 p-5 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl hover:border-cyan-400 hover:bg-white focus:outline-none focus-visible:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-200 transition-all duration-200"
    >
      <span className="flex items-center justify-center w-[72px] h-[72px] rounded-xl bg-white ring-1 ring-slate-200 text-slate-400 group-hover:text-cyan-500 transition-colors">
        <PlusIcon className="w-8 h-8" />
      </span>
      <span className="text-sm font-semibold text-slate-700 leading-snug">
        Don&apos;t see your school?
        <span className="block text-xs font-normal text-slate-500 mt-0.5">
          Request access
        </span>
      </span>
    </a>
  )
}

export default RequestSchoolCard
