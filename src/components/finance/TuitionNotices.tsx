'use client'

// Banners above the grid: a first sync still running, and a full refresh
// requested by QuickBooks. (Loose ends — unlinked customers and the like —
// live in AnomaliesPanel.)

import React from 'react'
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export const FirstSyncBanner = ({ companyName }: { companyName: string | null }) => (
  <div className="flex items-start gap-3 rounded-2xl border border-cyan-100 bg-cyan-50/70 px-5 py-4" role="status">
    <ArrowPathIcon className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-cyan-600" />
    <div>
      <p className="text-sm font-semibold text-cyan-900">First sync in progress…</p>
      <p className="text-xs text-cyan-800/80">
        Reading every customer, invoice and payment{companyName ? ` from ${companyName}` : ''}. This can take a few minutes — the grid fills
        in when it finishes.
      </p>
    </div>
  </div>
)

export const FullRefreshBanner = () => (
  <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50/70 px-5 py-3" role="status">
    <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
    <p className="text-sm text-amber-900">QuickBooks asked for a full refresh. The next sync reloads everything; until then some figures may be out of date.</p>
  </div>
)
