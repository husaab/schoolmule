'use client';

import type { FormField, FieldFilter } from '@/services/types/registration';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  fieldFilters: FieldFilter[];
  fields: FormField[];
  total: number;
  onClear: () => void;
}

// Live summary of the active per-field filters plus the matching count, e.g.
// "Grade: Grade 4, Grade 5 — 23 submissions". The total comes straight from the
// (filter-aware) pagination, so it always reflects what's currently shown.
export default function FilterSummaryChip({ fieldFilters, fields, total, onClear }: Props) {
  const active = fieldFilters.filter((f) => f.values.length > 0);
  if (active.length === 0) return null;

  const labelFor = (fieldId: string) => fields.find((f) => f.fieldId === fieldId)?.label ?? 'Field';

  const summary = active
    .map((f) => `${labelFor(f.fieldId)}: ${f.values.join(', ')}`)
    .join(' · ');

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-200 text-sm text-cyan-800">
      <span className="font-medium">{summary}</span>
      <span className="text-cyan-300">—</span>
      <span className="font-semibold">
        {total} submission{total !== 1 ? 's' : ''}
      </span>
      <button
        type="button"
        onClick={onClear}
        className="ml-0.5 p-0.5 rounded-full hover:bg-cyan-100 transition-colors"
        title="Clear field filters"
      >
        <XMarkIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
