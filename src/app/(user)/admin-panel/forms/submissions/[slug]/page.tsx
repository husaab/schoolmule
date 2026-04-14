'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import SubmissionFiltersComponent from '@/components/registration/Submissions/SubmissionFilters';
import ExportButton from '@/components/registration/Submissions/ExportButton';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import * as registrationService from '@/services/registrationService';
import type {
  RegistrationForm,
  FormField,
  FormSubmission,
  SubmissionFilters as FiltersType,
  SubmissionPagination,
} from '@/services/types/registration';
import {
  ArrowLeftIcon,
  EyeIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  InboxStackIcon,
} from '@heroicons/react/24/outline';

const statusColors: Record<string, string> = {
  new: 'bg-cyan-100 text-cyan-700',
  reviewed: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600',
};

export default function FormSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const showNotification = useNotificationStore((s) => s.showNotification);
  const slug = params.slug as string;

  // Form resolution
  const [form, setForm] = useState<RegistrationForm | null>(null);
  const [formLoading, setFormLoading] = useState(true);

  // Submissions data
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [pagination, setPagination] = useState<SubmissionPagination>({ total: 0, page: 1, limit: 25 });
  const [filters, setFilters] = useState<FiltersType>({ page: 1, limit: 25 });
  const [loading, setLoading] = useState(false);

  // Detail modal
  const [detailSubmission, setDetailSubmission] = useState<FormSubmission | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  const handleStatusChange = async (submissionId: string, status: string) => {
    try {
      await registrationService.updateSubmissionStatus(submissionId, status);
      fetchSubmissions();
    } catch {
      showNotification('Error updating status', 'error');
    }
  };

  const handleDelete = async (submissionId: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;
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
            </div>
            <ExportButton formId={form.formId} filters={filters} />
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6">
            <SubmissionFiltersComponent filters={filters} onChange={setFilters} />
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
                {filters.status || filters.dateFrom || filters.dateTo
                  ? 'Try adjusting your filters.'
                  : 'Submissions will appear here once parents fill out this form.'}
              </p>
            </div>
          )}

          {/* Table */}
          {!loading && submissions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      {fields.slice(0, 3).map((f) => (
                        <th key={f.fieldId} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider truncate max-w-[200px]">
                          {f.label}
                        </th>
                      ))}
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions.map((sub) => (
                      <tr
                        key={sub.submissionId}
                        onClick={() => { setDetailSubmission(sub); setDetailOpen(true); }}
                        className="border-b border-slate-50 hover:bg-cyan-50/30 cursor-pointer transition-colors"
                      >
                        <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                          {new Date(sub.submittedAt).toLocaleDateString('en-CA')}
                        </td>
                        <td className="px-5 py-3.5">
                          <select
                            value={sub.status}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => { e.stopPropagation(); handleStatusChange(sub.submissionId, e.target.value); }}
                            className={`text-xs font-medium px-2.5 py-1 rounded-full border-0 cursor-pointer ${statusColors[sub.status] || 'bg-slate-100 text-slate-600'}`}
                          >
                            <option value="new">New</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>
                        {fields.slice(0, 3).map((f) => (
                          <td key={f.fieldId} className="px-5 py-3.5 text-slate-600 truncate max-w-[200px]">
                            {sub.answers[f.fieldId] || '—'}
                          </td>
                        ))}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); setDetailSubmission(sub); setDetailOpen(true); }}
                              className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDelete(sub.submissionId); }}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-100 bg-slate-50/50">
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
          )}
        </div>
      </main>

      {/* Detail Modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Submission Detail" size="lg">
        {detailSubmission && (
          <div className="space-y-4 px-6 py-4">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Submitted: {new Date(detailSubmission.submittedAt).toLocaleString('en-CA')}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[detailSubmission.status]}`}>
                {detailSubmission.status}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {fields.map((field) => (
                <div key={field.fieldId} className="py-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{field.label}</p>
                  <p className="text-sm text-slate-900">
                    {detailSubmission.answers[field.fieldId] || <span className="text-slate-400 italic">No answer</span>}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                onClick={() => handleDelete(detailSubmission.submissionId)}
                className="px-4 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
              >
                Delete
              </button>
              <div className="flex gap-2">
                {detailSubmission.status === 'new' && (
                  <button
                    onClick={() => {
                      handleStatusChange(detailSubmission.submissionId, 'reviewed');
                      setDetailOpen(false);
                    }}
                    className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                  >
                    Mark as Reviewed
                  </button>
                )}
                <button
                  onClick={() => setDetailOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
