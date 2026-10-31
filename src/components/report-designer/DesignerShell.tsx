'use client';

/** The full-screen designer: top bar, left rail, pages, inspector, status bar. */
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassMinusIcon,
  MagnifyingGlassPlusIcon,
  CloudArrowUpIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import Modal from '@/components/shared/modal';
import { Button } from '@/components/shared/modalKit';
import { useNotificationStore } from '@/store/useNotificationStore';
import { isApiError } from '@/services/apiClient';
import {
  discardReportTemplateDraft,
  fetchPreviewPdf,
  getPreviewData,
  getReportTemplate,
  getSampleData,
  getTemplateCoverage,
  listReportTemplateVersions,
  publishReportTemplate,
  renameReportTemplate,
  restoreReportTemplateVersion,
  saveReportTemplateDraft,
  searchPreviewStudents,
} from '@/services/reportTemplateService';
import type { PreviewStudent, ReportTemplateSummary, ReportTemplateVersion } from '@/services/types/reportTemplate';
import { SAMPLE_OPTIONS, sampleReportData, type SampleKey } from '@/reportkit/sample';
import { validateTemplate } from '@/reportkit/validate';
import { GRADES } from '@/reportkit/format';
import type { ReportData } from '@/reportkit/types';
import { useDesignerStore, type PreviewTarget } from './store';
import { duplicateBlock, duplicateElement, findElement, removeBlock, removeElement, updateElement } from './docOps';
import DesignerCanvas from './DesignerCanvas';
import Inspector from './Inspector';
import LeftRail from './LeftRail';
import { ConfirmDialog, type ConfirmRequest } from './ConfirmDialog';
import { inputCls } from './fields';

const AUTOSAVE_MS = 1200;

