'use client'

// A compact type-to-filter box with the magnifier inside it.

import React from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

type SearchInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'> & {
  /** Placeholder doubles as the accessible name. */
  placeholder: string
  className?: string
}

const SearchInput: React.FC<SearchInputProps> = ({ placeholder, className = '', ...rest }) => (
  <label className={`relative block ${className}`}>
    <MagnifyingGlassIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    <input
      type="search"
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-sm focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
      {...rest}
    />
  </label>
)

export default SearchInput
