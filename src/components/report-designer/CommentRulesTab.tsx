'use client';

// Report templates → Comments: the school's rules for the comments teachers
// write on report cards and progress reports (src/lib/commentRules.ts).
//
// Word limits: a minimum and a maximum for each document (grades 1-8). The
// comment pages show the limit and count words as the teacher types; a
// comment over the maximum isn't saved until it is shortened, one under the
// minimum saves and counts as not finished.
//
// Review lock: lock a term's comments for a document, then read them class by
// class. While locked, teachers can read but not change them; whoever holds
// School setup still can. One class can be reopened (or locked) on its own;
// locking or reopening the whole term again clears those exceptions.

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowTopRightOnSquareIcon, LockClosedIcon, LockOpenIcon } from '@heroicons/react/24/outline';
import { Button, inputClass } from '@/components/shared/modalKit';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { classHref } from '@/lib/classroomRoutes';
import {
  KIND_NAME,
  limitsDraft,
  readLimits,
  sameLimits,
  standingDone,
  standingLine,
  type ClassCommentStanding,
  type CommentKind,
  type CommentLimits,
  type LimitsDraft,
} from '@/lib/commentRules';
import {
  getCommentsOverview,
  saveCommentLimits,
  setClassCommentLock,
  setTermCommentLock,
} from '@/services/reportCommentsService';
import { getTermsBySchool } from '@/services/termService';
import type { CommentsOverview, ReviewClass, TermCommentLock } from '@/services/types/reportComments';
import type { TermPayload } from '@/services/types/term';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useSchoolYearStore } from '@/store/useSchoolYearStore';
import { useUserStore } from '@/store/useUserStore';

type DocKey = 'reportCard' | 'progressReport';
const DOCS: { key: DocKey; kind: CommentKind; sub: string }[] = [
  { key: 'reportCard', kind: 'report_card', sub: 'report-comments' },
  { key: 'progressReport', kind: 'progress_report', sub: 'progress-comments' },
];

const card = 'rounded-2xl border border-slate-200 bg-white p-5';
const smallButton =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400';
const messageOf = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);
const gradeName = (g: string) => (g === 'JK' || g === 'SK' ? g : `Grade ${g}`);
const day = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : '';

