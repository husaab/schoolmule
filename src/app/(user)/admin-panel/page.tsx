'use client';

import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import Link from 'next/link';
import { ShieldCheckIcon, UserGroupIcon, CogIcon } from '@heroicons/react/24/outline';

const adminLinks = [
  {
    href: '/admin-panel/approvals',
    label: 'Manage User Approvals',
    description: 'Review and approve newly registered users for your school.',
    icon: ShieldCheckIcon,
  },
  {
    href: '/admin-panel/relations',
    label: 'Parent-Student Relations',
    description: 'View and manage parent-student mappings.',
    icon: UserGroupIcon,
  },
  {
    href: '/admin-panel/school-settings',
    label: 'School Settings',
    description: 'Manage school terms and academic year settings.',
    icon: CogIcon,
  },
  // You can add more admin tools here later
];

const AdminPanelPage = () => {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-32 lg:pt-40 bg-white min-h-screen p-4 lg:p-10 text-black">
        <h1 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6 text-center">Admin Panel</h1>
        <div className="space-y-4">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between bg-white hover:bg-cyan-50 border border-cyan-200 rounded-xl shadow-sm p-5 transition"
            >
              <div className="flex items-center gap-4">
                <link.icon className="h-8 w-8 text-cyan-600" />
                <div>
                  <h2 className="text-lg font-semibold">{link.label}</h2>
                  <p className="text-sm text-gray-600">{link.description}</p>
                </div>
              </div>
              <div className="text-cyan-600 text-sm font-medium">Open →</div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
};

export default AdminPanelPage;
