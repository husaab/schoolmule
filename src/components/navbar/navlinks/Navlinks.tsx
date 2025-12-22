'use client'
import { FC } from 'react'
import Link from 'next/link'
import { useUserStore } from '@/store/useUserStore'
import { getInitials } from '@/lib/utility'
import { QuestionMarkCircleIcon, EnvelopeIcon } from '@heroicons/react/24/outline'

interface NavLinksProps {
  vertical?: boolean
}

const NavLinks: FC<NavLinksProps> = ({ vertical = false }) => {
  const user = useUserStore(s => s.user)
  const initials = getInitials(user.username)

  if (vertical) {
    return (
      <div className="flex flex-col space-y-1">
        <Link
          href="/support"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <QuestionMarkCircleIcon className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium">Help & Support</span>
        </Link>
        <Link
          href="/contact-us"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <EnvelopeIcon className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium">Contact</span>
        </Link>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white text-xs font-semibold">
            {initials}
          </div>
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/support"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <QuestionMarkCircleIcon className="w-4 h-4" />
        <span className="hidden xl:inline">Help</span>
      </Link>
      <Link
        href="/contact-us"
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
      >
        <EnvelopeIcon className="w-4 h-4" />
        <span className="hidden xl:inline">Contact</span>
      </Link>
      <Link
        href="/settings"
        className="ml-2 w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all"
        title="Account settings"
      >
        {initials}
      </Link>
    </div>
  )
}

export default NavLinks
