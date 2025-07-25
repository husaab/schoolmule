// File: src/components/navlinks/NavLinks.tsx
'use client'
import { FC } from 'react'
import Link from 'next/link'
import { useUserStore } from '@/store/useUserStore'
import { getInitials } from '@/lib/utility'

interface NavLinksProps { vertical?: boolean }

const NavLinks: FC<NavLinksProps> = ({ vertical = false }) => {
  const user = useUserStore(s => s.user)
  const initials = getInitials(user.username);

  const linkBase =
    'transform transition duration-200 hover:scale-110 font-semibold text-gray-600 hover:text-gray-800' +
    (vertical
      ? 'py-2 px-3 text-sm block'
      : 'py-1 px-2 sm:py-2 sm:px-4 text-xs sm:text-lg inline-block')

  return (
    <div className={vertical ? 'flex flex-col space-y-2' : 'flex items-center space-x-4'}>
      <Link href="/support" scroll={false} className={linkBase}>
        Help & Support
      </Link>
      <Link href="/contact-us" scroll={false} className={linkBase}>
        Contact
      </Link>

      {vertical ? (
            <Link
              href="/settings"
              className="transform transition duration-200 hover:scale-110 flex items-center space-x-2 py-2 px-3 text-sm font-semibold text-gray-600 hover:text-sky-800"
            >
              <div className="transform transition duration-200 hover:scale-110 w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center text-gray-700">
                {initials}
              </div>
              <span>Settings</span>
            </Link>
          ) : (
            <Link href="/settings" title="Account settings">
              <div className="transform transition duration-200 hover:scale-110 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-200 text-gray-700 font-semibold flex items-center justify-center hover:bg-gray-300">
                {initials}
              </div>
            </Link>
          )}


    </div>
  )
}

export default NavLinks
