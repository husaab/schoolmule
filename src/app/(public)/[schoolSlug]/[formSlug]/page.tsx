'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getPublicForm } from '@/services/registrationPublicService';
import PublicFormRenderer from '@/components/registration/PublicForm/PublicFormRenderer';
import type { PublicFormData } from '@/services/types/registration';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function PublicFormPage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const formSlug = params.formSlug as string;

  const [form, setForm] = useState<PublicFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await getPublicForm(schoolSlug, formSlug);
        setForm(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Form not found');
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [schoolSlug, formSlug]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading form...</p>
        </div>
      </div>
    );
  }

  // Error / Not Found state
  if (error || !form) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Form Not Found</h2>
          <p className="text-sm text-slate-500">
            This form may no longer be available or the link may be incorrect.
            Please contact the school for more information.
          </p>
        </div>
      </div>
    );
  }

  return <PublicFormRenderer form={form} />;
}
