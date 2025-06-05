'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '@/store/useUserStore';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { getClassesByTeacherId } from '@/services/classService';
import { useRouter } from 'next/navigation';
import { ClassPayload } from '@/services/types/class';

const ClassAttendanceDashboard = () => {
  const user = useUserStore((state) => state.user);
  const router = useRouter();
  const [classes, setClasses] = useState<ClassPayload[]>([]);
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [collapsedGrades, setCollapsedGrades] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    getClassesByTeacherId(user.id).then((res) => {
      if (res.status === 'success') {
        setClasses(res.data);
      } else {
        console.error(res.message || 'Failed to load classes');
      }
    });
  }, [user?.id]);

  const availableGrades = Array.from(
    new Set(
      classes
        .map((c) => c.grade)
        .filter((g): g is number => g != null && !isNaN(g))
        .map((g) => Number(g))
    )
  )
    .filter((g) => g >= 1 && g <= 8)
    .sort((a, b) => a - b);

  const filteredClasses = classes.filter((c) => {
    return gradeFilter === '' || String(c.grade) === gradeFilter;
  });

  const toggleGrade = (grade: number) => {
    setCollapsedGrades((prev) => {
      const next = new Set(prev);
      if (next.has(grade)) next.delete(grade);
      else next.add(grade);
      return next;
    });
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="ml-32 min-h-screen bg-white p-10 text-black">
        <div className="pt-40 text-center mb-8">
          <h1 className="text-3xl font-semibold">Class Attendance</h1>
          <p className="text-gray-600 mt-2">Select a class below to record attendance</p>
        </div>

        <div className="w-[75%] mx-auto space-y-6">
          {/* Grade Filter */}
          <div className="flex justify-end mb-4">
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="w-48 px-3 py-2 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="">All Grades</option>
              {availableGrades.map((g) => (
                <option key={g} value={String(g)}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>

          {/* Class Sections by Grade */}
          {availableGrades.map((g) => {
            const classesForGrade = filteredClasses.filter((c) => Number(c.grade) === g);
            if (classesForGrade.length === 0) return null;

            const isCollapsed = collapsedGrades.has(g);

            return (
              <div key={g} className="space-y-2">
                <div
                  onClick={() => toggleGrade(g)}
                  className="flex items-center justify-between px-4 py-2 bg-cyan-600 text-white rounded-lg cursor-pointer select-none"
                >
                  <span className="font-semibold text-lg">Grade {g}</span>
                  <svg
                    className={`w-5 h-5 transform transition-transform duration-200 ${
                      isCollapsed ? '-rotate-90' : 'rotate-0'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {!isCollapsed &&
                  classesForGrade.map((cls) => (
                    <div
                      key={cls.classId}
                      className="flex items-center justify-between px-4 py-3 bg-white border border-cyan-400 rounded-lg shadow-sm"
                    >
                      <div>
                        <p className="font-medium text-gray-800">{cls.subject}</p>
                        <p className="text-gray-600 text-sm">Class ID: {cls.classId.slice(0, 8)}…</p>
                      </div>
                      <button
                        onClick={() => router.push(`/attendance/class/${cls.classId}`)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
                      >
                        Record Attendance
                      </button>
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
};

export default ClassAttendanceDashboard;
