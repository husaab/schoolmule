'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  DocumentDuplicateIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
  TableCellsIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import Modal from '@/components/shared/modal';
import { Button, ConfirmBody, Field, inputClass, selectClass } from '@/components/shared/modalKit';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUserStore } from '@/store/useUserStore';
import { useFilterParams } from '@/hooks/useFilterParams';
import {
  createReportTemplate,
  createTemplateAssignment,
  deleteReportTemplate,
  deleteTemplateAssignment,
  getFieldValues,
  getTemplateCoverage,
  listReportTemplates,
  listTemplateAssignments,
  renameReportTemplate,
  saveFieldValues,
  updateTemplateAssignment,
} from '@/services/reportTemplateService';
import { getTermsBySchool } from '@/services/termService';
import type {
  CoverageResponse,
  DefaultTemplateSummary,
  FieldValuesResponse,
  ReportTemplateListResponse,
  ReportTemplateSummary,
  TemplateAssignment,
} from '@/services/types/reportTemplate';
import { defaultTemplate } from '@/reportkit/defaults';
import { GRADES } from '@/reportkit/format';
import type { DocType } from '@/reportkit/types';
import TemplateThumb from '@/components/report-designer/TemplateThumb';

const DOC_LABEL: Record<DocType, string> = { progress_report: 'Progress report', report_card: 'Report card' };
type Tab = 'templates' | 'printing' | 'fields';

