'use client'
import { FC, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import NavLinks from '../navlinks/Navlinks';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

const NavBar: FC = () => {
  const [scrolled, setScrolled] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [notScrollable, setNotScrollable] = useState<boolean>(false);

  useEffect(() => {
    const checkScrollable = () => {
      // Check if page is scrollable
      const isScrollable = document.documentElement.scrollHeight > window.innerHeight;
      setNotScrollable(!isScrollable);
    };

    const handleScroll = () => setScrolled(window.pageYOffset > 20);

    // Initial checks
    handleScroll();
    checkScrollable();

    // Listen for scroll
    window.addEventListener('scroll', handleScroll);

    // Listen for resize (content might change scrollability)
    window.addEventListener('resize', checkScrollable);

    // Also check after a short delay for dynamic content
    const timeout = setTimeout(checkScrollable, 100);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkScrollable);
      clearTimeout(timeout);
    };
  }, []);

  // Apply white background if scrolled OR if page is not scrollable OR if menu is open
  const showWhiteBackground = scrolled || notScrollable || isOpen;

  return (
    <nav
      className={`fixed w-full top-0 z-50 transition-all duration-300 ease-out ${
        showWhiteBackground
          ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-100'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-25">
          {/* Logo */}
          <Link href="/" scroll={false} className="flex items-center group">
            <Image
              src="/logo/trimmedlogo.png"
              alt="SchoolMule Logo"
              width={140}
              height={36}
              quality={100}
              className="transition-transform duration-300 group-hover:scale-105 h-20 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:block">
            <NavLinks />
          </div>

          {/* Mobile Menu Button */}
          <button
            className="p-2 rounded-xl lg:hidden text-slate-700 hover:bg-slate-100 transition-colors"
            onClick={() => setIsOpen((o) => !o)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
          >
            {isOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      <div
        className={`lg:hidden transition-all duration-300 ease-out overflow-hidden ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-slate-100 px-4 py-6 shadow-xl">
          <NavLinks vertical onLinkClick={() => setIsOpen(false)} />
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
