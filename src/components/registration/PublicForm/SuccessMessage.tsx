'use client';

import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface Props {
  schoolName: string;
}

export default function SuccessMessage({ schoolName }: Props) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm">
        <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Submission Received!</h2>
        <p className="text-slate-600 mb-6">
          Thank you for submitting your registration form. {schoolName} has received your submission
          and will review it shortly.
        </p>
        <p className="text-sm text-slate-400">You may close this page.</p>
      </div>
    </div>
  );
}