function ReportTemplatesContent() {
  const { get, setParams } = useFilterParams();
  const tab = (get('tab', 'templates') as Tab) || 'templates';
  const setTab = (t: Tab) => setParams({ tab: t === 'templates' ? null : t });

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="min-h-screen bg-slate-50 pt-20 lg:ml-72">
        <div className="mx-auto max-w-6xl p-6 lg:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-slate-900">Report templates</h1>
            <p className="mt-1 text-sm text-slate-500">Design how report cards and progress reports look, choose which one prints for each grade and term, and fill in extra fields.</p>
          </div>
          <div className="mb-6 flex gap-1 rounded-xl border border-slate-200 bg-white p-1 sm:inline-flex">
            {(
              [
                ['templates', 'Templates', DocumentTextIcon],
                ['printing', 'Which template prints', TableCellsIcon],
                ['fields', 'Report fields', ListBulletIcon],
              ] as const
            ).map(([key, label, Icon]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-sm font-medium ${tab === key ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                data-testid={`tab-${key}`}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          {tab === 'templates' && <TemplatesTab />}
          {tab === 'printing' && <PrintingTab />}
          {tab === 'fields' && <FieldsTab />}
        </div>
      </main>
    </>
  );
}

export default function ReportTemplatesPage() {
  return (
    <Suspense fallback={null}>
      <ReportTemplatesContent />
    </Suspense>
  );
}

// ─────────────────────────────────────────────────────── templates ──

function TemplatesTab() {
  const router = useRouter();
  const notify = useNotificationStore((s) => s.showNotification);
  const [data, setData] = useState<ReportTemplateListResponse | null>(null);
  const [createFrom, setCreateFrom] = useState<{ docType: DocType; fromDefault?: string; fromTemplateId?: string; name: string } | null>(null);
  const [renaming, setRenaming] = useState<ReportTemplateSummary | null>(null);
  const [deleting, setDeleting] = useState<ReportTemplateSummary | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    listReportTemplates()
      .then(setData)
      .catch((e) => notify(e instanceof Error ? e.message : 'Could not load templates', 'error'));
  }, [notify]);
  useEffect(load, [load]);

  const create = async () => {
    if (!createFrom || !createFrom.name.trim()) return;
    setBusy(true);
    try {
      const res = await createReportTemplate({ ...createFrom, name: createFrom.name.trim() });
      router.push(`/admin-panel/report-templates/${res.template.templateId}`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not create the template', 'error');
      setBusy(false);
    }
  };

  const rename = async () => {
    if (!renaming) return;
    setBusy(true);
    try {
      await renameReportTemplate(renaming.templateId, renaming.name.trim());
      setRenaming(null);
      load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not rename', 'error');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    setBusy(true);
    try {
      const res = await deleteReportTemplate(deleting.templateId);
      notify(res.archived ? 'Template archived (reports already made with it keep it)' : 'Template deleted', 'success');
      setDeleting(null);
      load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-10">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your templates</h2>
          <Button onClick={() => setCreateFrom({ docType: 'progress_report', name: '' })} data-testid="new-template">
            <PlusIcon className="h-4 w-4" /> New template
          </Button>
        </div>
        {data.templates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
            <SparklesIcon className="mx-auto h-8 w-8 text-indigo-400" />
            <p className="mt-2 text-sm font-medium text-slate-800">No templates of your own yet</p>
            <p className="mt-1 text-sm text-slate-500">Your reports print with SchoolMule&apos;s designs below. Customize one to make it yours.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="template-list">
            {data.templates.map((t) => (
              <TemplateCard key={t.templateId} t={t} onRename={() => setRenaming({ ...t })} onDelete={() => setDeleting(t)} onDuplicate={() => setCreateFrom({ docType: t.docType, fromTemplateId: t.templateId, name: `${t.name} (copy)` })} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-slate-500">SchoolMule designs</h2>
        <p className="mb-3 text-sm text-slate-500">These print by default. Customize one to change it — the original stays here.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="default-list">
          {data.defaults.map((d) => (
            <DefaultCard key={d.key} d={d} onCustomize={() => setCreateFrom({ docType: d.docType, fromDefault: d.key, name: `${d.name}` })} />
          ))}
        </div>
      </section>

      <Modal isOpen={!!createFrom} onClose={() => setCreateFrom(null)} title={createFrom?.fromDefault ? 'Customize a SchoolMule design' : createFrom?.fromTemplateId ? 'Duplicate template' : 'New template'} size="md" closeOnEscape>
        {createFrom && (
          <div className="space-y-4">
            <Field label="Name" htmlFor="tpl-name" required>
              <input id="tpl-name" className={inputClass} value={createFrom.name} autoFocus onChange={(e) => setCreateFrom({ ...createFrom, name: e.target.value })} data-testid="new-template-name" />
            </Field>
            {!createFrom.fromDefault && !createFrom.fromTemplateId && (
              <>
                <Field label="Document" htmlFor="tpl-doc">
                  <select id="tpl-doc" className={selectClass} value={createFrom.docType} onChange={(e) => setCreateFrom({ ...createFrom, docType: e.target.value as DocType })}>
                    <option value="progress_report">Progress report</option>
                    <option value="report_card">Report card</option>
                  </select>
                </Field>
                <Field label="Start from" htmlFor="tpl-from">
                  <select id="tpl-from" className={selectClass} value={createFrom.fromDefault ?? ''} onChange={(e) => setCreateFrom({ ...createFrom, fromDefault: e.target.value || undefined })} data-testid="new-template-from">
                    <option value="">A blank page</option>
                    {data.defaults
                      .filter((d) => d.docType === createFrom.docType)
                      .map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.name}
                        </option>
                      ))}
                  </select>
                </Field>
              </>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setCreateFrom(null)}>
                Cancel
              </Button>
              <Button onClick={create} loading={busy} disabled={!createFrom.name.trim()} data-testid="create-template">
                Create and open
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!renaming} onClose={() => setRenaming(null)} title="Rename template" size="sm" closeOnEscape>
        {renaming && (
          <div className="space-y-4">
            <input className={inputClass} value={renaming.name} autoFocus onChange={(e) => setRenaming({ ...renaming, name: e.target.value })} data-testid="rename-input" />
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setRenaming(null)}>
                Cancel
              </Button>
              <Button onClick={rename} loading={busy} disabled={!renaming.name.trim()} data-testid="confirm-rename">
                Save
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete template" size="md" closeOnEscape>
        {deleting && (
          <div className="space-y-4">
            <ConfirmBody
              consequences={{
                title: 'What happens',
                items: [
                  deleting.assignedCount > 0 ? `It's used in ${deleting.assignedCount} "which template prints" rule${deleting.assignedCount === 1 ? '' : 's'} — remove those first.` : 'No grade prints with it.',
                  'Reports already generated with it stay exactly as they are.',
                ],
              }}
            >
              Delete <strong>{deleting.name}</strong>?
            </ConfirmBody>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setDeleting(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={remove} loading={busy} data-testid="confirm-delete-template">
                Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function TemplateCard({ t, onRename, onDelete, onDuplicate }: { t: ReportTemplateSummary; onRename: () => void; onDelete: () => void; onDuplicate: () => void }) {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" data-testid={`template-card-${t.templateId}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/admin-panel/report-templates/${t.templateId}`} className="block truncate font-semibold text-slate-900 hover:text-indigo-700">
            {t.name}
          </Link>
          <p className="text-xs text-slate-500">{DOC_LABEL[t.docType]}</p>
        </div>
        {t.published ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">v{t.published.versionNo}{t.hasUnpublishedChanges ? ' + edits' : ''}</span>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">Draft</span>
        )}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {t.assignedCount > 0 ? `Prints for ${t.assignedCount} rule${t.assignedCount === 1 ? '' : 's'}` : 'Not assigned to any grade yet'} · edited {new Date(t.updatedAt).toLocaleDateString()}
      </p>
      <div className="mt-4 flex items-center gap-1 border-t border-slate-100 pt-3">
        <Link href={`/admin-panel/report-templates/${t.templateId}`} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700" data-testid="edit-template">
          <PencilSquareIcon className="h-3.5 w-3.5" /> Edit
        </Link>
        <button type="button" onClick={onRename} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100" data-testid="rename-template">
          Rename
        </button>
        <button type="button" onClick={onDuplicate} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Duplicate">
          <DocumentDuplicateIcon className="h-4 w-4" />
        </button>
        <button type="button" onClick={onDelete} className="ml-auto rounded-lg p-1.5 text-rose-500 hover:bg-rose-50" title="Delete" data-testid="delete-template">
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DefaultCard({ d, onCustomize }: { d: DefaultTemplateSummary; onCustomize: () => void }) {
  const doc = useMemo(() => defaultTemplate(d.key), [d.key]);
  const sample = d.grades.includes('JK') ? 'JK' : d.grades.includes('SK') ? 'SK' : d.grades.includes('1') ? '2' : '4';
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-3 shadow-sm" data-testid={`default-card-${d.key}`}>
      <div className="flex justify-center rounded-xl bg-slate-50 p-3">{doc ? <TemplateThumb doc={doc} sample={sample} width={180} /> : <div className="h-[233px] w-[180px]" />}</div>
      <div className="mt-3 flex-1">
        <p className="text-sm font-semibold text-slate-900">{d.name}</p>
        <p className="mt-0.5 text-xs text-slate-500">{d.description}</p>
        <p className="mt-1.5 text-[11px] font-medium text-slate-400">
          {DOC_LABEL[d.docType]} · {d.grades.length === 8 ? 'Grades 1–8' : d.grades.join(', ')}
        </p>
      </div>
      <button type="button" onClick={onCustomize} className="mt-3 rounded-lg border border-indigo-200 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50" data-testid={`customize-${d.key}`}>
        Customize
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────── which template prints ──

function PrintingTab() {
  const notify = useNotificationStore((s) => s.showNotification);
  const [docType, setDocType] = useState<DocType>('progress_report');
  const [coverage, setCoverage] = useState<CoverageResponse | null>(null);
  const [assignments, setAssignments] = useState<TemplateAssignment[]>([]);
  const [list, setList] = useState<ReportTemplateListResponse | null>(null);
  const [editing, setEditing] = useState<(Partial<TemplateAssignment> & { target: string }) | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    Promise.all([getTemplateCoverage(docType), listTemplateAssignments(docType), listReportTemplates()])
      .then(([c, a, l]) => {
        setCoverage(c);
        setAssignments(a.assignments);
        setList(l);
      })
      .catch((e) => notify(e instanceof Error ? e.message : 'Could not load', 'error'));
  }, [docType, notify]);
  useEffect(load, [load]);

  const targets = useMemo(() => {
    if (!list) return [];
    return [
      ...list.templates.filter((t) => t.docType === docType).map((t) => ({ value: `t:${t.templateId}`, label: `${t.name}${t.published ? '' : ' (not published yet)'}` })),
      ...list.defaults.filter((d) => d.docType === docType).map((d) => ({ value: `d:${d.key}`, label: `SchoolMule: ${d.name}` })),
    ];
  }, [list, docType]);

  const saveRule = async () => {
    if (!editing) return;
    const [kind, ref] = editing.target.split(':');
    const payload = {
      docType,
      templateId: kind === 't' ? ref : null,
      defaultKey: kind === 'd' ? ref : null,
      grades: editing.grades && editing.grades.length ? editing.grades : null,
      terms: editing.terms && editing.terms.length ? editing.terms : null,
      priority: editing.priority ?? 100,
    };
    setBusy(true);
    try {
      if (editing.assignmentId) await updateTemplateAssignment(editing.assignmentId, payload);
      else await createTemplateAssignment(payload);
      setEditing(null);
      load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not save the rule', 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeRule = async (a: TemplateAssignment) => {
    if (!window.confirm(`Remove the rule "${a.name}"? Those grades go back to the next matching rule or the SchoolMule design.`)) return;
    try {
      await deleteTemplateAssignment(a.assignmentId);
      load();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not remove the rule', 'error');
    }
  };

  const cell = (grade: string, term: string) => coverage?.cells.find((c) => c.grade === grade && c.term === term);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          {(['progress_report', 'report_card'] as const).map((d) => (
            <button key={d} type="button" onClick={() => setDocType(d)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${docType === d ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {DOC_LABEL[d]}s
            </button>
          ))}
        </div>
        <Button onClick={() => setEditing({ target: targets[0]?.value ?? '', grades: [], terms: [], priority: 100 })} disabled={targets.length === 0} data-testid="add-rule">
          <PlusIcon className="h-4 w-4" /> Add a rule
        </Button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white" data-testid="coverage-matrix">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2.5">Grade</th>
              {coverage?.terms.map((t) => (
                <th key={t} className="px-4 py-2.5">
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(coverage?.grades ?? GRADES).map((g) => (
              <tr key={g} className="border-b border-slate-50 last:border-0">
                <td className="px-4 py-2 font-semibold text-slate-700">{g === 'JK' || g === 'SK' ? g : `Grade ${g}`}</td>
                {coverage?.terms.map((t) => {
                  const c = cell(g, t);
                  const tone = c?.source === 'assignment' ? 'bg-indigo-50 text-indigo-800' : c?.source === 'default' ? 'bg-slate-50 text-slate-700' : 'bg-amber-50 text-amber-800';
                  return (
                    <td key={t} className="px-2 py-1.5">
                      <span className={`block truncate rounded-md px-2 py-1 text-xs ${tone}`} title={c?.source === 'legacy' ? 'The original built-in layout' : c?.name}>
                        {c ? (c.source === 'legacy' ? 'Original layout' : c.name) : '—'}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">
        <span className="mr-3 inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-indigo-200" /> your rule</span>
        <span className="mr-3 inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-slate-200" /> SchoolMule design</span>
        <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-amber-200" /> original layout</span>
      </p>

      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">Rules</h2>
        {assignments.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-500">No rules yet — every grade prints with the SchoolMule design for it.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white" data-testid="rule-list">
            {assignments.map((a) => (
              <li key={a.assignmentId} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{a.name}</p>
                  <p className="text-xs text-slate-500">
                    {a.grades?.length ? a.grades.map((g) => (g === 'JK' || g === 'SK' ? g : `Gr ${g}`)).join(', ') : 'All grades'} · {a.terms?.length ? a.terms.join(', ') : 'Every term'} · priority {a.priority}
                  </p>
                </div>
                <button type="button" onClick={() => setEditing({ ...a, target: a.templateId ? `t:${a.templateId}` : `d:${a.defaultKey}` })} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100" data-testid="edit-rule">
                  Edit
                </button>
                <button type="button" onClick={() => removeRule(a)} className="rounded-lg p-1.5 text-rose-500 hover:bg-rose-50" title="Remove" data-testid="delete-rule">
                  <TrashIcon className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Modal isOpen={!!editing} onClose={() => setEditing(null)} title={editing?.assignmentId ? 'Edit rule' : 'Which template prints'} size="md" closeOnEscape>
        {editing && (
          <div className="space-y-4">
            <Field label="Print with" htmlFor="rule-target">
              <select id="rule-target" className={selectClass} value={editing.target} onChange={(e) => setEditing({ ...editing, target: e.target.value })} data-testid="rule-target">
                {targets.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="For these grades (none = all)">
              <div className="flex flex-wrap gap-1">
                {GRADES.map((g) => {
                  const on = (editing.grades ?? []).includes(g);
                  return (
                    <button key={g} type="button" onClick={() => setEditing({ ...editing, grades: on ? (editing.grades ?? []).filter((x) => x !== g) : [...(editing.grades ?? []), g] })} className={`min-w-[38px] rounded-lg border px-2 py-1 text-xs font-semibold ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600'}`} data-testid={`rule-grade-${g}`}>
                      {g}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="In these terms (none = every term)">
              <div className="flex flex-wrap gap-1">
                {(coverage?.terms ?? []).map((t) => {
                  const on = (editing.terms ?? []).includes(t);
                  return (
                    <button key={t} type="button" onClick={() => setEditing({ ...editing, terms: on ? (editing.terms ?? []).filter((x) => x !== t) : [...(editing.terms ?? []), t] })} className={`rounded-lg border px-2.5 py-1 text-xs font-semibold ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600'}`}>
                      {t}
                    </button>
                  );
                })}
              </div>
            </Field>
            <Field label="Priority" hint="When two rules match, the lower number wins.">
              <input type="number" className={inputClass} value={editing.priority ?? 100} onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) || 0 })} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setEditing(null)}>
                Cancel
              </Button>
              <Button onClick={saveRule} loading={busy} disabled={!editing.target} data-testid="save-rule">
                Save rule
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────── report fields ──

function FieldsTab() {
  const notify = useNotificationStore((s) => s.showNotification);
  const user = useUserStore((s) => s.user);
  const [docType, setDocType] = useState<DocType>('report_card');
  const [terms, setTerms] = useState<string[]>([]);
  const [term, setTerm] = useState('');
  const [grade, setGrade] = useState('1');
  const [data, setData] = useState<FieldValuesResponse | null>(null);
  const [saving, setSaving] = useState<Record<string, 'saving' | 'saved' | 'error'>>({});

  useEffect(() => {
    if (!user?.school) return;
    getTermsBySchool(user.school)
      .then((r) => {
        const names = [...new Set((r.data ?? []).map((t: { name: string }) => t.name))];
        setTerms(names);
        setTerm((cur) => cur || names[0] || 'Term 1');
      })
      .catch(() => setTerms(['Term 1', 'Term 2']));
  }, [user?.school]);

  useEffect(() => {
    if (!term) return;
    setData(null);
    getFieldValues(docType, term, grade)
      .then(setData)
      .catch((e) => notify(e instanceof Error ? e.message : 'Could not load the fields', 'error'));
  }, [docType, term, grade, notify]);

  const saveValue = async (studentId: string, key: string, value: string) => {
    const id = `${studentId}:${key}`;
    setSaving((s) => ({ ...s, [id]: 'saving' }));
    try {
      await saveFieldValues({ docType, term, studentId, values: { [key]: value === '' ? null : value } });
      setSaving((s) => ({ ...s, [id]: 'saved' }));
    } catch (e) {
      setSaving((s) => ({ ...s, [id]: 'error' }));
      notify(e instanceof Error ? e.message : 'Could not save', 'error');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-xs font-medium text-slate-600">
          Document
          <select className={`${selectClass} mt-1`} value={docType} onChange={(e) => setDocType(e.target.value as DocType)} data-testid="fields-doc">
            <option value="report_card">Report card</option>
            <option value="progress_report">Progress report</option>
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Term
          <select className={`${selectClass} mt-1`} value={term} onChange={(e) => setTerm(e.target.value)} data-testid="fields-term">
            {terms.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">
          Grade
          <select className={`${selectClass} mt-1`} value={grade} onChange={(e) => setGrade(e.target.value)} data-testid="fields-grade">
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g === 'JK' || g === 'SK' ? g : `Grade ${g}`}
              </option>
            ))}
          </select>
        </label>
        {data?.template && <p className="ml-auto text-xs text-slate-500">Prints with: <strong className="text-slate-700">{data.template.name}</strong></p>}
      </div>

      {!data ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : data.fields.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
          The template for this grade has no extra fields. Add them in the designer under <strong>Rules → Extra fields</strong>.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white" data-testid="fields-grid">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                <th className="px-4 py-2.5 font-semibold">Student</th>
                {data.fields.map((f) => (
                  <th key={f.key} className="min-w-[200px] px-3 py-2.5 font-semibold">
                    {f.label}
                    {f.required && <span className="text-rose-500"> *</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.students.map((s) => (
                <tr key={s.studentId} className="border-b border-slate-50 align-top last:border-0">
                  <td className="whitespace-nowrap px-4 py-2 font-medium text-slate-800">{s.name}</td>
                  {data.fields.map((f) => {
                    const id = `${s.studentId}:${f.key}`;
                    const state = saving[id];
                    const initial = s.values[f.key] ?? '';
                    const border = state === 'error' ? 'border-rose-300' : state === 'saved' ? 'border-emerald-300' : '';
                    return (
                      <td key={f.key} className="px-3 py-1.5">
                        {f.type === 'longtext' ? (
                          <textarea className={`${inputClass} ${border} min-h-[60px] text-xs`} defaultValue={initial} onBlur={(e) => e.target.value !== initial && saveValue(s.studentId, f.key, e.target.value)} />
                        ) : f.type === 'select' ? (
                          <select className={`${selectClass} ${border} text-xs`} defaultValue={initial} onChange={(e) => saveValue(s.studentId, f.key, e.target.value)}>
                            <option value="">—</option>
                            {(f.options ?? []).map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : f.type === 'checkbox' ? (
                          <input type="checkbox" defaultChecked={initial === 'Yes'} onChange={(e) => saveValue(s.studentId, f.key, e.target.checked ? 'Yes' : '')} className="mt-2 h-4 w-4" />
                        ) : (
                          <input type={f.type === 'date' ? 'date' : 'text'} className={`${inputClass} ${border} text-xs`} defaultValue={initial} onBlur={(e) => e.target.value !== initial && saveValue(s.studentId, f.key, e.target.value)} data-testid={`field-input-${f.key}`} />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
