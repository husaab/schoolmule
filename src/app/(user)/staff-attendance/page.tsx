'use client'

// Staff attendance for admins. Two ways in: the pay period (what payroll
// needs — everyone's hours to a pay day, step back and forth between pay
// days) and the month (each person's calendar with their work days and hours
// per day). Both share the overview strip, the staff filter, and the same
// day editor. Filters live in the URL so Back/refresh/share restore them.

import React, { useEffect, useState, useCallback, useMemo, Suspense } from 'react'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useUserStore } from '@/store/useUserStore'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import EditAttendanceModal from '@/components/teacherAttendance/EditAttendanceModal'
import PayScheduleModal from '@/components/teacherAttendance/PayScheduleModal'
import AttendanceOverview from '@/components/teacherAttendance/AttendanceOverview'
import PeriodSwitcher from '@/components/teacherAttendance/PeriodSwitcher'
import StaffPicker, { type StaffOption } from '@/components/teacherAttendance/StaffPicker'
import PayPeriodTable from '@/components/teacherAttendance/PayPeriodTable'
import StaffMonthRow from '@/components/teacherAttendance/StaffMonthRow'
import MarkDayModal, { type MarkDayFailure, type MarkDayPayload } from '@/components/teacherAttendance/MarkDayModal'
import { shiftDate, staffName, todayKey } from '@/components/teacherAttendance/payPeriodFormat'
import {
  getAllTeacherAttendance,
  updateTeacherRecord,
  downloadAttendancePDF,
  setWorkDays,
  resetWorkDays,
  setHoursPerDay,
  resetHoursPerDay,
  getPayPeriodContaining,
  savePaySchedule,
  deletePaySchedule,
} from '@/services/teacherAttendanceService'
import type {
  AttendanceRecord,
  TeacherAttendanceData,
  PaySchedule,
  PayPeriod,
  PaySchedulePayload,
} from '@/services/types/teacherAttendance'
import { format, addMonths, subMonths } from 'date-fns'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  IdentificationIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import { useFilterParams } from '@/hooks/useFilterParams'
import { useNotificationStore } from '@/store/useNotificationStore'

type View = 'period' | 'month'

interface EditTarget {
  teacherId: string
  date: string
  status: 'PRESENT' | 'ABSENT' | null
  notes: string | null
  hours: number | null
  usualHours: number
}

const errorMessage = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

const secondaryButton =
  'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'
const primaryButton =
  'inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2'
const navButton =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 cursor-pointer active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'

