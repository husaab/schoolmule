'use client';

import type { CalendarEventPayload, CalendarEventCategory } from '@/services/types/calendarEvent';

const CATEGORY_COLORS: Record<CalendarEventCategory, string> = {
  event: 'bg-cyan-100 text-cyan-800',
  holiday: 'bg-emerald-100 text-emerald-800',
  'pa-day': 'bg-amber-100 text-amber-800',
  exam: 'bg-violet-100 text-violet-800',
  other: 'bg-slate-100 text-slate-700',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface CalendarMonthGridProps {
  year: number;
  month: number; // 1-12
  events: CalendarEventPayload[];
  onDayClick: (isoDate: string) => void;
  onEventClick: (event: CalendarEventPayload) => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Does an event (possibly a range) cover the given ISO date? */
const eventCoversDate = (event: CalendarEventPayload, isoDate: string) => {
  const start = event.startDate.slice(0, 10);
  const end = (event.endDate || event.startDate).slice(0, 10);
  return isoDate >= start && isoDate <= end;
};

const CalendarMonthGrid = ({ year, month, events, onDayClick, onEventClick }: CalendarMonthGridProps) => {
  const firstDow = new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDow }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="grid grid-cols-7 border-b border-slate-100">
        {WEEKDAYS.map((d) => (
          <div key={d} className="px-2 py-2 text-center text-xs font-semibold text-slate-500 uppercase">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={i} className="min-h-24 border-b border-r border-slate-50 bg-slate-50/50" />;
          }
          const isoDate = `${year}-${pad(month)}-${pad(day)}`;
          const dayEvents = events.filter((e) => eventCoversDate(e, isoDate));

          return (
            <button
              key={i}
              type="button"
              onClick={() => onDayClick(isoDate)}
              className="min-h-24 border-b border-r border-slate-50 p-1.5 text-left align-top hover:bg-cyan-50/50 transition-colors cursor-pointer"
            >
              <span className="text-xs font-medium text-slate-600">{day}</span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map((event) => (
                  <span
                    key={event.eventId}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation();
                        onEventClick(event);
                      }
                    }}
                    className={`block truncate rounded px-1 py-0.5 text-[10px] font-medium leading-tight ${CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other} hover:opacity-75`}
                    title={event.title}
                  >
                    {event.title}
                  </span>
                ))}
                {dayEvents.length > 3 && (
                  <span className="block text-[10px] text-slate-400 px-1">
                    +{dayEvents.length - 3} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CalendarMonthGrid;
