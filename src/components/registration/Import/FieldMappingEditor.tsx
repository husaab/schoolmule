'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  ArchiveBoxArrowDownIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import * as importService from '@/services/registrationImportService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useAccess } from '@/hooks/useAccess';
import { Button } from '@/components/shared/modalKit';
import { FieldTypeTag } from '@/components/student/customFields/FieldTypeTag';
import { CUSTOM_FIELD_LIMITS, CUSTOM_FIELD_TYPES } from '@/lib/studentCustomFields';
import {
  NEW_FIELD_VALUE,
  applyKeepPlan,
  assignmentFromValue,
  assignmentValue,
  assignmentsFromMappings,
  keepPlanValueMaps,
  newFieldProblems,
  newFieldsIn,
  planKeepEverythingElse,
  seedValueMap,
  toMappingsToSave,
  unmappedQuestions,
  valueChoicesFor,
  type Assignments,
} from '@/lib/importMapping';
import type { CustomFieldDefinition, CustomFieldType } from '@/services/types/studentCustomField';
import type { MappableFormField, TargetFieldDef } from '@/services/types/registrationImport';
import KeepEverythingElseModal from './KeepEverythingElseModal';

interface Props {
  formId: string;
  onSaved: () => void;
  onCancel: () => void;
}

const selectBase =
  'w-full sm:w-64 shrink-0 cursor-pointer px-3 py-2 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-colors';

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Configures what each form question feeds: a built-in student field, one of
 * the school's custom fields (an existing one, or a new one made from the
 * question), or nothing. Choice questions feeding a field that only takes set
 * values (grade, gender, a dropdown) also get a per-answer translation.
 *
 * Saved per form and reused by every import, so this is a one-time setup rather
 * than something to redo on each run.
 */
