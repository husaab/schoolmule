'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import SubmissionFiltersComponent from '@/components/registration/Submissions/SubmissionFilters';
import SortControls from '@/components/registration/Submissions/SortControls';
import FieldValueFilters from '@/components/registration/Submissions/FieldValueFilters';
import FilterSummaryChip from '@/components/registration/Submissions/FilterSummaryChip';
import ExportButton from '@/components/registration/Submissions/ExportButton';
import FieldMappingEditor from '@/components/registration/Import/FieldMappingEditor';
import ImportPreviewModal from '@/components/registration/Import/ImportPreviewModal';
import ImportedBadge from '@/components/registration/Import/ImportedBadge';
import UndoImportModal from '@/components/registration/Import/UndoImportModal';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import * as registrationService from '@/services/registrationService';
import * as statusService from '@/services/registrationStatusService';
import { statusBadgeClass } from '@/lib/statusColors';
import type {
  RegistrationForm,
  FormField,
  FormSubmission,
  SubmissionFilters as FiltersType,
  SubmissionPagination,
  SortSpec,
  FieldFilter,
} from '@/services/types/registration';
import type { ImportScope } from '@/services/types/registrationImport';
import type { SubmissionStatusDef } from '@/services/types/registrationStatus';
import {
  ArrowLeftIcon,
  EyeIcon,
  TrashIcon,
  PencilIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxStackIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

// ─── URL (de)serialization for sort + field filters ──────────────────
// sort=fieldId:dir,fieldId:dir   ·   fieldFilters=<JSON array of { fieldId, values }>
const parseSortsFromUrl = (sortRaw: string | null, legacyFieldId: string | null, legacyDir: string | null): SortSpec[] => {
  if (sortRaw) {
    return sortRaw
      .split(',')
      .map((pair) => {
        const [fieldId, dir] = pair.split(':');
        return { fieldId: (fieldId || '').trim(), dir: dir === 'desc' ? 'desc' : 'asc' } as SortSpec;
      })
      .filter((s) => s.fieldId);
  }
  // Back-compat with the old single-sort URL params.
  if (legacyFieldId) return [{ fieldId: legacyFieldId, dir: legacyDir === 'desc' ? 'desc' : 'asc' }];
  return [];
};

const parseFieldFiltersFromUrl = (raw: string | null): FieldFilter[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((f) => f && typeof f.fieldId === 'string' && Array.isArray(f.values))
      .map((f) => ({ fieldId: f.fieldId, values: f.values.map((v: unknown) => String(v)) }));
  } catch {
    return [];
  }
};

