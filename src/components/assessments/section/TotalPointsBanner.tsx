// File: src/components/assessments/section/TotalPointsBanner.tsx
'use client'

import React from 'react'
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface TotalPointsBannerProps {
  totalPoints: number
}

/**
 * Shows progress toward the required 100-point total. A class's assessments
 * must add up to exactly 100 points for final grades to calculate correctly.
 */
const TotalPointsBanner: React.FC<TotalPointsBannerProps> = ({ totalPoints }) => {
  const complete = totalPoints === 100
  const over = totalPoints > 100
  const diff = Math.abs(100 - totalPoints)

  const progressPct = Math.min(totalPoints, 100)

  return (
    <div
      className={`px-6 py-3 border-b ${
        complete
          ? 'bg-emerald-50 border-emerald-100'
          : over
            ? 'bg-red-50 border-red-100'
            : 'bg-amber-50 border-amber-100'
      }`}
    >
      <div className="flex items-center gap-3">
        {complete ? (
          <CheckCircleIcon className="h-5 w-5 text-emerald-500 flex-shrink-0" />
        ) : (
          <ExclamationTriangleIcon
            className={`h-5 w-5 flex-shrink-0 ${over ? 'text-red-500' : 'text-amber-500'}`}
          />
        )}
        <div className="flex-1">
          <p
            className={`font-medium ${
              complete ? 'text-emerald-700' : over ? 'text-red-700' : 'text-amber-700'
            }`}
          >
            {complete ? (
              <>
                <strong>100 of 100 points</strong> — your assessments are complete
              </>
            ) : (
              <>
                <strong>{totalPoints.toFixed(1)} of 100 points</strong>
                {over
                  ? ` — remove ${diff.toFixed(1)} point${diff === 1 ? '' : 's'}`
                  : ` — add ${diff.toFixed(1)} more point${diff === 1 ? '' : 's'} of assessments`}
              </>
            )}
          </p>
          {!complete && (
            <p className={`text-sm ${over ? 'text-red-600' : 'text-amber-600'}`}>
              A class&apos;s assessments must total exactly <strong>100 points</strong> for
              student grades to calculate correctly.
            </p>
          )}
        </div>
      </div>
      {/* Progress toward 100 */}
      <div className="mt-2 h-1.5 rounded-full bg-white/70 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            complete
              ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
              : over
                ? 'bg-gradient-to-r from-red-400 to-rose-500'
                : 'bg-gradient-to-r from-amber-400 to-orange-400'
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  )
}

export default TotalPointsBanner
