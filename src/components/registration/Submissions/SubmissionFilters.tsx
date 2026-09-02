'use client';

import type { SubmissionStatus, SubmissionFilters as FiltersType, ImportState } from '@/services/types/registration';
import type { SubmissionStatusDef } from '@/services/types/registrationStatus';

interface Props {
  filters: FiltersType;
  onChange: (filters: FiltersType) => void;
  /** The school's status vocabulary. Replaces a hardcoded new/reviewed/archived list. */
  statuses: SubmissionStatusDef[];
}

export default function SubmissionFilters({ filters, onChange, statuses }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status filter */}
      <select
        value={filters.status || ''}
        onChange={(e) => onChange({ ...filters, status: (e.target.value || undefined) as SubmissionStatus | undefined, page: 1 })}
        className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
      >
        <option value="">All Statuses</option>
        {statuses.map((s) => (
          <option key={s.statusId} value={s.key}>{s.label}</option>
        ))}
      </select>

      {/* Import state — which submissions have already become students */}
      <select
        value={filters.importState || 'all'}
        onChange={(e) => onChange({ ...filters, importState: e.target.value as ImportState, page: 1 })}
        className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
      >
        <option value="all">All Submissions</option>
        <option value="not_imported">Not yet imported</option>
        <option value="imported">Imported</option>
      </select>

      {/* Date from */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-slate-500">From:</label>
        <input
          type="date"
          value={filters.dateFrom || ''}
          onChange={(e) => onChange({ ...filters, dateFrom: e.target.value || undefined, page: 1 })}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Date to */}
      <div className="flex items-center gap-1.5">
        <label className="text-xs text-slate-500">To:</label>
        <input
          type="date"
          value={filters.dateTo || ''}
          onChange={(e) => onChange({ ...filters, dateTo: e.target.value || undefined, page: 1 })}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500"
        />
      </div>

      {/* Clear filters */}
      {(filters.status || filters.dateFrom || filters.dateTo ||
        (filters.importState && filters.importState !== 'all')) && (
        <button
          onClick={() => onChange({ page: 1, limit: 25 })}
          className="text-xs text-cyan-600 hover:text-cyan-700 font-medium"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
