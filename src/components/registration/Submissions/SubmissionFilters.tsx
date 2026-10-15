'use client';

import type { SubmissionStatus, SubmissionFilters as FiltersType, ImportState } from '@/services/types/registration';
import type { SubmissionStatusDef } from '@/services/types/registrationStatus';
import SearchableSelect, { type SearchableOption } from '@/components/ui/SearchableSelect';

const trigger = 'px-3 py-2 border border-slate-300 rounded-lg focus:ring-cyan-500 bg-white';

const IMPORT_STATE_OPTIONS: SearchableOption[] = [
  { value: 'all', label: 'All Submissions' },
  { value: 'not_imported', label: 'Not yet imported' },
  { value: 'imported', label: 'Imported' },
];

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
      <SearchableSelect
        options={statuses.map((s) => ({ value: s.key, label: s.label }))}
        value={filters.status || ''}
        onChange={(v) => onChange({ ...filters, status: (v || undefined) as SubmissionStatus | undefined, page: 1 })}
        allLabel="All Statuses"
        ariaLabel="Status"
        searchPlaceholder="Find a status"
        triggerClassName={trigger}
      />

      {/* Import state — which submissions have already become students */}
      <SearchableSelect
        options={IMPORT_STATE_OPTIONS}
        value={filters.importState || 'all'}
        onChange={(v) => onChange({ ...filters, importState: v as ImportState, page: 1 })}
        ariaLabel="Import state"
        triggerClassName={trigger}
      />

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
