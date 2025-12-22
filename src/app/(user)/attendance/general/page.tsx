'use client';

import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { useState, useEffect } from 'react';
import { getAllStudents } from '@/services/studentService';
import { StudentPayload } from '@/services/types/student';
import { useUserStore } from '@/store/useUserStore';
import { format } from 'date-fns-tz';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  getGeneralAttendanceByDate,
  submitGeneralAttendance,
} from '@/services/attendanceService';
import { getGradeOptions, getGradeNumericValue } from '@/lib/schoolUtils';
import { ClipboardDocumentCheckIcon, UserGroupIcon, CheckCircleIcon, ClockIcon, XCircleIcon, CalendarIcon } from '@heroicons/react/24/outline';
import Spinner from '@/components/Spinner';

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';

export default function GeneralAttendancePage() {
  const [students, setStudents] = useState<StudentPayload[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus | null>>({});
  const user = useUserStore((state) => state.user);
  const showNotification = useNotificationStore(state => state.showNotification)

  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  const grades = getGradeOptions();

  const filteredStudents = students
    .filter(s => {
      const matchesName = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = gradeFilter === '' || String(s.grade) === gradeFilter;
      return matchesName && matchesGrade;
    })
    .sort((a, b) => {
      // Sort by grade first (JK, SK, 1, 2, 3...8)
      const gradeA = getGradeNumericValue(a.grade);
      const gradeB = getGradeNumericValue(b.grade);
      
      if (gradeA !== gradeB) {
        return gradeA - gradeB;
      }
      // Then sort by name alphabetically within the same grade
      return a.name.localeCompare(b.name);
    });

 const [selectedDate, setSelectedDate] = useState(() => {
  return format(new Date(), 'yyyy-MM-dd'); // Uses user’s browser local time
    });

  useEffect(() => {
    getGeneralAttendanceByDate(selectedDate, user.school!).then(res => {
      if (res.status === 'success') {
        const map: Record<string, AttendanceStatus> = {};
        for (const entry of res.data) {
          map[entry.studentId] = entry.status;
        }
        setAttendance(map);
      } else {
        console.error('Failed to load attendance for date:', selectedDate);
      }
    });
  }, [selectedDate, user.school]);
  

  useEffect(() => {
    if (user.school) {
      getAllStudents(user.school).then(res => {
        if (res.status === 'success') {
          setStudents(res.data);
        } else {
          console.error('Error fetching students:', res.message);
        }
      });
    }
  }, [user.school]);

  const handleSelect = (studentId: string, status: AttendanceStatus) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status
    }));
  };

  const markAllPresent = () => {
    const newAttendance: Record<string, AttendanceStatus | null> = {};
    filteredStudents.forEach(student => {
      newAttendance[student.studentId] = 'PRESENT';
    });
    setAttendance(newAttendance);
    showNotification('All students marked as present', 'success');
  };

  const groupedByGrade = filteredStudents.reduce((acc, student) => {
    const grade = `Grade ${student.grade ?? '-'}`;
    acc[grade] = acc[grade] || [];
    acc[grade].push(student);
    return acc;
  }, {} as Record<string, StudentPayload[]>);

  // Calculate attendance statistics
  const totalStudents = filteredStudents.length;
  const presentCount = filteredStudents.filter(student => 
    attendance[student.studentId] === 'PRESENT'
  ).length;
  const lateCount = filteredStudents.filter(student => 
    attendance[student.studentId] === 'LATE'
  ).length;
  const absentCount = filteredStudents.filter(student => 
    attendance[student.studentId] === 'ABSENT'
  ).length;
  const unmarkedCount = totalStudents - presentCount - lateCount - absentCount;

  // Check if there are unsaved changes
  const hasUnsavedChanges = Object.keys(attendance).some(studentId => 
    attendance[studentId] !== null
  );

  // Warn user about unsaved changes when navigating away
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have not saved your attendance changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    const handlePopState = () => {
      if (hasUnsavedChanges) {
        const confirmLeave = window.confirm('You have not saved your attendance changes. Are you sure you want to leave?')
        if (!confirmLeave) {
          // Push the current state back to prevent navigation
          window.history.pushState(null, '', window.location.href)
        }
      }
    }

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)

    // Push a state to handle back button
    if (hasUnsavedChanges) {
      window.history.pushState(null, '', window.location.href)
    }

    // Cleanup
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasUnsavedChanges])

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50 pb-28">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">General Attendance</h1>
                <p className="text-slate-500 mt-1">Track daily attendance for all students</p>
              </div>
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-slate-400" />
                <input
                  id="attendance-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-white cursor-pointer"
                />
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{presentCount}</p>
                    <p className="text-xs text-slate-500">Present</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{lateCount}</p>
                    <p className="text-xs text-slate-500">Late</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                    <XCircleIcon className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{absentCount}</p>
                    <p className="text-xs text-slate-500">Absent</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                    <UserGroupIcon className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">{unmarkedCount}</p>
                    <p className="text-xs text-slate-500">Unmarked</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
            {/* Sticky Header */}
            <div className="sticky top-20 z-10 bg-white rounded-t-2xl border-b border-slate-100">
              <div className="p-6">
                {/* Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Search Students
                    </label>
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50 placeholder:text-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Filter by Grade
                    </label>
                    <select
                      value={gradeFilter}
                      onChange={(e) => setGradeFilter(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-slate-900 bg-slate-50 cursor-pointer"
                    >
                      <option value="">All Grades</option>
                      {grades.map((gradeOption) => (
                        <option key={gradeOption.value} value={String(gradeOption.value)}>
                          Grade {gradeOption.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {(searchTerm || gradeFilter) && (
                  <div className="mt-4 flex items-center gap-3">
                    <span className="text-sm text-slate-500">
                      Showing {filteredStudents.length} of {students.length} students
                    </span>
                    <button
                      onClick={() => {
                        setSearchTerm('')
                        setGradeFilter('')
                      }}
                      className="text-sm text-cyan-600 hover:text-cyan-700 font-medium cursor-pointer"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Students Content */}
            <div className="p-6">
              <div className="space-y-4">
                {Object.entries(groupedByGrade)
                  .sort(([a], [b]) => {
                    const numA = parseInt(a.replace(/\D/g, ''), 10);
                    const numB = parseInt(b.replace(/\D/g, ''), 10);
                    return numA - numB;
                  })
                  .map(([grade, gradeStudents]) => (
                    <div key={grade} className="space-y-2">
                      {/* Grade header */}
                      <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                            <ClipboardDocumentCheckIcon className="w-5 h-5" />
                          </div>
                          <span className="font-semibold text-lg">{grade}</span>
                        </div>
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-sm">
                          {gradeStudents.length} students
                        </span>
                      </div>

                      {/* Student cards */}
                      <div className="space-y-2 pl-2">
                        {gradeStudents.map(student => (
                          <div
                            key={student.studentId}
                            className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                              attendance[student.studentId] === 'PRESENT'
                                ? 'bg-emerald-50 border-emerald-200'
                                : attendance[student.studentId] === 'LATE'
                                ? 'bg-amber-50 border-amber-200'
                                : attendance[student.studentId] === 'ABSENT'
                                ? 'bg-red-50 border-red-200'
                                : 'bg-slate-50 border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-medium text-cyan-700">
                                  {student.name.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">{student.name}</p>
                                <p className="text-slate-500 text-sm">Grade {student.grade}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {(['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]).map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleSelect(student.studentId, status)}
                                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                                    attendance[student.studentId] === status
                                      ? status === 'PRESENT'
                                        ? 'bg-emerald-500 text-white'
                                        : status === 'LATE'
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-red-500 text-white'
                                      : status === 'PRESENT'
                                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                        : status === 'LATE'
                                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                  }`}
                                >
                                  {status === 'PRESENT' ? 'Present' : status === 'LATE' ? 'Late' : 'Absent'}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Action Buttons at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-72 z-20 p-4 bg-white/95 backdrop-blur-sm border-t border-slate-200 shadow-lg">
          <div className="flex justify-center gap-4 max-w-7xl mx-auto">
            <button
              onClick={markAllPresent}
              className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all cursor-pointer font-medium shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <CheckCircleIcon className="w-5 h-5" />
              Mark All Present
            </button>
            <button
              onClick={async () => {
                const entries = Object.entries(attendance)
                  .filter(([, status]) => status !== null)
                  .map(([studentId, status]) => ({ studentId, status: status as AttendanceStatus }));

                try {
                  const res = await submitGeneralAttendance({
                    attendanceDate: selectedDate,
                    entries,
                    school: user.school!
                  });
                  if (res.status === 'success') {
                    showNotification('Attendance saved successfully', "success");
                  } else {
                    showNotification('Failed to save attendance', "error");
                  }
                } catch (err) {
                  console.error(err);
                  showNotification('Unexpected error saving attendance, contact support if persists', "error");
                }
              }}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition-all cursor-pointer font-medium shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <ClipboardDocumentCheckIcon className="w-5 h-5" />
              Save Attendance
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
