'use client';

import Navbar from '@/components/navbar/Navbar';
import Sidebar from '@/components/sidebar/Sidebar';
import Spinner from '@/components/Spinner';
import { useUserStore } from '@/store/useUserStore';
import { useEffect, useState, useMemo } from 'react';
import { getAllParentStudents } from '@/services/parentStudentService';
import { ParentStudentPayload } from '@/services/types/parentStudent';
import { useNotificationStore } from '@/store/useNotificationStore';
import AddRelationModal, { PresetStudent } from '@/components/relation/add/page';
import DeleteRelationModal from '@/components/relation/delete/page';
import EditRelationModal from '@/components/relation/edit/page';
import { getGradeDisplayName, getGradeNumericValue, GradeValue } from '@/lib/schoolUtils';
import {
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

interface FamilyGroup {
  studentId: string;
  name: string;
  grade: GradeValue | null;
  relations: ParentStudentPayload[];
}

const ParentStudentRelationsPage = () => {
  const user = useUserStore((state) => state.user);
  const notify = useNotificationStore((s) => s.showNotification);
  const [relations, setRelations] = useState<ParentStudentPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addPresetStudent, setAddPresetStudent] = useState<PresetStudent | null>(null);
  const [deletingRelation, setDeletingRelation] = useState<ParentStudentPayload | null>(null);
  const [editingRelation, setEditingRelation] = useState<ParentStudentPayload | null>(null);

  useEffect(() => {
    const loadRelations = async () => {
      if (!user.school || user.school === 'null') return;

      try {
        const res = await getAllParentStudents();
        if (res.status === 'success' && res.data) {
          setRelations(res.data);
        } else {
          notify('Failed to load parent-student relations', 'error');
        }
      } catch {
        notify('Failed to load parent-student relations', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadRelations();
  }, [user.school, notify]);

  const grades = useMemo(() => {
    const set = new Set<string>();
    relations.forEach(r => {
      if (r.student?.grade != null) set.add(String(r.student.grade));
    });
    return Array.from(set).sort(
      (a, b) => getGradeNumericValue(a) - getGradeNumericValue(b)
    );
  }, [relations]);

  const filteredRelations = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return relations
      .filter(r =>
        (r.student?.name ?? '').toLowerCase().includes(q) ||
        r.parentName?.toLowerCase().includes(q) ||
        (r.parentUser &&
          `${r.parentUser.firstName} ${r.parentUser.lastName}`.toLowerCase().includes(q)) ||
        r.relation.toLowerCase().includes(q)
      )
      .filter(r => gradeFilter === '' || String(r.student?.grade) === gradeFilter);
  }, [relations, searchTerm, gradeFilter]);

  // Group the filtered relations into one card per student
  const groups = useMemo<FamilyGroup[]>(() => {
    const map = new Map<string, FamilyGroup>();
    for (const r of filteredRelations) {
      const existing = map.get(r.studentId);
      if (existing) {
        existing.relations.push(r);
      } else {
        map.set(r.studentId, {
          studentId: r.studentId,
          name: r.student?.name ?? 'Unknown Student',
          grade: r.student?.grade ?? null,
          relations: [r],
        });
      }
    }
    return [...map.values()].sort(
      (a, b) =>
        getGradeNumericValue(a.grade) - getGradeNumericValue(b.grade) ||
        a.name.localeCompare(b.name)
    );
  }, [filteredRelations]);

  const handleAdd = (newRel: ParentStudentPayload) => {
    setRelations((prev) => [newRel, ...prev]);
  };

  const handleDeleted = (id: string) => {
    setRelations(prev => prev.filter(r => r.parentStudentLinkId !== id));
  };

  const handleUpdated = (updated: ParentStudentPayload) => {
    setRelations(prev =>
      prev.map(r => r.parentStudentLinkId === updated.parentStudentLinkId ? updated : r)
    );
  };

  const openAdd = (preset: PresetStudent | null) => {
    setAddPresetStudent(preset);
    setShowAddModal(true);
  };

  const hasFilters = searchTerm !== '' || gradeFilter !== '';

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                Parent-Student Relations
              </h1>
              <p className="text-slate-500 mt-1">
                {loading
                  ? 'Manage parent contacts and linked accounts'
                  : `${groups.length} student${groups.length !== 1 ? 's' : ''} · ${filteredRelations.length} relation${filteredRelations.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <button
              onClick={() => openAdd(null)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl font-medium cursor-pointer"
            >
              <PlusIcon className="h-5 w-5" />
              Add Relation
            </button>
          </div>

          {/* Search and filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by student, parent, or relation…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              />
            </div>
            <select
              value={gradeFilter}
              onChange={e => setGradeFilter(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent cursor-pointer"
            >
              <option value="">All Grades</option>
              {grades.map(g => (
                <option key={g} value={g}>
                  {getGradeDisplayName(g)}
                </option>
              ))}
            </select>
          </div>

          {/* Family cards */}
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : groups.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 text-center py-16 px-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                <UsersIcon className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {hasFilters ? 'No matching relations' : 'No relations yet'}
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {hasFilters
                  ? 'Try a different search or grade filter.'
                  : 'Link parents to students to manage contacts and portal access.'}
              </p>
              {!hasFilters && (
                <button
                  onClick={() => openAdd(null)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-lg hover:shadow-xl font-medium cursor-pointer"
                >
                  <PlusIcon className="h-5 w-5" />
                  Add your first relation
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {groups.map((group) => (
                <div
                  key={group.studentId}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
                >
                  {/* Student header */}
                  <div className="flex items-center gap-3 p-4 border-b border-slate-100">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-5 h-5 text-cyan-700" />
                    </div>
                    <h3 className="font-semibold text-slate-900 truncate">{group.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-cyan-50 text-cyan-700 font-medium flex-shrink-0">
                      {getGradeDisplayName(group.grade)}
                    </span>
                  </div>

                  {/* Parent rows */}
                  <div className="p-4 space-y-2">
                    {group.relations.map((relation) => (
                      <div
                        key={relation.parentStudentLinkId}
                        className="flex items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100 transition-all"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium text-slate-900">
                              {relation.parentName ||
                                (relation.parentUser
                                  ? `${relation.parentUser.firstName} ${relation.parentUser.lastName}`
                                  : 'Unnamed parent')}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700">
                              {relation.relation}
                            </span>
                            {relation.parentUser && (
                              <span className="text-xs px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700">
                                ✓ Linked account
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {[relation.parentEmail ?? relation.parentUser?.email, relation.parentNumber]
                              .filter(Boolean)
                              .join(' · ') || 'No contact info'}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => setEditingRelation(relation)}
                            aria-label="Edit relation"
                            className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-50 transition-colors cursor-pointer"
                          >
                            <PencilSquareIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeletingRelation(relation)}
                            aria-label="Remove relation"
                            className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() =>
                        openAdd({
                          studentId: group.studentId,
                          name: group.name,
                          grade: group.grade,
                        })
                      }
                      className="w-full flex items-center justify-center gap-1.5 p-2.5 border border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:text-cyan-600 hover:border-cyan-300 hover:bg-cyan-50/50 transition-colors cursor-pointer"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Add parent
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AddRelationModal
        isOpen={showAddModal}
        presetStudent={addPresetStudent}
        onClose={() => {
          setShowAddModal(false);
          setAddPresetStudent(null);
        }}
        onAdd={handleAdd}
      />
      {deletingRelation && (
        <DeleteRelationModal
          isOpen={true}
          relation={deletingRelation}
          onClose={() => setDeletingRelation(null)}
          onDeleted={handleDeleted}
        />
      )}

      {editingRelation && (
        <EditRelationModal
          isOpen={true}
          relation={editingRelation}
          onClose={() => setEditingRelation(null)}
          onUpdated={handleUpdated}
        />
      )}
    </>
  );
};

export default ParentStudentRelationsPage;
