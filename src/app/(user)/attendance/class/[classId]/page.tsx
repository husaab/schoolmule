'use client';

import { useParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import AttendanceRoll from '@/components/attendance/AttendanceRoll';
import { savedFromEntries, type AttendanceChanges } from '@/lib/attendanceRoll';
import { getGradeLabel } from '@/lib/schoolUtils';
import { getStudentsInClass, getClassById } from '@/services/classService';
import { getClassAttendanceByDate, submitClassAttendance } from '@/services/attendanceService';
import { classAttendanceTopic } from '@/lib/muley/dataChanges';
import type { ClassPayload } from '@/services/types/class';
import { useUserStore } from '@/store/useUserStore';

function ClassAttendanceContent() {
  const { classId } = useParams() as { classId: string };
  const school = useUserStore((state) => state.user.school);
  const [cls, setCls] = useState<ClassPayload | null>(null);

  useEffect(() => {
    let cancelled = false;
    getClassById(classId)
      .then((res) => {
        if (!cancelled && res.status === 'success') setCls(res.data);
      })
      .catch(() => {
        // The roll still works without the class's name; its own load reports a real failure.
      });
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const loadRoster = useCallback(async () => {
    const res = await getStudentsInClass(classId);
    if (res.status !== 'success') throw new Error(res.message || "The students couldn't be loaded.");
    return res.data;
  }, [classId]);

  const loadMarks = useCallback(
    async (date: string) => {
      const res = await getClassAttendanceByDate(classId, date);
      if (res.status !== 'success') throw new Error("This day's attendance couldn't be loaded.");
      return savedFromEntries(res.data);
    },
    [classId],
  );

  const save = useCallback(
    async (date: string, changes: AttendanceChanges) => {
      const res = await submitClassAttendance({ classId, attendanceDate: date, ...changes, school: school! });
      if (res.status !== 'success') throw new Error(res.message || 'Failed to save attendance');
    },
    [classId, school],
  );

  const changeTopic = useCallback((date: string) => classAttendanceTopic(classId, date), [classId]);

  const named = cls?.classId === classId ? cls : null;
  const subtitle = named
    ? [`Grade ${getGradeLabel(named.grade)}`, named.teacherName].filter(Boolean).join(' · ')
    : 'Class Attendance';

  return (
    <AttendanceRoll
      title={named?.subject ?? 'Class Attendance'}
      subtitle={named ? `Class attendance · ${subtitle}` : undefined}
      back={{ to: '/attendance/class', label: 'All classes' }}
      loadRoster={loadRoster}
      loadMarks={loadMarks}
      save={save}
      changeTopic={changeTopic}
    />
  );
}

// AttendanceRoll reads the search params, so the page body needs a Suspense
// boundary for the static prerender.
export default function ClassAttendancePage() {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50 pb-36 sm:pb-28">
        <Suspense fallback={null}>
          <ClassAttendanceContent />
        </Suspense>
      </main>
    </>
  );
}
