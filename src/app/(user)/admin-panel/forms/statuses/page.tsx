'use client';

import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import StatusManager from '@/components/registration/Statuses/StatusManager';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function SubmissionStatusesPage() {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <Link
            href="/admin-panel/forms/submissions"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 mb-6 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to submission forms
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Statuses</h1>
            <p className="text-slate-500 mt-1">
              Track where each submission is in your process. Add your own alongside the built-in ones.
            </p>
          </div>

          <StatusManager />
        </div>
      </main>
    </>
  );
}
