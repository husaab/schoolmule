'use client';

// Who a payment request goes to: whole grades, whole classes, and students
// picked by name, from this school year's roster. Shows how many students
// that is, and how many of them have no guardian email to send to.

import React, { useMemo, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import type { PaymentRequestTarget, PaymentsRoster } from '@/services/types/payments';
import { audienceStudents, gradeLabel, rosterGrades } from '@/lib/paymentRequests';
import { inputClass, selectClass } from '@/components/shared/modalKit';

interface Props {
  roster: PaymentsRoster | null;
  rosterError?: string | null;
  target: Required<PaymentRequestTarget>;
  onChange: (next: Required<PaymentRequestTarget>) => void;
  /** Students already on the request: shown as such, not counted again. */
  alreadyOn?: Set<string>;
}

const chip = (active: boolean) =>
  `rounded-full px-3 py-1 text-xs font-medium transition-colors ${active ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`;

export default function AudiencePicker({ roster, rosterError, target, onChange, alreadyOn }: Props) {
  const [query, setQuery] = useState('');

  const grades = useMemo(() => (roster ? rosterGrades(roster) : []), [roster]);
  const chosen = useMemo(() => (roster ? audienceStudents(roster, target) : []), [roster, target]);
  const fresh = chosen.filter((s) => !alreadyOn?.has(s.studentId));
  const noEmail = fresh.filter((s) => !s.hasGuardianEmail);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!roster || q.length < 2) return [];
    return roster.students.filter((s) => s.name.toLowerCase().includes(q) && !target.studentIds.includes(s.studentId)).slice(0, 8);
  }, [roster, query, target.studentIds]);

  if (rosterError) return <p role="alert" className="text-sm text-rose-600">{rosterError}</p>;
  if (!roster) return <div className="h-24 animate-pulse rounded-xl bg-slate-100" />;

  const toggleGrade = (g: string) =>
    onChange({ ...target, grades: target.grades.includes(g) ? target.grades.filter((x) => x !== g) : [...target.grades, g] });
  const addClass = (id: string) => id && !target.classIds.includes(id) && onChange({ ...target, classIds: [...target.classIds, id] });
  const removeClass = (id: string) => onChange({ ...target, classIds: target.classIds.filter((x) => x !== id) });
  const addStudent = (id: string) => { onChange({ ...target, studentIds: [...target.studentIds, id] }); setQuery(''); };
  const removeStudent = (id: string) => onChange({ ...target, studentIds: target.studentIds.filter((x) => x !== id) });
  const studentName = (id: string) => roster.students.find((s) => s.studentId === id)?.name || 'Student';

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-1.5 text-sm font-medium text-slate-700">Whole grades</p>
        {grades.length === 0 ? (
          <p className="text-sm text-slate-500">No students this school year yet.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Grades">
            {grades.map((g) => (
              <button key={g} type="button" aria-pressed={target.grades.includes(g)} onClick={() => toggleGrade(g)} className={chip(target.grades.includes(g))}>
                {gradeLabel(g)}
              </button>
            ))}
          </div>
        )}
      </div>

      {roster.classes.length > 0 && (
        <div>
          <label htmlFor="audience-class" className="mb-1.5 block text-sm font-medium text-slate-700">Whole classes</label>
          <select id="audience-class" value="" onChange={(e) => addClass(e.target.value)} className={selectClass}>
            <option value="">Add a class…</option>
            {roster.classes.filter((c) => !target.classIds.includes(c.classId)).map((c) => (
              <option key={c.classId} value={c.classId}>{c.name} · {gradeLabel(c.grade)} · {c.teacherName} ({c.studentCount})</option>
            ))}
          </select>
          {target.classIds.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {target.classIds.map((id) => {
                const c = roster.classes.find((x) => x.classId === id);
                return (
                  <span key={id} className="inline-flex items-center gap-1 rounded-full bg-cyan-50 py-1 pl-3 pr-1.5 text-xs font-medium text-cyan-800 ring-1 ring-cyan-200">
                    {c ? `${c.name} · ${gradeLabel(c.grade)}` : 'Class'}
                    <button type="button" onClick={() => removeClass(id)} aria-label={`Remove ${c?.name || 'class'}`} className="rounded-full p-0.5 hover:bg-cyan-100">
                      <XMarkIcon className="h-3.5 w-3.5" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div>
        <label htmlFor="audience-student" className="mb-1.5 block text-sm font-medium text-slate-700">Students</label>
        <div className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input id="audience-student" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Type a name" autoComplete="off" className={`${inputClass} pl-9`} />
        </div>
        {matches.length > 0 && (
          <ul className="mt-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-sm" role="listbox" aria-label="Matching students">
            {matches.map((s) => (
              <li key={s.studentId}>
                <button type="button" role="option" aria-selected={false} onClick={() => addStudent(s.studentId)} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-cyan-50">
                  <span className="text-slate-800">{s.name}</span>
                  <span className="text-xs text-slate-500">{gradeLabel(s.grade)}{alreadyOn?.has(s.studentId) ? ' · already on it' : ''}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {target.studentIds.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {target.studentIds.map((id) => (
              <span key={id} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs font-medium text-slate-700">
                {studentName(id)}
                <button type="button" onClick={() => removeStudent(id)} aria-label={`Remove ${studentName(id)}`} className="rounded-full p-0.5 hover:bg-slate-200">
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm" aria-live="polite">
        <p className="font-medium text-slate-900">
          {fresh.length === 0
            ? chosen.length > 0 ? 'Everyone you chose is on this request already.' : 'Choose a grade, a class or students.'
            : `${fresh.length} ${fresh.length === 1 ? 'student' : 'students'}${alreadyOn && chosen.length > fresh.length ? ` (${chosen.length - fresh.length} already on it)` : ''}`}
        </p>
        {noEmail.length > 0 && (
          <p className="mt-0.5 text-xs text-amber-700">
            {noEmail.length === 1 ? `${noEmail[0].name} has` : `${noEmail.length} have`} no guardian email, so no email goes to {noEmail.length === 1 ? 'that family' : 'those families'}. Their payment is still listed on the request.
          </p>
        )}
      </div>
    </div>
  );
}
