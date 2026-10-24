'use client'
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import LogoutModal from '../logout/logoutModal';
import Avatar from '@/components/avatar/Avatar';
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
  ChartBarIcon,
  ClipboardDocumentListIcon,
  QuestionMarkCircleIcon,
  EnvelopeIcon,
  ShieldCheckIcon,
  DocumentChartBarIcon,
  PencilSquareIcon,
  EyeIcon,
  PresentationChartLineIcon,
  UserCircleIcon,
  IdentificationIcon,
  SparklesIcon,
  TrophyIcon,
  CalendarDaysIcon,
  Squares2X2Icon,
  ChatBubbleLeftRightIcon,
  InboxIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  GlobeAltIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect, useSyncExternalStore, Fragment } from 'react';
import { useUserStore } from '@/store/useUserStore'
import { useSidebarStore } from '@/store/useSidebarStore'
import { usePatchNotesStore } from '@/store/usePatchNotesStore'
import { useRegistrationStore } from '@/store/useRegistrationStore'
import { useMessagingStore } from '@/store/useMessagingStore'
import { inboxBadgeCount, inboxBadgeLabel } from '@/components/messaging/formatters'
import { getNewSubmissionCount } from '@/services/registrationService'
import SchoolYearSelector from '@/components/navbar/SchoolYearSelector'
import ChildSwitcher from '@/components/parent/ChildSwitcher'
import ViewSwitcher from '@/components/navbar/ViewSwitcher'
import { canSwitchViews, viewLabelFor } from '@/lib/viewSwitch'
import { roleLabel } from '@/components/adminUsers/userDisplay'
import { useRememberedHref } from '@/hooks/useFilterParams'
import { useParentClassesSeen } from '@/lib/parentClassesSeen'
import { accessInfo, canOpenPath } from '@/lib/permissions'
import { ADMIN_PANEL_OVERVIEW, adminPanelNavFor } from '@/lib/adminPanelNav'
import { VIEW_WEBSITE_HREF } from '@/lib/websiteVisit'

interface NavLink {
  href: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

interface DropdownLink extends NavLink {
  subLinks?: NavLink[];
}

// Staff main links. Each shows only when its page opens for the user
// (lib/permissions ROUTE_RULES), so a link can never lead to a bounce.
const teacherLinks: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: HomeIcon },
  { href: '/students', label: 'Students', icon: UserGroupIcon },
  { href: '/classes', label: 'Classes', icon: AcademicCapIcon },
  { href: '/messages', label: 'Messages', icon: InboxIcon },
  { href: '/analytics', label: 'Analytics', icon: PresentationChartLineIcon },
];

const parentLinks: NavLink[] = [
  { href: '/parent/dashboard', label: 'Overview', icon: HomeIcon },
  { href: '/parent/classes', label: 'Classes', icon: AcademicCapIcon },
  { href: '/parent/grades', label: 'Grades', icon: BookOpenIcon },
  { href: '/parent/messages', label: 'Messages', icon: InboxIcon },
  { href: '/parent/attendance', label: 'Attendance', icon: ClipboardDocumentCheckIcon },
  { href: '/parent/calendar', label: 'Calendar', icon: CalendarDaysIcon },
  { href: '/parent/feedback', label: 'Feedback', icon: ChatBubbleLeftRightIcon },
  { href: '/parent/report-cards', label: 'Report Cards', icon: DocumentChartBarIcon },
  { href: '/parent/staff', label: 'Staff Directory', icon: UserGroupIcon }
];

const supportLinks: NavLink[] = [
  { href: '/support', label: 'Help & Support', icon: QuestionMarkCircleIcon },
  { href: '/contact-us', label: 'Contact', icon: EnvelopeIcon }
];

// The Gradebook item left the sidebar (it is each class's Grades tab now).
// Staff see a one-line pointer under Classes until they dismiss it. Stored
// in localStorage; when storage is unavailable it stays dismissed for the tab.
const GRADEBOOK_HINT_KEY = 'sm.hint.gradebookMoved'
let gradebookHintDismissed = false
const gradebookHintListeners = new Set<() => void>()
const readGradebookHintDismissed = () => {
  if (gradebookHintDismissed) return true
  try {
    return window.localStorage.getItem(GRADEBOOK_HINT_KEY) === '1'
  } catch {
    return false
  }
}
const subscribeGradebookHint = (listener: () => void) => {
  gradebookHintListeners.add(listener)
  return () => {
    gradebookHintListeners.delete(listener)
  }
}
const dismissGradebookHint = () => {
  gradebookHintDismissed = true
  try {
    window.localStorage.setItem(GRADEBOOK_HINT_KEY, '1')
  } catch {
    // Storage unavailable: dismissed for this tab only.
  }
  gradebookHintListeners.forEach((l) => l())
}