export default function FormSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const showNotification = useNotificationStore((s) => s.showNotification);
  const slug = params.slug as string;

  // Form resolution
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [formLoading, setFormLoading] = useState(true);

  // The school's status vocabulary, shared by every form. Drives the row
  // dropdown, the filter, and each badge's colour.
  const [statuses, setStatuses] = useState<SubmissionStatusDef[]>([]);

  // Submissions data
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [pagination, setPagination] = useState<SubmissionPagination>({ total: 0, page: 1, limit: 25 });

  // Initialize filters from URL params (so refresh / shareable links retain sort + filters)
  const [filters, setFilters] = useState<FiltersType>(() => ({
    page: 1,
    limit: 25,
    sorts: parseSortsFromUrl(
      searchParams.get('sort'),
      searchParams.get('sortFieldId'),
      searchParams.get('sortDir'),
    ),
    fieldFilters: parseFieldFiltersFromUrl(searchParams.get('fieldFilters')),
  }));
  const [loading, setLoading] = useState(false);

  // Map fieldId → its sort level (1-based) + direction, for table header indicators.
  const sortByField = useMemo(() => {
    const m = new Map<string, { level: number; dir: 'asc' | 'desc' }>();
    (filters.sorts || []).forEach((s, i) => m.set(s.fieldId, { level: i + 1, dir: s.dir }));
    return m;
  }, [filters.sorts]);

  // Whether to show per-column sort levels (only meaningful with 2+ sorts).
  const showSortLevels = (filters.sorts?.length || 0) > 1;

  // Build the column list shown in the table: first 3 fields by default, plus any
  // field referenced by an active sort or filter so users always see those columns.
  const displayedFields = useMemo(() => {
    const baseColumns = fields.slice(0, 3);
    const extraIds = new Set<string>();
    (filters.sorts || []).forEach((s) => { if (s.fieldId !== 'submittedAt') extraIds.add(s.fieldId); });
    (filters.fieldFilters || []).forEach((f) => extraIds.add(f.fieldId));
    const extras = fields.filter(
      (f) => extraIds.has(f.fieldId) && !baseColumns.some((b) => b.fieldId === f.fieldId)
    );
    return [...baseColumns, ...extras];
  }, [fields, filters.sorts, filters.fieldFilters]);

  // Sync filters to URL whenever sort/field filters change (preserves them across navigation)
  useEffect(() => {
    const sp = new URLSearchParams();
    if (filters.sorts && filters.sorts.length > 0) {
      sp.set('sort', filters.sorts.map((s) => `${s.fieldId}:${s.dir}`).join(','));
    }
    const activeFilters = (filters.fieldFilters || []).filter((f) => f.values.length > 0);
    if (activeFilters.length > 0) {
      sp.set('fieldFilters', JSON.stringify(activeFilters));
    }
    const qs = sp.toString();
    const newUrl = qs ? `?${qs}` : '';
    if (window.location.search !== newUrl) {
      window.history.replaceState(null, '', `${window.location.pathname}${newUrl}`);
    }
  }, [filters.sorts, filters.fieldFilters]);

  // ─── Import ────────────────────────────────────────────────────────
  // Row selection drives the "bulk" entry point; the batch entry point sends
  // the current filters to the server instead of a list of ids.
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [importScope, setImportScope] = useState<ImportScope | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [mappingOpen, setMappingOpen] = useState(false);
  const [undoSubmissionId, setUndoSubmissionId] = useState<string | null>(null);

  // Detail modal
  const [detailSubmission, setDetailSubmission] = useState<FormSubmission | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Answer editing
  const [isEditing, setIsEditing] = useState(false);
  const [editAnswers, setEditAnswers] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const openDetail = (sub: FormSubmission) => {
    setDetailSubmission(sub);
    setIsEditing(false);
    setDetailOpen(true);
  };

  const startEditing = () => {
    if (!detailSubmission) return;
    setEditAnswers({ ...detailSubmission.answers });
    setIsEditing(true);
  };

  // Open the detail modal directly in edit mode (from the Actions column).
  const openDetailEditing = (sub: FormSubmission) => {
    setDetailSubmission(sub);
    setEditAnswers({ ...sub.answers });
    setIsEditing(true);
    setDetailOpen(true);
  };

  const handleSaveAnswers = async () => {
    if (!detailSubmission) return;
    setSaving(true);
    try {
      const res = await registrationService.updateSubmissionAnswers(
        detailSubmission.submissionId,
        editAnswers
      );
      setDetailSubmission(res.data);
      setIsEditing(false);
      fetchSubmissions();
      showNotification('Submission updated', 'success');
    } catch (err) {
      showNotification((err as Error).message || 'Error updating submission', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Resolve slug → form
  useEffect(() => {
    (async () => {
      try {
        const res = await registrationService.getForms();
        const match = res.data.find((f) => f.slug === slug);
        if (!match) {
          showNotification('Form not found', 'error');
          router.push('/admin-panel/forms/submissions');
          return;
        }
        setForm(match);
      } catch {
        showNotification('Error loading form', 'error');
        router.push('/admin-panel/forms/submissions');
      } finally {
        setFormLoading(false);
      }
    })();
  }, [slug, router, showNotification]);

  const loadStatuses = useCallback(async () => {
    try {
      const res = await statusService.getStatuses();
      setStatuses(res.data);
    } catch {
      // The table still works without labels — it falls back to the raw key —
      // so this shouldn't interrupt the page with an error toast.
    }
  }, []);

  useEffect(() => { loadStatuses(); }, [loadStatuses]);

  // Look up a status by the key stored on a submission. Falls back to showing
  // the raw key so a submission is never rendered blank.
  const statusFor = useCallback(
    (key: string) => statuses.find((s) => s.key === key),
    [statuses],
  );

  // Fetch submissions when form or filters change
  const fetchSubmissions = useCallback(async () => {
    if (!form) return;
    setLoading(true);
    try {
      const [subsRes, formRes] = await Promise.all([
        registrationService.getSubmissions(form.formId, filters),
        registrationService.getForm(form.formId),
      ]);
      setSubmissions(subsRes.data);
      setPagination(subsRes.pagination);
      setFields(formRes.data.fields);
    } catch {
      showNotification('Error loading submissions', 'error');
    } finally {
      setLoading(false);
    }
  }, [form, filters, showNotification]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  // Selecting rows only makes sense against the rows on screen, so clear the
  // selection whenever the underlying list changes.
  useEffect(() => {
    setSelectedIds(new Set());
  }, [filters.page, filters.limit, filters.status, filters.importState, filters.dateFrom, filters.dateTo]);

  const toggleSelected = (submissionId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(submissionId)) next.delete(submissionId);
      else next.add(submissionId);
      return next;
    });
  };

  const allOnPageSelected = submissions.length > 0 && submissions.every((s) => selectedIds.has(s.submissionId));

  const toggleSelectAllOnPage = () => {
    setSelectedIds((prev) => {
      if (allOnPageSelected) {
        const next = new Set(prev);
        submissions.forEach((s) => next.delete(s.submissionId));
        return next;
      }
      return new Set([...prev, ...submissions.map((s) => s.submissionId)]);
    });
  };

  // Bulk: exactly the ticked rows.
  const openImportSelected = () => {
    setImportScope({ mode: 'selected', submissionIds: [...selectedIds] });
    setImportOpen(true);
  };

  // Batch: everything the current filters match, resolved server-side using the
  // same query builder the list itself uses.
  const openImportFiltered = () => {
    setImportScope({
      mode: 'filtered',
      status: filters.status,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      fieldFilters: filters.fieldFilters,
      importState: filters.importState,
      sorts: filters.sorts,
    });
    setImportOpen(true);
  };

  const handleStatusChange = async (submissionId: string, status: string) => {
    try {
      await registrationService.updateSubmissionStatus(submissionId, status);
      fetchSubmissions();
    } catch {
      showNotification('Error updating status', 'error');
    }
  };

  const handleDelete = async (submissionId: string) => {
    // Deleting a submission that was imported destroys the original answers and
    // nulls the student's "imported from" link, so name the consequence rather
    // than showing the same generic prompt used for an untouched submission.
    const sub = submissions.find((s) => s.submissionId === submissionId);
    const message = sub?.importedStudentId
      ? `This submission was imported as ${sub.importedStudentName || 'a student'}. `
        + 'Deleting it keeps the student but permanently removes these answers and the link between them.\n\n'
        + 'Delete anyway?'
      : 'Are you sure you want to delete this submission?';
    if (!confirm(message)) return;
    try {
      await registrationService.deleteSubmission(submissionId);
      setDetailOpen(false);
      setDetailSubmission(null);
      fetchSubmissions();
      showNotification('Submission deleted', 'success');
    } catch {
      showNotification('Error deleting submission', 'error');
    }
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Renders an editable input for a field while in edit mode. Mirrors the
  // field-type branching used in PublicForm/FormField.tsx.
  const renderEditField = (field: FormField) => {
    const value = editAnswers[field.fieldId] ?? '';
    const onChange = (v: string) =>
      setEditAnswers((prev) => ({ ...prev, [field.fieldId]: v }));
    const inputClass =
      'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors';

    if (field.fieldType === 'textarea') {
      return (
        <textarea
          rows={3}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} resize-y`}
        />
      );
    }

    if (field.fieldType === 'select' || field.fieldType === 'radio') {
      return (
        <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          <option value="">— No answer —</option>
          {field.options?.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    const inputType =
      field.fieldType === 'date' ? 'date'
      : field.fieldType === 'email' || /email/i.test(field.label) ? 'email'
      : field.fieldType === 'phone' ? 'tel'
      : 'text';

    return (
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    );
  };

  // Loading state while resolving slug
  if (formLoading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="p-6 lg:p-8 max-w-6xl mx-auto">
            <div className="text-center py-20 text-slate-400">
              <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Loading...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!form) return null;

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Back link */}
          <Link
            href="/admin-panel/forms/submissions"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to submission forms
          </Link>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">{form.title}</h1>
              <p className="text-slate-500 mt-1">{pagination.total} submission{pagination.total !== 1 ? 's' : ''}</p>
              <div className="mt-2">
                <FilterSummaryChip
                  fieldFilters={filters.fieldFilters || []}
                  fields={fields}
                  total={pagination.total}
                  onClear={() => setFilters({ ...filters, fieldFilters: [], page: 1 })}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/admin-panel/forms/statuses"
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 border border-slate-200 rounded-lg transition-colors"
                title="Add or rename submission statuses"
              >
                <TagIcon className="w-4 h-4" />
                Statuses
              </Link>
              <button
                onClick={() => setMappingOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
                title="Choose which form questions map to which student fields"
              >
                <Cog6ToothIcon className="w-4 h-4" />
                Import setup
              </button>
              <button
                onClick={openImportFiltered}
                disabled={pagination.total === 0}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                title="Import every submission matching the current filters"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Import all {pagination.total > 0 ? `(${pagination.total})` : ''}
              </button>
              <ExportButton formId={form.formId} filters={filters} />
            </div>
          </div>

          {/* Filters + Sort */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-col gap-4">
            <SubmissionFiltersComponent filters={filters} onChange={setFilters} statuses={statuses} />

            <div className="flex flex-col lg:flex-row lg:items-start gap-6 border-t border-slate-100 pt-4">
              <div className="lg:w-1/2">
                <SortControls
                  fields={fields}
                  sorts={filters.sorts || []}
                  onChange={(sorts) => setFilters({ ...filters, sorts, page: 1 })}
                />
              </div>
              <div className="lg:w-1/2 lg:border-l lg:border-slate-100 lg:pl-6">
                <FieldValueFilters
                  fields={fields}
                  fieldFilters={filters.fieldFilters || []}
                  onChange={(fieldFilters) => setFilters({ ...filters, fieldFilters, page: 1 })}
                />
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-12 text-slate-400">
              <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-sm">Loading submissions...</p>
            </div>
          )}

          {/* Empty */}
          {!loading && submissions.length === 0 && (
            <div className="text-center py-16">
              <InboxStackIcon className="w-14 h-14 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No submissions found</h3>
              <p className="text-sm text-slate-500">
                {filters.status || filters.dateFrom || filters.dateTo ||
                 (filters.importState && filters.importState !== 'all') ||
                 (filters.fieldFilters?.some((f) => f.values.length > 0))
                  ? 'Try adjusting your filters.'
                  : 'Submissions will appear here once parents fill out this form.'}
              </p>
            </div>
          )}

          {/* Bulk import bar — only while rows are selected */}
          {selectedIds.size > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-4 py-3 bg-cyan-50 border border-cyan-200 rounded-xl">
              <p className="text-sm text-cyan-900">
                <span className="font-semibold">{selectedIds.size}</span>{' '}
                submission{selectedIds.size === 1 ? '' : 's'} selected
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedIds(new Set())}
                  className="text-sm text-cyan-700 hover:text-cyan-900 font-medium transition-colors cursor-pointer"
                >
                  Clear
                </button>
                <button
                  onClick={openImportSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors cursor-pointer"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Import {selectedIds.size} selected
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          {!loading && submissions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="w-10 px-4 py-3.5">
                        <input
                          type="checkbox"
                          checked={allOnPageSelected}
                          onChange={toggleSelectAllOnPage}
                          title="Select all on this page"
                          className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                        />
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Imported</th>
                      {displayedFields.map((f) => {
                        const sortInfo = sortByField.get(f.fieldId);
                        const isSorted = !!sortInfo;
                        return (
                          <th
                            key={f.fieldId}
                            className={`text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wider truncate max-w-[200px] ${isSorted ? 'text-cyan-700 bg-cyan-50/40' : 'text-slate-500'}`}
                          >
                            <span className="inline-flex items-center gap-1.5">
                              {f.label}
                              {sortInfo && (
                                <span className="inline-flex items-center gap-0.5">
                                  {sortInfo.dir === 'desc'
                                    ? <ArrowDownIcon className="w-3 h-3" />
                                    : <ArrowUpIcon className="w-3 h-3" />}
                                  {showSortLevels && <span className="text-[10px]">{sortInfo.level}</span>}
                                </span>
                              )}
                            </span>
                          </th>
                        );
                      })}
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr
                        key={sub.submissionId}
                        onClick={() => openDetail(sub)}
                        className={`border-b border-slate-50 hover:bg-cyan-50/30 cursor-pointer transition-colors ${
                          selectedIds.has(sub.submissionId) ? 'bg-cyan-50/50' : ''
                        }`}
                      >
                        <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(sub.submissionId)}
                            onChange={() => toggleSelected(sub.submissionId)}
                            className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                          {new Date(sub.submittedAt).toLocaleDateString('en-CA')}
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={sub.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => { e.stopPropagation(); handleStatusChange(sub.submissionId, e.target.value); }}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusBadgeClass(statusFor(sub.status)?.color)}`}
                          >
                            {/* A submission can hold a status an admin has since
                                deleted from the list; keep it selectable rather
                                than silently showing the wrong one. */}
                            {!statusFor(sub.status) && (
                              <option value={sub.status}>{sub.status}</option>
                            )}
                            {statuses.map((st) => (
                              <option key={st.statusId} value={st.key}>{st.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-5 py-3.5">
                          <ImportedBadge
                            submission={sub}
                            onUndo={(s) => setUndoSubmissionId(s.submissionId)}
                          />
                        </td>
                        {displayedFields.map((f) => {
                          const isSorted = sortByField.has(f.fieldId);
                          return (
                            <td
                              key={f.fieldId}
                              className={`px-5 py-3.5 truncate max-w-[200px] ${isSorted ? 'bg-cyan-50/40 text-slate-900 font-medium' : 'text-slate-600'}`}
                            >
                              {sub.answers[f.fieldId] || '—'}
                            </td>
                          );
                        })}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); openDetail(sub); }}
                              title="View"
                              className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); openDetailEditing(sub); }}
                              title="Edit"
                              className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(sub.submissionId); }}
                              title="Delete"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination + page size */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
                {/* Page size selector */}
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <span>Show</span>
                  <select
                    value={filters.limit || 25}
                    onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value, 10), page: 1 })}
                    className="px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                    <option value={500}>500</option>
                  </select>
                  <span>per page</span>
                  <span className="hidden sm:inline text-slate-400">·</span>
                  <span className="hidden sm:inline">
                    Showing {Math.min(((filters.page || 1) - 1) * (filters.limit || 25) + 1, pagination.total)}–
                    {Math.min((filters.page || 1) * (filters.limit || 25), pagination.total)} of {pagination.total}
                  </span>
                </div>

                {/* Page navigation */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                      disabled={(filters.page || 1) <= 1}
                      className="flex items-center gap-1 text-sm text-slate-600 hover:text-cyan-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeftIcon className="w-4 h-4" /> Previous
                    </button>
                    <span className="text-sm text-slate-500">
                      Page {filters.page || 1} of {totalPages}
                    </span>
                    <button
                      onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                      disabled={(filters.page || 1) >= totalPages}
                      className="flex items-center gap-1 text-sm text-slate-600 hover:text-cyan-600 disabled:text-slate-300 disabled:cursor-not-allowed transition-colors"
                    >
                      Next <ChevronRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Import field mapping */}
      <Modal
        isOpen={mappingOpen}
        onClose={() => setMappingOpen(false)}
        title="Student import mapping"
        size="2xl"
      >
        {mappingOpen && (
          <FieldMappingEditor
            formId={form.formId}
            onSaved={() => setMappingOpen(false)}
            onCancel={() => setMappingOpen(false)}
          />
        )}
      </Modal>

      {/* Import preview + run */}
      <ImportPreviewModal
        formId={form.formId}
        scope={importScope}
        isOpen={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={() => { setSelectedIds(new Set()); fetchSubmissions(); }}
        onConfigureMapping={() => setMappingOpen(true)}
      />

      {/* Undo a previous import */}
      <UndoImportModal
        submissionId={undoSubmissionId}
        isOpen={!!undoSubmissionId}
        onClose={() => setUndoSubmissionId(null)}
        onUndone={fetchSubmissions}
      />

      {/* Detail Modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Submission Detail" size="lg">
        {detailSubmission && (
          <div className="flex flex-col">
            <div className="space-y-4 px-6 py-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Submitted: {new Date(detailSubmission.submittedAt).toLocaleString('en-CA')}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadgeClass(statusFor(detailSubmission.status)?.color)}`}>
                {statusFor(detailSubmission.status)?.label || detailSubmission.status}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {fields.map((field) => (
                <div key={field.fieldId} className="py-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">
                    {field.label}
                    {field.isRequired && <span className="text-rose-500 ml-1">*</span>}
                  </p>
                  {isEditing ? (
                    renderEditField(field)
                  ) : (
                    <p className="text-sm text-slate-900">
                      {detailSubmission.answers[field.fieldId] || <span className="text-slate-400 italic">No answer</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
            </div>

            <div className="sticky bottom-0 bg-white px-6 py-3 border-t border-slate-100 flex items-center justify-between">
              {isEditing ? (
                <>
                  <span />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveAnswers}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleDelete(detailSubmission.submissionId)}
                    className="px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                  <div className="flex gap-2">
                    <button
                      onClick={startEditing}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" /> Edit
                    </button>
                    {detailSubmission.status === 'new' && statusFor('reviewed') && (
                      <button
                        onClick={() => {
                          handleStatusChange(detailSubmission.submissionId, 'reviewed');
                          setDetailOpen(false);
                        }}
                        className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors cursor-pointer"
                      >
                        Mark as {statusFor('reviewed')!.label}
                      </button>
                    )}
                    <button
                      onClick={() => setDetailOpen(false)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
