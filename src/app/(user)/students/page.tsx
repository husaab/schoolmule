'use client'

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import Navbar from '../../../components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import StudentAddModal from '@/components/student/add/studentAddModal';
import StudentDeleteModal from '@/components/student/delete/studentDeleteModal';
import StudentEditModal from '@/components/student/edit/studentEditModal';
import StudentArchiveModal from '@/components/student/archive/studentArchiveModal';
import StudentUnarchiveModal from '@/components/student/archive/studentUnarchiveModal';
import { getAllStudents, getArchivedStudents } from '@/services/studentService';
import { StudentPayload } from '@/services/types/student';
import { useUserStore } from '@/store/useUserStore';
import { effectiveStaffRole } from '@/lib/permissions';
import { useSchoolYearStore } from '@/store/useSchoolYearStore';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, AcademicCapIcon, UserIcon, ArchiveBoxIcon, ArchiveBoxArrowDownIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import StudentNameLink from '@/components/student/profile/StudentNameLink';
import Avatar from '@/components/avatar/Avatar';
import { studentAvatar } from '@/lib/studentAvatar';
import { useStudentProfile } from '@/hooks/useStudentProfile';
import { useStudentProfileStore } from '@/store/useStudentProfileStore';
import NewConversationModal from '@/components/messaging/NewConversationModal';
import Spinner from '@/components/Spinner';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { getGradeOptions, getGradeNumericValue, getGradeDisplayName } from '@/lib/schoolUtils';
import { useFilterParams, useDebouncedParam } from '@/hooks/useFilterParams';