const Sidebar = () => {
  const pathname = usePathname();
  const user = useUserStore(s => s.user);
  const { isOpen: sidebarOpen, closeSidebar } = useSidebarStore();
  const hasUnread = usePatchNotesStore((s) => s.hasUnread);

  const newSubmissionCount = useRegistrationStore((s) => s.newSubmissionCount);
  const setNewSubmissionCount = useRegistrationStore((s) => s.setNewSubmissionCount);
  const inboxCount = useMessagingStore((s) => inboxBadgeCount(s.summary));
  const inboxLabel = useMessagingStore((s) => inboxBadgeLabel(s.summary, user?.role === 'PARENT'));
  // Hidden on the server render; shown after hydration unless dismissed.
  const gradebookHintHidden = useSyncExternalStore(subscribeGradebookHint, readGradebookHintDismissed, () => true);
  // A small "New" pill beside a parent's Classes link until they first open the page.
  const parentClassesSeen = useParentClassesSeen();

  // What this user may open (lib/permissions): every item below asks the
  // same rules the router enforces.
  const allowed = (href: string) => canOpenPath(href, user);
  const isStaff = accessInfo(user).staff;
  const isAttendancePath = pathname.startsWith('/attendance');
  const isReportCardPath = pathname.startsWith('/report-cards');
  const isRegistrationPath = pathname.startsWith('/admin-panel/forms');
  const isSchoolSchedulePath = pathname === '/school-schedule';
  const isFinancePath = pathname.startsWith('/finance');

  const canForms = allowed('/admin-panel/forms');
  const canFinance = allowed('/finance/tuition');
  const canGeneralAttendance = allowed('/attendance/general');
  const canClassAttendance = allowed('/attendance/class');
  const canReports = allowed('/reports');
  const canStudentViews = allowed('/student-views');
  const canReportCards = allowed('/report-cards/generate');
  const hasToolsBlock = canGeneralAttendance || canClassAttendance || canReports || canStudentViews || canReportCards;
  const adminPanel = adminPanelNavFor(user);
  const showAdminPanel = adminPanel.show;
  const mainLinks = user?.role === 'PARENT' ? parentLinks : teacherLinks.filter((l) => allowed(l.href));
  // School Schedule sits in the Admin Panel dropdown when there is one; otherwise it is a top-level link.
  const isAdminPanelPath =
    (pathname.startsWith('/admin-panel') && !isRegistrationPath) || (showAdminPanel && isSchoolSchedulePath);

  const [attendanceOpen, setAttendanceOpen] = useState(isAttendancePath);
  const [reportCardOpen, setReportCardOpen] = useState(isReportCardPath);
  const [registrationOpen, setRegistrationOpen] = useState(isRegistrationPath);
  const [adminPanelOpen, setAdminPanelOpen] = useState(isAdminPanelPath);
  const [financeOpen, setFinanceOpen] = useState(isFinancePath);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    closeSidebar();
  }, [pathname, closeSidebar]);

  // The forms' new-submission dot, for whoever can open the forms
  useEffect(() => {
    if (canForms) {
      getNewSubmissionCount()
        .then((res) => setNewSubmissionCount(res.data.count))
        .catch(() => {});
    }
  }, [canForms, setNewSubmissionCount]);

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

  // A custom access role names what the account does better than its base role.
  const staffLabel = (isStaff && user.accessRole?.name) || roleLabel(user.role ?? '')

  // Nav hrefs re-expand each page's remembered filters (filter memory), so
  // returning to Students via the sidebar shows the grade the user had picked.
  const NavItem = ({ href, label, icon: Icon, isActive, badge, badgeTitle, pill }: { href: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; isActive: boolean; badge?: number; badgeTitle?: string; pill?: string }) => (
    <Link
      href={useRememberedHref(href)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${
        isActive
          ? 'bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 font-medium border border-cyan-100'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
      <span className="text-sm flex-1">{label}</span>
      {pill && (
        <span className="rounded-full bg-amber-700 px-[7px] py-0.5 text-[10px] font-semibold text-white">{pill}</span>
      )}
      {badge !== undefined && badge > 0 && (
        <span title={badgeTitle} className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold text-white ${user?.role === 'PARENT' ? 'bg-amber-700' : 'bg-cyan-600'}`}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
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
      <div className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-[64rem] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="ml-4 mt-1 pl-4 border-l-2 border-slate-100 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );

  // Small label that splits a long dropdown into scannable groups
  const SubNavGroup = ({ label }: { label: string }) => (
    <p className="px-3 pt-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-slate-400 select-none">
      {label}
    </p>
  );

  const SubNavItem = ({ href, label, icon: Icon, exact }: { href: string; label: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; exact?: boolean }) => {
    const isActive = exact ? pathname === href : (pathname === href || pathname.startsWith(href + '/'));
    const rememberedHref = useRememberedHref(href)
    return (
      <Link
        href={rememberedHref}
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
        w-72 fixed top-0 bottom-0 left-0 bg-white border-r border-slate-200 z-[56]
        flex flex-col
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
        {/* School Year Selector (Mobile) */}
        <div className="lg:hidden px-0 pb-2">
          <SchoolYearSelector />
        </div>

        {/* Child Switcher (Parents) */}
        {user?.role === 'PARENT' && <ChildSwitcher />}

        {/* Main Links */}
        {mainLinks.map(link => (
          <Fragment key={link.href}>
            <NavItem
              href={link.href}
              label={link.label}
              icon={link.icon}
              isActive={
                user?.role === 'PARENT' || link.href === '/classes'
                  ? pathname === link.href || pathname.startsWith(link.href + '/')
                  : pathname === link.href
              }
              badge={link.href === '/messages' || link.href === '/parent/messages' ? inboxCount : undefined}
              badgeTitle={link.href === '/messages' || link.href === '/parent/messages' ? inboxLabel : undefined}
              pill={link.href === '/parent/classes' && !parentClassesSeen ? 'New' : undefined}
            />
            {link.href === '/classes' && isStaff && !gradebookHintHidden && (
              <div className="ml-11 mr-1 flex items-start gap-2 rounded-lg bg-cyan-50 px-3 py-2 text-xs text-cyan-800">
                <span className="flex-1">Gradebook moved: open a class, then Grades.</span>
                <button
                  type="button"
                  onClick={dismissGradebookHint}
                  aria-label="Dismiss the gradebook note"
                  className="-mr-1 cursor-pointer rounded p-0.5 text-cyan-700 hover:bg-cyan-100"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </Fragment>
        ))}

        {user?.role !== 'PARENT' && (
          <>
            {hasToolsBlock && (
              <div className="py-3">
                <div className="border-t border-slate-100" />
              </div>
            )}

            {/* Attendance Dropdown */}
            {(canGeneralAttendance || canClassAttendance) && (
              <DropdownSection
                label="Attendance"
                icon={ClipboardDocumentCheckIcon}
                isOpen={attendanceOpen}
                onToggle={() => setAttendanceOpen(!attendanceOpen)}
                isActive={isAttendancePath}
              >
                {canGeneralAttendance && (
                  <SubNavItem href="/attendance/general" label="General Attendance" icon={ClipboardDocumentListIcon} />
                )}
                {canClassAttendance && (
                  <SubNavItem href="/attendance/class" label="Class Attendance" icon={AcademicCapIcon} />
                )}
              </DropdownSection>
            )}

            {/* Reports */}
            {canReports && (
              <NavItem
                href="/reports"
                label="Reports"
                icon={ChartBarIcon}
                isActive={pathname.startsWith('/reports')}
              />
            )}

            {/* Student Views — custom filtered lists for awards/recognition */}
            {canStudentViews && (
              <NavItem
                href="/student-views"
                label="Student Views"
                icon={TrophyIcon}
                isActive={pathname.startsWith('/student-views')}
              />
            )}

            {/* Report Cards Dropdown */}
            {canReportCards && (
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
            )}

            {/* Divider */}
            <div className="py-3">
              <div className="border-t border-slate-100" />
            </div>

            {/* Attendance log: staff_attendance holders manage everyone's, other staff see their own */}
            {allowed('/staff-attendance') ? (
              <NavItem
                href="/staff-attendance"
                label="Staff Attendance"
                icon={IdentificationIcon}
                isActive={pathname === '/staff-attendance'}
              />
            ) : (
              <NavItem
                href="/my-attendance"
                label="My Attendance"
                icon={UserCircleIcon}
                isActive={pathname === '/my-attendance'}
              />
            )}

            {/* School Schedule — the published timetable. Top-level unless the Admin Panel dropdown carries it. */}
            {!showAdminPanel && (
              <NavItem
                href="/school-schedule"
                label="School Schedule"
                icon={CalendarDaysIcon}
                isActive={isSchoolSchedulePath}
              />
            )}

            {/* Forms and Finance stay on the side; everything else lives in the Admin Panel dropdown */}
            {canForms && (
              <DropdownSection
                label="Forms"
                icon={ClipboardDocumentListIcon}
                isOpen={registrationOpen}
                onToggle={() => setRegistrationOpen(!registrationOpen)}
                isActive={isRegistrationPath}
              >
                <SubNavItem href="/admin-panel/forms" label="Form Builder" icon={PencilSquareIcon} exact />
                <div className="relative">
                  <SubNavItem href="/admin-panel/forms/submissions" label="Submissions" icon={EyeIcon} />
                  {newSubmissionCount > 0 && (
                    <span className="absolute top-1/2 -translate-y-1/2 right-2 h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                  )}
                </div>
              </DropdownSection>
            )}

            {canFinance && (
              <DropdownSection
                label="Finance"
                icon={BanknotesIcon}
                isOpen={financeOpen}
                onToggle={() => setFinanceOpen(!financeOpen)}
                isActive={isFinancePath}
              >
                <SubNavItem href="/finance/tuition" label="Tuition" icon={CurrencyDollarIcon} />
              </DropdownSection>
            )}

            {showAdminPanel && (
              <DropdownSection
                label="Admin Panel"
                icon={ShieldCheckIcon}
                isOpen={adminPanelOpen}
                onToggle={() => setAdminPanelOpen(!adminPanelOpen)}
                isActive={isAdminPanelPath}
              >
                {/* Overview stays pinned first */}
                {adminPanel.overview && (
                  <SubNavItem href={ADMIN_PANEL_OVERVIEW} label="Overview" icon={Squares2X2Icon} exact />
                )}
                {adminPanel.groups.map((group) => (
                  <Fragment key={group.label}>
                    <SubNavGroup label={group.label} />
                    {group.items.map((item) => (
                      <SubNavItem key={item.href} href={item.href} label={item.label} icon={item.icon} exact={item.exact} />
                    ))}
                  </Fragment>
                ))}
              </DropdownSection>
            )}
          </>
        )}

        {/* Divider */}
        <div className="py-1">
          <div className="border-t border-slate-100" />
        </div>

        {/* What's New (not shown to parents) */}
        {user?.role !== 'PARENT' && (
          <div className="relative">
            <NavItem
              href="/whats-new"
              icon={SparklesIcon}
              label="What's New"
              isActive={pathname === '/whats-new'}
            />
            {hasUnread && (
              <span className="absolute top-1/2 -translate-y-1/2 right-4 h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            )}
          </div>
        )}

        {/* Settings */}
        <NavItem
          href="/settings"
          label="Settings"
          icon={Cog6ToothIcon}
          isActive={pathname === '/settings'}
        />

        {/* The marketing website, in its own tab: opening it there lets a
            signed-in user browse it, while this tab stays in the app. */}
        <a
          href={VIEW_WEBSITE_HREF}
          target="_blank"
          rel="noopener"
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group text-slate-600 hover:bg-slate-50 hover:text-slate-900"
        >
          <GlobeAltIcon className="w-5 h-5 flex-shrink-0 text-slate-400 group-hover:text-slate-600" />
          <span className="text-sm flex-1">SchoolMule website</span>
          <ArrowTopRightOnSquareIcon className="w-4 h-4 flex-shrink-0 text-slate-300 group-hover:text-slate-500" />
        </a>

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

      {/* User Info Footer. The card opens Settings (photo, avatar, password).
          For staff who are also parents it names the active view and carries
          the switch; this is the only placement on phones. */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
        <Link
          href="/settings"
          title="Profile and settings"
          aria-current={pathname === '/settings' ? 'page' : undefined}
          className="-m-2 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
        >
          <Avatar
            name={user.fullName || user.username || 'You'}
            avatar={user.avatar}
            photoUrl={user.photoUrl}
            size={40}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 truncate">{user.username}</p>
            <p className="text-xs text-slate-500 truncate">
              {canSwitchViews(user)
                ? user.role === 'PARENT'
                  ? `${viewLabelFor(user.role)} · ${user.accessRole?.name ?? roleLabel(user.baseRole ?? '')} account`
                  : `${staffLabel} · also a parent`
                : staffLabel}
            </p>
          </div>
        </Link>
        <ViewSwitcher variant="card" />
      </div>
    </aside>
  )
}

export default Sidebar;
