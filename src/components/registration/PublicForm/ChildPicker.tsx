'use client';

// On a public form, for a parent who is signed in: which of their children
// the response is for. The school then sees the child on the response and on
// any payment. Nobody else sees this; it is never required.

import { UserIcon } from '@heroicons/react/24/outline';
import { gradeLabel } from '@/lib/paymentRequests';
import type { PublicFormChildren } from '@/services/types/registration';

interface Props {
  childrenList: PublicFormChildren['children'];
  value: string | null;
  onChange: (studentId: string | null) => void;
}

export default function ChildPicker({ childrenList, value, onChange }: Props) {
  if (childrenList.length === 0) return null;
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <legend className="sr-only">Which child is this for?</legend>
      <div className="mb-3 flex items-center gap-2">
        <UserIcon className="h-5 w-5 text-cyan-600" />
        <p className="text-base font-medium text-slate-900">Which child is this for?</p>
      </div>
      <p className="mb-3 text-sm text-slate-500">You’re signed in, so the school can match this to your child.</p>
      <div className="space-y-2">
        {childrenList.map((c) => (
          <label key={c.studentId} className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${value === c.studentId ? 'border-cyan-500 bg-cyan-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
            <input type="radio" name="child" checked={value === c.studentId} onChange={() => onChange(c.studentId)} className="h-4 w-4 text-cyan-600" />
            <span className="font-medium text-slate-900">{c.name}</span>
            <span className="text-slate-500">{gradeLabel(c.grade)}</span>
          </label>
        ))}
        <label className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${value === null ? 'border-cyan-500 bg-cyan-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
          <input type="radio" name="child" checked={value === null} onChange={() => onChange(null)} className="h-4 w-4 text-cyan-600" />
          <span className="text-slate-700">Not for one of my children</span>
        </label>
      </div>
    </fieldset>
  );
}
