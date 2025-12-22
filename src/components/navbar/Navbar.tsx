'use client'
import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import NavLinks from './navlinks/Navlinks';
import { Bars3Icon } from '@heroicons/react/24/outline';
import { useSidebarStore } from '@/store/useSidebarStore';
import { useUserStore } from '@/store/useUserStore';
import { getSchoolName } from '@/lib/schoolUtils';

const NavBar: FC = () => {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const { toggleSidebar } = useSidebarStore();
  const user = useUserStore((state) => state.user);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.pageYOffset > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`
        fixed top-0 right-0 left-0 lg:left-72 z-30
        transition-all duration-300 ease-out
        ${scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-100'
          : 'bg-white border-b border-slate-100'
        }
      `}
    >
      <div className="flex justify-between items-center h-20 px-4 lg:px-8">
        {/* Mobile: Hamburger + School Name */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          {/* School Name / Page Context */}
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold text-slate-900">
              {user?.school ? getSchoolName(user.school) : 'SchoolMule'}
            </h1>
            <p className="text-xs text-slate-500">
              {user?.role === 'ADMIN' ? 'Administrator' : user?.role === 'PARENT' ? 'Parent Portal' : 'Teacher Portal'}
            </p>
          </div>
        </div>

        {/* Right Side - Actions & User */}
        <div className="flex items-center gap-3">
          {/* Desktop Nav Links */}
          <div className="hidden lg:block">
            <NavLinks />
          </div>

          {/* User Avatar (Mobile) */}
          <Link
            href="/settings"
            className="lg:hidden w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm"
          >
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
