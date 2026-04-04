'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import FormBuilder from '@/components/registration/FormBuilder/FormBuilder';
import { useNotificationStore } from '@/store/useNotificationStore';
import * as registrationService from '@/services/registrationService';
import type { RegistrationFormWithFields } from '@/services/types/registration';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const showNotification = useNotificationStore((s) => s.showNotification);
  const formId = params.formId as string;

  const [form, setForm] = useState<RegistrationFormWithFields | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchForm = useCallback(async () => {
    try {
      const res = await registrationService.getForm(formId);
      setForm(res.data);
    } catch {
      showNotification('Error loading form', 'error');
      router.push('/admin-panel/forms');
    } finally {
      setLoading(false);
    }
  }, [formId, showNotification, router]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Back link */}
          <Link
            href="/admin-panel/forms"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to forms
          </Link>

          {/* Loading */}
          {loading && (
            <div className="text-center py-20 text-slate-400">
              <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Loading form builder...</p>
            </div>
          )}

          {/* Builder */}
          {!loading && form && (
            <FormBuilder form={form} onSaved={fetchForm} />
          )}
        </div>
      </main>
    </>
  );
}
