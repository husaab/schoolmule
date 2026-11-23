'use client';

// Report templates → Subject headings: the school's headings on grades 1-8
// progress reports, in print order, with the subjects under each and the class
// names each subject covers (src/lib/subjectHeadings.ts). Edits stay a draft
// until Save; "Remove all headings" goes back to A to Z with no headings.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Button, inputClass } from '@/components/shared/modalKit';
import { useNotificationStore } from '@/store/useNotificationStore';
import { deleteSubjectLayout, getSubjectLayout, saveSubjectLayout } from '@/services/reportTemplateService';
import {
  OTHER_HEADING,
  emptySection,
  emptySubject,
  fromDraft,
  layoutProblem,
  moveItem,
  placeOf,
  sameLayout,
  toDraft,
  uncoveredSubjects,
  type DraftSection,
  type DraftSubject,
  type LayoutSection,
} from '@/lib/subjectHeadings';
import ShowMeHow from '@/components/tours/ShowMeHow';
import { ConfirmDialog, type ConfirmRequest } from './ConfirmDialog';

const iconButton =
  'inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-40';

export default function SubjectHeadingsTab() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [saved, setSaved] = useState<LayoutSection[] | null>(null);
  const [classSubjects, setClassSubjects] = useState<string[]>([]);
  const [draft, setDraft] = useState<DraftSection[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);

  const load = useCallback(() => {
    setLoadError(null);
    getSubjectLayout()
      .then((res) => {
        setSaved(res.sections);
        setDraft(toDraft(res.sections));
        setClassSubjects(res.classSubjects ?? []);
      })
      .catch((e) => setLoadError(e instanceof Error && e.message ? e.message : "The subject headings couldn't be loaded"));
  }, []);
  useEffect(() => load(), [load]);

  const current = useMemo(() => fromDraft(draft), [draft]);
  const changed = saved !== null && !sameLayout(current, saved);
  const uncovered = uncoveredSubjects(current, classSubjects);

  const setSection = (i: number, patch: Partial<DraftSection>) => setDraft((d) => d.map((s, k) => (k === i ? { ...s, ...patch } : s)));
  const setSubject = (i: number, j: number, patch: Partial<DraftSubject>) =>
    setSection(i, { subjects: draft[i].subjects.map((s, k) => (k === j ? { ...s, ...patch } : s)) });

  const save = async () => {
    const reason = layoutProblem(current);
    if (reason) {
      setProblem(reason);
      return;
    }
    setSaving(true);
    setProblem(null);
    try {
      const res = await saveSubjectLayout(current);
      setSaved(res.sections);
      setDraft(toDraft(res.sections));
      notify('Subject headings saved. Progress reports generated from now on use them.', 'success');
    } catch (e) {
      setProblem(e instanceof Error && e.message ? e.message : "The subject headings couldn't be saved");
    } finally {
      setSaving(false);
    }
  };

  const removeAll = () =>
    setConfirm({
      title: 'Remove all subject headings?',
      message: 'Progress reports will list subjects A to Z under their class names, with no headings.',
      confirmLabel: 'Remove headings',
      onConfirm: async () => {
        try {
          await deleteSubjectLayout();
          setSaved([]);
          setDraft([]);
          setProblem(null);
          notify('Subject headings removed', 'success');
        } catch (e) {
          notify(e instanceof Error && e.message ? e.message : "The subject headings couldn't be removed", 'error');
        }
      },
    });

  if (loadError) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
        {loadError}
        <Button variant="secondary" onClick={load}>
          Try again
        </Button>
      </div>
    );
  }
  if (saved === null) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-4" data-testid="subject-headings">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600">
        <p>
          Grades 1–8 progress reports print their subjects under these headings, in this order. Each subject prints under the name
          you give it and covers the classes named in <strong className="text-slate-800">Class names</strong> (or the classes with
          its own name when that&apos;s empty). Classes no heading covers print last, under &ldquo;{OTHER_HEADING}&rdquo;.
        </p>
        <p className="mt-2 text-slate-500">Report cards are not affected. Reports already generated keep their old layout until you generate them again.</p>
        <ShowMeHow tour="progress-report-layout" fromStep="heading" className="mt-3" />
      </div>

      {draft.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          No headings: progress reports list subjects A to Z. Add a heading to group them.
        </div>
      )}

      {draft.map((section, i) => (
        <section key={section.key} className="rounded-2xl border border-slate-200 bg-white p-4" aria-label={section.heading || `Heading ${i + 1}`}>
          <div className="flex items-end gap-2" data-tour={i === 0 ? 'subjectHeadings.heading' : undefined}>
            <label className="flex-1 text-xs font-medium text-slate-600">
              Heading
              <input
                className={`${inputClass} mt-1 font-semibold`}
                value={section.heading}
                maxLength={80}
                placeholder="e.g. Religious Studies"
                onChange={(e) => setSection(i, { heading: e.target.value })}
              />
            </label>
            <button type="button" className={iconButton} disabled={i === 0} onClick={() => setDraft((d) => moveItem(d, i, -1))} aria-label={`Move ${section.heading || 'heading'} up`}>
              <ArrowUpIcon className="h-4 w-4" />
            </button>
            <button type="button" className={iconButton} disabled={i === draft.length - 1} onClick={() => setDraft((d) => moveItem(d, i, 1))} aria-label={`Move ${section.heading || 'heading'} down`}>
              <ArrowDownIcon className="h-4 w-4" />
            </button>
            <button type="button" className={`${iconButton} hover:text-rose-600`} onClick={() => setDraft((d) => d.filter((_, k) => k !== i))} aria-label={`Remove ${section.heading || 'heading'}`}>
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 space-y-2 border-l-2 border-slate-100 pl-3 sm:pl-4" data-tour={i === 0 ? 'subjectHeadings.subjects' : undefined}>
            <div className="hidden grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] gap-2 text-xs font-medium text-slate-500 sm:grid">
              <span>Printed as</span>
              <span>Class names (comma-separated)</span>
              <span className="w-[104px]" />
            </div>
            {section.subjects.map((subject, j) => (
              <div key={subject.key} className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto] sm:items-center">
                <input
                  className={inputClass}
                  value={subject.name}
                  maxLength={80}
                  placeholder="e.g. Quran"
                  aria-label="Printed as"
                  onChange={(e) => setSubject(i, j, { name: e.target.value })}
                />
                <input
                  className={inputClass}
                  value={subject.classes}
                  placeholder={subject.name ? `Classes named ${subject.name}` : 'e.g. Quran, Quran Teaching'}
                  aria-label="Class names"
                  onChange={(e) => setSubject(i, j, { classes: e.target.value })}
                />
                <div className="flex justify-end gap-1">
                  <button type="button" className={iconButton} disabled={j === 0} onClick={() => setSection(i, { subjects: moveItem(section.subjects, j, -1) })} aria-label={`Move ${subject.name || 'subject'} up`}>
                    <ArrowUpIcon className="h-4 w-4" />
                  </button>
                  <button type="button" className={iconButton} disabled={j === section.subjects.length - 1} onClick={() => setSection(i, { subjects: moveItem(section.subjects, j, 1) })} aria-label={`Move ${subject.name || 'subject'} down`}>
                    <ArrowDownIcon className="h-4 w-4" />
                  </button>
                  <button type="button" className={`${iconButton} hover:text-rose-600`} onClick={() => setSection(i, { subjects: section.subjects.filter((_, k) => k !== j) })} aria-label={`Remove ${subject.name || 'subject'}`}>
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
            <button type="button" onClick={() => setSection(i, { subjects: [...section.subjects, emptySubject()] })} className="inline-flex cursor-pointer items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-800">
              <PlusIcon className="h-4 w-4" /> Add subject
            </button>
          </div>
        </section>
      ))}

      <Button variant="secondary" onClick={() => setDraft((d) => [...d, emptySection()])}>
        <PlusIcon className="h-4 w-4" /> Add heading
      </Button>

      {classSubjects.length > 0 && current.length > 0 && (
        <div data-tour="subjectHeadings.classes" className="rounded-2xl border border-slate-200 bg-white p-4 text-sm">
          <h3 className="font-semibold text-slate-800">This year&apos;s classes</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {classSubjects.map((c) => {
              const at = placeOf(current, c);
              return (
                <li
                  key={c}
                  className={`rounded-full px-2.5 py-1 text-xs ${at ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}
                  title={at ? `Prints as ${at.name} under ${at.heading}` : `Prints under ${OTHER_HEADING}`}
                >
                  {c}
                  {at ? ` → ${at.heading}${at.name !== c ? ` (${at.name})` : ''}` : ` → ${OTHER_HEADING}`}
                </li>
              );
            })}
          </ul>
          {uncovered.length > 0 && (
            <p className="mt-2 text-xs text-amber-700">
              {uncovered.length === 1 ? '1 class subject prints' : `${uncovered.length} class subjects print`} under &ldquo;{OTHER_HEADING}&rdquo;.
              Add {uncovered.length === 1 ? 'it' : 'them'} to a subject&apos;s class names to group {uncovered.length === 1 ? 'it' : 'them'}.
            </p>
          )}
        </div>
      )}

      {problem && <p className="text-sm text-rose-600">{problem}</p>}

      <div data-tour="subjectHeadings.save" className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4">
        {saved.length > 0 && (
          <Button variant="secondary" className="text-rose-600" onClick={removeAll}>
            Remove all headings
          </Button>
        )}
        <span className="ml-auto" />
        {changed && (
          <Button variant="secondary" onClick={() => { setDraft(toDraft(saved)); setProblem(null); }}>
            Discard changes
          </Button>
        )}
        <Button loading={saving} disabled={!changed || saving || current.length === 0} onClick={() => void save()} data-testid="subject-headings-save">
          Save headings
        </Button>
      </div>

      <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
    </div>
  );
}