export default function CommentRulesTab() {
  const notify = useNotificationStore((s) => s.showNotification);
  const school = useUserStore((s) => s.user.school);
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId);

  const [terms, setTerms] = useState<TermPayload[]>([]);
  // null: let the server open on the active term.
  const [termId, setTermId] = useState<string | null>(null);
  const [overview, setOverview] = useState<CommentsOverview | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  // What is being changed right now ("limits", "term:report_card", "class:<id>:<kind>"), to hold its button.
  const [busy, setBusy] = useState<string | null>(null);

  const [drafts, setDrafts] = useState<Record<DocKey, LimitsDraft> | null>(null);
  const [limitsProblem, setLimitsProblem] = useState<string | null>(null);

  const apply = useCallback((next: CommentsOverview) => {
    setOverview(next);
    setLoadError(null);
  }, []);

  // Only the answer to the latest request is shown (switching terms quickly must not show the slower one).
  const requested = useRef(0);
  const load = useCallback(() => {
    const request = ++requested.current;
    getCommentsOverview(termId)
      .then((res) => {
        if (request !== requested.current) return;
        apply(res.data);
        // The form starts from what is saved; later reloads leave typing alone.
        setDrafts((d) => d ?? { reportCard: limitsDraft(res.data.limits.reportCard), progressReport: limitsDraft(res.data.limits.progressReport) });
      })
      .catch((e) => {
        if (request === requested.current) setLoadError(messageOf(e, "The comment rules couldn't be loaded"));
      });
  }, [termId, apply]);
  useEffect(() => load(), [load, selectedYearId]);

  useEffect(() => {
    if (!school) return;
    getTermsBySchool(school)
      .then((res) => setTerms(res.data ?? []))
      .catch(() => setTerms([]));
  }, [school, selectedYearId]);

  if (loadError && !overview) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
        {loadError}
        <Button type="button" variant="secondary" onClick={load}>
          Try again
        </Button>
      </div>
    );
  }
  if (!overview || !drafts) return <p className="text-sm text-slate-500">Loading…</p>;

  // ── Word limits ───────────────────────────────────────────────────────────
  const read = { reportCard: readLimits(drafts.reportCard), progressReport: readLimits(drafts.progressReport) };
  const limitsChanged = DOCS.some(({ key }) => {
    const r = read[key];
    return 'error' in r || !sameLimits(r.value, overview.limits[key]);
  });

  const saveLimits = async () => {
    const values = {} as Record<DocKey, CommentLimits>;
    for (const { key, kind } of DOCS) {
      const r = read[key];
      if ('error' in r) return setLimitsProblem(`${KIND_NAME[kind]}: ${r.error}`);
      values[key] = r.value;
    }
    setLimitsProblem(null);
    setBusy('limits');
    try {
      const res = await saveCommentLimits(values);
      setDrafts({ reportCard: limitsDraft(res.data.reportCard), progressReport: limitsDraft(res.data.progressReport) });
      notify('Word limits saved', 'success');
      load();
    } catch (e) {
      setLimitsProblem(messageOf(e, "The word limits couldn't be saved"));
    } finally {
      setBusy(null);
    }
  };

  // ── Locks ─────────────────────────────────────────────────────────────────
  const term = overview.term;

  const lockTerm = async (kind: CommentKind, locked: boolean) => {
    if (!term) return;
    setBusy(`term:${kind}`);
    try {
      const res = await setTermCommentLock(term.termId, kind, locked);
      apply(res.data);
      notify(`${KIND_NAME[kind]} ${locked ? 'locked' : 'reopened'} for ${term.name}`, 'success');
    } catch (e) {
      notify(messageOf(e, "The lock couldn't be changed"), 'error');
    } finally {
      setBusy(null);
    }
  };

  const lockClass = async (cls: ReviewClass, kind: CommentKind, locked: boolean) => {
    setBusy(`class:${cls.classId}:${kind}`);
    try {
      await setClassCommentLock(cls.classId, kind, locked);
      const res = await getCommentsOverview(term?.termId ?? null);
      apply(res.data);
    } catch (e) {
      notify(messageOf(e, "The lock couldn't be changed"), 'error');
    } finally {
      setBusy(null);
    }
  };

  const termOptions = terms.map((t) => ({ value: t.termId, label: t.isActive ? `${t.name} (current)` : t.name }));

  return (
    <div className="space-y-6" data-testid="comment-rules">
      {/* Word limits */}
      <section className={card} aria-labelledby="comment-limits-title">
        <h2 id="comment-limits-title" className="text-base font-semibold text-slate-900">
          Word limits
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Set how long a comment must be on each document. Teachers see the limit above their comments and a word count
          under each one as they write. A comment over the maximum isn&apos;t saved until it is shortened; one under the
          minimum saves and counts as not finished.
        </p>
        <p className="mt-1 text-sm text-slate-500">Applies to grades 1 to 8. JK and SK comments are not limited.</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {DOCS.map(({ key, kind }) => {
            const r = read[key];
            return (
              <fieldset key={key} className="rounded-xl border border-slate-200 p-4">
                <legend className="px-1 text-sm font-medium text-slate-800">{KIND_NAME[kind]}</legend>
                <div className="grid grid-cols-2 gap-3">
                  {(['minWords', 'maxWords'] as const).map((end) => (
                    <label key={end} className="text-xs font-medium text-slate-600">
                      {end === 'minWords' ? 'Minimum words' : 'Maximum words'}
                      <input
                        type="text"
                        inputMode="numeric"
                        value={drafts[key][end]}
                        onChange={(e) => {
                          setLimitsProblem(null);
                          setDrafts({ ...drafts, [key]: { ...drafts[key], [end]: e.target.value } });
                        }}
                        placeholder="No limit"
                        className={`${inputClass} mt-1`}
                        aria-invalid={'error' in r}
                      />
                    </label>
                  ))}
                </div>
                {'error' in r && <p className="mt-2 text-xs text-rose-700">{r.error}</p>}
              </fieldset>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">Leave a box blank for no limit.</p>
          <div className="flex items-center gap-3">
            {limitsProblem && <p className="text-sm text-rose-700">{limitsProblem}</p>}
            <Button type="button" variant="primary" onClick={() => void saveLimits()} loading={busy === 'limits'} disabled={!limitsChanged}>
              Save word limits
            </Button>
          </div>
        </div>
      </section>

      {/* Review lock */}
      <section className={card} aria-labelledby="comment-lock-title">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 max-w-2xl">
            <h2 id="comment-lock-title" className="text-base font-semibold text-slate-900">
              Lock comments for review
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Lock a term&apos;s comments while you read them. Teachers can still see locked comments but can&apos;t change
              them; you can. Reopen one class from the list if its teacher needs to fix something.
            </p>
          </div>
          {termOptions.length > 0 && term && (
            <div className="w-56">
              <SearchableSelect
                value={term.termId}
                onChange={(v) => setTermId(v || null)}
                options={termOptions}
                ariaLabel="Term"
                placeholder="Term"
                searchPlaceholder="Search terms…"
              />
            </div>
          )}
        </div>

        {!term ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
            This school year has no term yet. Add one in School settings, then come back to lock its comments.
          </p>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {DOCS.map(({ key, kind }) => (
                <TermLockPanel
                  key={key}
                  title={KIND_NAME[kind]}
                  lock={overview.termLocks[key]}
                  classes={overview.classes.map((c) => c[key])}
                  busy={busy === `term:${kind}`}
                  onChange={(locked) => void lockTerm(kind, locked)}
                />
              ))}
            </div>

            {overview.classes.length === 0 ? (
              <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                {term.name} has no classes yet.
              </p>
            ) : (
              <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium text-slate-500">
                      <th className="px-4 py-2.5">Class</th>
                      {DOCS.map(({ key, kind }) => (
                        <th key={key} className="px-4 py-2.5">
                          {KIND_NAME[kind]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overview.classes.map((cls) => (
                      <tr key={cls.classId} className="align-top">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">
                            {gradeName(cls.grade)} · {cls.subject}
                          </p>
                          <p className="text-xs text-slate-500">{cls.teacherName ?? 'No teacher'}</p>
                        </td>
                        {DOCS.map(({ key, kind, sub }) => (
                          <td key={key} className="px-4 py-3">
                            <ClassLockCell
                              cls={cls}
                              standing={cls[key]}
                              href={classHref(cls.classId, 'grades', cls.kindergarten ? { doc: kind } : { sub })}
                              label={`${KIND_NAME[kind]}, ${gradeName(cls.grade)} ${cls.subject}`}
                              busy={busy === `class:${cls.classId}:${kind}`}
                              onChange={(locked) => void lockClass(cls, kind, locked)}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 text-xs text-slate-500">
              JK and SK comments lock and reopen with the whole term. Their ratings are not locked.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

/** One document's lock for the whole term: its state, how many classes are locked, and the switch. */
function TermLockPanel({
  title,
  lock,
  classes,
  busy,
  onChange,
}: {
  title: string;
  lock: TermCommentLock;
  classes: ClassCommentStanding[];
  busy: boolean;
  onChange: (locked: boolean) => void;
}) {
  const lockedCount = classes.filter((c) => c.locked).length;
  const exceptions = classes.filter((c) => c.exception !== null).length;
  return (
    <div className={`rounded-xl border p-4 ${lock.locked ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-slate-50/60'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            {lock.locked ? <LockClosedIcon className="h-4 w-4 text-amber-700" aria-hidden /> : <LockOpenIcon className="h-4 w-4 text-slate-400" aria-hidden />}
            {title}
          </p>
          <p className="mt-0.5 text-xs text-slate-600">
            {lock.locked
              ? `Locked${lock.lockedAt ? ` ${day(lock.lockedAt)}` : ''}${lock.lockedBy ? ` by ${lock.lockedBy}` : ''}`
              : 'Open: teachers can edit'}
          </p>
          {classes.length > 0 && (
            <p className="mt-0.5 text-xs tabular-nums text-slate-500">
              {lockedCount} of {classes.length} classes locked
              {exceptions > 0 && ` · ${exceptions} on ${exceptions === 1 ? 'its' : 'their'} own`}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant={lock.locked ? 'secondary' : 'primary'}
          loading={busy}
          onClick={() => onChange(!lock.locked)}
          className="flex-shrink-0 whitespace-nowrap"
        >
          {lock.locked ? 'Reopen all' : 'Lock all'}
        </Button>
      </div>
      {exceptions > 0 && (
        <button
          type="button"
          disabled={busy}
          onClick={() => onChange(lock.locked)}
          className="mt-2 cursor-pointer text-xs font-medium text-indigo-600 hover:text-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {lock.locked ? 'Lock every class again' : 'Reopen every class'}
        </button>
      )}
    </div>
  );
}

/** One class's comments for one document: how they stand, whether they are locked, and the switch. */
function ClassLockCell({
  cls,
  standing,
  href,
  label,
  busy,
  onChange,
}: {
  cls: ReviewClass;
  standing: ClassCommentStanding;
  href: string;
  label: string;
  busy: boolean;
  onChange: (locked: boolean) => void;
}) {
  const line = standingLine(standing);
  const attention = Boolean(standing.tooShort || standing.tooLong);
  return (
    <div className="space-y-1.5">
      {line && (
        <p className={`text-xs tabular-nums ${standingDone(standing) ? 'text-emerald-700' : attention ? 'text-amber-700' : 'text-slate-500'}`}>
          {line}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
            standing.locked ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {standing.locked ? <LockClosedIcon className="h-3 w-3" aria-hidden /> : <LockOpenIcon className="h-3 w-3" aria-hidden />}
          {standing.locked ? 'Locked' : 'Open'}
          {standing.exception && <span className="font-normal"> · on its own</span>}
        </span>
        {cls.kindergarten ? (
          <span className="text-xs text-slate-500">Follows the term</span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => onChange(!standing.locked)}
            aria-label={`${standing.locked ? 'Reopen' : 'Lock'} ${label}`}
            className={`${smallButton} border-slate-200 bg-white text-slate-700 hover:bg-slate-50`}
          >
            {busy ? 'Saving…' : standing.locked ? 'Reopen' : 'Lock'}
          </button>
        )}
        <Link
          href={href}
          aria-label={`Review ${label}`}
          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
        >
          Review
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