export default function FieldMappingEditor({ formId, onSaved, onCancel }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);
  // Making a field for every student is part of editing students; without it
  // a question can still be saved into the fields the school already has.
  const canAddFields = useAccess().can('students');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isSuggested, setIsSuggested] = useState(false);
  const [fields, setFields] = useState<MappableFormField[]>([]);
  const [targetFields, setTargetFields] = useState<TargetFieldDef[]>([]);
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([]);
  // question → what it feeds
  const [assignments, setAssignments] = useState<Assignments>({});
  // question → { answer option → target value }
  const [valueMaps, setValueMaps] = useState<Record<string, Record<string, string>>>({});
  const [keepOpen, setKeepOpen] = useState(false);
  // Problems with new fields show once the admin has tried to save.
  const [triedSaving, setTriedSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await importService.getMapping(formId);
        const { mappings, fields: formFields, targetFields: targets, customFields: custom, isSuggested: suggested } = res.data;

        setFields(formFields);
        setTargetFields(targets);
        setCustomFields(custom ?? []);
        setIsSuggested(suggested);
        setAssignments(assignmentsFromMappings(mappings));
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

  // Group the dropdown so Mother/Father contact fields don't read as one flat list.
  const groupedTargets = useMemo(() => {
    const groups = new Map<string, TargetFieldDef[]>();
    for (const t of targetFields) {
      if (!groups.has(t.group)) groups.set(t.group, []);
      groups.get(t.group)!.push(t);
    }
    return [...groups.entries()];
  }, [targetFields]);

  // A student field, built-in or custom, is fed by one question at most, so
  // each is offered only where it is still free (or already selected here).
  const takenBy = useMemo(() => {
    const m = new Map<string, string>();
    for (const [questionId, a] of Object.entries(assignments)) {
      if (a.kind === 'builtin' || a.kind === 'custom') m.set(assignmentValue(a), questionId);
    }
    return m;
  }, [assignments]);

  const setAssignment = (question: MappableFormField, value: string) => {
    const next = assignmentFromValue(value, question);
    setAssignments((prev) => ({ ...prev, [question.fieldId]: next }));

    // A choice question pointed at a field that only takes set values starts
    // from a proposed translation, not an empty grid. The translation belongs
    // to the target, so re-pointing the question replaces it.
    const choices = valueChoicesFor(next, question, targetFields, customFields);
    setValueMaps((prev) => {
      const rest = { ...prev };
      delete rest[question.fieldId];
      if (choices) rest[question.fieldId] = seedValueMap(question.options ?? [], choices);
      return rest;
    });
  };

  const setOptionValue = (fieldId: string, option: string, value: string) => {
    setValueMaps((prev) => ({
      ...prev,
      [fieldId]: { ...(prev[fieldId] || {}), [option]: value },
    }));
  };

  const setNewField = (questionId: string, change: { label?: string; type?: CustomFieldType }) => {
    setAssignments((prev) => {
      const current = prev[questionId];
      if (current?.kind !== 'new') return prev;
      return { ...prev, [questionId]: { kind: 'new', draft: { ...current.draft, ...change } } };
    });
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
    for (const question of fields) {
      const choices = valueChoicesFor(assignments[question.fieldId], question, targetFields, customFields);
      if (!choices) continue;
      const map = valueMaps[question.fieldId] || {};
      const missing = (question.options ?? []).filter((o) => !map[o]);
      if (missing.length > 0) out.push({ fieldId: question.fieldId, label: question.label, options: missing });
    }
    return out;
  }, [fields, assignments, valueMaps, targetFields, customFields]);

  const notImported = useMemo(() => unmappedQuestions(fields, assignments), [fields, assignments]);
  const keepPlan = useMemo(
    () => (keepOpen ? planKeepEverythingElse(fields, assignments, customFields) : []),
    [keepOpen, fields, assignments, customFields],
  );
  const newFields = useMemo(() => newFieldsIn(fields, assignments), [fields, assignments]);
  const problems = useMemo(() => newFieldProblems(assignments, customFields), [assignments, customFields]);

  const handleSave = async () => {
    setTriedSaving(true);
    if (Object.keys(problems).length > 0) {
      showNotification('Fix the new fields marked in red, then save', 'error');
      return;
    }
    setSaving(true);
    try {
      const res = await importService.saveMapping(
        formId,
        toMappingsToSave(fields, assignments, valueMaps, targetFields, customFields),
      );
      const created = res.data.createdFields?.length ?? 0;
      showNotification(
        created > 0 ? `Import mapping saved. ${plural(created, 'custom field', 'custom fields')} added.` : 'Import mapping saved',
        'success',
      );
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

        {/* The questions that would otherwise never reach the student. */}
        {notImported.length > 0 && (
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:flex-row sm:items-center">
            <ArchiveBoxArrowDownIcon className="hidden h-5 w-5 shrink-0 text-slate-400 sm:block" />
            <p className="flex-1 text-sm text-slate-700">
              <span className="font-medium">
                {plural(notImported.length, 'question isn’t', 'questions aren’t')} imported.
              </span>{' '}
              {notImported.length === 1 ? 'Its answer stays' : 'Their answers stay'} on the submission and never reach the student.
            </p>
            {canAddFields && (
              <Button type="button" variant="secondary" onClick={() => setKeepOpen(true)} className="shrink-0 bg-white">
                Keep {notImported.length === 1 ? 'it' : 'them'} as custom fields
              </Button>
            )}
          </div>
        )}

        <div className="divide-y divide-slate-100">
          {fields.map((field) => {
            const assignment = assignments[field.fieldId];
            const value = assignmentValue(assignment);
            const choices = valueChoicesFor(assignment, field, targetFields, customFields);
            const existing = assignment?.kind === 'custom' ? customFields.find((f) => f.fieldId === assignment.fieldId) : null;
            const problem = triedSaving ? problems[field.fieldId] : undefined;

            return (
              <div key={field.fieldId} className="py-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <p className="flex-1 text-sm text-slate-700 min-w-0 break-words">{field.label}</p>
                  <span className="hidden sm:block text-slate-300 shrink-0">→</span>
                  <select
                    value={value}
                    aria-label={`What "${field.label}" is imported as`}
                    onChange={(e) => setAssignment(field, e.target.value)}
                    className={`${selectBase} ${value ? 'border-cyan-300 text-slate-900' : 'border-slate-200 text-slate-400'}`}
                  >
                    <option value="">— Not imported —</option>
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
                    <optgroup label="Custom fields">
                      {customFields.map((f) => {
                        const key = `custom:${f.fieldId}`;
                        const claimedBy = takenBy.get(key);
                        const claimedElsewhere = claimedBy && claimedBy !== field.fieldId;
                        return (
                          <option key={f.fieldId} value={key} disabled={!!claimedElsewhere}>
                            {f.label}
                            {claimedElsewhere ? ' (already used)' : ''}
                          </option>
                        );
                      })}
                      <option value={NEW_FIELD_VALUE} disabled={!canAddFields}>
                        {canAddFields ? '+ New custom field' : '+ New custom field (needs permission to edit students)'}
                      </option>
                    </optgroup>
                  </select>
                </div>

                {existing && (
                  <div className="mt-2 flex justify-end">
                    <FieldTypeTag type={existing.type} />
                  </div>
                )}

                {assignment?.kind === 'new' && (
                  <div className="mt-3 sm:ml-4 space-y-2 border-l-2 border-cyan-100 pl-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      New field, on every student
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        value={assignment.draft.label}
                        maxLength={CUSTOM_FIELD_LIMITS.label}
                        aria-label={`Name of the new field for "${field.label}"`}
                        aria-invalid={Boolean(problem)}
                        onChange={(e) => setNewField(field.fieldId, { label: e.target.value })}
                        placeholder="Field name"
                        className={`min-w-0 flex-1 px-3 py-2 text-sm border rounded-lg bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                          problem ? 'border-rose-300' : 'border-slate-300'
                        }`}
                      />
                      <select
                        value={assignment.draft.type}
                        aria-label={`Kind of answer for "${field.label}"`}
                        onChange={(e) => setNewField(field.fieldId, { type: e.target.value as CustomFieldType })}
                        className="w-full sm:w-40 shrink-0 cursor-pointer px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        {CUSTOM_FIELD_TYPES
                          // A dropdown needs choices, and only a choice question has them to give.
                          .filter(({ type }) => type !== 'select' || assignment.draft.options.length > 0)
                          .map(({ type, label }) => (
                            <option key={type} value={type}>{label}</option>
                          ))}
                      </select>
                    </div>
                    {assignment.draft.type === 'select' && (
                      <p className="text-xs text-slate-500 break-words">Choices: {assignment.draft.options.join(', ')}</p>
                    )}
                    {problem && <p className="text-xs text-rose-600">{problem}</p>}
                  </div>
                )}

                {choices && (
                  <div className="mt-3 ml-0 sm:ml-4 pl-4 border-l-2 border-cyan-100 space-y-1.5">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                      Answer → {choices.label}
                    </p>
                    {field.options!.map((opt) => {
                      const mapped = valueMaps[field.fieldId]?.[opt] || '';
                      return (
                        <div key={opt} className="flex items-center gap-3">
                          <span className="flex-1 text-sm text-slate-600 truncate" title={opt}>{opt}</span>
                          <select
                            value={mapped}
                            aria-label={`${choices.label} for the answer "${opt}"`}
                            onChange={(e) => setOptionValue(field.fieldId, opt, e.target.value)}
                            className={`w-40 shrink-0 cursor-pointer px-2 py-1.5 text-sm border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 ${
                              mapped ? 'border-slate-300 text-slate-900' : 'border-amber-300 text-slate-400'
                            }`}
                          >
                            <option value="">— None —</option>
                            {choices.values.map((v) => (
                              <option key={v} value={v}>{choices.display(v)}</option>
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

      <div className="sticky bottom-0 bg-white px-6 py-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 flex items-center gap-1.5">
          {missingRequired.length === 0 && (
            <>
              <CheckCircleIcon className="w-4 h-4 text-emerald-500" />
              Ready to import
            </>
          )}
          {newFields.length > 0 && (
            <span className={missingRequired.length === 0 ? 'before:mr-1.5 before:text-slate-300 before:content-["·"]' : ''}>
              Saving adds {plural(newFields.length, 'custom field', 'custom fields')}
            </span>
          )}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} loading={saving}>
            {saving ? 'Saving' : 'Save mapping'}
          </Button>
        </div>
      </div>

      <KeepEverythingElseModal
        isOpen={keepOpen}
        plan={keepPlan}
        takenNames={[...customFields.map((f) => f.label), ...newFields.map((d) => d.label)]}
        onClose={() => setKeepOpen(false)}
        onConfirm={(plan) => {
          setAssignments((prev) => applyKeepPlan(prev, plan));
          setValueMaps((prev) => ({ ...prev, ...keepPlanValueMaps(plan, targetFields, customFields) }));
        }}
      />
    </div>
  );
}
