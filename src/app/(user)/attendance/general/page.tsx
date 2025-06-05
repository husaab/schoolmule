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

 const [selectedDate, setSelectedDate] = useState(() => {
  return format(new Date(), 'yyyy-MM-dd'); // Uses user’s browser local time
    });

  useEffect(() => {
    getGeneralAttendanceByDate(selectedDate).then(res => {
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
  }, [selectedDate]);
  

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

  const groupedByGrade = students.reduce((acc, student) => {
    const grade = `Grade ${student.grade ?? '-'}`;
    acc[grade] = acc[grade] || [];
    acc[grade].push(student);
    return acc;
  }, {} as Record<string, StudentPayload[]>);

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="ml-32 min-h-screen bg-white p-10">
        <h1 className="text-3xl text-center mb-6 pt-40 text-black">General Attendance</h1>
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
          {Object.entries(groupedByGrade)
            .sort(([a], [b]) => {
                const numA = parseInt(a.replace(/\D/g, ''), 10);
                const numB = parseInt(b.replace(/\D/g, ''), 10);
                return numA - numB;
            })
            .map(([grade, students]) => (
            <div key={grade}>
              <h2 className="text-xl font-semibold mb-2">{grade}</h2>
              <div className="space-y-2">
                {students.map(student => (
                  <div
                    key={student.studentId}
                    className="flex items-center justify-between border border-gray-300 rounded px-4 py-2 text-sm"
                  >
                    <span className="flex-1">{student.name}</span>
                    <div className="flex space-x-4 items-center text-sm">
                      {(['PRESENT', 'LATE', 'ABSENT'] as AttendanceStatus[]).map(status => (
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
            </div>
          ))}
        </div>

        <div className="text-center mt-6">
          <button
            onClick={async () => {
              const entries = Object.entries(attendance)
                .filter(([_, status]) => status !== null)
                .map(([studentId, status]) => ({ studentId, status: status as AttendanceStatus }));

              try {
                const res = await submitGeneralAttendance({
                  attendanceDate: selectedDate,
                  entries,
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
            className="bg-green-400 hover:bg-green-600 text-white px-6 py-2 rounded cursor-pointer"
          >
            Save All Changes
          </button>
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
