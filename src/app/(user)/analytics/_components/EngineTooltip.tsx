'use client'

import React, { useState } from 'react'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'

/**
 * Explains the two grade engines. Hover/focus popover — kept dependency-free
 * (no Headless UI) since it's a single static tooltip.
 */
const EngineTooltip: React.FC = () => {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-label="Explain grade engines"
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="text-slate-400 hover:text-cyan-600 transition-colors"
      >
        <QuestionMarkCircleIcon className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-6 z-50 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-4 text-left">
          <p className="text-xs font-semibold text-slate-900 mb-1">Skip Ungraded</p>
          <p className="text-xs text-slate-600 mb-3">
            Ungraded assessments are left out of the calculation entirely. Matches the
            gradebook totals, student views and award numbers.
          </p>
          <p className="text-xs font-semibold text-slate-900 mb-1">Count as Zero</p>
          <p className="text-xs text-slate-600">
            Ungraded assessments count as 0%. Matches legacy report card PDFs and the
            dashboard average. Lower numbers while work is outstanding.
          </p>
        </div>
      )}
    </span>
  )
}

export default EngineTooltip
