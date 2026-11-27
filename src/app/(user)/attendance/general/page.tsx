'use client';

import { Suspense, useCallback } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import AttendanceRoll from '@/components/attendance/AttendanceRoll';
import { savedFromEntries, type AttendanceChanges } from '@/lib/attendanceRoll';
import { getAllStudents } from '@/services/studentService';
import { getGeneralAttendanceByDate, submitGeneralAttendance } from '@/services/attendanceService';
import { useUserStore } from '@/store/useUserStore';
import { useSchoolYearStore } from '@/store/useSchoolYearStore';
import { generalAttendanceTopic } from '@/lib/muley/dataChanges';

function GeneralAttendanceContent() {
  const school = useUserStore((state) => state.user.school);
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId);

  const loadRoster = useCallback(async () => {
    const res = await getAllStudents(school!);
    if (res.status !== 'success') throw new Error(res.message || "The students couldn't be loaded.");
    return res.data;
  }, [school]);

  const loadMarks = useCallback(
    async (date: string) => {
      const res = await getGeneralAttendanceByDate(date, school!);
      if (res.status !== 'success') throw new Error("This day's attendance couldn't be loaded.");
      return savedFromEntries(res.data);
    },
    [school],
  );

  const save = useCallback(
    async (date: string, changes: AttendanceChanges) => {
      const res = await submitGeneralAttendance({ attendanceDate: date, ...changes, school: school! });
      if (res.status !== 'success') throw new Error(res.message || 'Failed to save attendance');
    },
    [school],
  );

  if (!school) return null;

  return (
    // Keyed by school year: the students and their marks are the selected year's.
    <AttendanceRoll
      key={selectedYearId ?? 'current'}
      title="General Attendance"
      subtitle="Track daily attendance for all students"
      loadRoster={loadRoster}
      loadMarks={loadMarks}
      changeTopic={generalAttendanceTopic}
      save={save}
      byGrade
    />
  );
}

// AttendanceRoll reads the search params, so the page body needs a Suspense
// boundary for the static prerender.
export default function GeneralAttendancePage() {
  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50 pb-36 sm:pb-28">
        <Suspense fallback={null}>
          <GeneralAttendanceContent />
        </Suspense>
      </main>
    </>
  );
}
