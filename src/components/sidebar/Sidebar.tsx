'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutModal from '../logout/logoutModal';
import { Cog6ToothIcon, ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore'
import { useSidebarStore } from '@/store/useSidebarStore'

const teacherLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/students', label: 'Students' },
  { href: '/classes', label: 'Classes' },
  { href: '/gradebook', label: 'Gradebook' },
];

const parentLinks = [
  { href: '/parent/dashboard', label: 'Dashboard' },
  { href: '/parent/communication', label: 'Communication' },
  { href: '/parent/feedback', label: 'Feedback' },
  { href: '/parent/report-cards', label: 'Report Cards'}
];

const supportLinks = [
  { href: '/help', label: 'Help & Support' },
  { href: '/contact', label: 'Contact' }
];

const Sidebar = () => {
  const pathname = usePathname();
  const user = useUserStore(s => s.user);
  const { isOpen: sidebarOpen, closeSidebar } = useSidebarStore();

  const isAttendancePath = pathname.startsWith('/attendance');
  const isReportCardPath = pathname.startsWith('/report-cards');

  const [attendanceOpen, setAttendanceOpen] = useState(isAttendancePath);
  const [reportCardOpen, setReportCardOpen] = useState(isReportCardPath);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  // Close sidebar when clicking outside (mobile)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      if (sidebarOpen && sidebar && !sidebar.contains(event.target as Node)) {
        closeSidebar();
      }
    };

    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, closeSidebar]);

  return (
    <aside 
      id="mobile-sidebar"
      className={`
        w-64 fixed -top-10 bottom-0 lg:top-10 left-0 px-4 pt-20 bg-white text-black shadow-lg z-40 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:z-20
      `}
    >
      {/* Mobile close button */}
      <button
        onClick={closeSidebar}
        className="lg:hidden absolute top-15 right-4 p-2 text-gray-600 hover:text-gray-800"
      >
        <XMarkIcon className="h-6 w-6" />
      </button>

      <nav className="space-y-3 text-sm lg:text-lg xl:text-lg overflow-y-auto h-full pb-20 mt-8 lg:mt-4">
        {(user?.role === 'PARENT' ? parentLinks : teacherLinks).map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`transform transition duration-200 hover:scale-110 block px-4 py-2 rounded hover:bg-gray-100 ${
            pathname === link.href ? 'bg-gray-200 font-semibold' : ''
          }`}
        >
          {link.label}
        </Link>
      ))}

        {user?.role !== 'PARENT' && (
            <>
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
                      className={`transform transition duration-200 hover:scale-110 block px-2 py-1 rounded hover:bg-gray-100 ${
                        pathname === '/attendance/general' ? 'bg-gray-200 font-semibold' : ''
                      }`}
                    >
                      General Attendance
                    </Link>
                    <Link
                      href="/attendance/class"
                      className={`transform transition duration-200 hover:scale-110 block px-2 py-1 rounded hover:bg-gray-100 ${
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
                      className={`transform transition duration-200 hover:scale-110 block px-2 py-1 rounded hover:bg-gray-100 ${
                        pathname === '/report-cards/generate' ? 'bg-gray-200 font-semibold' : ''
                      }`}
                    >
                      Generate Report Cards
                    </Link>
                    <Link
                      href="/report-cards/view"
                      className={`transform transition duration-200 hover:scale-110 block px-2 py-1 rounded hover:bg-gray-100 ${
                        pathname === '/report-cards/view' ? 'bg-gray-200 font-semibold' : ''
                      }`}
                    >
                      View/Download Report Cards
                    </Link>
                  </div>
                )}
              </div>

              {/* Admin-only link */}
              {user?.role === 'ADMIN' && (
                <Link
                  href="/admin-panel"
                  className={`transform transition duration-200 hover:scale-110 block px-4 py-2 rounded hover:bg-gray-100 ${
                    pathname === '/admin-panel/approvals' ? 'bg-gray-200 font-semibold' : ''
                  }`}
                >
                  Admin Panel
                </Link>
              )}

              <Link href="/schedule" className="transform transition duration-200 hover:scale-110 flex items-center px-4 py-2 rounded hover:bg-gray-100">
                Schedule
              </Link>

              <Link href="/schedule" className="transform transition duration-200 hover:scale-110 flex items-center px-4 py-2 rounded hover:bg-gray-100">
                Parent Communication
              </Link>

              <Link href="/analytics" className="transform transition duration-200 hover:scale-110 flex items-center px-4 py-2 rounded hover:bg-gray-100">
                Analytics
              </Link>
            </>
          )}

        <Link href="/settings" className="transform transition duration-200 hover:scale-110 flex items-center px-4 py-2 rounded hover:bg-gray-100 text-gray-700">
          <Cog6ToothIcon className="h-5 w-5 mr-2" />
          <span>Settings</span>
        </Link>

        {/* Support Links */}
        <div className="lg:hidden xl:hidden border-t pt-3 mt-3">
          {supportLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={`transform transition duration-200 hover:scale-110 block px-4 py-2 rounded hover:bg-gray-100 ${
                pathname === link.href ? 'bg-gray-200 font-semibold' : ''
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="transform transition duration-200 hover:scale-110 text-red-600 hover:text-red-800 cursor-pointer">
          <LogoutModal />
        </div>
      </nav>
    </aside>
  )
}

export default Sidebar;
