'use client';

import { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent
} from '@/services/calendarEventService';
import type {
  CalendarEventPayload,
  CalendarEventCategory,
  CalendarStaffDay
} from '@/services/types/calendarEvent';

const CATEGORY_OPTIONS: { value: CalendarEventCategory; label: string }[] = [
  { value: 'event', label: 'Event' },
  { value: 'holiday', label: 'Holiday' },
  { value: 'pa-day', label: 'PA Day' },
  { value: 'exam', label: 'Exam' },
  { value: 'other', label: 'Other' },
];

const STAFF_DAY_OPTIONS: { value: CalendarStaffDay; label: string; hint: string }[] = [
  { value: 'off', label: 'Day off', hint: 'Unpaid: no hours for staff.' },
  { value: 'paid', label: 'Paid holiday', hint: 'Staff are paid their usual hours.' },
  { value: 'work', label: 'Work day', hint: 'Staff still come in (e.g. a PA day).' },
];

/** Staff work on PA days; any other closure starts as an unpaid day off. */
const defaultStaffDay = (category: CalendarEventCategory): CalendarStaffDay =>
  category === 'pa-day' ? 'work' : 'off';

interface EventFormModalProps {
  school: string;
  /** Event being edited, or null when creating a new one */
  event: CalendarEventPayload | null;
  /** Pre-filled start date (YYYY-MM-DD) when creating from a day click */
  defaultDate?: string;
  onClose: () => void;
  /** Called after a successful create/update/delete so the parent refetches */
  onSaved: () => void;
}

const EventFormModal = ({ school, event, defaultDate, onClose, onSaved }: EventFormModalProps) => {
  const showNotification = useNotificationStore((state) => state.showNotification);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CalendarEventCategory>('event');
  const [startDate, setStartDate] = useState(defaultDate || '');
  const [endDate, setEndDate] = useState('');
  const [isSchoolClosed, setIsSchoolClosed] = useState(false);
  const [staffDay, setStaffDay] = useState<CalendarStaffDay>('off');
  // Until someone picks a staff option, it follows the category.
  const [staffDayChosen, setStaffDayChosen] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setCategory(event.category);
      setStartDate(event.startDate?.slice(0, 10) || '');
      setEndDate(event.endDate?.slice(0, 10) || '');
      setIsSchoolClosed(event.isSchoolClosed);
      setStaffDay(event.staffDay ?? 'off');
      setStaffDayChosen(true);
      setNotes(event.notes || '');
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate) {
      showNotification('Title and start date are required', 'error');
      return;
    }
    if (endDate && endDate < startDate) {
      showNotification('End date must be after the start date', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        category,
        startDate,
        endDate: endDate || null,
        isSchoolClosed,
        staffDay,
        notes: notes.trim() || null,
      };
      if (event) {
        await updateCalendarEvent(event.eventId, payload);
        showNotification('Event updated', 'success');
      } else {
        await createCalendarEvent({ school, ...payload });
        showNotification('Event created', 'success');
      }
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      showNotification('Failed to save event', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    if (!window.confirm(`Delete "${event.title}"?`)) return;

    setSaving(true);
    try {
      await deleteCalendarEvent(event.eventId);
      showNotification('Event deleted', 'success');
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error deleting event:', error);
      showNotification('Failed to delete event', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">
            {event ? 'Edit Event' : 'Add Event'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. First Day of School"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                End date <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => {
                const next = e.target.value as CalendarEventCategory;
                setCategory(next);
                if (!staffDayChosen) setStaffDay(defaultStaffDay(next));
              }}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={isSchoolClosed}
              onChange={(e) => setIsSchoolClosed(e.target.checked)}
              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            School closed (no classes) — shaded on agenda planner pages
          </label>

          {isSchoolClosed && (
            <fieldset>
              <legend className="block text-sm font-medium text-slate-700 mb-1">For staff</legend>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                {STAFF_DAY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    aria-pressed={staffDay === opt.value}
                    onClick={() => {
                      setStaffDay(opt.value);
                      setStaffDayChosen(true);
                    }}
                    className={`rounded-lg px-2 py-1.5 text-sm font-medium transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                      staffDay === opt.value ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                {STAFF_DAY_OPTIONS.find((opt) => opt.value === staffDay)?.hint} Ontario stat holidays
                (Thanksgiving, Christmas…) are always paid.
              </p>
            </fieldset>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Notes <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            {event ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl cursor-pointer disabled:opacity-50"
              >
                Delete
              </button>
            ) : <span />}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving…' : event ? 'Save Changes' : 'Add Event'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventFormModal;