function StaffAttendanceContent() {
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const { get, setParams } = useFilterParams()

  const view: View = get('view') === 'month' ? 'month' : 'period'
  const paydayParam = get('payday') // any date inside the period to show; empty = today
  const monthParam = get('month')
  const currentMonth = monthParam ? new Date(monthParam + '-01T00:00:00') : new Date()
  const monthStr = format(currentMonth, 'yyyy-MM')
  const selectedTeacherId = get('teacher')

  // Pay period (also feeds the overview strip, whichever view is open)
  const [schedule, setSchedule] = useState<PaySchedule | null>(null)
  const [period, setPeriod] = useState<PayPeriod | null>(null)
  const [periodLoading, setPeriodLoading] = useState(true)
  const [periodError, setPeriodError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Month
  const [monthTeachers, setMonthTeachers] = useState<TeacherAttendanceData[]>([])
  const [monthLoading, setMonthLoading] = useState(false)
  const [monthError, setMonthError] = useState<string | null>(null)
  const [openRows, setOpenRows] = useState<Set<string>>(new Set())

  // Modals
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null)
  const [markDay, setMarkDay] = useState<{ teacherIds: string[]; date?: string } | null>(null)
  const [downloading, setDownloading] = useState(false)

  const loadPeriod = useCallback(async () => {
    setPeriodLoading(true)
    setPeriodError(null)
    try {
      const res = await getPayPeriodContaining(paydayParam || undefined)
      setSchedule(res.data.schedule)
      setPeriod(res.data.periods[0] ?? null)
    } catch (err) {
      setPeriodError(errorMessage(err, 'Could not load the pay period'))
    } finally {
      setPeriodLoading(false)
    }
  }, [paydayParam])

  const loadMonth = useCallback(async () => {
    if (!user.school) return
    setMonthLoading(true)
    setMonthError(null)
    try {
      const res = await getAllTeacherAttendance(user.school, monthStr)
      setMonthTeachers(res.data.teachers)
      setSchedule(res.data.paySchedule ?? null)
    } catch (err) {
      setMonthError(errorMessage(err, 'Could not load this month'))
    } finally {
      setMonthLoading(false)
    }
  }, [user.school, monthStr])

  useEffect(() => {
    if (user.id) loadPeriod()
  }, [user.id, loadPeriod])

  useEffect(() => {
    if (user.id && view === 'month') loadMonth()
  }, [user.id, view, loadMonth])

  // A single filtered person opens by default; a whole school stays folded.
  useEffect(() => {
    setOpenRows(selectedTeacherId ? new Set([selectedTeacherId]) : new Set())
    setExpandedId(selectedTeacherId || null)
  }, [selectedTeacherId, monthStr, paydayParam])

  const reload = useCallback(async () => {
    await Promise.all([loadPeriod(), view === 'month' ? loadMonth() : Promise.resolve()])
  }, [loadPeriod, loadMonth, view])

  // ── Derived ──────────────────────────────────────────────────────────
  const allStaff: TeacherAttendanceData[] = period?.teachers ?? monthTeachers
  const staffOptions: StaffOption[] = useMemo(
    () =>
      [...allStaff]
        .map((t) => ({ id: t.teacherId, name: staffName(t) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [allStaff]
  )
  const filterTo = <T extends { teacherId: string }>(list: T[]) =>
    selectedTeacherId ? list.filter((t) => t.teacherId === selectedTeacherId) : list
  const periodTeachers = filterTo(period?.teachers ?? [])
  const visibleMonthTeachers = filterTo(monthTeachers)

  const today = todayKey()
  const isCurrentPeriod = !!period && period.startDate <= today && today <= period.endDate

  // ── Handlers ─────────────────────────────────────────────────────────
  const openEditor = (teacher: TeacherAttendanceData, date: string, record: AttendanceRecord | null) =>
    setEditTarget({
      teacherId: teacher.teacherId,
      date,
      status: record?.status ?? null,
      notes: record?.notes ?? null,
      hours: record?.hours ?? null,
      usualHours: teacher.hoursPerDay,
    })

  const handleMonthDayClick = (teacher: TeacherAttendanceData, date: string) => {
    const record = teacher.records.find((r) => r.attendanceDate.substring(0, 10) === date) ?? null
    openEditor(teacher, date, record)
  }

  const handleEditSave = async (status: 'PRESENT' | 'ABSENT', notes: string | null, hours?: number | null) => {
    if (!editTarget) return
    try {
      await updateTeacherRecord(editTarget.teacherId, editTarget.date, status, notes, hours ?? null)
      setEditTarget(null)
      showNotification('Attendance saved', 'success')
      await reload()
    } catch (err) {
      showNotification(errorMessage(err, 'Could not save attendance'), 'error')
    }
  }

  const handleMarkDay = async (payload: MarkDayPayload): Promise<MarkDayFailure[]> => {
    const names = new Map(staffOptions.map((s) => [s.id, s.name]))
    const results = await Promise.allSettled(
      payload.teacherIds.map((id) => updateTeacherRecord(id, payload.date, payload.status, payload.notes, payload.hours))
    )
    const failed: MarkDayFailure[] = []
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        failed.push({ name: names.get(payload.teacherIds[i]) ?? 'Staff member', message: errorMessage(r.reason, 'Could not save') })
      }
    })
    const saved = results.length - failed.length
    if (saved > 0) {
      const verb = payload.status === 'PRESENT' ? 'present' : 'absent'
      showNotification(`Marked ${saved} ${saved === 1 ? 'person' : 'people'} ${verb}`, 'success')
      await reload()
    }
    if (failed.length === 0) setMarkDay(null)
    return failed
  }

  // Work days and hours change what every day is worth, so reload after.
  const withReload = (label: string, action: () => Promise<unknown>) => async () => {
    try {
      await action()
      showNotification(label, 'success')
      await reload()
    } catch (err) {
      showNotification(errorMessage(err, 'Something went wrong'), 'error')
      throw err
    }
  }

  const handleSavePaySchedule = async (payload: PaySchedulePayload) => {
    await savePaySchedule(payload)
    showNotification('Pay schedule saved', 'success')
    setScheduleModalOpen(false)
    await reload()
  }

  const handleDeletePaySchedule = async () => {
    await deletePaySchedule()
    showNotification('Pay schedule removed', 'success')
    setScheduleModalOpen(false)
    await reload()
  }

  const handleDownloadPDF = async () => {
    if (!user.school) return
    setDownloading(true)
    try {
      await downloadAttendancePDF(user.school, monthStr, selectedTeacherId || undefined)
    } catch {
      showNotification('Could not generate the PDF', 'error')
    } finally {
      setDownloading(false)
    }
  }

  const toggleRow = (id: string) =>
    setOpenRows((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const noSchedule = !periodLoading && !periodError && !schedule

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-4 lg:p-8 max-w-6xl mx-auto w-full">
          {/* Header */}
          <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <IdentificationIcon className="w-7 h-7 text-cyan-500" />
                Staff Attendance
              </h1>
              <p className="text-slate-500 mt-1">Hours worked to each pay day, and every person&apos;s calendar</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setScheduleModalOpen(true)} className={secondaryButton} title="When staff are paid">
                <Cog6ToothIcon className="h-4 w-4" />
                Pay schedule
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={downloading || staffOptions.length === 0}
                className={secondaryButton}
                title={`${format(currentMonth, 'MMMM yyyy')}: the month grid plus hours worked to each pay day in it`}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                {downloading ? 'Generating…' : `${format(currentMonth, 'MMM')} PDF`}
              </button>
              <button
                type="button"
                onClick={() => setMarkDay({ teacherIds: selectedTeacherId ? [selectedTeacherId] : [] })}
                disabled={staffOptions.length === 0}
                className={primaryButton}
              >
                <CalendarDaysIcon className="h-4 w-4" />
                Mark a day
              </button>
            </div>
          </div>

          {/* Overview strip */}
          <div className="mb-5">
            {noSchedule ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                    <BanknotesIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">No pay schedule yet</p>
                    <p className="text-xs text-slate-500">Set when staff are paid to see hours worked to each pay day.</p>
                  </div>
                </div>
                <button type="button" onClick={() => setScheduleModalOpen(true)} className={`${primaryButton} self-start sm:self-auto`}>
                  <Cog6ToothIcon className="h-4 w-4" />
                  Set up pay schedule
                </button>
              </div>
            ) : periodError ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-rose-100 bg-rose-50/70 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3 text-sm text-rose-900">
                  <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-rose-500" />
                  {periodError}
                </div>
                <button type="button" onClick={loadPeriod} className={`${secondaryButton} self-start sm:self-auto`}>
                  Try again
                </button>
              </div>
            ) : (
              <AttendanceOverview period={period} teachers={periodTeachers} loading={periodLoading} />
            )}
          </div>

          {/* Toolbar + content */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="View">
                  {(
                    [
                      { key: 'period', label: 'Pay period' },
                      { key: 'month', label: 'Month' },
                    ] as { key: View; label: string }[]
                  ).map((o) => {
                    const on = view === o.key
                    return (
                      <button
                        key={o.key}
                        type="button"
                        role="tab"
                        aria-selected={on}
                        onClick={() => setParams({ view: o.key === 'period' ? null : o.key })}
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                          on ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        {o.label}
                      </button>
                    )
                  })}
                </div>

                {view === 'period' ? (
                  <PeriodSwitcher
                    period={period}
                    isCurrent={isCurrentPeriod}
                    disabled={periodLoading || !schedule}
                    onPrev={() => period && setParams({ payday: shiftDate(period.startDate, -1) })}
                    onNext={() => period && setParams({ payday: shiftDate(period.endDate, 1) })}
                    onCurrent={() => setParams({ payday: null })}
                  />
                ) : (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setParams({ month: format(subMonths(currentMonth, 1), 'yyyy-MM') })}
                      aria-label="Previous month"
                      className={navButton}
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
                    </button>
                    <h2 className="min-w-[10rem] text-center text-sm font-semibold text-slate-900">{format(currentMonth, 'MMMM yyyy')}</h2>
                    <button
                      type="button"
                      onClick={() => setParams({ month: format(addMonths(currentMonth, 1), 'yyyy-MM') })}
                      aria-label="Next month"
                      className={navButton}
                    >
                      <ChevronRightIcon className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {view === 'month' && visibleMonthTeachers.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenRows(openRows.size === visibleMonthTeachers.length ? new Set() : new Set(visibleMonthTeachers.map((t) => t.teacherId)))
                    }
                    className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer"
                  >
                    {openRows.size === visibleMonthTeachers.length ? 'Collapse all' : 'Expand all'}
                  </button>
                )}
                <StaffPicker
                  options={staffOptions}
                  value={selectedTeacherId}
                  onChange={(id) => setParams({ teacher: id || null })}
                  className="w-full sm:w-60"
                />
              </div>
            </div>

            {view === 'period' ? (
              noSchedule ? (
                <EmptyState
                  icon={BanknotesIcon}
                  title="Pay periods appear once there is a pay schedule"
                  description="Until then, the month view still has everyone's calendar."
                  action={
                    <button type="button" onClick={() => setParams({ view: 'month' })} className={secondaryButton}>
                      Open month view
                    </button>
                  }
                />
              ) : periodLoading ? (
                <div className="flex justify-center py-16">
                  <Spinner size="lg" />
                </div>
              ) : periodError || !period ? (
                <EmptyState
                  icon={ExclamationTriangleIcon}
                  iconClassName="text-rose-300"
                  title="Could not load this pay period"
                  description={periodError ?? undefined}
                  action={
                    <button type="button" onClick={loadPeriod} className={secondaryButton}>
                      Try again
                    </button>
                  }
                />
              ) : periodTeachers.length === 0 ? (
                <EmptyState
                  icon={UsersIcon}
                  title={selectedTeacherId ? 'That person is not on staff this period' : 'No staff yet'}
                  description={selectedTeacherId ? 'Pick someone else, or show everyone.' : 'Staff appear here once their accounts are approved.'}
                  action={
                    selectedTeacherId ? (
                      <button type="button" onClick={() => setParams({ teacher: null })} className={secondaryButton}>
                        Show all staff
                      </button>
                    ) : undefined
                  }
                />
              ) : (
                <PayPeriodTable
                  period={period}
                  teachers={periodTeachers}
                  expandedId={expandedId}
                  onToggle={(id) => setExpandedId((cur) => (cur === id ? null : id))}
                  onEditDay={(teacher, record) => openEditor(teacher, record.attendanceDate.substring(0, 10), record)}
                  onMarkDay={(teacher) => setMarkDay({ teacherIds: [teacher.teacherId] })}
                />
              )
            ) : monthLoading ? (
              <div className="flex justify-center py-16">
                <Spinner size="lg" />
              </div>
            ) : monthError ? (
              <EmptyState
                icon={ExclamationTriangleIcon}
                iconClassName="text-rose-300"
                title="Could not load this month"
                description={monthError}
                action={
                  <button type="button" onClick={loadMonth} className={secondaryButton}>
                    Try again
                  </button>
                }
              />
            ) : visibleMonthTeachers.length === 0 ? (
              <EmptyState
                icon={UsersIcon}
                title={selectedTeacherId ? 'That person is not on staff' : 'No staff yet'}
                description={selectedTeacherId ? 'Pick someone else, or show everyone.' : 'Staff appear here once their accounts are approved.'}
                action={
                  selectedTeacherId ? (
                    <button type="button" onClick={() => setParams({ teacher: null })} className={secondaryButton}>
                      Show all staff
                    </button>
                  ) : undefined
                }
              />
            ) : (
              <>
                <ul className="divide-y divide-slate-100">
                  {visibleMonthTeachers.map((teacher) => (
                    <StaffMonthRow
                      key={teacher.teacherId}
                      teacher={teacher}
                      month={currentMonth}
                      open={openRows.has(teacher.teacherId)}
                      onToggle={() => toggleRow(teacher.teacherId)}
                      onDayClick={(date) => handleMonthDayClick(teacher, date)}
                      onSaveWorkDays={(days) => withReload('Work days saved', () => setWorkDays(teacher.teacherId, days))()}
                      onResetWorkDays={withReload('Work days reset to the schedule planner', () => resetWorkDays(teacher.teacherId))}
                      onSaveHoursPerDay={(hours) => withReload('Hours per day saved', () => setHoursPerDay(teacher.teacherId, hours))()}
                      onResetHoursPerDay={withReload('Hours per day reset to the school default', () => resetHoursPerDay(teacher.teacherId))}
                    />
                  ))}
                </ul>
                <p className="border-t border-slate-100 px-4 py-3 text-xs text-slate-400 sm:px-5">
                  The {format(currentMonth, 'MMMM')} PDF has this grid for everyone shown, plus hours worked to each pay day in the month.
                </p>
              </>
            )}
          </div>
        </div>
      </main>

      <EditAttendanceModal
        isOpen={!!editTarget}
        date={editTarget?.date ?? ''}
        currentStatus={editTarget?.status ?? null}
        currentNotes={editTarget?.notes ?? null}
        allowHours
        currentHours={editTarget?.hours ?? null}
        usualHours={editTarget?.usualHours}
        onSave={handleEditSave}
        onClose={() => setEditTarget(null)}
      />

      <MarkDayModal
        isOpen={!!markDay}
        staff={staffOptions}
        initialTeacherIds={markDay?.teacherIds}
        initialDate={markDay?.date}
        onSubmit={handleMarkDay}
        onClose={() => setMarkDay(null)}
      />

      <PayScheduleModal
        isOpen={scheduleModalOpen}
        schedule={schedule}
        onSave={handleSavePaySchedule}
        onDelete={handleDeletePaySchedule}
        onClose={() => setScheduleModalOpen(false)}
      />
    </>
  )
}

export default function StaffAttendancePage() {
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
      <StaffAttendanceContent />
    </Suspense>
  )
}
