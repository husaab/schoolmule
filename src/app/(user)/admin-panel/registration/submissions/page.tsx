'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import SubmissionsList from '@/components/registration/Submissions/SubmissionsList';
import { useNotificationStore } from '@/store/useNotificationStore';
import * as registrationService from '@/services/registrationService';
import type { RegistrationForm } from '@/services/types/registration';
import { ArrowLeftIcon, InboxIcon } from '@heroicons/react/24/outline';

export default function SubmissionsPage() {
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

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Back link */}
          <Link
            href="/admin-panel/registration"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to forms
          </Link>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Form Submissions</h1>
            <p className="text-slate-500 mt-1">View and manage registration form submissions</p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-20 text-slate-400">
              <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Loading...</p>
            </div>
          )}

          {/* No forms */}
          {!loading && forms.length === 0 && (
            <div className="text-center py-20">
              <InboxIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 mb-1">No forms yet</h3>
              <p className="text-sm text-slate-500">
                Create a registration form first to start receiving submissions.
              </p>
            </div>
          )}

          {/* Submissions list */}
          {!loading && forms.length > 0 && (
            <SubmissionsList forms={forms} />
          )}
        </div>
      </main>
    </>
  );
}
