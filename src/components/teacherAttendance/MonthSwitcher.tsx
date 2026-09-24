'use client'

// Step month by month. The page owns the month (it lives in the URL); this
// only reports which way to go.

import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'
import NavIconButton from './NavIconButton'

interface MonthSwitcherProps {
  month: Date
  onPrev: () => void
  onNext: () => void
  className?: string
}

const MonthSwitcher: React.FC<MonthSwitcherProps> = ({ month, onPrev, onNext, className = '' }) => (
  <div className={`flex items-center gap-1 ${className}`}>
    <NavIconButton label="Previous month" onClick={onPrev}>
      <ChevronLeftIcon className="h-5 w-5" />
    </NavIconButton>
    <h2 className="min-w-[10rem] flex-1 text-center text-sm font-semibold text-slate-900 sm:text-base">{format(month, 'MMMM yyyy')}</h2>
    <NavIconButton label="Next month" onClick={onNext}>
      <ChevronRightIcon className="h-5 w-5" />
    </NavIconButton>
  </div>
)

export default MonthSwitcher
