'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { useNotificationStore } from '@/store/useNotificationStore';
import * as registrationService from '@/services/registrationService';
import type { RegistrationForm, FormStatus } from '@/services/types/registration';
import {
  InboxIcon,
  ChevronRightIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  InboxStackIcon,
  PencilSquareIcon,
} from '@heroicons/react/24/outline';

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  published: { label: 'Published', bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  draft: { label: 'Draft', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-400' },
  closed: { label: 'Closed', bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400' },
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export default function SubmissionsPage() {
  const router = useRouter();
  const showNotification = useNotificationStore((s) => s.showNotification);
  const [forms, setForms] = useState<RegistrationForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<FormStatus | 'all'>('all');

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

  const filteredForms = useMemo(() => {
    return forms.filter((f) => {
      const matchesSearch = f.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [forms, search, statusFilter]);

  // Count forms per status for filter pills
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: forms.length, published: 0, draft: 0, closed: 0 };
    forms.forEach((f) => { counts[f.status] = (counts[f.status] || 0) + 1; });
    return counts;
  }, [forms]);

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Form Submissions</h1>
              <p className="text-slate-500 mt-1">Select a form to view and manage its submissions</p>
            </div>
            <Link
              href="/admin-panel/forms"
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl transition-colors shadow-sm"
            >
              <PlusIcon className="w-4 h-4" />
              Build a Form
            </Link>
          </div>

          {/* Loading */}
          {loading && (
            <div className="text-center py-20 text-slate-400">
              <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
              <p className="text-sm">Loading forms...</p>
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

          {/* Search + Filters + Forms list */}
          {!loading && forms.length > 0 && (
            <div className="space-y-5">
              {/* Search + Status filter bar */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <MagnifyingGlassIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search forms..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent focus:bg-white placeholder:text-slate-400 transition-colors"
                  />
                </div>

                {/* Status filter pills */}
                <div className="flex items-center gap-1.5">
                  {(['all', 'published', 'draft', 'closed'] as const).map((s) => {
                    const isActive = statusFilter === s;
                    const label = s === 'all' ? 'All' : statusConfig[s].label;
                    const count = statusCounts[s] || 0;
                    return (
                      <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                          isActive
                            ? 'bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`}
                      >
                        {label} <span className={isActive ? 'text-cyan-500' : 'text-slate-400'}>({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Forms list */}
              <div className="space-y-3">
                {filteredForms.map((form) => {
                  const status = statusConfig[form.status] || statusConfig.draft;
                  const bannerUrl = form.bannerImagePath
                    ? `${SUPABASE_URL}/storage/v1/object/public/registration-forms/${form.bannerImagePath}`
                    : null;

                  return (
                    <button
                      key={form.formId}
                      onClick={() => router.push(`/admin-panel/forms/submissions/${form.slug}`)}
                      className="w-full bg-white rounded-2xl border border-slate-200 flex items-stretch overflow-hidden hover:border-cyan-200 hover:shadow-lg hover:shadow-cyan-50/50 transition-all duration-200 text-left group cursor-pointer"
                    >
                      {/* Banner image or gradient fallback */}
                      <div className="hidden sm:block w-36 lg:w-44 flex-shrink-0 relative overflow-hidden">
                        {bannerUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={bannerUrl}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-slate-50 to-slate-100 flex items-center justify-center">
                            <InboxStackIcon className="w-8 h-8 text-slate-300" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 p-5 flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1.5">
                            <h3 className="font-semibold text-slate-900 truncate group-hover:text-cyan-700 transition-colors">{form.title}</h3>
                            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                              {status.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-slate-500">
                            <span>
                              {form.newSubmissionsCount > 0 ? (
                                <><span className="font-semibold text-cyan-600">{form.newSubmissionsCount} new</span> submission{form.newSubmissionsCount !== 1 ? 's' : ''}</>
                              ) : (
                                'No new submissions'
                              )}
                            </span>
                            {form.publishedAt && (
                              <>
                                <span className="text-slate-300">·</span>
                                <span>Published {new Date(form.publishedAt).toLocaleDateString('en-CA')}</span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Edit + Arrow */}
                        <div
                          onClick={(e) => { e.stopPropagation(); router.push(`/admin-panel/forms/${form.formId}`); }}
                          className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors flex-shrink-0"
                          title="Edit form"
                        >
                          <PencilSquareIcon className="w-4.5 h-4.5" />
                        </div>
                        <ChevronRightIcon className="w-5 h-5 text-slate-300 group-hover:text-cyan-400 flex-shrink-0 transition-colors" />
                      </div>
                    </button>
                  );
                })}

                {/* No results from search/filter */}
                {filteredForms.length === 0 && (
                  <div className="text-center py-12 text-slate-400">
                    <MagnifyingGlassIcon className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    <p className="text-sm">No forms match your search or filters</p>
                    <button
                      onClick={() => { setSearch(''); setStatusFilter('all'); }}
                      className="text-xs text-cyan-600 hover:text-cyan-700 font-medium mt-2"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
