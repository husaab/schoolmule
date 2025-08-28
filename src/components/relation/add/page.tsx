'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../shared/modal';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getAllStudents } from '@/services/studentService';
import { getAllParents } from '@/services/parentService';
import { createParentStudent } from '@/services/parentStudentService';
import type { ParentStudentPayload, CreateParentStudentRequest } from '@/services/types/parentStudent';
import type { StudentPayload } from '@/services/types/student';
import type { ParentPayload } from '@/services/types/parent';
import { getGradeNumericValue } from '@/lib/schoolUtils';

interface AddRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (relation: ParentStudentPayload) => void;
}

const AddRelationModal: React.FC<AddRelationModalProps> = ({ isOpen, onClose, onAdd }) => {
  const user = useUserStore((state) => state.user);
  const showNotification = useNotificationStore((s) => s.showNotification);

  // students state
  const [students, setStudents] = useState<StudentPayload[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  // parents state
  const [parents, setParents] = useState<ParentPayload[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  // form state
  const [searchStudent, setSearchStudent] = useState('');
  const [filterGrade, setFilterGrade] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const [searchParent, setSearchParent] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);

  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentNumber, setParentNumber] = useState('');
  const [relation, setRelation] = useState('');

  // fetch on open
  useEffect(() => {
    if (!isOpen || !user?.school) return;
    // students
    setLoadingStudents(true);
    getAllStudents(user.school!)
      .then(res => {
        if (res.status === 'success' && res.data) setStudents(res.data);
        else showNotification('Failed to load students', 'error');
      })
      .catch(() => showNotification('Error fetching students', 'error'))
      .finally(() => setLoadingStudents(false));
    // parents
    setLoadingParents(true);
    getAllParents(user.school!)
      .then(res => {
        if (res.status === 'success' && res.data) setParents(res.data);
        else showNotification('Failed to load parents', 'error');
      })
      .catch(() => showNotification('Error fetching parents', 'error'))
      .finally(() => setLoadingParents(false));
  }, [isOpen, user.school, showNotification]);

  // filter lists
  const grades = useMemo(
    () => Array.from(new Set(students.map(s => s.grade).filter(g => g != null)))
      .sort((a,b) => getGradeNumericValue(a!) - getGradeNumericValue(b!))
      .map(g => g!.toString()),
    [students]
  );

  const filteredStudents = useMemo(
    () => students
      .filter(s => filterGrade === '' || s.grade?.toString() === filterGrade)
      .filter(s => s.name.toLowerCase().includes(searchStudent.toLowerCase()))
    , [students, searchStudent, filterGrade]
  );

  const filteredParents = useMemo(
    () => parents
      .filter(p => `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchParent.toLowerCase()))
    ,[parents, searchParent]
  );

  const reset = () => {
    setSearchStudent(''); setFilterGrade(''); setSelectedStudentId('');
    setSearchParent(''); setSelectedParentId(null);
    setParentName(''); setParentEmail(''); setParentNumber(''); setRelation('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !relation.trim()) {
      return showNotification('Select student & relation', 'error');
    }
    const payload: CreateParentStudentRequest = {
      studentId: selectedStudentId,
      parentId: selectedParentId || null,
      relation: relation.trim(),
      school: user.school!,
      parentName: parentName.trim() || null,
      parentEmail: parentEmail.trim() || null,
      parentNumber: parentNumber.trim() || null,
    };
    try {
      const res = await createParentStudent(payload);
      if (res.status === 'success' && res.data) {
        const raw = res.data;
        const stud = students.find(
          (s) => s.studentId === raw.studentId
        );
        // hydrate parentUser details (and include phone)
        const par = parents.find((p) => p.userId === raw.parentId);
        const enriched: ParentStudentPayload = {
          ...raw,
          student: {
            name: stud!.name,
            grade: stud!.grade!,
          },
          parentUser: par
            ? {
                firstName: par.firstName,
                lastName: par.lastName,
                email: par.email,
              }
            : null,
        };

        onAdd(enriched);
        showNotification('Relation added', 'success');
        reset(); onClose();
      } else {
        showNotification(res.message || 'Failed', 'error');
      }
    } catch {
      showNotification('Error creating relation, relation already exists','error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={() => { reset(); onClose(); }} style="p-6 max-w-lg w-11/12">
      <h2 className="text-xl mb-4 text-black">Add Parent-Student Relation</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        {/* Student selector */}
        <div>
          <label className="block text-sm font-medium mb-1">Student</label>
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              placeholder="Search students…"
              value={searchStudent}
              onChange={e => setSearchStudent(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            />
            <select
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
              className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
            >
              <option value="">All Grades</option>
              {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
            </select>
          </div>
          <div className="max-h-36 overflow-y-auto border rounded-lg p-2 bg-white">          
            {loadingStudents ? (
              <p className="text-gray-600">Loading...</p>
            ) : filteredStudents.length === 0 ? (
              <p className="text-gray-600">No students found.</p>
            ) : filteredStudents.map(s => (
              <div key={s.studentId} className="flex items-center mb-1">
                <input
                  type="radio"
                  id={`stu-${s.studentId}`}
                  name="student"
                  value={s.studentId}
                  checked={selectedStudentId === s.studentId}
                  onChange={() => setSelectedStudentId(s.studentId)}
                  className="mr-2"
                />
                <label htmlFor={`stu-${s.studentId}`} className="text-black">
                  {s.name} (Grade {s.grade})
                </label>
              </div>
            ))}
          </div>
        </div>
        {/* Parent selector */}
        <div>
          <label className="block text-sm font-medium mb-1">Parent (optional)</label>
          <input
            type="text"
            placeholder="Search parents…"
            value={searchParent}
            onChange={e => setSearchParent(e.target.value)}
            className="w-full mb-2 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
          />
          <div className="max-h-36 overflow-y-auto border rounded-lg p-2 bg-white">
            {loadingParents ? (
              <p className="text-gray-600">Loading...</p>
            ) : filteredParents.length === 0 ? (
              <p className="text-gray-600">No parents found.</p>
            ) : filteredParents.map(p => (
              <div key={p.userId} className="flex items-center mb-1">
                <input
                  type="radio"
                  id={`par-${p.userId}`}
                  name="parent"
                  value={p.userId}
                  checked={selectedParentId === p.userId}
                  onChange={() => {
                    setSelectedParentId(p.userId)
                    setParentName(`${p.firstName} ${p.lastName}`)
                    setParentEmail(p.email)
                  }}
                  className="mr-2"
                />
                <label htmlFor={`par-${p.userId}`} className="text-black">
                  {p.firstName} {p.lastName} ({p.email})
                </label>
              </div>
            ))}
          </div>
        </div>
        {/* Relation and fallback inputs */}
        <div>
          <label className="block text-sm">Relation</label>
          <input
            required
            value={relation}
            onChange={e => setRelation(e.target.value)}
            placeholder="e.g. Mother"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Parent Name</label>
          <input
            value={parentName}
            onChange={e => setParentName(e.target.value)}
            placeholder="Fallback if no account selected"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Parent Email</label>
          <input
            type="email"
            value={parentEmail}
            onChange={e => setParentEmail(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Parent Phone</label>
          <input
            value={parentNumber}
            onChange={e => setParentNumber(e.target.value)}
            placeholder="Phone number"
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => { reset(); onClose(); }}
            className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-600 text-white rounded-md cursor-pointer"
          >
            Add Relation
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddRelationModal;
