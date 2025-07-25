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

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';

export default function GeneralAttendancePage() {
  const [students, setStudents] = useState<StudentPayload[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus | null>>({});
  const user = useUserStore((state) => state.user);
  const showNotification = useNotificationStore(state => state.showNotification)

  const [searchTerm, setSearchTerm] = useState('');
  const [gradeFilter, setGradeFilter] = useState('');

  const grades = Array.from(
    new Set(students.map(s => s.grade).filter((g): g is number => g != null))
  ).sort((a, b) => a - b);

  const filteredStudents = students.filter(s => {
    const matchesName = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = gradeFilter === '' || String(s.grade) === gradeFilter;
    return matchesName && matchesGrade;
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

  const groupedByGrade = filteredStudents.reduce((acc, student) => {
    const grade = `Grade ${student.grade ?? '-'}`;
    acc[grade] = acc[grade] || [];
    acc[grade].push(student);
    return acc;
  }, {} as Record<string, StudentPayload[]>);

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10 pb-24">
        <div className="text-black text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold">General Attendance</h1>
          <p className="text-gray-600 mt-2">Track daily attendance for all students</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-md">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-200">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Student Attendance</h2>
                  <p className="text-sm text-gray-600">Mark attendance for {format(new Date(selectedDate), 'MMM dd, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <label htmlFor="attendance-date" className="text-sm font-medium text-gray-700">
                    Date:
                  </label>
                  <input
                    id="attendance-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Students
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Grade
                  </label>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black"
                  >
                    <option value="">All Grades</option>
                    {grades.map((g) => (
                      <option key={g} value={String(g)}>
                        Grade {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              {(searchTerm || gradeFilter) && (
                <div className="mt-4 flex items-center space-x-2">
                  <span className="text-sm text-gray-600">
                    Showing {filteredStudents.length} of {students.length} students
                  </span>
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setGradeFilter('')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Students Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-4">
              {Object.entries(groupedByGrade)
                .sort(([a], [b]) => {
                  const numA = parseInt(a.replace(/\D/g, ''), 10);
                  const numB = parseInt(b.replace(/\D/g, ''), 10);
                  return numA - numB;
                })
                .map(([grade, students]) => (
                  <div key={grade} className="space-y-2">
                    {/* Grade header */}
                    <div className="flex items-center justify-between px-4 py-2 bg-cyan-600 text-white rounded-lg">
                      <span className="font-semibold text-lg">{grade}</span>
                      <span className="text-sm">{students.length} students</span>
                    </div>

                    {/* Student cards */}
                    <div className="space-y-2">
                      {students.map(student => (
                        <div
                          key={student.studentId}
                          className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="font-medium text-gray-800">{student.name}</p>
                            <p className="text-gray-600 text-sm">Grade {student.grade}</p>
                          </div>
                          <div className="flex space-x-4 items-center">
                            {(['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]).map(status => (
                              <label key={status} className="flex items-center space-x-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={attendance[student.studentId] === status}
                                  onChange={() => handleSelect(student.studentId, status)}
                                  className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className={`text-sm ${
                                  status === 'PRESENT' ? 'text-green-700' :
                                  status === 'LATE' ? 'text-yellow-700' :
                                  'text-red-700'
                                }`}>
                                  {status}
                                </span>
                              </label>
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

        {/* Sticky Save Button at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-20 p-4 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex justify-center">
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
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer font-semibold shadow-md"
            >
              Save All Changes
            </button>
          </div>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.2) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(0, 0, 0, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0, 0, 0, 0.4);
        }
      `}</style>
    </>
  );
}
