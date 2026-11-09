'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '../../shared/modal';
import { ModalBody, ModalFooter } from '../../shared/modalKit';
import PersonCombobox from '../PersonCombobox';
import RelationFormFields, { useRelationForm } from '../RelationFormFields';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { getAllStudents } from '@/services/studentService';
import { getAllParents } from '@/services/parentService';
import { createParentStudent } from '@/services/parentStudentService';
import type { ParentStudentPayload } from '@/services/types/parentStudent';
import type { StudentPayload } from '@/services/types/student';
import type { ParentPayload } from '@/services/types/parent';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { getGradeDisplayName, getGradeNumericValue, GradeValue } from '@/lib/schoolUtils';
import { addRelationForEach, addRelationsSummary } from '@/lib/addRelations';

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

  const [selectedStudents, setSelectedStudents] = useState<PresetStudent[]>([]);
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

  const pickedIds = useMemo(
    () => new Set(selectedStudents.map(s => s.studentId)),
    [selectedStudents]
  );

  // On open: reset the form, apply the preset student, and load pick lists
  useEffect(() => {
    if (!isOpen || !user?.school) return;

    setSelectedStudents(presetStudent ? [presetStudent] : []);
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
    setSelectedStudents([]);
    setFilterGrade('');
    reset();
    onClose();
  };

  const toggleStudent = (studentId: string) => {
    const student = students.find(s => s.studentId === studentId);
    if (!student) return;
    setSelectedStudents(prev =>
      prev.some(s => s.studentId === studentId)
        ? prev.filter(s => s.studentId !== studentId)
        : [...prev, { studentId, name: student.name, grade: student.grade }]
    );
  };

  const removeStudent = (studentId: string) =>
    setSelectedStudents(prev => prev.filter(s => s.studentId !== studentId));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudents.length === 0) {
      return showNotification('Select at least one student', 'error');
    }
    const error = validate();
    if (error) {
      return showNotification(error, 'error');
    }

    const relation = relationValue();
    const parentFields = buildParentFields();

    setSubmitting(true);
    const { added, failed } = await addRelationForEach(selectedStudents, student =>
      createParentStudent({ studentId: student.studentId, relation, ...parentFields })
    );
    setSubmitting(false);

    added.forEach(({ student, relation: created }) =>
      onAdd({
        ...created,
        student: { name: student.name, grade: student.grade as GradeValue },
        parentUser: buildParentUser(),
      })
    );

    const summary = addRelationsSummary(added.length, failed);
    if (failed.length === 0) {
      showNotification(summary, 'success');
      handleClose();
    } else {
      // Only the refused students stay, so trying again can't double up the rest.
      showNotification(summary, 'error');
      setSelectedStudents(failed.map(f => f.student));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Parent Relation" size="lg">
      <form onSubmit={handleSubmit}>
        <ModalBody>
          {/* Students */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Students</label>
            {selectedStudents.length > 0 && (
              <ul className="flex flex-wrap gap-2 mb-2">
                {selectedStudents.map(student => (
                  <li
                    key={student.studentId}
                    className="inline-flex items-center gap-1.5 max-w-full pl-3 pr-1 py-1 bg-cyan-50 border border-cyan-200 rounded-xl"
                  >
                    <span className="text-sm font-medium text-slate-900 truncate">{student.name}</span>
                    <span className="text-xs text-slate-500 flex-shrink-0">
                      {getGradeDisplayName(student.grade)}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStudent(student.studentId)}
                      aria-label={`Remove ${student.name}`}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-cyan-100 transition-colors cursor-pointer flex-shrink-0"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 min-w-0">
                <PersonCombobox
                  options={filteredStudents.map(s => ({
                    id: s.studentId,
                    primary: s.name,
                    secondary: getGradeDisplayName(s.grade),
                  }))}
                  selected={null}
                  pickedIds={pickedIds}
                  onSelect={opt => toggleStudent(opt.id)}
                  placeholder={selectedStudents.length > 0 ? 'Add another student…' : 'Search students…'}
                  loading={loadingStudents}
                />
              </div>
              <SearchableSelect
                options={grades.map(g => ({ value: String(g), label: getGradeDisplayName(g) }))}
                value={filterGrade}
                onChange={setFilterGrade}
                allLabel="All Grades"
                ariaLabel="Filter by grade"
                searchPlaceholder="Find a grade"
                className="w-full sm:w-40 flex-shrink-0"
              />
            </div>
          </div>

          <RelationFormFields
            form={form}
            setForm={setForm}
            parents={parents}
            loadingParents={loadingParents}
          />
        </ModalBody>

        <ModalFooter>
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
            {submitting
              ? 'Adding…'
              : selectedStudents.length > 1
                ? `Add ${selectedStudents.length} Relations`
                : 'Add Relation'}
          </button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default AddRelationModal;
