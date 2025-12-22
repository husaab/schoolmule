'use client'
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import LogoutModal from '../logout/logoutModal';
import {
  Cog6ToothIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  HomeIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClipboardDocumentListIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  PencilSquareIcon,
  EyeIcon,
  BanknotesIcon,
  PresentationChartLineIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore'
import { useSidebarStore } from '@/store/useSidebarStore'

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface DropdownLink extends NavLink {
  subLinks?: NavLink[];
}

const teacherLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/students', label: 'Students', icon: UserGroupIcon },
  { href: '/classes', label: 'Classes', icon: AcademicCapIcon },
  { href: '/gradebook', label: 'Gradebook', icon: BookOpenIcon },
];

const parentLinks: NavLink[] = [
  { href: '/parent/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/parent/communication', label: 'Communication', icon: ChatBubbleLeftRightIcon },
  { href: '/parent/feedback', label: 'Feedback', icon: DocumentTextIcon },
  { href: '/parent/report-cards', label: 'Report Cards', icon: DocumentChartBarIcon }
];

const supportLinks: NavLink[] = [
  { href: '/support', label: 'Help & Support', icon: QuestionMarkCircleIcon },
  { href: '/contact-us', label: 'Contact', icon: EnvelopeIcon }
];

const Sidebar = () => {
  const pathname = usePathname();
  const user = useUserStore(s => s.user);
  const { isOpen: sidebarOpen, closeSidebar } = useSidebarStore();

  const isAttendancePath = pathname.startsWith('/attendance');
  const isReportCardPath = pathname.startsWith('/report-cards');
  const isFeedbackPath = pathname.startsWith('/feedback')
  const isFinancialPath = pathname.startsWith('/financials')

  const [feedbackOpen, setFeedbackOpen] = useState(isFeedbackPath)
  const [attendanceOpen, setAttendanceOpen] = useState(isAttendancePath);
  const [reportCardOpen, setReportCardOpen] = useState(isReportCardPath);
  const [financialOpen, setFinancialOpen] = useState(isFinancialPath);

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

  if (!user) return null

  const NavItem = ({ href, label, icon: Icon, isActive }: { href: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; isActive: boolean }) => (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
        isActive
          ? 'bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 font-medium border border-cyan-100'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
      <span className="text-sm">{label}</span>
    </Link>
  );

  const DropdownSection = ({
    label,
    icon: Icon,
    isOpen,
    onToggle,
    children,
    isActive
  }: {
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    isActive: boolean;
  }) => (
    <div>
      <button
        onClick={onToggle}
        className={`flex items-center justify-between w-full px-4 py-2.5 rounded-xl transition-all duration-200 cursor-pointer ${
          isActive
            ? 'bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 font-medium border border-cyan-100'
            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
          <span className="text-sm">{label}</span>
        </div>
        {isOpen ? (
          <ChevronDownIcon className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronRightIcon className="w-4 h-4 text-slate-400" />
        )}
      </button>
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="ml-4 mt-1 pl-4 border-l-2 border-slate-100 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );

  const SubNavItem = ({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }) => {
    const isActive = pathname === href || pathname.startsWith(href + '/');
    return (
      <Link
        href={href}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-200 ${
          isActive
            ? 'bg-cyan-50 text-cyan-700 font-medium'
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
        }`}
      >
        <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-600' : 'text-slate-400'}`} />
        {label}
      </Link>
    );
  };

  return (
    <aside
      id="mobile-sidebar"
      className={`
        w-72 fixed top-0 bottom-0 left-0 bg-white border-r border-slate-200 z-40
        transform transition-transform duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}
    >
      {/* Header */}
      <div className="h-20 flex items-center justify-center px-6 relative">
        <Link href={user?.role === 'PARENT' ? '/parent/dashboard' : '/dashboard'} className="group">
          <Image
            src="/logo/trimmedlogo.png"
            alt="SchoolMule"
            width={140}
            height={44}
            className="h-18 w-auto transition-transform duration-200 group-hover:scale-105 pr-4"
          />
        </Link>
        <button
          onClick={closeSidebar}
          className="lg:hidden absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
        {/* Main Links */}
        {(user?.role === 'PARENT' ? parentLinks : teacherLinks).map(link => (
          <NavItem
            key={link.href}
            href={link.href}
            label={link.label}
            icon={link.icon}
            isActive={pathname === link.href}
          />
        ))}

        {user?.role !== 'PARENT' && (
          <>
            {/* Divider */}
            <div className="py-3">
              <div className="border-t border-slate-100" />
            </div>

            {/* Attendance Dropdown */}
            <DropdownSection
              label="Attendance"
              icon={ClipboardDocumentCheckIcon}
              isOpen={attendanceOpen}
              onToggle={() => setAttendanceOpen(!attendanceOpen)}
              isActive={isAttendancePath}
            >
              <SubNavItem href="/attendance/general" label="General Attendance" icon={ClipboardDocumentListIcon} />
              <SubNavItem href="/attendance/class" label="Class Attendance" icon={AcademicCapIcon} />
            </DropdownSection>

            {/* Reports */}
            <NavItem
              href="/reports"
              label="Reports"
              icon={ChartBarIcon}
              isActive={pathname.startsWith('/reports')}
            />

            {/* Report Cards Dropdown */}
            <DropdownSection
              label="Report Cards"
              icon={DocumentChartBarIcon}
              isOpen={reportCardOpen}
              onToggle={() => setReportCardOpen(!reportCardOpen)}
              isActive={isReportCardPath}
            >
              <SubNavItem href="/report-cards/generate" label="Generate" icon={PencilSquareIcon} />
              <SubNavItem href="/report-cards/view" label="View & Download" icon={EyeIcon} />
            </DropdownSection>

            {/* Financials Dropdown */}
            <DropdownSection
              label="Financials"
              icon={CurrencyDollarIcon}
              isOpen={financialOpen}
              onToggle={() => setFinancialOpen(o => !o)}
              isActive={isFinancialPath}
            >
              <SubNavItem href="/financials/tuition" label="Tuition & Invoices" icon={BanknotesIcon} />
              <SubNavItem href="/financials/overview" label="Financial Overview" icon={PresentationChartLineIcon} />
            </DropdownSection>

            {/* Divider */}
            <div className="py-3">
              <div className="border-t border-slate-100" />
            </div>

            {/* Schedule */}
            <NavItem
              href="/schedule"
              label="Schedule"
              icon={CalendarDaysIcon}
              isActive={pathname === '/schedule'}
            />

            {/* Feedback Dropdown */}
            <DropdownSection
              label="Feedback"
              icon={ChatBubbleLeftRightIcon}
              isOpen={feedbackOpen}
              onToggle={() => setFeedbackOpen(!feedbackOpen)}
              isActive={isFeedbackPath}
            >
              <SubNavItem href="/feedback/send" label="Send Feedback" icon={PencilSquareIcon} />
              <SubNavItem href="/feedback" label="View & Edit" icon={EyeIcon} />
            </DropdownSection>

            {/* Communication */}
            <NavItem
              href="/communication"
              label="Parent Communication"
              icon={EnvelopeIcon}
              isActive={pathname === '/communication'}
            />

            {/* Admin Panel */}
            {user?.role === 'ADMIN' && (
              <NavItem
                href="/admin-panel"
                label="Admin Panel"
                icon={ShieldCheckIcon}
                isActive={pathname.startsWith('/admin-panel')}
              />
            )}
          </>
        )}

        {/* Divider */}
        <div className="py-3">
          <div className="border-t border-slate-100" />
        </div>

        {/* Settings */}
        <NavItem
          href="/settings"
          label="Settings"
          icon={Cog6ToothIcon}
          isActive={pathname === '/settings'}
        />

        {/* Support Links (Mobile) */}
        <div className="lg:hidden space-y-1.5">
          {supportLinks.map(link => (
            <NavItem
              key={link.href}
              href={link.href}
              label={link.label}
              icon={link.icon}
              isActive={pathname === link.href}
            />
          ))}
        </div>

        {/* Logout */}
        <div className="pt-2">
          <LogoutModal />
        </div>
      </nav>

      {/* User Info Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-white font-semibold text-sm">
            {user.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user.username}</p>
            <p className="text-xs text-slate-500 truncate">{user.role}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar;
