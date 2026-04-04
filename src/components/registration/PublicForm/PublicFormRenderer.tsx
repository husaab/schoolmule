'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import DOMPurify from 'dompurify';
import type { PublicFormData } from '@/services/types/registration';
import { submitPublicForm } from '@/services/registrationPublicService';
import FormField from './FormField';
import SuccessMessage from './SuccessMessage';

interface Props {
  form: PublicFormData;
}

export default function PublicFormRenderer({ form }: Props) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<Record<string, string>>();

  if (submitted) {
    return <SuccessMessage schoolName={form.schoolName} />;
  }

  const onSubmit = async (data: Record<string, string>) => {
    setSubmitting(true);
    setError(null);
    try {
      await submitPublicForm(form.schoolSlug, form.slug, data);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const sanitizedDescription = form.description
    ? DOMPurify.sanitize(form.description)
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Banner Image */}
      {form.bannerImageUrl && (
        <div className="rounded-t-2xl overflow-hidden mb-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={form.bannerImageUrl}
            alt={`${form.title} banner`}
            className="w-full h-48 sm:h-56 object-cover"
          />
        </div>
      )}

      {/* Title & Description Card */}
      <div className={`bg-white border border-slate-200 p-6 sm:p-8 shadow-sm ${
        form.bannerImageUrl ? 'rounded-b-2xl border-t-4 border-t-cyan-500' : 'rounded-2xl border-t-4 border-t-cyan-500'
      }`}>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">
          {form.title}
        </h1>
        <p className="text-sm text-slate-500 mb-4">{form.schoolName}</p>

        {sanitizedDescription && (
          <div
            className="prose prose-sm prose-slate max-w-none text-slate-700"
            dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
          />
        )}

        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs text-red-500">* Indicates required question</p>
        </div>
      </div>

      {/* Form Fields */}
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
        {/* Honeypot fields (hidden from humans, visible to bots) */}
        <div className="hidden" aria-hidden="true">
          <input type="text" tabIndex={-1} autoComplete="off" {...register('website')} />
          <input type="text" tabIndex={-1} autoComplete="off" {...register('url')} />
          <input type="text" tabIndex={-1} autoComplete="off" {...register('homepage')} />
        </div>

        {form.fields.map((field, index) => (
          <FormField
            key={field.fieldId}
            field={field}
            register={register}
            errors={errors}
            index={index}
          />
        ))}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-8 py-3 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </form>

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-xs text-slate-400">
          Powered by <span className="font-medium">SchoolMule</span>
        </p>
      </div>
    </div>
  );
}
