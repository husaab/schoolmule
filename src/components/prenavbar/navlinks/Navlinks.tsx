// File: src/components/navlinks/NavLinks.tsx
'use client'
import { FC } from 'react'
import Link from 'next/link'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'

interface NavLinksProps { vertical?: boolean }

const NavLinks: FC<NavLinksProps> = ({ vertical = false }) => {
  const user = useUserStore(s => s.user)
  const clearUser = useUserStore(s => s.clearUser)
  const notify = useNotificationStore(s => s.showNotification)
  const isLoggedIn = Boolean(user.id)

  const linkBase =
    'font-semibold text-gray-600 hover:text-sky-800 ' +
    (vertical
      ? 'py-2 px-3 text-sm block'
      : 'py-1 px-2 sm:py-2 sm:px-4 text-xs sm:text-lg inline-block')
  const buttonBase =
    'bg-cyan-600 hover:bg-sky-500 text-white rounded-lg ' +
    (vertical
      ? 'w-full text-center py-2 px-4 text-sm block'
      : 'py-1 px-3 sm:py-2 sm:px-6 text-xs sm:text-lg inline-block')

  return (
    <div className={vertical ? 'flex flex-col space-y-2' : 'flex items-center space-x-4'}>
      <Link href="/about" scroll={false} className={linkBase}>
        About
      </Link>
      <Link href="/product" className={linkBase}>
        Our Product
      </Link>
      <Link href="/contact" scroll={false} className={linkBase}>
        Contact
      </Link>

      {isLoggedIn ? (
        // Only logout for authenticated users; settings/navigation handled elsewhere
        <button
          onClick={() => {
            clearUser()
            notify('Logged out', 'success')
            localStorage.removeItem('user-storage')
          }}
          className={`${linkBase} ${vertical ? 'mt-2 text-red-600 block' : 'text-red-600 inline-block'}`}
        >
          Logout
        </button>
      ) : (
        // For guests, show both Login and Sign Up
        <>
          <Link href="/login" className={buttonBase}>
            Login
          </Link>
          <Link href="/signup" className={buttonBase.replace('bg-cyan-600', 'bg-green-500').replace('hover:bg-sky-500', 'hover:bg-green-400')}>
            Sign Up
          </Link>
        </>
      )}
    </div>
  )
}

export default NavLinks
