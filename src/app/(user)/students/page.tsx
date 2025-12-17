'use client'

import React, { useState, useEffect, useCallback } from 'react';
import Navbar from '../../../components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import StudentAddModal from '@/components/student/add/studentAddModal';
import StudentViewModal from '@/components/student/view/studentViewModal';
import StudentDeleteModal from '@/components/student/delete/studentDeleteModal';
import StudentEditModal from '@/components/student/edit/studentEditModal';
import StudentArchiveModal from '@/components/student/archive/studentArchiveModal';
import StudentUnarchiveModal from '@/components/student/archive/studentUnarchiveModal';
import { getAllStudents, getArchivedStudents } from '@/services/studentService';
import { StudentPayload } from '@/services/types/student';
import { useUserStore } from '@/store/useUserStore';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, AcademicCapIcon, UserIcon, ArchiveBoxIcon, ArchiveBoxArrowDownIcon } from '@heroicons/react/24/outline';
import Spinner from '@/components/Spinner';
import { getGradeOptions, getGradeNumericValue } from '@/lib/schoolUtils';

const StudentsPage = () => {

    const [students, setStudents] = useState<StudentPayload[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const user = useUserStore((state) => state.user);
    const [gradeFilter, setGradeFilter] = useState<string>('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [viewStudent, setViewStudent] = useState<StudentPayload | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<StudentPayload | null>(null);
    const [editStudent, setEditStudent] = useState<StudentPayload | null>(null);
    const [archiveTarget, setArchiveTarget] = useState<StudentPayload | null>(null);
    const [unarchiveTarget, setUnarchiveTarget] = useState<StudentPayload | null>(null);
    const [showArchived, setShowArchived] = useState(false);

    const loadStudents = useCallback(async () => {
        if (!user.school) return;
        
        setLoading(true);
        setError(null);
        
        try {
            const response = showArchived 
                ? await getArchivedStudents(user.school)
                : await getAllStudents(user.school);
                
            if (response.status === 'success') {
                setStudents(response.data);
            } else {
                setError(response.message || 'Failed to load students');
            }
        } catch (err) {
            console.error('Error loading students:', err);
            setError('Error loading students');
        } finally {
            setLoading(false);
        }
    }, [user.school, showArchived]);

    useEffect(() => {
        loadStudents();
    }, [user.school, loadStudents]);

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

    return (
        <>
            <Navbar />
            <Sidebar />
            <main className="lg:ml-64 pt-36 lg:pt-44 bg-gray-50 min-h-screen p-4 lg:p-10">
                <div className="text-black text-center mb-6">
                    <h1 className="text-2xl lg:text-3xl font-semibold">Students Management</h1>
                    <p className="text-gray-600 mt-2">Manage student records and information for your school.</p>
                </div>

                {/* Main Content Card */}
                <div className="bg-white rounded-2xl shadow-md">
                    {/* Sticky Header */}
                    <div className="sticky top-0 z-10 bg-white rounded-t-2xl border-b border-gray-200">
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-800">Student Directory</h2>
                                    <p className="text-sm text-gray-600">View and manage all student records</p>
                                </div>
                                {!showArchived && (
                                    <button
                                        onClick={() => setShowAddModal(true)}
                                        className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
                                    >
                                        <PlusIcon className="h-5 w-5 mr-2" />
                                        Add Student
                                    </button>
                                )}
                            </div>

                            {/* Tabs for Active/Archived */}
                            <div className="flex space-x-1 mb-6">
                                <button
                                    onClick={() => setShowArchived(false)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                                        !showArchived
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    Active Students
                                </button>
                                <button
                                    onClick={() => setShowArchived(true)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                                        showArchived
                                            ? 'bg-amber-100 text-amber-700'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                    }`}
                                >
                                    <ArchiveBoxIcon className="h-4 w-4 inline mr-1" />
                                    Archived Students
                                </button>
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
                                        {grades.map(gradeOption => (
                                            <option key={gradeOption.value} value={String(gradeOption.value)}>Grade {gradeOption.label}</option>
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
                    <div className="p-6">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <Spinner />
                            </div>
                        ) : error ? (
                            <div className="text-center text-red-600 py-8">
                                {error}
                            </div>
                        ) : filteredStudents.length === 0 ? (
                            <div className="text-center text-gray-500 py-8">
                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                                    <UserIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    {students.length === 0 
                                        ? (showArchived ? 'No Archived Students' : 'No Students') 
                                        : 'No Matching Students'}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {students.length === 0 
                                        ? (showArchived 
                                            ? 'No students have been archived yet.' 
                                            : 'Add your first student to get started.')
                                        : 'Try adjusting your search or filters.'}
                                </p>
                            </div>
                        ) : (
                            /* Students Table */
                            <div className="overflow-x-auto overflow-y-auto max-h-[70vh]">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Student Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Grade
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                OEN
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Homeroom Teacher
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Parent Contact
                                            </th>
                                            {showArchived && (
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Archived Date
                                                </th>
                                            )}
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {filteredStudents.map((student) => (
                                            <tr key={student.studentId} className={`hover:bg-gray-50 ${showArchived ? 'opacity-75' : ''}`}>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <UserIcon className="h-5 w-5 text-gray-400 mr-3" />
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {student.name}
                                                            {showArchived && (
                                                                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                    Archived
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="flex items-center">
                                                        <AcademicCapIcon className="h-4 w-4 text-gray-400 mr-1" />
                                                        Grade {student.grade ?? '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {student.oen || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {student.homeroomTeacherId ? 'Assigned' : 'Not Assigned'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {(student.mother.name && student.mother.name.toLowerCase() !== 'n/a' ? student.mother.name : null) || 
                                                     (student.father.name && student.father.name.toLowerCase() !== 'n/a' ? student.father.name : null) || 
                                                     'No Contact'}
                                                </td>
                                                {showArchived && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {student.archivedAt 
                                                            ? new Date(student.archivedAt).toLocaleDateString()
                                                            : '-'}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex space-x-2">
                                                        <button
                                                            onClick={() => setViewStudent(student)}
                                                            className="text-blue-600 hover:text-blue-900 p-1 cursor-pointer"
                                                            title="View Student"
                                                        >
                                                            <EyeIcon className="h-5 w-5" />
                                                        </button>
                                                        {!showArchived && (
                                                            <>
                                                                <button
                                                                    onClick={() => setEditStudent(student)}
                                                                    className="text-green-600 hover:text-green-900 p-1 cursor-pointer"
                                                                    title="Edit Student"
                                                                >
                                                                    <PencilIcon className="h-5 w-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setArchiveTarget(student)}
                                                                    className="text-amber-600 hover:text-amber-900 p-1 cursor-pointer"
                                                                    title="Archive Student"
                                                                >
                                                                    <ArchiveBoxArrowDownIcon className="h-5 w-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() => setDeleteTarget(student)}
                                                                    className="text-red-600 hover:text-red-900 p-1 cursor-pointer"
                                                                    title="Delete Student"
                                                                >
                                                                    <TrashIcon className="h-5 w-5" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {showArchived && (
                                                            <button
                                                                onClick={() => setUnarchiveTarget(student)}
                                                                className="text-green-600 hover:text-green-900 p-1 cursor-pointer"
                                                                title="Restore Student"
                                                            >
                                                                <ArchiveBoxIcon className="h-5 w-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Modals */}
                <StudentAddModal
                    isOpen={showAddModal}
                    onClose={() => setShowAddModal(false)}
                    onAdd={() => loadStudents()}
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
                        onUpdate={() => loadStudents()}
                    />
                )}

                {deleteTarget && (
                    <StudentDeleteModal
                        isOpen={!!deleteTarget}
                        onClose={() => setDeleteTarget(null)}
                        student={deleteTarget}
                        onDeleted={() => loadStudents()}
                    />
                )}

                {archiveTarget && (
                    <StudentArchiveModal
                        isOpen={!!archiveTarget}
                        onClose={() => setArchiveTarget(null)}
                        student={archiveTarget}
                        onArchived={() => loadStudents()}
                    />
                )}

                {unarchiveTarget && (
                    <StudentUnarchiveModal
                        isOpen={!!unarchiveTarget}
                        onClose={() => setUnarchiveTarget(null)}
                        student={unarchiveTarget}
                        onUnarchived={() => loadStudents()}
                    />
                )}
            </main>
        </>
    );
    
};

export default StudentsPage;