const StudentsContent = () => {

    const filters = useFilterParams();
  const { get, setParams } = filters;
    const [students, setStudents] = useState<StudentPayload[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // Free-text search keeps local state for snappy typing, seeded from URL.
    const [searchTerm, setSearchTerm] = useDebouncedParam(filters, 'q');
    const user = useUserStore((state) => state.user);
    const selectedYearId = useSchoolYearStore((s) => s.selectedYearId);
    // Filters live in the URL so Back/refresh/share restore them.
    const gradeFilter = get('grade');
    const showArchived = get('archived') === '1';
    const [showAddModal, setShowAddModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<StudentPayload | null>(null);
    const [editStudent, setEditStudent] = useState<StudentPayload | null>(null);
    const [archiveTarget, setArchiveTarget] = useState<StudentPayload | null>(null);
    const [unarchiveTarget, setUnarchiveTarget] = useState<StudentPayload | null>(null);
    const [messageTarget, setMessageTarget] = useState<StudentPayload | null>(null);
    const router = useRouter();
    // Rows open the student's full profile as a modal over this list.
    const { open: openProfile } = useStudentProfile();
    // ...which bumps this when it edits, archives or deletes someone.
    const profileChanges = useStudentProfileStore((s) => s.changeVersion);

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
    }, [user.school, showArchived, selectedYearId, profileChanges]); // refetch when the selected school year changes, or the profile modal changed a student

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
                        <div className="sticky top-20 z-20 bg-white rounded-t-2xl border-b border-slate-100">
                            <div className="p-6">
                                {/* Tabs for Active/Archived */}
                                <div className="flex gap-2 mb-6">
                                    <button
                                        onClick={() => setParams({ archived: null })}
                                        className={`px-4 py-2 text-sm font-medium rounded-xl transition-all cursor-pointer ${
                                            !showArchived
                                                ? 'bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 border border-cyan-100'
                                                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        Active Students
                                    </button>
                                    <button
                                        onClick={() => setParams({ archived: '1' })}
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
                                        <SearchableSelect
                                            value={gradeFilter}
                                            onChange={(v) => setParams({ grade: v })}
                                            options={grades.map(g => ({ value: String(g.value), label: getGradeDisplayName(g.value) }))}
                                            allLabel="All Grades"
                                            ariaLabel="Filter by Grade"
                                            searchPlaceholder="Search grades…"
                                        />
                                    </div>
                                </div>

                                {(searchTerm || gradeFilter) && (
                                    <div className="mt-4 flex items-center gap-3">
                                        <span className="text-sm text-slate-500">
                                            Showing {filteredStudents.length} of {students.length} students
                                        </span>
                                        <button
                                            onClick={() => {
                                                setParams({ q: null, grade: null })
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
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="sticky left-0 z-10 bg-white py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                    Student Name
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    Grade
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    OEN
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    Homeroom
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    Parent Contact
                                                </th>
                                                {showArchived && (
                                                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                        Archived Date
                                                    </th>
                                                )}
                                                <th className="sticky right-0 z-10 bg-white px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredStudents.map((student) => (
                                                <tr
                                                    key={student.studentId}
                                                    onClick={() => openProfile(student.studentId)}
                                                    onKeyDown={(e) => {
                                                        // Keys pressed on the row's own buttons and links are theirs.
                                                        if (e.target !== e.currentTarget) return
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault()
                                                            openProfile(student.studentId)
                                                        }
                                                    }}
                                                    tabIndex={0}
                                                    role="button"
                                                    aria-label={`Open ${student.name}'s profile`}
                                                    className={`hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 ${showArchived ? 'opacity-75' : ''} group`}
                                                >
                                                    <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-3 whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                        <div className="flex items-center gap-2">
                                                            <Avatar name={student.name} avatar={studentAvatar(student)} size={32} />
                                                            <div>
                                                                <StudentNameLink
                                                                    studentId={student.studentId}
                                                                    className="text-sm font-medium text-slate-900 hover:text-cyan-700 hover:underline"
                                                                >
                                                                    {student.name}
                                                                </StudentNameLink>
                                                                {showArchived && (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                                                        Archived
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap">
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-sm font-medium">
                                                            <AcademicCapIcon className="h-4 w-4" />
                                                            {student.grade ? getGradeDisplayName(student.grade) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 font-mono">
                                                        {student.oen || '-'}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                                                        {student.homeroomTeacherId ? (
                                                            <span className="text-emerald-600">Assigned</span>
                                                        ) : (
                                                            <span className="text-slate-400">Not Assigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-600">
                                                        {(student.mother.name && student.mother.name.toLowerCase() !== 'n/a' ? student.mother.name : null) ||
                                                         (student.father.name && student.father.name.toLowerCase() !== 'n/a' ? student.father.name : null) ||
                                                         <span className="text-slate-400">No Contact</span>}
                                                    </td>
                                                    {showArchived && (
                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                                                            {student.archivedAt
                                                                ? new Date(student.archivedAt).toLocaleDateString()
                                                                : '-'}
                                                        </td>
                                                    )}
                                                    <td className="sticky right-0 z-10 bg-white group-hover:bg-slate-50 px-4 py-3 whitespace-nowrap shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                        {/* Row itself opens the profile, so keep these actions from bubbling into it. */}
                                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                            {!showArchived && (
                                                                <button
                                                                    onClick={() => setMessageTarget(student)}
                                                                    className="p-2 rounded-lg text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 transition-colors cursor-pointer"
                                                                    title="Message guardians"
                                                                >
                                                                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => openProfile(student.studentId)}
                                                                className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                                                                title="View profile"
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

                <NewConversationModal
                        isOpen={messageTarget !== null}
                        onClose={() => setMessageTarget(null)}
                        tone="staff"
                        role={effectiveStaffRole(user, 'messages.all')}
                        preset={messageTarget ? { studentId: messageTarget.studentId, mode: 'general' } : undefined}
                        onCreated={(thread) => {
                            setMessageTarget(null)
                            router.push(`/messages?thread=${encodeURIComponent(thread.conversation.conversationId)}`)
                        }}
                    />
            </main>
        </>
    );

};

const StudentsPage = () => (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
        <StudentsContent />
    </Suspense>
);

export default StudentsPage;