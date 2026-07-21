'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Modal from '../../shared/modal';
import PersonCombobox from '../PersonCombobox';
import RelationFormFields, { useRelationForm } from '../RelationFormFields';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getAllStudents } from '@/services/studentService';
import { getAllParents } from '@/services/parentService';
import { createParentStudent } from '@/services/parentStudentService';
import type { ParentStudentPayload, CreateParentStudentRequest } from '@/services/types/parentStudent';
import type { StudentPayload } from '@/services/types/student';
import type { ParentPayload } from '@/services/types/parent';
import { getGradeDisplayName, getGradeNumericValue, GradeValue } from '@/lib/schoolUtils';

export interface PresetStudent {
  studentId: string;
  name: string;
  grade: GradeValue | null;
}

interface AddRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (relation: ParentStudentPayload) => void;
  presetStudent?: PresetStudent | null;
}

const AddRelationModal: React.FC<AddRelationModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  presetStudent = null,
}) => {
  const user = useUserStore((state) => state.user);
  const showNotification = useNotificationStore((s) => s.showNotification);

  const [students, setStudents] = useState<StudentPayload[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [parents, setParents] = useState<ParentPayload[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  const [selectedStudent, setSelectedStudent] = useState<PresetStudent | null>(null);
  const [filterGrade, setFilterGrade] = useState('');
  const { form, setForm, reset, relationValue, validate, buildParentFields, buildParentUser } =
    useRelationForm();
  const [submitting, setSubmitting] = useState(false);

  const grades = useMemo(
    () =>
      Array.from(new Set(students.filter(s => s.grade != null).map(s => String(s.grade)))).sort(
        (a, b) => getGradeNumericValue(a) - getGradeNumericValue(b)
      ),
    [students]
  );

  const filteredStudents = useMemo(
    () =>
      filterGrade === '' ? students : students.filter(s => String(s.grade) === filterGrade),
    [students, filterGrade]
  );

  // On open: reset the form, apply the preset student, and load pick lists
  useEffect(() => {
    if (!isOpen || !user?.school) return;

    setSelectedStudent(presetStudent);
    setFilterGrade('');
    reset();

    setLoadingStudents(true);
    getAllStudents(user.school)
      .then(res => {
        if (res.status === 'success' && res.data) setStudents(res.data);
        else showNotification('Failed to load students', 'error');
      })
      .catch(() => showNotification('Error fetching students', 'error'))
      .finally(() => setLoadingStudents(false));

    setLoadingParents(true);
    getAllParents()
      .then(res => {
        if (res.status === 'success' && res.data) setParents(res.data);
        else showNotification('Failed to load parents', 'error');
      })
      .catch(() => showNotification('Error fetching parents', 'error'))
      .finally(() => setLoadingParents(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.school, presetStudent]);

  const handleClose = () => {
    setSelectedStudent(null);
    setFilterGrade('');
    reset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      return showNotification('Select a student', 'error');
    }
    const error = validate();
    if (error) {
      return showNotification(error, 'error');
    }

    const payload: CreateParentStudentRequest = {
      studentId: selectedStudent.studentId,
      relation: relationValue(),
      ...buildParentFields(),
    };

    setSubmitting(true);
    try {
      const res = await createParentStudent(payload);
      if (res.status === 'success' && res.data) {
        const enriched: ParentStudentPayload = {
          ...res.data,
          student: {
            name: selectedStudent.name,
            grade: selectedStudent.grade as GradeValue,
          },
          parentUser: buildParentUser(),
        };
        onAdd(enriched);
        showNotification('Relation added', 'success');
        handleClose();
      } else {
        showNotification(res.message || 'Failed to add relation', 'error');
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error creating relation', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Parent Relation" size="lg">
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Student */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Student</label>
          <div className="flex gap-2">
            <div className="flex-1 min-w-0">
              <PersonCombobox
                options={filteredStudents.map(s => ({
                  id: s.studentId,
                  primary: s.name,
                  secondary: getGradeDisplayName(s.grade),
                }))}
                selected={
                  selectedStudent
                    ? {
                        id: selectedStudent.studentId,
                        primary: selectedStudent.name,
                        secondary: getGradeDisplayName(selectedStudent.grade),
                      }
                    : null
                }
                onSelect={(opt) => {
                  const student = students.find(s => s.studentId === opt.id);
                  if (!student) return;
                  setSelectedStudent({
                    studentId: student.studentId,
                    name: student.name,
                    grade: student.grade,
                  });
                }}
                onClear={() => setSelectedStudent(null)}
                placeholder="Search students…"
                loading={loadingStudents}
              />
            </div>
            {!selectedStudent && (
              <select
                value={filterGrade}
                onChange={e => setFilterGrade(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent cursor-pointer flex-shrink-0"
              >
                <option value="">All Grades</option>
                {grades.map(g => (
                  <option key={g} value={g}>
                    {getGradeDisplayName(g)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <RelationFormFields
          form={form}
          setForm={setForm}
          parents={parents}
          loadingParents={loadingParents}
        />

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={submitting}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium text-sm cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all font-medium text-sm cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Adding…' : 'Add Relation'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AddRelationModal;
