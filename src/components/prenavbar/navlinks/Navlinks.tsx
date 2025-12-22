'use client'
import { FC } from 'react'
import Link from 'next/link'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ArrowRightIcon } from '@heroicons/react/24/outline'

interface NavLinksProps {
  vertical?: boolean
  onLinkClick?: () => void
}

const NavLinks: FC<NavLinksProps> = ({ vertical = false, onLinkClick }) => {
  const user = useUserStore((s) => s.user)
  const clearUser = useUserStore((s) => s.clearUser)
  const notify = useNotificationStore((s) => s.showNotification)
  const isLoggedIn = Boolean(user.id)

  const handleClick = () => {
    if (onLinkClick) onLinkClick()
  }

  const linkClass = vertical
    ? 'block py-3 px-4 text-base font-medium text-slate-700 hover:text-cyan-600 hover:bg-slate-50 rounded-xl transition-all duration-200'
    : 'px-4 py-2 text-sm font-medium text-slate-600 hover:text-cyan-600 transition-colors duration-200'

  const primaryButtonClass = vertical
    ? 'block w-full text-center py-3 px-4 text-base font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-200 shadow-md'
    : 'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5'

  const secondaryButtonClass = vertical
    ? 'block w-full text-center py-3 px-4 text-base font-semibold text-slate-700 border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:text-cyan-600 transition-all duration-200'
    : 'inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-slate-700 border-2 border-slate-200 rounded-xl hover:border-cyan-500 hover:text-cyan-600 transition-all duration-200'

  return (
    <div
      className={
        vertical
          ? 'flex flex-col space-y-2'
          : 'flex items-center gap-2'
      }
    >
      <Link href="/about" scroll={false} className={linkClass} onClick={handleClick}>
        About
      </Link>
      <Link href="/product" className={linkClass} onClick={handleClick}>
        Product
      </Link>
      <Link href="/demo" className={linkClass} onClick={handleClick}>
        Demo
      </Link>
      <Link href="/contact" scroll={false} className={linkClass} onClick={handleClick}>
        Contact
      </Link>

      {/* Divider for desktop */}
      {!vertical && <div className="w-px h-6 bg-slate-200 mx-2" />}

      {isLoggedIn ? (
        <>
          <Link href="/dashboard" className={primaryButtonClass} onClick={handleClick}>
            Dashboard
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              clearUser()
              notify('Logged out', 'success')
              localStorage.removeItem('user-storage')
              handleClick()
            }}
            className={`${linkClass} ${vertical ? '' : ''} text-red-600 hover:text-red-700 cursor-pointer`}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link href="/login" className={secondaryButtonClass} onClick={handleClick}>
            Log In
          </Link>
          <Link href="/signup" className={primaryButtonClass} onClick={handleClick}>
            Get Started
            {!vertical && <ArrowRightIcon className="w-4 h-4" />}
          </Link>
        </>
      )}
    </div>
  )
}

export default NavLinks
