'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface Props {
  schoolName: string;
}

export default function SuccessMessage({ schoolName }: Props) {
  const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Top Nav */}
      <nav className="flex items-center justify-between mb-6">
        <Link href="/">
          <Image
            src="/logo/trimmedlogo.png"
            alt="SchoolMule"
            width={200}
            height={60}
            className="h-16 w-auto"
          />
        </Link>
        {isLoggedIn && (
          <Link
            href="/dashboard"
            className="text-sm font-medium text-cyan-600 hover:text-cyan-700 transition-colors"
          >
            Dashboard &rarr;
          </Link>
        )}
      </nav>

      <div className="bg-white rounded-2xl border border-slate-200 p-10 shadow-sm text-center mt-12">
        <CheckCircleIcon className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Submission Received!</h2>
        <p className="text-slate-600 mb-6">
          Thank you for submitting your form. {schoolName} has received your submission
          and will review it shortly.
        </p>
        <p className="text-sm text-slate-400">You may close this page.</p>
      </div>
    </div>
  );
}
