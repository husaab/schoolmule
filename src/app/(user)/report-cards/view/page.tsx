'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { useUserStore } from '@/store/useUserStore';
import { getAllStudents } from '@/services/studentService';
import { StudentPayload } from '@/services/types/student';
import { EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';


export default function ViewReportCardsPage() {
  const user = useUserStore((state) => state.user);
  const [students, setStudents] = useState<StudentPayload[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<string>('');

  useEffect(() => {
    if (user.school) {
      getAllStudents(user.school).then((res) => {
        if (res.status === 'success') {
          setStudents(res.data);
        }
      });
    }
  }, [user.school]);

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
      <main className="ml-32 bg-white min-h-screen p-10 text-black pt-40">
        <h1 className="text-3xl font-bold text-center mb-6">View Report Cards</h1>

        <div className="w-[70%] mx-auto space-y-6">
          <div className="w-full">
            <label className="font-medium">Filter by grade:</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full border px-3 py-2 rounded mt-1"
            >
              <option value="">-- All Grades --</option>
              {Object.keys(groupedByGrade)
                .sort((a, b) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
                .map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
            </select>
          </div>

          <div className="max-h-[50vh] overflow-y-scroll border p-4 rounded custom-scrollbar">
            {Object.entries(groupedByGrade)
              .sort(([a], [b]) => parseInt(a.replace(/\D/g, '')) - parseInt(b.replace(/\D/g, '')))
              .map(([grade, students]) => {
                const collapsed = selectedGrade && grade !== selectedGrade;
                if (!selectedGrade || !collapsed) {
                  return (
                    <div key={grade} className="mb-6">
                      <h2 className="text-xl font-semibold mb-2">{grade}</h2>
                      <div className="space-y-2">
                        {students.map((student) => (
                          <div
                            key={student.studentId}
                            className="flex items-center justify-between border px-4 py-2 rounded"
                          >
                            <span>{student.name}</span>
                            <div className="flex gap-4">
                              <button title="View PDF" className="hover:text-cyan-700">
                                <EyeIcon className="h-6 w-6 text-green-400" />
                              </button>
                              <button title="Download PDF" className="hover:text-green-700">
                                <ArrowDownTrayIcon className="h-6 w-6 text-blue-400" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })}
          </div>
        </div>

        <style jsx global>{`
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
          }
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 3px;
          }
        `}</style>
      </main>
    </>
  );
}
