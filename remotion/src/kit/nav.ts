import {
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  BarChart3,
  CalendarCheck,
  FileText,
  Eye,
  ScrollText,
  DollarSign,
  FileInput,
  Shield,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

export type NavKey =
  | 'dashboard'
  | 'students'
  | 'classes'
  | 'gradebook'
  | 'analytics'
  | 'attendance'
  | 'reports'
  | 'studentviews'
  | 'reportcards'
  | 'financials'
  | 'forms'
  | 'admin'
  | 'settings'
  | 'logout';

export interface NavItem {
  key: NavKey;
  label: string;
  Icon: LucideIcon;
  danger?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { key: 'students', label: 'Students', Icon: Users },
  { key: 'classes', label: 'Classes', Icon: BookOpen },
  { key: 'gradebook', label: 'Gradebook', Icon: ClipboardList },
  { key: 'analytics', label: 'Analytics', Icon: BarChart3 },
  { key: 'attendance', label: 'Attendance', Icon: CalendarCheck },
  { key: 'reports', label: 'Reports', Icon: FileText },
  { key: 'studentviews', label: 'Student Views', Icon: Eye },
  { key: 'reportcards', label: 'Report Cards', Icon: ScrollText },
  { key: 'financials', label: 'Financials', Icon: DollarSign },
  { key: 'forms', label: 'Forms', Icon: FileInput },
  { key: 'admin', label: 'Admin Panel', Icon: Shield },
  { key: 'settings', label: 'Settings', Icon: Settings },
  { key: 'logout', label: 'Logout', Icon: LogOut, danger: true },
];
