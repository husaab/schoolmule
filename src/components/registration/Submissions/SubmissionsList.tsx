'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  RegistrationForm,
  FormField,
  FormSubmission,
  SubmissionFilters as FiltersType,
  SubmissionPagination,
} from '@/services/types/registration';
import * as registrationService from '@/services/registrationService';
import SubmissionFiltersComponent from './SubmissionFilters';
import ExportButton from './ExportButton';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

const statusColors: Record<string, string> = {
  new: 'bg-cyan-100 text-cyan-700',
  reviewed: 'bg-emerald-100 text-emerald-700',
  archived: 'bg-slate-100 text-slate-600',
};

interface Props {
  forms: RegistrationForm[];
}

export default function SubmissionsList({ forms }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);

  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.formId || '');
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);
  const [pagination, setPagination] = useState<SubmissionPagination>({ total: 0, page: 1, limit: 25 });
  const [filters, setFilters] = useState<FiltersType>({ page: 1, limit: 25 });
  const [loading, setLoading] = useState(false);

  // Detail modal
  const [detailSubmission, setDetailSubmission] = useState<FormSubmission | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    if (!selectedFormId) return;
    setLoading(true);
    try {
      const [subsRes, formRes] = await Promise.all([
        registrationService.getSubmissions(selectedFormId, filters),
        registrationService.getForm(selectedFormId),
      ]);
      setSubmissions(subsRes.data);
      setPagination(subsRes.pagination);
      setFields(formRes.data.fields);
    } catch {
      showNotification('Error loading submissions', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedFormId, filters, showNotification]);

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

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  // Build a field lookup map
  const fieldMap = new Map(fields.map((f) => [f.fieldId, f]));

  return (
    <div className="space-y-6">
      {/* Form selector + Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <select
          value={selectedFormId}
          onChange={(e) => {
            setSelectedFormId(e.target.value);
            setFilters({ page: 1, limit: 25 });
          }}
          className="px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-white font-medium"
        >
          {forms.map((f) => (
            <option key={f.formId} value={f.formId}>
              {f.title} ({f.status})
            </option>
          ))}
        </select>

        <div className="flex-1">
          <SubmissionFiltersComponent filters={filters} onChange={setFilters} />
        </div>

        <ExportButton formId={selectedFormId} filters={filters} />
      </div>

      {/* Results summary */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{pagination.total} submission{pagination.total !== 1 ? 's' : ''}</span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-slate-400">
          <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm">Loading...</p>
        </div>
      )}

      {/* Empty */}
      {!loading && submissions.length === 0 && (
        <div className="text-center py-12 text-slate-400">
          <p className="text-sm">No submissions found</p>
        </div>
      )}

      {/* Table */}
      {!loading && submissions.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                  {fields.slice(0, 3).map((f) => (
                    <th key={f.fieldId} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase truncate max-w-[200px]">
                      {f.label}
                    </th>
                  ))}
                  <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub.submissionId} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {new Date(sub.submittedAt).toLocaleDateString('en-CA')}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={sub.status}
                        onChange={(e) => handleStatusChange(sub.submissionId, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[sub.status] || 'bg-slate-100 text-slate-600'}`}
                      >
                        <option value="new">New</option>
                        <option value="reviewed">Reviewed</option>
                        <option value="archived">Archived</option>
                      </select>
                    </td>
                    {fields.slice(0, 3).map((f) => (
                      <td key={f.fieldId} className="px-4 py-3 text-slate-600 truncate max-w-[200px]">
                        {sub.answers[f.fieldId] || '—'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => { setDetailSubmission(sub); setDetailOpen(true); }}
                        className="p-1.5 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
              <button
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                disabled={(filters.page || 1) <= 1}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-cyan-600 disabled:text-slate-300 disabled:cursor-not-allowed"
              >
                <ChevronLeftIcon className="w-4 h-4" /> Previous
              </button>
              <span className="text-sm text-slate-500">
                Page {filters.page || 1} of {totalPages}
              </span>
              <button
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                disabled={(filters.page || 1) >= totalPages}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-cyan-600 disabled:text-slate-300 disabled:cursor-not-allowed"
              >
                Next <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={detailOpen} onClose={() => setDetailOpen(false)} title="Submission Detail" size="lg">
        {detailSubmission && (
          <div className="space-y-4 p-1">
            <div className="flex items-center justify-between text-sm text-slate-500">
              <span>Submitted: {new Date(detailSubmission.submittedAt).toLocaleString('en-CA')}</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[detailSubmission.status]}`}>
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

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
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
        )}
      </Modal>
    </div>
  );
}
