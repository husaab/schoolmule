'use client';

// Public read-only view of a published school schedule (share link).

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { getPublicSchedule } from '@/services/schedulePublicService';
import type { PublicSchedule } from '@/services/types/schedulePlanner';
import WeeklyGrid, { type GridSession } from '@/components/schedulePlanner/WeeklyGrid';
import { ExclamationTriangleIcon, PrinterIcon } from '@heroicons/react/24/outline';

export default function PublicSchedulePage() {
  const params = useParams();
  const schoolSlug = params.schoolSlug as string;
  const token = params.token as string;

  const [schedule, setSchedule] = useState<PublicSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const res = await getPublicSchedule(schoolSlug, token);
        setSchedule(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Schedule not found');
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [schoolSlug, token]);

  const classGroups = useMemo(
    () => [...new Set((schedule?.sessions ?? []).map((s) => s.classGroupName))].sort(),
    [schedule]
  );
  const activeGroup = selectedGroup && classGroups.includes(selectedGroup) ? selectedGroup : classGroups[0];

  const days = useMemo(
    () => [...new Set((schedule?.sessions ?? []).map((s) => s.dayOfWeek))].sort((a, b) => a - b),
    [schedule]
  );
  const [rangeStartMin, rangeEndMin] = useMemo(() => {
    const sessions = schedule?.sessions ?? [];
    if (sessions.length === 0) return [480, 930];
    return [Math.min(...sessions.map((s) => s.startMin)), Math.max(...sessions.map((s) => s.endMin))];
  }, [schedule]);

  const visibleSessions: GridSession[] = useMemo(
    () =>
      (schedule?.sessions ?? [])
        .filter((s) => s.classGroupName === activeGroup)
        .map((s) => ({
          id: s.sessionId,
          day: s.dayOfWeek,
          startMin: s.startMin,
          endMin: s.endMin,
          title: s.courseName,
          subtitle: s.teacherName,
          roomName: s.roomName,
        })),
    [schedule, activeGroup]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-slate-400">Loading schedule...</p>
        </div>
      </div>
    );
  }

  if (error || !schedule) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center max-w-md">
          <ExclamationTriangleIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-slate-700 mb-1">Schedule not found</h1>
          <p className="text-sm text-slate-500">
            This schedule link is invalid or is no longer published.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-black">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6 print:mb-3">
          <div>
            <h1 className="text-2xl font-bold text-cyan-800">{schedule.schoolName}</h1>
            <p className="text-sm text-slate-500">
              {schedule.scheduleName} · Weekly Schedule
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-600 hover:bg-white transition cursor-pointer print:hidden"
          >
            <PrinterIcon className="h-4 w-4" /> Print
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 mb-4 print:hidden">
          {classGroups.map((name) => (
            <button
              key={name}
              onClick={() => setSelectedGroup(name)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition cursor-pointer ${
                name === activeGroup
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white text-slate-600 border-slate-300 hover:border-cyan-400'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <h2 className="text-lg font-semibold mb-2">{activeGroup}</h2>
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-sm">
          <WeeklyGrid
            sessions={visibleSessions}
            days={days}
            rangeStartMin={rangeStartMin}
            rangeEndMin={rangeEndMin}
          />
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          Powered by SchoolMule · Published{' '}
          {new Date(schedule.publishedAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
