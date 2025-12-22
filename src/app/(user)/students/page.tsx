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
            <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
                <div className="p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Students</h1>
                                <p className="text-slate-500 mt-1">Manage student records and information</p>
                            </div>
                            {!showArchived && (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl font-medium cursor-pointer"
                                >
                                    <PlusIcon className="h-5 w-5" />
                                    Add Student
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Main Content Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100">
                        {/* Sticky Header */}
                        <div className="sticky top-20 z-10 bg-white rounded-t-2xl border-b border-slate-100">
                            <div className="p-6">
                                {/* Tabs for Active/Archived */}
                                <div className="flex gap-2 mb-6">
                                    <button
                                        onClick={() => setShowArchived(false)}
                                        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                                            !showArchived
                                                ? 'bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 border border-cyan-100'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        Active Students
                                    </button>
                                    <button
                                        onClick={() => setShowArchived(true)}
                                        className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                                            showArchived
                                                ? 'bg-amber-50 text-amber-700 border border-amber-100'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        <ArchiveBoxIcon className="h-4 w-4" />
                                        Archived
                                    </button>
                                </div>

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
                                            {grades.map(gradeOption => (
                                                <option key={gradeOption.value} value={String(gradeOption.value)}>Grade {gradeOption.label}</option>
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
                            {loading ? (
                                <div className="flex justify-center py-12">
                                    <Spinner size="lg" />
                                </div>
                            ) : error ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-full flex items-center justify-center">
                                        <UserIcon className="h-8 w-8 text-red-400" />
                                    </div>
                                    <p className="text-red-600">{error}</p>
                                </div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                                        <UserIcon className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                                        {students.length === 0
                                            ? (showArchived ? 'No Archived Students' : 'No Students Yet')
                                            : 'No Matching Students'}
                                    </h3>
                                    <p className="text-sm text-slate-500">
                                        {students.length === 0
                                            ? (showArchived
                                                ? 'No students have been archived yet.'
                                                : 'Add your first student to get started.')
                                            : 'Try adjusting your search or filters.'}
                                    </p>
                                </div>
                            ) : (
                                /* Students Table */
                                <div className="overflow-x-auto">
                                    <table className="min-w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    Student Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    Grade
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    OEN
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    Homeroom
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    Parent Contact
                                                </th>
                                                {showArchived && (
                                                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                        Archived Date
                                                    </th>
                                                )}
                                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredStudents.map((student) => (
                                                <tr key={student.studentId} className={`hover:bg-slate-50 transition-colors ${showArchived ? 'opacity-75' : ''}`}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                                                                <UserIcon className="h-5 w-5 text-cyan-600" />
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-slate-900">
                                                                    {student.name}
                                                                </div>
                                                                {showArchived && (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                                        Archived
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium">
                                                            <AcademicCapIcon className="h-4 w-4" />
                                                            Grade {student.grade ?? '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 font-mono">
                                                        {student.oen || '-'}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                        {student.homeroomTeacherId ? (
                                                            <span className="text-emerald-600">Assigned</span>
                                                        ) : (
                                                            <span className="text-slate-400">Not Assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                        {(student.mother.name && student.mother.name.toLowerCase() !== 'n/a' ? student.mother.name : null) ||
                                                         (student.father.name && student.father.name.toLowerCase() !== 'n/a' ? student.father.name : null) ||
                                                         <span className="text-slate-400">No Contact</span>}
                                                    </td>
                                                    {showArchived && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                                            {student.archivedAt
                                                                ? new Date(student.archivedAt).toLocaleDateString()
                                                                : '-'}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => setViewStudent(student)}
                                                                className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                                                title="View Student"
                                                            >
                                                                <EyeIcon className="h-5 w-5" />
                                                            </button>
                                                            {!showArchived && (
                                                                <>
                                                                    <button
                                                                        onClick={() => setEditStudent(student)}
                                                                        className="p-2 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                                                                        title="Edit Student"
                                                                    >
                                                                        <PencilIcon className="h-5 w-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setArchiveTarget(student)}
                                                                        className="p-2 rounded-lg text-amber-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                                                                        title="Archive Student"
                                                                    >
                                                                        <ArchiveBoxArrowDownIcon className="h-5 w-5" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setDeleteTarget(student)}
                                                                        className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                                                                        title="Delete Student"
                                                                    >
                                                                        <TrashIcon className="h-5 w-5" />
                                                                    </button>
                                                                </>
                                                            )}
                                                            {showArchived && (
                                                                <button
                                                                    onClick={() => setUnarchiveTarget(student)}
                                                                    className="p-2 rounded-lg text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
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