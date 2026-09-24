'use client'

// Step from one pay day to the next. The centre names the pay day and the
// days it covers; the chip says where it sits relative to today, with a way
// back to the current period once you have wandered.

import React from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import type { PayPeriodRange } from '@/services/types/teacherAttendance'
import NavIconButton from './NavIconButton'
import { dateRange, daysUntil, relativeDays, shortDate } from './payPeriodFormat'

interface PeriodSwitcherProps {
  period: PayPeriodRange | null
  isCurrent: boolean
  disabled?: boolean
  onPrev: () => void
  onNext: () => void
  onCurrent: () => void
}

const PeriodSwitcher: React.FC<PeriodSwitcherProps> = ({ period, isCurrent, disabled, onPrev, onNext, onCurrent }) => {
  const until = period ? daysUntil(period.payDate) : 0

  return (
    <div className="flex items-center gap-1">
      <NavIconButton label="Previous pay day" onClick={onPrev} disabled={disabled || !period}>
        <ChevronLeftIcon className="h-5 w-5" />
      </NavIconButton>
      <div className="min-w-[10rem] flex-1 text-center sm:min-w-[13rem]">
        {period ? (
          <>
            <p className="text-sm font-semibold text-slate-900">
              Pay day {shortDate(period.payDate, true)}
              <span
                className={`ml-2 rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                  isCurrent ? 'bg-cyan-50 text-cyan-700 border border-cyan-100' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {relativeDays(until)}
              </span>
            </p>
            <p className="text-xs text-slate-500">
              {dateRange(period.startDate, period.endDate)}
              {!isCurrent && (
                <>
                  {' · '}
                  <button type="button" onClick={onCurrent} className="font-medium text-cyan-700 hover:underline cursor-pointer">
                    Back to current
                  </button>
                </>
              )}
            </p>
          </>
        ) : (
          <span className="block h-9 w-40 mx-auto rounded-lg bg-slate-100 animate-pulse" aria-label="Loading" />
        )}
      </div>
      <NavIconButton label="Next pay day" onClick={onNext} disabled={disabled || !period}>
        <ChevronRightIcon className="h-5 w-5" />
      </NavIconButton>
    </div>
  )
}

export default PeriodSwitcher
