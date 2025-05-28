'use client'

import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import { getAllStudents } from '@/services/studentService';
import { StudentPayload } from '@/services/types/student';
import { useRouter } from 'next/navigation';

const StudentsPage = () => {

    const [students, setStudents] = useState<StudentPayload[]>([]);
    const router = useRouter();

    useEffect(() => {
    getAllStudents()
      .then((res) => {
        if (res.status === 'success') {
          setStudents(res.data);
        } else {
          console.error('Failed to fetch students:', res.message);
        }
      })
      .catch((err) => console.error('Error loading students:', err));
  }, []);

    return (
    <>
        <Navbar/>
        <Sidebar />
        <main className = "ml-32 bg-white min-h-screen p-10">
            <div className="py-40 p-50 text-black">
                <h1 className="text-3xl text-center">Students</h1>
                <div className="mt-10 p-8 w-[70%] max-h-[80vh] sm:w-12/12 md:w-11/12 lg:w-10/12 mx-auto overflow-y-scroll custom-scrollbar border-2 border-cyan-600 rounded-lg shadow-lg space-y-4">
          {students.map((student) => (
            <div
              key={student.studentId}
              className="flex items-center justify-between p-4 bg-white border border-cyan-400 rounded-lg shadow-sm"
            >
              <span className="font-medium text-gray-800 flex-1">{student.name}</span>

              <div className="flex items-center space-x-6">
                <span className="w-24 text-gray-600 text-right">Grade: {student.grade ?? '-'}</span>
                <span className="w-64 text-gray-600 text-right mr-12">OEN: {student.oen ?? '-'}</span>
                <button
                  onClick={() => router.push(`/students/${student.studentId}`)}
                  className="px-3 py-1 bg-green-400 text-white rounded hover:bg-blue-700 cursor-pointer"
                >
                  View
                </button>
                <button
                  onClick={() => router.push(`/students/${student.studentId}/edit`)}
                  className="px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
            </div>
        </main>

        {/* Custom scrollbar styling */}
      {/* Custom scrollbar styling */}
      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(0,0,0,0.2) transparent;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
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
    
};

export default StudentsPage;