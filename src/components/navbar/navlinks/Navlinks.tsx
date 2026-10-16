'use client'
import { FC } from 'react'
import Link from 'next/link'
import { useUserStore } from '@/store/useUserStore'
import Avatar from '@/components/avatar/Avatar'
import { QuestionMarkCircleIcon, EnvelopeIcon, ChartBarSquareIcon } from '@heroicons/react/24/outline'

interface NavLinksProps {
  vertical?: boolean
}

const NavLinks: FC<NavLinksProps> = ({ vertical = false }) => {
  const user = useUserStore(s => s.user)
  const name = user.fullName || user.username || 'You'

  if (vertical) {
    return (
      <div className="flex flex-col space-y-1">
        {user.isPlatformOwner && (
          <Link
            href="/observe"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <ChartBarSquareIcon className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium">Observe</span>
          </Link>
        )}
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
          <Avatar name={name} avatar={user.avatar} photoUrl={user.photoUrl} size={32} />
          <span className="text-sm font-medium">Settings</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {user.isPlatformOwner && (
        <Link
          href="/observe"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-900 hover:text-white transition-colors"
          title="Observe console"
        >
          <ChartBarSquareIcon className="w-4 h-4" />
          <span className="hidden xl:inline">Observe</span>
        </Link>
      )}
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
        className="ml-2 rounded-full transition-all hover:shadow-lg hover:scale-105"
        title="Account settings"
        aria-label="Account settings"
      >
        <Avatar name={name} avatar={user.avatar} photoUrl={user.photoUrl} size={36} className="block" />
      </Link>
    </div>
  )
}

export default NavLinks
