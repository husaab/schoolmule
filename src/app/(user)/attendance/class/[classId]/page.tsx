'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { getStudentsInClass, getClassById } from '@/services/classService';
import { getClassAttendanceByDate, submitClassAttendance } from '@/services/attendanceService';
import { StudentPayload } from '@/services/types/student';
import { format } from 'date-fns-tz';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUserStore } from '@/store/useUserStore';

type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT';

export default function ClassAttendancePage() {
  const { classId } = useParams() as { classId: string };
  const [students, setStudents] = useState<StudentPayload[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus | null>>({});
  const [selectedDate, setSelectedDate] = useState(() =>
    format(new Date(), 'yyyy-MM-dd')
  );
  const [className, setClassName] = useState<string>('');
  const showNotification = useNotificationStore(state => state.showNotification);
  const user = useUserStore(state => state.user);

  useEffect(() => {
    getClassById(classId).then((res) => {
      if (res.status === 'success') {
        setClassName(res.data.subject);
      }
    });
  }, [classId]);

  useEffect(() => {
    getStudentsInClass(classId).then((res) => {
      if (res.status === 'success') {
        setStudents(res.data);
      }
    });
  }, [classId]);

  useEffect(() => {
    getClassAttendanceByDate(classId, selectedDate).then((res) => {
      if (res.status === 'success') {
        const map: Record<string, AttendanceStatus> = {};
        for (const entry of res.data) {
          map[entry.studentId] = entry.status;
        }
        setAttendance(map);
      }
    });
  }, [classId, selectedDate]);

  const handleSelect = (studentId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? null : status,
    }));
  };

  const handleSave = async () => {
    const entries = Object.entries(attendance)
                .filter(([_, status]) => status !== null)
                .map(([studentId, status]) => ({ studentId, status: status as AttendanceStatus }));

    const res = await submitClassAttendance({
      classId,
      attendanceDate: selectedDate,
      entries,
      school: user.school!
    });

    if (res.status === 'success') {
      showNotification('Attendance saved successfully', "success");
    } else {
      showNotification(res.message || 'Failed to save attendance', "error");
    }
  };

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10 pb-24">
        <div className="text-black text-center mb-6">
          <h1 className="text-2xl lg:text-3xl font-semibold">Class Attendance</h1>
          <p className="text-gray-600 mt-2">{className || 'Loading...'}</p>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-2xl shadow-md">
          {/* Sticky Header */}
          <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-200">
            <div className="p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Student Attendance</h2>
                  <p className="text-sm text-gray-600">Mark attendance for {className} on {format(new Date(selectedDate), 'MMM dd, yyyy')}</p>
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
            </div>
          </div>

          {/* Students Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="space-y-2">
              {students.map((student) => (
                <div
                  key={student.studentId}
                  className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">{student.name}</p>
                    <p className="text-gray-600 text-sm">Grade {student.grade}</p>
                  </div>
                  <div className="flex space-x-4 items-center">
                    {(['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]).map((status) => (
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
        </div>

        {/* Sticky Save Button at Bottom */}
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-20 p-4 bg-white border-t border-gray-200 shadow-lg">
          <div className="flex justify-center">
            <button
              onClick={handleSave}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer font-semibold shadow-md"
            >
              Save All Changes
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
