'use client';

import type { FormField as FormFieldType } from '@/services/types/registration';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';

interface Props {
  field: FormFieldType;
  register: UseFormRegister<Record<string, string>>;
  errors: FieldErrors<Record<string, string>>;
  index: number;
}

export default function FormField({ field, register, errors, index }: Props) {
  const error = errors[field.fieldId];
  const label = `${index + 1}. ${field.label}`;

  const baseInputClass =
    'w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors';
  const errorClass = error ? 'border-red-400 focus:ring-red-500' : '';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <label className="block text-sm font-medium text-slate-800 mb-3">
        {label}
        {field.isRequired && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Text / Email / Phone */}
      {(field.fieldType === 'text' || field.fieldType === 'email' || field.fieldType === 'phone') && (
        <input
          type={field.fieldType === 'phone' ? 'tel' : field.fieldType}
          placeholder={field.placeholder || 'Your answer'}
          {...register(field.fieldId, { required: field.isRequired ? 'This field is required' : false })}
          className={`${baseInputClass} ${errorClass}`}
        />
      )}

      {/* Date */}
      {field.fieldType === 'date' && (
        <input
          type="date"
          {...register(field.fieldId, { required: field.isRequired ? 'This field is required' : false })}
          className={`${baseInputClass} ${errorClass}`}
        />
      )}

      {/* Textarea */}
      {field.fieldType === 'textarea' && (
        <textarea
          rows={4}
          placeholder={field.placeholder || 'Your answer'}
          {...register(field.fieldId, { required: field.isRequired ? 'This field is required' : false })}
          className={`${baseInputClass} ${errorClass} resize-y`}
        />
      )}

      {/* Select (Dropdown) */}
      {field.fieldType === 'select' && (
        <select
          {...register(field.fieldId, { required: field.isRequired ? 'This field is required' : false })}
          className={`${baseInputClass} ${errorClass}`}
          defaultValue=""
        >
          <option value="" disabled>Select an option</option>
          {field.options?.map((opt, i) => (
            <option key={i} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {/* Radio */}
      {field.fieldType === 'radio' && (
        <div className="space-y-3 mt-1">
          {field.options?.map((opt, i) => (
            <label key={i} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="radio"
                value={opt}
                {...register(field.fieldId, { required: field.isRequired ? 'This field is required' : false })}
                className="w-4 h-4 text-cyan-600 border-slate-300 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-700 group-hover:text-slate-900">{opt}</span>
            </label>
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-2 text-xs text-red-500">{error.message as string}</p>
      )}
    </div>
  );
}
