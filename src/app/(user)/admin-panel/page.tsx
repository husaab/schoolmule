'use client';

import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import Link from 'next/link';
import { ShieldCheckIcon, UserGroupIcon, CogIcon, PhotoIcon, ArrowRightIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';

const adminLinks = [
  {
    href: '/admin-panel/approvals',
    label: 'Manage User Approvals',
    description: 'Review and approve newly registered users for your school.',
    icon: ShieldCheckIcon,
    color: 'bg-emerald-500',
    bgColor: 'from-emerald-50 to-teal-50',
    borderColor: 'border-emerald-100',
  },
  {
    href: '/admin-panel/relations',
    label: 'Parent-Student Relations',
    description: 'View and manage parent-student mappings.',
    icon: UserGroupIcon,
    color: 'bg-blue-500',
    bgColor: 'from-blue-50 to-indigo-50',
    borderColor: 'border-blue-100',
  },
  {
    href: '/admin-panel/school-settings',
    label: 'School Settings',
    description: 'Manage school terms and academic year settings.',
    icon: CogIcon,
    color: 'bg-violet-500',
    bgColor: 'from-violet-50 to-purple-50',
    borderColor: 'border-violet-100',
  },
  {
    href: '/admin-panel/school-assets',
    label: 'School Assets',
    description: 'Upload and manage school logo, principal signature, and stamp.',
    icon: PhotoIcon,
    color: 'bg-amber-500',
    bgColor: 'from-amber-50 to-orange-50',
    borderColor: 'border-amber-100',
  },
];

const AdminPanelPage = () => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Admin Panel</h1>
                <p className="text-slate-500 mt-1">Manage school settings, users, and configurations</p>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-50 to-pink-50 rounded-xl border border-rose-100">
                <WrenchScrewdriverIcon className="w-5 h-5 text-rose-600" />
                <span className="text-sm font-medium text-rose-700">Admin Tools</span>
              </div>
            </div>
          </div>

          {/* Admin Links Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {adminLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`group relative bg-gradient-to-br ${link.bgColor} rounded-2xl border ${link.borderColor} shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden`}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`${link.color} p-3 rounded-xl text-white group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                      <link.icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-cyan-600 transition-colors duration-200">
                        {link.label}
                      </h3>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                        {link.description}
                      </p>
                    </div>
                  </div>

                  {/* Arrow indicator */}
                  <div className="absolute top-6 right-6 text-slate-300 group-hover:text-cyan-500 group-hover:translate-x-1 transition-all duration-200">
                    <ArrowRightIcon className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Info Card */}
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Admin Access</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                </div>
                <span className="text-slate-600">Full user management control</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                </div>
                <span className="text-slate-600">Configure school settings</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
                  <div className="w-2.5 h-2.5 bg-violet-500 rounded-full" />
                </div>
                <span className="text-slate-600">Manage academic terms</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default AdminPanelPage;
