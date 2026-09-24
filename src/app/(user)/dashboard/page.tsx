'use client'

// Schedule-first dashboard, then the numbers, then the term.
//
// The day ribbon leads because the first question at 8:40 AM is "where am I
// supposed to be". Four clickable tiles follow, then academics sit beside
// attendance in the main column — a principal is judged on both, so the page
// no longer charts one and reduces the other to a single figure. The right
// rail holds what is coming (this week), the AI briefing, and the staff
// directory.
//
// Analytics loads after the summary and attendance requests, keyed on the
// active term id (resolved here — useUserStore only knows the term's name),
// and every analytics card owns its own loading/empty/error state so an
// analytics failure never takes the rest of the page down.

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format, isWeekend } from 'date-fns'
import Navbar from '../../../components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useMyScheduleStore } from '@/store/useMyScheduleStore'
import { getSchoolName } from '@/lib/schoolUtils'
import { getDashboardSummary, getAttendanceTrend } from '@/services/dashboardService'
import { DashboardSummaryData, AttendanceTrendPoint } from '@/services/types/dashboard'
import { getTodayStatus, checkIn, getPaySchedule } from '@/services/teacherAttendanceService'
import {
  useAnalyticsOverview,
  useAnalyticsSnapshot,
  useAnalyticsClassesHealth,
} from '@/components/analytics/useAnalyticsData'
import Spinner from '@/components/Spinner'
import Card from '@/components/ui/Card'
import CheckInModal from '@/components/teacherAttendance/CheckInModal'
import DayRibbon from '@/components/schedulePlanner/DayRibbon'
import SchoolDayPanel from '@/components/schedulePlanner/SchoolDayPanel'
import StaffList from '@/components/staff/StaffList'
import DailyBriefing from '@/components/dashboard/DailyBriefing'
import HeadlineTiles from '@/components/dashboard/HeadlineTiles'
import AcademicsPanel from '@/components/dashboard/AcademicsPanel'
import MyClassesPanel from '@/components/dashboard/MyClassesPanel'
import AttendanceCard from '@/components/dashboard/AttendanceCard'
import ThisWeekCard from '@/components/dashboard/ThisWeekCard'
import { useDashboardTerms } from '@/components/dashboard/useDashboardTerms'
import {
  AcademicCapIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ChartBarIcon,
  ChevronDownIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

/** Time-of-day greeting — the dashboard is opened at a specific moment. */
const greetingFor = (date: Date): string => {
  const hour = date.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// Header buttons rather than a card: three verbs the user came here to do
// belong next to the greeting, not below the fold. Each keeps its own hue so
// the row is scannable by colour, not just by reading three similar labels.
const QUICK_ACTIONS = [
  { href: '/classes', label: 'Open classes', icon: AcademicCapIcon, chip: 'text-cyan-700 bg-cyan-50', hover: 'hover:border-cyan-300 hover:bg-cyan-50/40' },
  { href: '/gradebook', label: 'Enter grades', icon: BookOpenIcon, chip: 'text-violet-700 bg-violet-50', hover: 'hover:border-violet-300 hover:bg-violet-50/40' },
  { href: '/attendance/general', label: 'Take attendance', icon: ClipboardDocumentCheckIcon, chip: 'text-emerald-700 bg-emerald-50', hover: 'hover:border-emerald-300 hover:bg-emerald-50/40' },
]

const DashboardPage: React.FC = () => {
  const user = useUserStore((state) => state.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const isAdmin = user.role === 'ADMIN'
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const today = format(new Date(), 'yyyy-MM-dd')
  const [trend, setTrend] = useState<AttendanceTrendPoint[]>([])
  const [daysWindow, setDaysWindow] = useState<number>(7)
  const [showCheckIn, setShowCheckIn] = useState(false)
  const [checkInPayDate, setCheckInPayDate] = useState<string | null>(null)
  const [staffOpen, setStaffOpen] = useState(false)
  // Already loaded by the day ribbon; read it so the briefing can flag a
  // school that has never published a timetable.
  const mySchedule = useMyScheduleStore((s) => s.data)

  // Check-in flow: localStorage for instant suppression, backend as source of truth
  useEffect(() => {
    if (!user.id || user.role === 'PARENT') return

    // No check-in prompt on weekends or during summer break (July/August)
    const now = new Date()
    if (isWeekend(now) || now.getMonth() === 6 || now.getMonth() === 7) return

    const localKey = `checkin_date_${user.id}`
    const todayStr = format(new Date(), 'yyyy-MM-dd')

    // Fast path: already checked in today per localStorage
    if (localStorage.getItem(localKey) === todayStr) return

    // Slow path: ask the backend (send local date to avoid UTC mismatch)
    getTodayStatus(todayStr)
      .then((res) => {
        if (res.data.checkedIn) {
          localStorage.setItem(localKey, todayStr)
          // No prompt when they aren't expected in (school closed, or a part-timer's day off)
        } else if (res.data.expected !== false) {
          setShowCheckIn(true)
          // One quiet line in the prompt: which pay day today counts toward.
          getPaySchedule()
            .then((pay) => setCheckInPayDate(pay.data.currentPeriod?.payDate ?? null))
            .catch(() => setCheckInPayDate(null))
        }
      })
      .catch(() => {
        // Silently fail — don't block dashboard
      })
  }, [user.id, user.role])

  const handleCheckIn = useCallback(
    async (status: 'PRESENT' | 'ABSENT', notes: string | null) => {
      const todayStr = format(new Date(), 'yyyy-MM-dd')
      await checkIn(status, todayStr, notes)
      localStorage.setItem(`checkin_date_${user.id}`, todayStr)
      setShowCheckIn(false)
    },
    [user.id]
  )

  // The summary gates the page; the trend does not. They are separate effects
  // so that changing the attendance window re-fetches only the chart and never
  // flips the page back to its spinner (which would also reset every analytics
  // request below, since those key off the summary being on screen).
  useEffect(() => {
    if (!user.school) return
    let cancelled = false
    setLoading(true)
    getDashboardSummary(user.school, user.activeTerm!, today)
      .then((res) => {
        if (!cancelled) setSummary(res.data)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setError('Failed to load dashboard data')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [user.school, user.activeTerm, today, selectedYearId]) // refetch when the selected school year changes

  useEffect(() => {
    if (!user.school) return
    let cancelled = false
    getAttendanceTrend(user.school, daysWindow, today)
      .then((res) => {
        if (!cancelled) setTrend(res.data)
      })
      .catch((err) => {
        // The chart shows its empty state; the rest of the page is unaffected.
        console.error(err)
        if (!cancelled) setTrend([])
      })
    return () => {
      cancelled = true
    }
  }, [user.school, daysWindow, today, selectedYearId])

  // ── Analytics: one request per endpoint per term, started only once the
  //    summary is on screen. Teachers get their own classes (server-scoped)
  //    plus the student snapshot for check-ins; admins get the school overview
  //    compared against the previous term.
  const { activeTerm, previousTerm, loading: termsLoading } = useDashboardTerms(user.school, selectedYearId)
  const termId = summary && activeTerm ? activeTerm.termId : null
  const overview = useAnalyticsOverview(termId, 'null_skip', isAdmin ? (previousTerm?.termId ?? null) : null)
  const classesHealth = useAnalyticsClassesHealth(isAdmin ? null : termId, 'null_skip')
  const snapshot = useAnalyticsSnapshot(isAdmin ? null : termId, 'null_skip')
  const analyticsPending = termsLoading || (Boolean(activeTerm) && !termId)

  if (loading) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
            <Spinner />
          </div>
        </main>
      </>
    )
  }

  if (error || !summary) {
    return (
      <>
        <Navbar />
        <Sidebar />
        <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
          <div className="flex items-center justify-center h-[calc(100vh-5rem)]">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-slate-600">{error || 'No data available'}</p>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          {/* Header: greeting on the left, the three things to do on the right */}
          <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-semibold text-slate-900 tracking-tight">
                {greetingFor(new Date())}, {user.username}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {format(new Date(), 'EEEE, MMMM d')}
                {user.school ? ` · ${getSchoolName(user.school)}` : ''}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((a) => (
                <Link
                  key={a.href}
                  href={a.href}
                  className={`inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white pl-2 pr-3.5 py-1.5 text-sm font-medium text-slate-800 transition-colors ${a.hover}`}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${a.chip}`}>
                    <a.icon className="h-4 w-4" />
                  </span>
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Today: the teacher's own day, or who is where across the school */}
          {isAdmin ? <SchoolDayPanel /> : <DayRibbon />}

          <HeadlineTiles
            isAdmin={isAdmin}
            summary={summary}
            today={today}
            termId={termId}
            previousTermName={previousTerm?.name ?? null}
            pending={analyticsPending}
            overview={overview}
            classesHealth={classesHealth}
          />

          {/* Main column: academics then attendance. Rail: what's coming,
              the briefing, and the staff directory folded away. */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6 items-start">
            <div className="xl:col-span-2 space-y-4">
              {isAdmin ? (
                <AcademicsPanel
                  overview={overview}
                  termId={termId}
                  termName={activeTerm?.name ?? null}
                  previousTermName={previousTerm?.name ?? null}
                  pending={analyticsPending}
                  hasTerm={Boolean(activeTerm)}
                />
              ) : (
                <MyClassesPanel
                  classesHealth={classesHealth}
                  snapshot={snapshot}
                  overview={overview}
                  termId={termId}
                  termName={activeTerm?.name ?? null}
                  pending={analyticsPending}
                  hasTerm={Boolean(activeTerm)}
                />
              )}
              <AttendanceCard
                trend={trend}
                daysWindow={daysWindow}
                onWindowChange={setDaysWindow}
                weekly={summary.weeklyAttendance}
                monthly={summary.monthlyAttendance}
                today={today}
              />
            </div>

            <div className="space-y-4">
              {user.school && <ThisWeekCard school={user.school} isAdmin={isAdmin} />}
              {user.school && (
                <DailyBriefing
                  summary={summary}
                  trend={trend}
                  schoolName={getSchoolName(user.school)}
                  schoolCode={user.school}
                  today={today}
                  hasPublishedSchedule={Boolean(mySchedule?.schedule)}
                />
              )}
              {/* Staff directory: still here for everyone who needs a colleague's
                  contact details, but folded away so it stops burying the page. */}
              <Card flush>
                <button
                  onClick={() => setStaffOpen((open) => !open)}
                  aria-expanded={staffOpen}
                  className="group flex w-full items-center gap-3 px-5 py-4 text-left cursor-pointer"
                >
                  <UsersIcon className="h-5 w-5 text-slate-400 group-hover:text-cyan-600 transition-colors" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">Staff directory</p>
                    <p className="text-xs text-slate-500">
                      {summary.totalTeachers || 0} staff members and their contact details
                    </p>
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 ml-auto text-slate-400 transition-transform ${staffOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {staffOpen && (
                  <div className="border-t border-slate-200/70 p-5 lg:p-6 max-h-[32rem] overflow-y-auto">
                    <StaffList school={user.school!} showContactInfo showActions />
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </main>
      <CheckInModal isOpen={showCheckIn} onCheckIn={handleCheckIn} onSkip={() => setShowCheckIn(false)} payDate={checkInPayDate} />
    </>
  )
}

export default DashboardPage
