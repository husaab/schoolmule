'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ExclamationTriangleIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import * as importService from '@/services/registrationImportService';
import { useNotificationStore } from '@/store/useNotificationStore';
import type {
  FieldMapping,
  MappableFormField,
  TargetFieldDef,
  StudentTargetField,
} from '@/services/types/registrationImport';

interface Props {
  formId: string;
  onSaved: () => void;
  onCancel: () => void;
}

const UNMAPPED = '';

/**
 * Configures which form field feeds which student field, plus the per-option
 * translation choice fields need (e.g. "Grade 1" → the `1` grade token).
 *
 * Saved per form and reused by every import, so this is a one-time setup rather
 * than something to redo on each run.
 */
export default function FieldMappingEditor({ formId, onSaved, onCancel }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuggested, setIsSuggested] = useState(false);
  const [fields, setFields] = useState<MappableFormField[]>([]);
  const [targetFields, setTargetFields] = useState<TargetFieldDef[]>([]);
  // fieldId → target field ('' means not imported)
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  // fieldId → { option text → target value }
  const [valueMaps, setValueMaps] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await importService.getMapping(formId);
        const { mappings, fields: formFields, targetFields: targets, isSuggested: suggested } = res.data;

        setFields(formFields);
        setTargetFields(targets);
        setIsSuggested(suggested);
        setAssignments(Object.fromEntries(mappings.map((m) => [m.fieldId, m.targetField])));
        setValueMaps(
          Object.fromEntries(
            mappings.filter((m) => m.valueMap).map((m) => [m.fieldId, { ...m.valueMap } as Record<string, string>]),
          ),
        );
      } catch (err) {
        showNotification((err as Error).message || 'Error loading mapping', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [formId, showNotification]);

  const targetByKey = useMemo(
    () => new Map(targetFields.map((t) => [t.targetField, t])),
    [targetFields],
  );

  // Group the dropdown so Mother/Father contact fields don't read as one flat list.
  const groupedTargets = useMemo(() => {
    const groups = new Map<string, TargetFieldDef[]>();
    for (const t of targetFields) {
      if (!groups.has(t.group)) groups.set(t.group, []);
      groups.get(t.group)!.push(t);
    }
    return [...groups.entries()];
  }, [targetFields]);

  // A student field may only be claimed once, so offer each one only where it
  // is still free (or already selected here).
  const takenBy = useMemo(() => {
    const m = new Map<string, string>();
    for (const [fieldId, target] of Object.entries(assignments)) {
      if (target) m.set(target, fieldId);
    }
    return m;
  }, [assignments]);

  const setAssignment = useCallback((fieldId: string, target: string) => {
    setAssignments((prev) => ({ ...prev, [fieldId]: target }));

    // Seed a value map when a choice field is pointed at an enum target, so the
    // admin starts from a proposal rather than an empty grid.
    const def = targetByKey.get(target as StudentTargetField);
    if (def?.dataType === 'enum') {
      const field = fields.find((f) => f.fieldId === fieldId);
      if (field?.options?.length) {
        setValueMaps((prev) => {
          if (prev[fieldId]) return prev;
          const seeded: Record<string, string> = {};
          for (const opt of field.options!) {
            const guess = guessEnumValue(opt, def.enumValues || []);
            if (guess) seeded[opt] = guess;
          }
          return { ...prev, [fieldId]: seeded };
        });
      }
    }
  }, [fields, targetByKey]);

  const setOptionValue = (fieldId: string, option: string, value: string) => {
    setValueMaps((prev) => ({
      ...prev,
      [fieldId]: { ...(prev[fieldId] || {}), [option]: value },
    }));
  };

  // Required student fields that nothing feeds yet — the import can't run
  // without these, so they're surfaced before the admin saves.
  const missingRequired = useMemo(
    () => targetFields.filter((t) => t.required && !takenBy.has(t.targetField)),
    [targetFields, takenBy],
  );

  // Choice options with no translation, which would fail at import time.
  const untranslatedOptions = useMemo(() => {
    const out: { fieldId: string; label: string; options: string[] }[] = [];
    for (const field of fields) {
      const target = assignments[field.fieldId];
      const def = target ? targetByKey.get(target as StudentTargetField) : null;
      if (!def || def.dataType !== 'enum' || !field.options?.length) continue;
      const map = valueMaps[field.fieldId] || {};
      const missing = field.options.filter((o) => !map[o]);
      if (missing.length > 0) out.push({ fieldId: field.fieldId, label: field.label, options: missing });
    }
    return out;
  }, [fields, assignments, valueMaps, targetByKey]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.entries(assignments)
        .filter(([, target]) => target)
        .map(([fieldId, target]) => {
          const def = targetByKey.get(target as StudentTargetField);
          return {
            fieldId,
            targetField: target as StudentTargetField,
            valueMap: def?.dataType === 'enum' ? (valueMaps[fieldId] || {}) : null,
          };
        });

      await importService.saveMapping(formId, payload);
      showNotification('Import mapping saved', 'success');
      onSaved();
    } catch (err) {
      showNotification((err as Error).message || 'Error saving mapping', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-slate-400">
        <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2" />
        <p className="text-sm">Loading mapping...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-6 py-4 space-y-4">
        {isSuggested && (
          <div className="flex items-start gap-2.5 p-3 bg-cyan-50 border border-cyan-100 rounded-xl">
            <SparklesIcon className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
            <p className="text-sm text-cyan-900">
              We&apos;ve suggested a mapping from your field labels. Review it and save — nothing is
              stored until you do.
            </p>
          </div>
        )}

        {missingRequired.length > 0 && (
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-900">
              <span className="font-medium">
                {missingRequired.map((t) => t.label).join(' and ')} {missingRequired.length === 1 ? 'is' : 'are'} not mapped.
              </span>{' '}
              Submissions can&apos;t be imported until every required field has a source.
            </p>
          </div>
        )}

        {untranslatedOptions.length > 0 && (
          <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-medium mb-1">Some answer options have no value set.</p>
              <ul className="list-disc list-inside space-y-0.5">
                {untranslatedOptions.map((u) => (
                  <li key={u.fieldId}>
                    <span className="font-medium">{u.options.join(', ')}</span> — submissions using{' '}
                    {u.options.length === 1 ? 'it' : 'them'} will be flagged instead of imported.
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {fields.map((field) => {
            const target = assignments[field.fieldId] || UNMAPPED;
            const def = target ? targetByKey.get(target as StudentTargetField) : null;
            const needsValueMap = def?.dataType === 'enum' && !!field.options?.length;

            return (
              <div key={field.fieldId} className="py-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <p className="flex-1 text-sm text-slate-700 min-w-0 break-words">{field.label}</p>
                  <span className="hidden sm:block text-slate-300 shrink-0">→</span>
                  <select
                    value={target}
                    onChange={(e) => setAssignment(field.fieldId, e.target.value)}
                    className={`w-full sm:w-64 shrink-0 px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors ${
                      target ? 'border-cyan-300 text-slate-900' : 'border-slate-200 text-slate-400'
                    }`}
                  >
                    <option value={UNMAPPED}>— Not imported —</option>
                    {groupedTargets.map(([group, defs]) => (
                      <optgroup key={group} label={group}>
                        {defs.map((t) => {
                          const claimedBy = takenBy.get(t.targetField);
                          const claimedElsewhere = claimedBy && claimedBy !== field.fieldId;
                          return (
                            <option key={t.targetField} value={t.targetField} disabled={!!claimedElsewhere}>
                              {t.label}
                              {t.required ? ' *' : ''}
                              {claimedElsewhere ? ' (already used)' : ''}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                </div>

                {needsValueMap && (
                  <div className="mt-3 ml-0 sm:ml-4 pl-4 border-l-2 border-cyan-100 space-y-1.5">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                      Answer → {def!.label}
                    </p>
                    {field.options!.map((opt) => {
                      const value = valueMaps[field.fieldId]?.[opt] || '';
                      return (
                        <div key={opt} className="flex items-center gap-3">
                          <span className="flex-1 text-sm text-slate-600 truncate" title={opt}>{opt}</span>
                          <select
                            value={value}
                            onChange={(e) => setOptionValue(field.fieldId, opt, e.target.value)}
                            className={`w-32 shrink-0 px-2 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                              value ? 'border-slate-300 text-slate-900' : 'border-amber-300 text-slate-400'
                            }`}
                          >
                            <option value="">— None —</option>
                            {(def!.enumValues || []).map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="sticky bottom-0 bg-white px-6 py-3 border-t border-slate-100 flex items-center justify-between">
        <p className="text-sm text-slate-500 flex items-center gap-1.5">
          {missingRequired.length === 0 && (
            <>
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              Ready to import
            </>
          )}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save mapping'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Proposes a target value for one answer option, so switching a field to an
 * enum target starts from something sensible.
 * "Junior Kindergarten (born in 2022)" → 'JK'; "Grade 3" → '3'.
 *
 * Deliberately mirrors suggestGradeValue() in the backend's
 * studentImportTarget.js: that one seeds the initial server-side suggestion,
 * this one re-seeds instantly when the admin re-points a field mid-edit, with
 * no round-trip. Keep the two regexes in sync.
 */
function guessEnumValue(option: string, enumValues: string[]): string | null {
  const l = option.toLowerCase();
  if (/junior\s*k|\bjk\b/.test(l) && enumValues.includes('JK')) return 'JK';
  if (/senior\s*k|\bsk\b/.test(l) && enumValues.includes('SK')) return 'SK';
  const m = l.match(/\b(\d{1,2})\b/);
  if (m && enumValues.includes(m[1])) return m[1];
  return null;
}
