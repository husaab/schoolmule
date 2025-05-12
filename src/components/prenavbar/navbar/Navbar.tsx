// File: src/components/navbar/NavBar.tsx\
'use client'
import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NavLinks from '../navlinks/Navlinks';

const NavBar: FC = () => {
  const [atTop, setAtTop] = useState<boolean>(true);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleScroll = () => setAtTop(window.pageYOffset < 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`fixed w-full top-0 z-30 transition border-b border-gray-200 duration-300 ease-in-out ${!atTop ? 'bg-white shadow-lg' : ''}`}>      
      <div className="flex justify-between items-center py-2 px-4 lg:px-12">
        {/* logo */}
        <Link href="" scroll={false}>
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

        {/* mobile menu button */}
        <button className="p-2 rounded-lg lg:hidden text-blue-900" onClick={() => setIsOpen(o => !o)}>
          <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
            {isOpen ? (
              <path fillRule="evenodd" clipRule="evenodd" d="M18.278 16.864a1 1 0 0 1-1.414 1.414l-4.829-4.828-4.828 4.828a1 1 0 0 1-1.414-1.414l4.828-4.829-4.828-4.828a1 1 0 0 1 1.414-1.414l4.829 4.828 4.828-4.828a1 1 0 1 1 1.414 1.414l-4.828 4.829 4.828 4.828z" />
            ) : (
              <path fillRule="evenodd" d="M4 5h16a1 1 0 0 1 0 2H4a1 1 0 1 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2zm0 6h16a1 1 0 0 1 0 2H4a1 1 0 0 1 0-2z" />
            )}
          </svg>
        </button>
      </div>

      {/* mobile dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full w-full bg-white p-4 lg:hidden shadow-xl">
          <NavLinks vertical />
        </div>
      )}
    </nav>
  );
};

export default NavBar;
