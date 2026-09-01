'use client';

import {
  PlusCircleIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';
import type { ImportSummary } from '@/services/types/registrationImport';

/**
 * Counts strip above the preview table. Rows needing review are called out
 * separately because they are skipped by default — without this they'd be
 * silently left behind.
 */
export default function ImportSummaryBar({ summary }: { summary: ImportSummary }) {
  const stats = [
    { key: 'create', label: 'Create', value: summary.create, Icon: PlusCircleIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { key: 'update', label: 'Update', value: summary.update, Icon: ArrowPathIcon, color: 'text-cyan-600', bg: 'bg-cyan-50' },
    { key: 'skip', label: 'Skip', value: summary.skip, Icon: NoSymbolIcon, color: 'text-slate-500', bg: 'bg-slate-50' },
    { key: 'error', label: 'Blocked', value: summary.error, Icon: ExclamationTriangleIcon, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stats.map(({ key, label, value, Icon, color, bg }) => (
          <div key={key} className={`${bg} rounded-xl px-3 py-2.5 flex items-center gap-2.5`}>
            <Icon className={`w-5 h-5 ${color} shrink-0`} />
            <div className="min-w-0">
              <p className={`text-lg font-semibold leading-none ${color}`}>{value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {summary.needsReview > 0 && (
        <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
          <QuestionMarkCircleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">
            <span className="font-medium">{summary.needsReview} possible {summary.needsReview === 1 ? 'match' : 'matches'}</span>{' '}
            — skipped unless you pick an action for {summary.needsReview === 1 ? 'it' : 'them'}.
          </p>
        </div>
      )}
    </div>
  );
}
