'use client';

import type { FormField, FieldFilter } from '@/services/types/registration';
import { FunnelIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface Props {
  fields: FormField[];
  fieldFilters: FieldFilter[];
  onChange: (fieldFilters: FieldFilter[]) => void;
}

const isChoice = (f: FormField) => f.fieldType === 'select' || f.fieldType === 'radio';

// Per-field value filters. Choice fields (select/radio) offer their defined
// options as toggle pills (multiple = OR). Text-ish fields use a "contains" input.
// Date fields are intentionally excluded — the From/To range covers them.
export default function FieldValueFilters({ fields, fieldFilters, onChange }: Props) {
  const filterableFields = fields.filter((f) => f.fieldType !== 'date');
  const usedIds = new Set(fieldFilters.map((f) => f.fieldId));
  const addableFields = filterableFields.filter((f) => !usedIds.has(f.fieldId));

  const addFilter = (fieldId: string) => {
    if (!fieldId) return;
    onChange([...fieldFilters, { fieldId, values: [] }]);
  };

  const updateValues = (fieldId: string, values: string[]) =>
    onChange(fieldFilters.map((f) => (f.fieldId === fieldId ? { ...f, values } : f)));

  const removeFilter = (fieldId: string) =>
    onChange(fieldFilters.filter((f) => f.fieldId !== fieldId));

  const fieldById = (fieldId: string) => fields.find((f) => f.fieldId === fieldId);

  const toggleOption = (filter: FieldFilter, option: string) => {
    const next = filter.values.includes(option)
      ? filter.values.filter((v) => v !== option)
      : [...filter.values, option];
    updateValues(filter.fieldId, next);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <FunnelIcon className="w-4 h-4 text-slate-400" />
        Filter by field
      </div>

      {fieldFilters.map((filter) => {
        const field = fieldById(filter.fieldId);
        if (!field) return null;
        return (
          <div key={filter.fieldId} className="flex items-start gap-2">
            <span className="text-xs font-medium text-slate-600 pt-2 min-w-[90px] max-w-[140px] truncate" title={field.label}>
              {field.label}
            </span>
            <div className="flex-1 flex flex-wrap items-center gap-1.5">
              {isChoice(field) ? (
                (field.options ?? []).map((opt) => {
                  const active = filter.values.includes(opt);
                  return (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => toggleOption(filter, opt)}
                      className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        active
                          ? 'bg-cyan-600 border-cyan-600 text-white'
                          : 'bg-white border-slate-300 text-slate-600 hover:border-cyan-400'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })
              ) : (
                <input
                  type="text"
                  value={filter.values[0] ?? ''}
                  placeholder="Contains…"
                  onChange={(e) => updateValues(filter.fieldId, e.target.value ? [e.target.value] : [])}
                  className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 max-w-[220px]"
                />
              )}
            </div>
            <button
              type="button"
              onClick={() => removeFilter(filter.fieldId)}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title={`Remove ${field.label} filter`}
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        );
      })}

      {addableFields.length > 0 && (
        <div className="flex items-center gap-1.5">
          <PlusIcon className="w-3.5 h-3.5 text-cyan-600" />
          {/* Use the select purely as an "add" trigger; it resets to placeholder after each pick. */}
          <select
            value=""
            onChange={(e) => addFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-medium text-cyan-600 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
          >
            <option value="">Add filter…</option>
            {addableFields.map((f) => (
              <option key={f.fieldId} value={f.fieldId}>
                {f.label.length > 40 ? `${f.label.slice(0, 40)}…` : f.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
