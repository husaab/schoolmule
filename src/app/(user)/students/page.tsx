'use client'

import React, { useState, useEffect } from 'react';
import Navbar from '../../../components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import StudentAddModal from '@/components/student/add/studentAddModal';
import StudentViewModal from '@/components/student/view/studentViewModal';
import StudentDeleteModal from '@/components/student/delete/studentDeleteModal';
import StudentEditModal from '@/components/student/edit/studentEditModal';
import { getAllStudents } from '@/services/studentService';
import { StudentPayload } from '@/services/types/student';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/useUserStore';

const StudentsPage = () => {

    const [students, setStudents] = useState<StudentPayload[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const user = useUserStore((state) => state.user);
    const [gradeFilter, setGradeFilter] = useState<string>('');
    const router = useRouter();
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewStudent, setViewStudent] = useState<StudentPayload | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<StudentPayload | null>(null);
    const [editStudent, setEditStudent] = useState<StudentPayload | null>(null)

    useEffect(() => {
      if(user.school != null) {
        getAllStudents(user.school)
      .then((res) => {
        if (res.status === 'success') {
          setStudents(res.data);
        } else {
          console.error('Failed to fetch students:', res.message);
        }
      })
      .catch((err) => console.error('Error loading students:', err));
      }
  }, []);

   const grades = Array.from(
    new Set(students.map(s => s.grade)
        .filter((g): g is number => g != null)
        .map(g => Number(g)))).filter(g => !isNaN(g)).sort((a, b) => a - b);

    const filteredStudents = students.filter(s => {
      const matchesName = s.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGrade = gradeFilter === '' || String(s.grade) === gradeFilter;
      return matchesName && matchesGrade;
    });

    return (
    <>
        <Navbar/>
        <Sidebar />
        <main className = "ml-32 bg-white min-h-screen p-10">
            <div className="py-40 p-50 text-black">
                <h1 className="text-3xl text-center">Students</h1>
                <div className="mt-10 p-8 w-[70%] max-h-[80vh] sm:w-12/12 md:w-11/12 lg:w-10/12 mx-auto overflow-y-scroll custom-scrollbar border-2 border-cyan-600 rounded-lg shadow-lg space-y-4">

             {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <input
              type="text"
              placeholder="Search by name…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="w-full sm:w-48 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="">All Grades</option>
              {grades.map(g => (
                <option key={g} value={String(g)}>
                  Grade {g}
                </option>
              ))}
            </select>
            <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-green-400 text-white rounded-lg hover:bg-green-500 cursor-pointer"
          >
            + Add Student
          </button>
          </div>
          
          
            {filteredStudents.map((student) => (
            <div
              key={student.studentId}
              className="flex items-center justify-between p-4 bg-white border border-cyan-400 rounded-lg shadow-sm"
            >
              <span className="font-medium text-gray-800 flex-1">{student.name}</span>

              <div className="flex items-center space-x-6">
                <span className="w-24 text-gray-600 text-right">Grade: {student.grade ?? '-'}</span>
                <span className="w-64 text-gray-600 text-right mr-12">OEN: {student.oen ?? '-'}</span>
                <button
                  onClick={() => setViewStudent(student)}
                  className="px-3 py-1 bg-green-600 text-white rounded hover:bg-rgeen-700 cursor-pointer"
                >
                  View
                </button>
                <button
                  onClick={() => setEditStudent(student)}
                  className="px-3 py-1 bg-cyan-600 text-white rounded hover:bg-cyan-700 cursor-pointer"
                >
                  Edit
                </button>
                <button
                    onClick={() => setDeleteTarget(student)}
                    className="text-2xl text-red-600 hover:text-red-800 font-bold px-2 cursor-pointer"
                  >
                    ×
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
      <StudentAddModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={newStudent => setStudents(prev => [newStudent, ...prev])}
        />

      {viewStudent && (
        <StudentViewModal
          isOpen={!!viewStudent}
          onClose={() => setViewStudent(null)}
          student={viewStudent}
        />
      )}
      {editStudent && (
        <StudentEditModal
          isOpen={!!editStudent}
          onClose={() => setEditStudent(null)}
          student={editStudent}
          onUpdate={(updated) => {
            setStudents((prev) =>
              prev.map((s) => (s.studentId === updated.studentId ? updated : s))
            );
            setEditStudent(null);
          }}
        />
      )}
      {deleteTarget && (
        <StudentDeleteModal
          isOpen
          onClose={() => setDeleteTarget(null)}
          student={deleteTarget}
          onDeleted={(id) => {
            setStudents((prev) => prev.filter((s) => s.studentId !== id));
          }}
        />
      )}
  </>
  );
    
};

export default StudentsPage;