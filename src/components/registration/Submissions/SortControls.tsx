'use client';

import type { FormField, SortSpec } from '@/services/types/registration';
import {
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

interface Props {
  fields: FormField[];
  sorts: SortSpec[];
  onChange: (sorts: SortSpec[]) => void;
}

const SUBMITTED_AT = 'submittedAt';

// Ordered multi-sort builder. Each row is one sort level (priority = position).
// A field UUID or the special 'submittedAt' value, plus an asc/desc toggle.
export default function SortControls({ fields, sorts, onChange }: Props) {
  // Fields not yet used in a sort row (so each level targets a distinct field).
  const usedIds = new Set(sorts.map((s) => s.fieldId));
  const availableFieldId = () => {
    if (!usedIds.has(SUBMITTED_AT)) {
      const firstFree = fields.find((f) => !usedIds.has(f.fieldId));
      return firstFree ? firstFree.fieldId : SUBMITTED_AT;
    }
    const firstFree = fields.find((f) => !usedIds.has(f.fieldId));
    return firstFree ? firstFree.fieldId : SUBMITTED_AT;
  };

  const addSort = () => onChange([...sorts, { fieldId: availableFieldId(), dir: 'asc' }]);

  const updateSort = (index: number, patch: Partial<SortSpec>) =>
    onChange(sorts.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const removeSort = (index: number) => onChange(sorts.filter((_, i) => i !== index));

  const labelFor = (fieldId: string) => {
    if (fieldId === SUBMITTED_AT) return 'Date submitted';
    const f = fields.find((x) => x.fieldId === fieldId);
    return f?.label ?? 'Field';
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <ArrowsUpDownIcon className="w-4 h-4 text-slate-400" />
        Sort by
      </div>

      {sorts.length === 0 && (
        <p className="text-xs text-slate-400">Newest first (default). Add a sort to group by a field.</p>
      )}

      {sorts.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="text-xs text-slate-400 w-4 text-right">{i + 1}.</span>
          <select
            value={s.fieldId}
            onChange={(e) => updateSort(i, { fieldId: e.target.value })}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white max-w-[200px]"
          >
            <option value={SUBMITTED_AT}>Date submitted</option>
            {fields.map((f) => (
              // Hide fields already chosen on other rows to avoid duplicate levels.
              <option key={f.fieldId} value={f.fieldId} disabled={f.fieldId !== s.fieldId && usedIds.has(f.fieldId)}>
                {f.label.length > 30 ? `${f.label.slice(0, 30)}…` : f.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => updateSort(i, { dir: s.dir === 'asc' ? 'desc' : 'asc' })}
            className="p-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
            title={s.dir === 'asc' ? 'Ascending' : 'Descending'}
          >
            {s.dir === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => removeSort(i)}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title={`Remove sort by ${labelFor(s.fieldId)}`}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addSort}
        className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600 hover:text-cyan-700 self-start"
      >
        <PlusIcon className="w-3.5 h-3.5" /> Add sort
      </button>
    </div>
  );
}
