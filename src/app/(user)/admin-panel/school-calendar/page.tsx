'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import CalendarMonthGrid from '@/components/calendar/CalendarMonthGrid';
import EventFormModal from '@/components/calendar/EventFormModal';
import { useUserStore } from '@/store/useUserStore';
import { useSchoolYearStore, useSelectedYear } from '@/store/useSchoolYearStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getEventsByAcademicYear } from '@/services/calendarEventService';
import type { CalendarEventPayload } from '@/services/types/calendarEvent';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Academic year months in display order: September .. August
const ACADEMIC_MONTHS = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6, 7, 8];

/** Build selectable academic years around today (e.g. "2025-2026"). */
const buildAcademicYearOptions = (): string[] => {
  const now = new Date();
  // Academic years start in August
  const baseYear = now.getMonth() + 1 >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  return [-1, 0, 1, 2].map((offset) => `${baseYear + offset}-${baseYear + offset + 1}`);
};

const SchoolCalendarPage = () => {
  const user = useUserStore((state) => state.user);
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId);
  const selectedYear = useSelectedYear();
  const showNotification = useNotificationStore((state) => state.showNotification);

  const yearOptions = useMemo(buildAcademicYearOptions, []);
  const [academicYear, setAcademicYear] = useState(yearOptions[1]);
  const [monthIndex, setMonthIndex] = useState(0); // index into ACADEMIC_MONTHS
  const [events, setEvents] = useState<CalendarEventPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEventPayload | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);

  const month = ACADEMIC_MONTHS[monthIndex];
  const startYear = Number(academicYear.split('-')[0]);
  const year = month >= 8 ? startYear : startYear + 1;

  const fetchEvents = useCallback(async () => {
    if (!user?.school) return;
    setLoading(true);
    try {
      const response = await getEventsByAcademicYear(user.school, academicYear);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
      showNotification('Failed to load calendar events', 'error');
    } finally {
      setLoading(false);
    }
  }, [user?.school, academicYear, showNotification, selectedYearId]); // refetch when the selected school year changes

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ── Keep the local academic-year dropdown in sync with the header year ──
  // The X-School-Year header already scopes the refetch correctly, but the
  // local dropdown/date-range can still point at the old year, making the
  // (correctly-filtered) results look empty. Skip the initial mount/hydration
  // — only react to an actual change of selectedYearId after the page loads —
  // and only snap the dropdown when the newly-selected year's label is one of
  // this page's academic-year options; otherwise leave it as-is.
  const yearIdRef = useRef(selectedYearId);
  useEffect(() => {
    if (yearIdRef.current === selectedYearId) return;
    yearIdRef.current = selectedYearId;
    if (selectedYear?.label && yearOptions.includes(selectedYear.label)) {
      setAcademicYear(selectedYear.label);
    }
  }, [selectedYearId, selectedYear, yearOptions]);

  const monthEvents = useMemo(() => {
    const pad = (n: number) => String(n).padStart(2, '0');
    const monthStart = `${year}-${pad(month)}-01`;
    const monthEnd = `${year}-${pad(month)}-31`;
    return events.filter((e) => {
      const start = e.startDate.slice(0, 10);
      const end = (e.endDate || e.startDate).slice(0, 10);
      return start <= monthEnd && end >= monthStart;
    });
  }, [events, year, month]);

  const openCreate = (isoDate?: string) => {
    setEditingEvent(null);
    setDefaultDate(isoDate);
    setModalOpen(true);
  };

  const openEdit = (event: CalendarEventPayload) => {
    setEditingEvent(event);
    setDefaultDate(undefined);
    setModalOpen(true);
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-5xl mx-auto">
          {/* Header */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">School Calendar</h1>
              <p className="text-slate-500 mt-1">
                Manage holidays, PA days and events. The agenda&apos;s &quot;Days to Remember&quot; pull from here.
              </p>
            </div>
            <button
              onClick={() => openCreate()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-xl cursor-pointer"
            >
              <PlusIcon className="w-4 h-4" />
              Add Event
            </button>
          </div>

          {/* Year + month navigation */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y} school year</option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-white rounded-xl border border-slate-200 px-1 py-1">
              <button
                onClick={() => setMonthIndex((i) => Math.max(0, i - 1))}
                disabled={monthIndex === 0}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <span className="px-3 text-sm font-semibold text-slate-800 min-w-36 text-center">
                {MONTH_NAMES[month - 1]} {year}
              </span>
              <button
                onClick={() => setMonthIndex((i) => Math.min(ACADEMIC_MONTHS.length - 1, i + 1))}
                disabled={monthIndex === ACADEMIC_MONTHS.length - 1}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Month grid */}
          {loading ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center text-slate-400">
              Loading calendar…
            </div>
          ) : (
            <CalendarMonthGrid
              year={year}
              month={month}
              events={monthEvents}
              onDayClick={(isoDate) => openCreate(isoDate)}
              onEventClick={openEdit}
            />
          )}

          {/* Month event list */}
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
              <CalendarDaysIcon className="w-5 h-5 text-cyan-600" />
              <h2 className="text-base font-semibold text-slate-900">
                Events in {MONTH_NAMES[month - 1]} {year}
              </h2>
            </div>
            {monthEvents.length === 0 ? (
              <p className="px-6 py-8 text-sm text-slate-400 text-center">
                No events this month. Click a day on the grid to add one.
              </p>
            ) : (
              <ul className="divide-y divide-slate-50">
                {monthEvents.map((event) => (
                  <li key={event.eventId}>
                    <button
                      onClick={() => openEdit(event)}
                      className="w-full flex items-center justify-between px-6 py-3 text-left hover:bg-slate-50 cursor-pointer"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">{event.title}</p>
                        <p className="text-xs text-slate-500">
                          {event.startDate.slice(0, 10)}
                          {event.endDate ? ` – ${event.endDate.slice(0, 10)}` : ''}
                          {event.isSchoolClosed ? ' · School closed' : ''}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-slate-400 capitalize">{event.category}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>

      {modalOpen && user?.school && (
        <EventFormModal
          school={user.school}
          event={editingEvent}
          defaultDate={defaultDate}
          onClose={() => setModalOpen(false)}
          onSaved={fetchEvents}
        />
      )}
    </>
  );
};

export default SchoolCalendarPage;
