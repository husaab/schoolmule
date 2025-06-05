'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutModal from '../logout/logoutModal';
import { Cog6ToothIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/students', label: 'Students' },
  { href: '/classes', label: 'Classes' },
  { href: '/gradebook', label: 'Gradebook' }
];

const Sidebar = () => {
  const pathname = usePathname();

  const isAttendancePath = pathname.startsWith('/attendance');
  const isReportCardPath = pathname.startsWith('/report-cards');

  const [attendanceOpen, setAttendanceOpen] = useState(isAttendancePath);
  const [reportCardOpen, setReportCardOpen] = useState(isReportCardPath);

  return (
    <aside className="h-screen w-64 fixed left-0 px-4 py-35 bg-white text-black z-20 shadow-lg">
      <nav className="space-y-4 text-lg">
        {links.map(link => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-4 py-2 rounded hover:bg-gray-100 ${
              pathname === link.href ? 'bg-gray-200 font-semibold' : ''
            }`}
          >
            {link.label}
          </Link>
        ))}

        {/* Attendance Dropdown */}
        <div>
          <button
            onClick={() => setAttendanceOpen(!attendanceOpen)}
            className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-100 cursor-pointer"
          >
            <span>Attendance</span>
            {attendanceOpen ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
          {attendanceOpen && (
            <div className="ml-6 mt-2 space-y-2">
              <Link
                href="/attendance/general"
                className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                  pathname === '/attendance/general' ? 'bg-gray-200 font-semibold' : ''
                }`}
              >
                General Attendance
              </Link>
              <Link
                href="/attendance/class"
                className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                  pathname === '/attendance/class' ? 'bg-gray-200 font-semibold' : ''
                }`}
              >
                Class Attendance
              </Link>
            </div>
          )}
        </div>

        {/* Report Cards Dropdown */}
        <div>
          <button
            onClick={() => setReportCardOpen(!reportCardOpen)}
            className="flex items-center justify-between w-full px-4 py-2 rounded hover:bg-gray-100 cursor-pointer"
          >
            <span>Report Cards</span>
            {reportCardOpen ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
          {reportCardOpen && (
            <div className="ml-6 mt-2 space-y-2">
              <Link
                href="/report-cards/generate"
                className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                  pathname === '/report-cards/generate' ? 'bg-gray-200 font-semibold' : ''
                }`}
              >
                Generate Report Cards
              </Link>
              <Link
                href="/report-cards/view"
                className={`block px-2 py-1 rounded hover:bg-gray-100 ${
                  pathname === '/report-cards/view' ? 'bg-gray-200 font-semibold' : ''
                }`}
              >
                View/Download Report Cards
              </Link>
            </div>
          )}
        </div>

        <Link href="/analytics" className="flex items-center px-4 py-2 rounded hover:bg-gray-100">
          Analytics
        </Link>

        <Link href="/settings" className="flex items-center px-4 py-2 rounded hover:bg-gray-100 text-gray-700">
          <Cog6ToothIcon className="h-5 w-5 mr-2" />
          <span>Settings</span>
        </Link>

        <div className="text-red-600 pl-2 hover:bg-gray-100">
          <LogoutModal />
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;
