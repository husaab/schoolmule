'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import StatusBadge from '@/components/registration/FormBuilder/StatusBadge';
import { useNotificationStore } from '@/store/useNotificationStore';
import * as registrationService from '@/services/registrationService';
import type { RegistrationForm } from '@/services/types/registration';
import {
  PlusIcon,
  DocumentTextIcon,
  TrashIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

export default function RegistrationFormsPage() {
  const router = useRouter();
  const showNotification = useNotificationStore((s) => s.showNotification);
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForms = useCallback(async () => {
    try {
      const res = await registrationService.getForms();
      setForms(res.data);
    } catch {
      showNotification('Error loading forms', 'error');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchForms();
  }, [fetchForms]);

  const handleCreate = async () => {
    try {
      const res = await registrationService.createForm({ title: 'Untitled Form' });
      router.push(`/admin-panel/registration/${res.data.formId}`);
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Error creating form', 'error');
    }
  };

  const handleDelete = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this draft form?')) return;
    try {
      await registrationService.deleteForm(formId);
      showNotification('Form deleted', 'success');
      fetchForms();
    } catch (error) {
      showNotification(error instanceof Error ? error.message : 'Only draft forms can be deleted', 'error');
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Registration Forms</h1>
              <p className="text-slate-500 mt-1">Create and manage custom registration forms for your school</p>
            </div>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              New Form
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-20 text-slate-400">
              <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Loading forms...</p>
            </div>
          )}

          {/* Empty State */}
          {!loading && forms.length === 0 && (
            <div className="text-center py-20">
              <DocumentTextIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No forms yet</h3>
              <p className="text-sm text-slate-500 mb-6">
                Create your first registration form to start collecting submissions from parents.
              </p>
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
                Create First Form
              </button>
            </div>
          )}

          {/* Forms List */}
          {!loading && forms.length > 0 && (
            <div className="space-y-3">
              {forms.map((form) => (
                <div
                  key={form.formId}
                  className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-sm transition-shadow group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <Link
                          href={`/admin-panel/registration/${form.formId}`}
                          className="text-lg font-semibold text-slate-900 hover:text-cyan-600 transition-colors truncate"
                        >
                          {form.title}
                        </Link>
                        <StatusBadge status={form.status} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>Created {new Date(form.createdAt).toLocaleDateString()}</span>
                        <span>/{form.slug}</span>
                        {form.newSubmissionsCount > 0 && (
                          <span className="flex items-center gap-1 text-cyan-600 font-medium">
                            <span className="h-1.5 w-1.5 bg-cyan-500 rounded-full animate-pulse" />
                            {form.newSubmissionsCount} new submission{form.newSubmissionsCount !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {form.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(form.formId)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        href={`/admin-panel/registration/${form.formId}`}
                        className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      >
                        <ArrowRightIcon className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
