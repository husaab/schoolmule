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
      <main className="ml-32 min-h-screen bg-white p-10">
        <div className="pt-40 text-black text-center mb-6">
          <h1 className="text-3xl font-semibold">{className} – Class Attendance</h1>
        </div>

        <div className="mb-4 flex items-center justify-center gap-2 text-black">
          <label htmlFor="attendance-date" className="font-medium">
            Attendance Date:
          </label>
          <input
            id="attendance-date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
        </div>

        <div className="w-[70%] mx-auto max-h-[60vh] overflow-y-scroll custom-scrollbar border border-cyan-600 rounded-lg p-4 space-y-4 text-black">
          {students.map((student) => (
            <div
              key={student.studentId}
              className="flex items-center justify-between border border-gray-300 rounded px-4 py-2 text-sm"
            >
              <span className="flex-1">{student.name}</span>
              <div className="flex space-x-4 items-center text-sm">
                {(['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]).map((status) => (
                  <label key={status} className="flex items-center space-x-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attendance[student.studentId] === status}
                      onChange={() => handleSelect(student.studentId, status)}
                    />
                    <span>{status}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={handleSave}
            className="bg-green-500 hover:bg-green-700 text-white px-6 py-2 rounded cursor-pointer"
          >
            Save All Changes
          </button>
        </div>
      </main>
    </>
  );
}
