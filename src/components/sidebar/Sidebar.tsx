'use client'
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutModal from '../logout/logoutModal';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/students', label: 'Students' },
  { href: '/classes', label: 'Classes' },
  { href: '/gradebook', label: 'Gradebook' },
  { href: 'Attendance', label: 'Attendance'},
  { href: '/report-cards', label: 'Generate Report Cards' },
  { href: '/analytics', label: 'Analytics'}
];

const Sidebar = () => {
  const pathname = usePathname();

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
        <Link href="/settings" className="flex items-center px-4 py-2 rounded hover:bg-gray-100 text-gray-700">
            <Cog6ToothIcon className="h-5 w-5 mr-2" />
            <span>Settings</span>
            </Link>
        <div className="text-red-600 pl-2 hover:bg-gray-100">
            <LogoutModal/>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;