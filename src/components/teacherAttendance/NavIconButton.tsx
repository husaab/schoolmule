'use client'

// The small square "previous / next" button used by every switcher on the
// attendance pages, so they all press the same way.

import React from 'react'

type NavIconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Screen-reader name; the button has no visible text. */
  label: string
}

const NavIconButton: React.FC<NavIconButtonProps> = ({ label, className = '', children, ...rest }) => (
  <button
    type="button"
    aria-label={label}
    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${className}`}
    {...rest}
  >
    {children}
  </button>
)

export default NavIconButton