export default function DesignerShell({ templateId }: { templateId: string }) {
  const notify = useNotificationStore((s) => s.showNotification);
  const store = useDesignerStore;
  const doc = useDesignerStore((s) => s.doc);
  const editSeq = useDesignerStore((s) => s.editSeq);
  const saveState = useDesignerStore((s) => s.saveState);
  const zoom = useDesignerStore((s) => s.zoom);
  const setZoom = useDesignerStore((s) => s.setZoom);
  const preview = useDesignerStore((s) => s.preview);
  const previewData = useDesignerStore((s) => s.previewData);
  const warnings = useDesignerStore((s) => s.warnings);
  const pageCount = useDesignerStore((s) => s.pageCount);
  const past = useDesignerStore((s) => s.past.length);
  const future = useDesignerStore((s) => s.future.length);

  const [summary, setSummary] = useState<ReportTemplateSummary | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const revRef = useRef(0);
  const savedSeqRef = useRef(0);
  const [pdf, setPdf] = useState<{ url: string; pages: number | null } | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  pdfUrlRef.current = pdf?.url ?? null;
  useEffect(() => () => void (pdfUrlRef.current && URL.revokeObjectURL(pdfUrlRef.current)), []);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [warningsOpen, setWarningsOpen] = useState(false);

  // ── load ──
  useEffect(() => {
    let cancelled = false;
    getReportTemplate(templateId)
      .then((detail) => {
        if (cancelled) return;
        revRef.current = detail.draftRev;
        savedSeqRef.current = 0;
        setSummary(detail.template);
        setName(detail.template.name);
        store.getState().load(detail.draft);
        const start: SampleKey = detail.draft.docType === 'progress_report' ? 'SK' : '4';
        void choosePreview({ kind: 'sample', key: start }, detail.draft.docType);
      })
      .catch((e) => !cancelled && setLoadError(e instanceof Error ? e.message : 'Could not open the template'));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId]);

  // ── preview data ──
  const choosePreview = useCallback(
    async (target: PreviewTarget, docType = store.getState().doc?.docType ?? 'progress_report') => {
      let data: ReportData;
      try {
        data = target.kind === 'sample' ? await getSampleData(target.key, docType) : await getPreviewData(target.studentId, docType, target.term);
      } catch (e) {
        if (target.kind === 'student') {
          notify(e instanceof Error ? e.message : "Couldn't load that student's report", 'error');
          return;
        }
        data = sampleReportData(target.key, docType);
      }
      store.getState().setPreview(target, data);
    },
    [notify, store],
  );

  // ── autosave ──
  // Saves run one at a time, each with the latest rev; a response that arrives
  // after a reload (loadGen changed) is ignored. Resolves true when the draft
  // on the server now matches the editor.
  const inflightRef = useRef<Promise<boolean> | null>(null);
  const loadGenRef = useRef(0);
  const save = useCallback(async (): Promise<boolean> => {
    while (inflightRef.current) await inflightRef.current;
    const run = async (): Promise<boolean> => {
      const st = store.getState();
      if (!st.doc || st.saveState === 'conflict') return false;
      const seq = st.editSeq;
      if (seq === savedSeqRef.current) return true;
      if (!validateTemplate(st.doc).ok) {
        st.setSaveState('error');
        return false;
      }
      const gen = loadGenRef.current;
      st.setSaveState('saving');
      try {
        const res = await saveReportTemplateDraft(templateId, st.doc, revRef.current);
        if (gen !== loadGenRef.current) return false;
        revRef.current = res.draftRev;
        savedSeqRef.current = seq;
        const settled = store.getState().editSeq === seq;
        store.getState().setSaveState(settled ? 'saved' : 'dirty');
        return settled;
      } catch (e) {
        if (gen !== loadGenRef.current) return false;
        store.getState().setSaveState(isApiError(e) && e.status === 409 ? 'conflict' : 'error');
        return false;
      }
    };
    const p = run();
    inflightRef.current = p;
    try {
      return await p;
    } finally {
      if (inflightRef.current === p) inflightRef.current = null;
    }
  }, [store, templateId]);

  /** Save until the server has exactly what is on screen (edits may land mid-save). */
  const saveNow = useCallback(async (): Promise<boolean> => {
    for (let i = 0; i < 4; i++) {
      if (await save()) return true;
      const state = store.getState().saveState;
      if (state === 'conflict' || state === 'error') return false;
    }
    return false;
  }, [save, store]);

  useEffect(() => {
    if (editSeq === 0 || editSeq === savedSeqRef.current) return;
    const t = setTimeout(() => void save(), AUTOSAVE_MS);
    return () => clearTimeout(t);
  }, [editSeq, save]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      const s = store.getState().saveState;
      if (s === 'dirty' || s === 'saving') {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [store]);

  // ── keyboard ──
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return;
      const st = store.getState();
      if (!st.doc) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) st.redo();
        else st.undo();
        return;
      }
      if (mod && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        st.redo();
        return;
      }
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void saveNow();
        return;
      }
      if (mod && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        st.setZoom(st.zoom + 0.1);
        return;
      }
      if (mod && e.key === '-') {
        e.preventDefault();
        st.setZoom(st.zoom - 0.1);
        return;
      }
      const sel = st.selection;
      if (!sel) return;
      if (e.key === 'Escape') return st.select(null);
      if (mod && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (sel.kind === 'element') {
          const r = duplicateElement(st.doc, sel.id);
          st.commit(r.doc);
          if (r.newId) st.select({ kind: 'element', id: r.newId });
        } else if (sel.kind === 'block') {
          const r = duplicateBlock(st.doc, sel.id);
          st.commit(r.doc);
          if (r.newId) st.select({ kind: 'block', id: r.newId });
        }
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (sel.kind === 'element' && findElement(st.doc, sel.id)?.element.locked) return;
        if (sel.kind === 'element') st.commit(removeElement(st.doc, sel.id));
        else if (sel.kind === 'block') st.commit(removeBlock(st.doc, sel.id));
        st.select(null);
        return;
      }
      if (sel.kind === 'element' && e.key.startsWith('Arrow')) {
        const found = findElement(st.doc, sel.id);
        if (!found || found.element.locked) return;
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        st.commit(updateElement(st.doc, sel.id, { x: found.element.x + dx, y: found.element.y + dy }), `nudge-${sel.id}`);
      }
      if (sel.kind === 'element' && e.key === 'Enter') {
        const found = findElement(st.doc, sel.id);
        if (found?.element.type === 'text' && !found.element.locked) {
          e.preventDefault();
          st.setEditingText(sel.id);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saveNow, store]);

  // ── actions ──
  const rename = async () => {
    const next = name.trim();
    if (!summary || !next || next === summary.name) return setName(summary?.name ?? '');
    try {
      const updated = await renameReportTemplate(templateId, next);
      setSummary((s) => (s ? { ...s, name: updated.name ?? next } : s));
      notify('Renamed', 'success');
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not rename', 'error');
      setName(summary.name);
    }
  };

  const checkPdf = async () => {
    const st = store.getState();
    if (!st.doc) return;
    setPdfBusy(true);
    try {
      if (!(await saveNow())) {
        notify('Save your changes first (see the status under the name).', 'error');
        return;
      }
      const target = st.preview;
      const res = await fetchPreviewPdf({
        doc: st.doc,
        docType: st.doc.docType,
        ...(target.kind === 'student' ? { studentId: target.studentId, term: target.term } : { sample: target.key }),
      });
      setPdf({ url: res.url, pages: res.pageCount });
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not make the PDF', 'error');
    } finally {
      setPdfBusy(false);
    }
  };

  const reloadFromServer = async () => {
    loadGenRef.current += 1;
    const detail = await getReportTemplate(templateId);
    revRef.current = detail.draftRev;
    savedSeqRef.current = 0;
    setSummary(detail.template);
    store.getState().load(detail.draft);
  };

  if (loadError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-6 text-center">
        <p className="text-sm text-slate-600">{loadError}</p>
        <Link href="/admin-panel/report-templates" className="text-sm font-semibold text-indigo-600">
          Back to report templates
        </Link>
      </div>
    );
  }

  const previewLabel =
    preview.kind === 'sample'
      ? SAMPLE_OPTIONS.find((o) => o.key === preview.key)?.label ?? 'Sample'
      : `${preview.name} · ${preview.grade === 'JK' || preview.grade === 'SK' ? preview.grade : `Grade ${preview.grade}`}`;

  return (
    <>
      {/* Desktop only */}
      <div className="flex h-screen flex-col items-center justify-center gap-3 bg-slate-50 p-8 text-center lg:hidden">
        <ComputerDesktopIcon className="h-10 w-10 text-slate-400" />
        <h1 className="text-lg font-semibold text-slate-800">The report designer needs a bigger screen</h1>
        <p className="max-w-sm text-sm text-slate-500">Open SchoolMule on a computer to design report cards and progress reports.</p>
        <Link href="/admin-panel/report-templates" className="text-sm font-semibold text-indigo-600">
          Back to report templates
        </Link>
      </div>

      <div className="fixed inset-0 z-[60] hidden flex-col bg-slate-100 lg:flex" data-testid="designer">
        {/* top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3">
          <Link href="/admin-panel/report-templates" className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-slate-600 hover:bg-slate-100" title="Back to report templates">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div className="min-w-0">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={rename}
              onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
              className="w-64 truncate rounded-md border border-transparent bg-transparent px-1.5 py-0.5 text-sm font-semibold text-slate-900 hover:border-slate-200 focus:border-indigo-300 focus:outline-none"
              aria-label="Template name"
              data-testid="template-name"
            />
            <div className="flex items-center gap-1.5 px-1.5 text-[11px] text-slate-500">
              <span>{doc?.docType === 'report_card' ? 'Report card' : 'Progress report'}</span>
              <span>·</span>
              {summary?.published ? <span>Published v{summary.published.versionNo}</span> : <span>Never published</span>}
              <span>·</span>
              <SaveChip state={saveState} onRetry={() => void saveNow()} onReload={reloadFromServer} />
            </div>
          </div>

          <div className="ml-2 flex items-center gap-0.5 border-l border-slate-200 pl-3">
            <IconButton title="Undo (⌘Z)" disabled={past === 0} onClick={() => store.getState().undo()} testId="undo">
              <ArrowUturnLeftIcon className="h-4 w-4" />
            </IconButton>
            <IconButton title="Redo (⇧⌘Z)" disabled={future === 0} onClick={() => store.getState().redo()} testId="redo">
              <ArrowUturnRightIcon className="h-4 w-4" />
            </IconButton>
          </div>
          <div className="flex items-center gap-0.5 border-l border-slate-200 pl-3">
            <IconButton title="Zoom out" onClick={() => setZoom(zoom - 0.1)}>
              <MagnifyingGlassMinusIcon className="h-4 w-4" />
            </IconButton>
            <button type="button" className="w-12 rounded px-1 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setZoom(1)} title="Reset zoom">
              {Math.round(zoom * 100)}%
            </button>
            <IconButton title="Zoom in" onClick={() => setZoom(zoom + 0.1)}>
              <MagnifyingGlassPlusIcon className="h-4 w-4" />
            </IconButton>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-2.5 pr-1">
              <span className="text-[11px] font-medium text-slate-500">Preview as</span>
              <select
                className="max-w-[210px] rounded-md border-0 bg-white py-0.5 pl-1.5 pr-6 text-xs font-semibold text-slate-800 shadow-sm focus:ring-2 focus:ring-indigo-200"
                value={preview.kind === 'sample' ? preview.key : '__student'}
                onChange={(e) => {
                  if (e.target.value === '__pick') return setPickerOpen(true);
                  if (e.target.value !== '__student') void choosePreview({ kind: 'sample', key: e.target.value as SampleKey });
                }}
                data-testid="preview-picker"
              >
                {SAMPLE_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
                {preview.kind === 'student' && <option value="__student">{previewLabel}</option>}
                <option value="__pick">A real student…</option>
              </select>
            </div>
            <Button variant="secondary" onClick={checkPdf} loading={pdfBusy} className="!py-1.5 !text-xs" data-testid="check-pdf">
              <DocumentMagnifyingGlassIcon className="h-4 w-4" /> Check PDF
            </Button>
            <Button variant="secondary" onClick={() => setVersionsOpen(true)} className="!py-1.5 !text-xs" data-testid="open-versions">
              <ClockIcon className="h-4 w-4" /> Versions
            </Button>
            <button
              type="button"
              onClick={async () => {
                if (await saveNow()) setPublishOpen(true);
                else notify("Your latest changes aren't saved, so they can't be published yet.", 'error');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700"
              data-testid="open-publish"
            >
              <CloudArrowUpIcon className="h-4 w-4" /> Publish
            </button>
          </div>
        </header>

        {/* body */}
        <div className="flex min-h-0 flex-1">
          <aside className="w-[272px] shrink-0 border-r border-slate-200 bg-white">{doc && <LeftRail />}</aside>
          <main
            className="relative min-w-0 flex-1 overflow-auto px-8 py-8"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) store.getState().select(null);
            }}
            data-testid="designer-scroll"
          >
            {doc ? <DesignerCanvas data={previewData} /> : <div className="p-10 text-center text-sm text-slate-500">Opening…</div>}
          </main>
          <aside className="w-[316px] shrink-0 border-l border-slate-200 bg-white">{doc && <Inspector />}</aside>
        </div>

        {/* status bar */}
        <footer className="flex h-8 shrink-0 items-center gap-3 border-t border-slate-200 bg-white px-4 text-[11px] text-slate-500">
          <span data-testid="page-count">
            {pageCount} page{pageCount === 1 ? '' : 's'} · {doc?.page.size === 'a4' ? 'A4' : 'Letter'}
          </span>
          <span>·</span>
          <span>Previewing {previewLabel}</span>
          <button
            type="button"
            onClick={() => setWarningsOpen((o) => !o)}
            className={`ml-auto inline-flex items-center gap-1 rounded px-2 py-0.5 font-semibold ${warnings.length ? 'bg-amber-50 text-amber-700' : 'text-emerald-700'}`}
            data-testid="warnings-toggle"
          >
            {warnings.length ? <ExclamationTriangleIcon className="h-3.5 w-3.5" /> : <CheckCircleIcon className="h-3.5 w-3.5" />}
            {warnings.length ? `${warnings.length} thing${warnings.length === 1 ? '' : 's'} to check` : 'Everything fits'}
          </button>
        </footer>
        {warningsOpen && warnings.length > 0 && (
          <div className="absolute bottom-9 right-4 z-50 w-96 rounded-xl border border-amber-200 bg-white p-3 shadow-xl" data-testid="warnings-panel">
            <div className="mb-2 text-xs font-semibold text-amber-800">For {previewLabel}</div>
            <ul className="max-h-60 space-y-1.5 overflow-auto">
              {warnings.map((w, i) => (
                <li key={i}>
                  <button
                    type="button"
                    className="w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-700 hover:bg-amber-50"
                    onClick={() => {
                      if (w.blockId) store.getState().select({ kind: 'block', id: w.blockId });
                      else if (w.elementId) store.getState().select({ kind: 'element', id: w.elementId });
                    }}
                  >
                    {w.message}
                    {w.page ? <span className="text-slate-400"> · page {w.page}</span> : null}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <StudentPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onPick={(s) => {
          setPickerOpen(false);
          void choosePreview({ kind: 'student', studentId: s.studentId, name: s.name, grade: s.grade });
        }}
      />

      <Modal isOpen={!!pdf} onClose={() => (pdf && URL.revokeObjectURL(pdf.url), setPdf(null))} title="The PDF as it will print" size="4xl" closeOnEscape maxHeightClass="max-h-[92vh]">
        {pdf && (
          <div className="space-y-2">
            <p className="text-xs text-slate-500">
              Made by the server from your draft for {previewLabel}.{' '}
              {pdf.pages !== null && (pdf.pages === pageCount ? `${pdf.pages} pages — same as the editor.` : `${pdf.pages} pages here vs ${pageCount} in the editor.`)}
            </p>
            <iframe src={pdf.url} title="PDF preview" className="h-[75vh] w-full rounded-lg border border-slate-200" data-testid="pdf-frame" />
          </div>
        )}
      </Modal>

      <PublishDialog
        open={publishOpen}
        onClose={() => setPublishOpen(false)}
        templateId={templateId}
        onPublished={(versionNo, publishedAt, versionId) => setSummary((s) => (s ? { ...s, published: { versionNo, publishedAt, versionId }, hasUnpublishedChanges: false } : s))}
      />
      <VersionsDialog
        open={versionsOpen}
        onClose={() => setVersionsOpen(false)}
        templateId={templateId}
        hasPublished={!!summary?.published}
        onRestored={async () => {
          await reloadFromServer();
          setVersionsOpen(false);
        }}
      />
    </>
  );
}

function IconButton({ children, title, onClick, disabled, testId }: { children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean; testId?: string }) {
  return (
    <button type="button" title={title} aria-label={title} disabled={disabled} onClick={onClick} data-testid={testId} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30">
      {children}
    </button>
  );
}

function SaveChip({ state, onRetry, onReload }: { state: string; onRetry: () => void; onReload: () => void }) {
  if (state === 'saving') return <span data-testid="save-state">Saving…</span>;
  if (state === 'dirty') return <span data-testid="save-state">Unsaved changes</span>;
  if (state === 'error')
    return (
      <button type="button" className="font-semibold text-rose-600" onClick={onRetry} data-testid="save-state">
        Not saved — retry
      </button>
    );
  if (state === 'conflict')
    return (
      <button type="button" className="font-semibold text-rose-600" onClick={onReload} data-testid="save-state" title="Someone else changed this template. Reload to see their version (your last edits here are lost).">
        Changed elsewhere — reload
      </button>
    );
  return (
    <span className="text-emerald-700" data-testid="save-state">
      Draft saved
    </span>
  );
}

function StudentPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (s: PreviewStudent) => void }) {
  const [grade, setGrade] = useState('SK');
  const [q, setQ] = useState('');
  const [students, setStudents] = useState<PreviewStudent[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      setLoading(true);
      searchPreviewStudents(grade, q.trim() || undefined)
        .then((r) => setStudents(r.students))
        .catch(() => setStudents([]))
        .finally(() => setLoading(false));
    }, 200);
    return () => clearTimeout(t);
  }, [open, grade, q]);
  return (
    <Modal isOpen={open} onClose={onClose} title="Preview a real student" size="md" closeOnEscape>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1">
          {GRADES.map((g) => (
            <button key={g} type="button" onClick={() => setGrade(g)} className={`min-w-[36px] rounded-lg border px-2 py-1 text-xs font-semibold ${grade === g ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600 hover:border-indigo-300'}`} data-testid={`picker-grade-${g}`}>
              {g}
            </button>
          ))}
        </div>
        <input className={inputCls} placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-80 overflow-auto rounded-lg border border-slate-100">
          {loading && <p className="p-3 text-xs text-slate-500">Searching…</p>}
          {!loading && students.length === 0 && <p className="p-3 text-xs text-slate-500">No students in this grade.</p>}
          {students.map((s) => (
            <button key={s.studentId} type="button" onClick={() => onPick(s)} className="flex w-full items-center justify-between border-b border-slate-50 px-3 py-2 text-left text-sm hover:bg-indigo-50" data-testid="picker-student">
              <span className="font-medium text-slate-800">{s.name}</span>
              <span className="text-xs text-slate-400">{s.grade}</span>
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500">Only you see this preview. Nothing is generated or sent.</p>
      </div>
    </Modal>
  );
}

function PublishDialog({ open, onClose, templateId, onPublished }: { open: boolean; onClose: () => void; templateId: string; onPublished: (versionNo: number, publishedAt: string, versionId: string) => void }) {
  const doc = useDesignerStore((s) => s.doc);
  const notify = useNotificationStore((s) => s.showNotification);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [engineOff, setEngineOff] = useState(false);
  const check = doc ? validateTemplate(doc) : { ok: false, errors: [] };
  useEffect(() => {
    if (!open || !doc) return;
    getTemplateCoverage(doc.docType)
      .then((c) => setEngineOff(c.engineMode !== undefined && c.engineMode !== 'new'))
      .catch(() => setEngineOff(false));
  }, [open, doc]);
  const publish = async () => {
    setBusy(true);
    try {
      const res = await publishReportTemplate(templateId, note.trim() || undefined);
      onPublished(res.versionNo, res.publishedAt, res.versionId);
      notify(`Published version ${res.versionNo}`, 'success');
      setNote('');
      onClose();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not publish', 'error');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal isOpen={open} onClose={onClose} title="Publish this template" size="md" closeOnEscape>
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Reports generated from now on use this version wherever this template is assigned. Reports already generated don&apos;t change.</p>
        {engineOff && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            Reports still print with the original layouts for now. Your published template takes over as soon as SchoolMule switches the new designs on.
          </p>
        )}
        {!check.ok && (
          <ul className="space-y-1 rounded-lg border border-rose-100 bg-rose-50 p-3 text-xs text-rose-800">
            {check.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">What changed? (optional)</span>
          <input className={inputCls} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. New logo, French moved beside Arabic" data-testid="publish-note" />
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={publish} loading={busy} disabled={!check.ok} data-testid="confirm-publish">
            Publish
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function VersionsDialog({ open, onClose, templateId, hasPublished, onRestored }: { open: boolean; onClose: () => void; templateId: string; hasPublished: boolean; onRestored: () => void }) {
  const notify = useNotificationStore((s) => s.showNotification);
  const [versions, setVersions] = useState<ReportTemplateVersion[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  useEffect(() => {
    if (!open) return;
    setVersions(null);
    listReportTemplateVersions(templateId)
      .then((r) => setVersions(r.versions))
      .catch(() => setVersions([]));
  }, [open, templateId]);
  const [confirm, setConfirm] = useState<ConfirmRequest | null>(null);
  const askRestore = (v: ReportTemplateVersion) =>
    setConfirm({
      title: `Restore version ${v.versionNo}`,
      message: `Replace the draft with version ${v.versionNo}?`,
      consequences: ['Your unpublished changes are replaced.', 'What is published stays the same until you publish again.'],
      confirmLabel: 'Restore to draft',
      tone: 'warning',
      onConfirm: () => restore(v),
    });
  const restore = async (v: ReportTemplateVersion) => {
    setBusy(v.versionId);
    try {
      await restoreReportTemplateVersion(templateId, v.versionId);
      notify(`Draft restored from version ${v.versionNo}`, 'success');
      onRestored();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not restore', 'error');
    } finally {
      setBusy(null);
    }
  };
  const askDiscard = () =>
    setConfirm({
      title: 'Discard unpublished changes',
      message: 'Throw away the unpublished changes and go back to the published version?',
      confirmLabel: 'Discard changes',
      onConfirm: () => discard(),
    });
  const discard = async () => {
    setBusy('discard');
    try {
      await discardReportTemplateDraft(templateId);
      notify('Draft reset to the published version', 'success');
      onRestored();
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not reset the draft', 'error');
    } finally {
      setBusy(null);
    }
  };
  return (
    <Modal isOpen={open} onClose={onClose} title="Versions" size="md" closeOnEscape>
      <div className="space-y-3" data-testid="versions-dialog">
        {versions === null && <p className="text-sm text-slate-500">Loading…</p>}
        {versions?.length === 0 && <p className="text-sm text-slate-500">Nothing published yet.</p>}
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-100">
          {versions?.map((v) => (
            <li key={v.versionId} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-slate-800">Version {v.versionNo}</div>
                <div className="truncate text-xs text-slate-500">
                  {new Date(v.publishedAt).toLocaleString()}
                  {v.publishedBy ? ` · ${v.publishedBy}` : ''}
                  {v.note ? ` · ${v.note}` : ''}
                </div>
              </div>
              <Button variant="secondary" className="!py-1 !text-xs" loading={busy === v.versionId} onClick={() => askRestore(v)}>
                Restore to draft
              </Button>
            </li>
          ))}
        </ul>
        <ConfirmDialog request={confirm} onClose={() => setConfirm(null)} />
        {hasPublished && (
          <button type="button" onClick={askDiscard} className="text-xs font-semibold text-rose-600" disabled={busy === 'discard'}>
            Discard unpublished changes
          </button>
        )}
      </div>
    </Modal>
  );
}
