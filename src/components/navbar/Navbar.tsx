// File: src/components/navbar/NavBar.tsx\
'use client'
import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NavLinks from './navlinks/Navlinks';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useSidebarStore } from '@/store/useSidebarStore';

const NavBar: FC = () => {
  const [atTop, setAtTop] = useState<boolean>(true);
  const { toggleSidebar } = useSidebarStore();

  useEffect(() => {
    const handleScroll = () => setAtTop(window.pageYOffset < 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full top-0 z-30 transition bg-white shadow-xs duration-300 ease-in-out ${!atTop ? 'bg-white shadow-lg' : ''}`}>      
      <div className="flex justify-between items-center py-2 px-4 lg:px-12">
        {/* Mobile sidebar button */}
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-3 text-blue-900 z-50"
        >
          <Bars3Icon className="h-8 w-8 stroke-2" />
        </button>

        {/* logo */}
        <Link href="/dashboard" scroll={false} className="flex-shrink-0">
            <Image
              src="/logo/trimmedlogo.png"
              alt="Logo"
              width={100}
              height={100}
              quality={100}
            />
        </Link>

        {/* desktop links */}
        <div className="hidden lg:block">
          <NavLinks />
        </div>
        </div>
    </nav>
  );
};

export default NavBar;
