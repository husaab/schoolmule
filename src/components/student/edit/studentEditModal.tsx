// File: src/components/student/edit/studentEditModal.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import Modal from '../../shared/modal';
import { updateStudent } from '@/services/studentService';
import { getTeachersBySchool } from '@/services/teacherService';
import { StudentPayload } from '@/services/types/student';
import { TeacherPayload } from '@/services/types/teacher';
import StudentFormFields, { StudentFormValues } from '../StudentFormFields';
import { Button, ModalBody, ModalFooter, ModalHeader } from '../../shared/modalKit';
import { PencilSquareIcon } from '@heroicons/react/24/outline';

interface StudentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPayload;
  onUpdate: (updated: StudentPayload) => void;
}

const toFormValues = (student: StudentPayload): StudentFormValues => ({
  name: student.name || '',
  grade: student.grade ?? '',
  oen: student.oen || '',
  // The API returns a full ISO timestamp; <input type="date"> needs YYYY-MM-DD.
  dateOfBirth: student.dateOfBirth ? student.dateOfBirth.slice(0, 10) : '',
  healthCardNumber: student.healthCardNumber || '',
  homeroomTeacherId: student.homeroomTeacherId || '',
  motherName: student.mother?.name || '',
  motherEmail: student.mother?.email || '',
  motherPhone: student.mother?.phone || '',
  fatherName: student.father?.name || '',
  fatherEmail: student.father?.email || '',
  fatherPhone: student.father?.phone || '',
  emergencyContact: student.emergencyContact || '',
  address: student.address || '',
  medicalNotes: student.medicalNotes || '',
});

const StudentEditModal: React.FC<StudentEditModalProps> = ({ isOpen, onClose, student, onUpdate }) => {
  const [values, setValues] = useState<StudentFormValues>(() => toFormValues(student));
  const [teachers, setTeachers] = useState<TeacherPayload[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const user = useUserStore((state) => state.user);
  const showNotification = useNotificationStore((state) => state.showNotification);

  const setField = <K extends keyof StudentFormValues>(field: K, value: StudentFormValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: value }));

  useEffect(() => {
    if (isOpen) setValues(toFormValues(student));
  }, [isOpen, student]);

  useEffect(() => {
    if (!isOpen || !user?.school) return;
    const fetchTeachers = async () => {
      try {
        const res = await getTeachersBySchool(user.school!);
        if (res.status === 'success') {
          setTeachers(res.data);
        } else {
          showNotification('Failed to load teachers', 'error');
        }
      } catch {
        showNotification('Error fetching teachers', 'error');
      }
    };
    fetchTeachers();
  }, [isOpen, user?.school, showNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.name.trim() || values.grade === '') {
      showNotification('Name and grade are required', 'error');
      return;
    }

    const updateData: Partial<Omit<StudentPayload, 'studentId' | 'createdAt' | 'lastModifiedAt'>> = {
      name: values.name.trim(),
      grade: values.grade,
      oen: values.oen || null,
      school: user?.school || '',
      homeroomTeacherId: values.homeroomTeacherId || null,
      mother: {
        name: values.motherName || null,
        email: values.motherEmail || null,
        phone: values.motherPhone || null
      },
      father: {
        name: values.fatherName || null,
        email: values.fatherEmail || null,
        phone: values.fatherPhone || null
      },
      emergencyContact: values.emergencyContact || null,
      dateOfBirth: values.dateOfBirth || null,
      address: values.address || null,
      healthCardNumber: values.healthCardNumber || null,
      medicalNotes: values.medicalNotes || null
    };

    setSubmitting(true);
    try {
      const res = await updateStudent(student.studentId, updateData);
      // Backend now returns camelCase data
      const updated = res.data as StudentPayload;

      if (res.status === 'success') {
        onUpdate(updated);
        showNotification('Student updated successfully', 'success');
        onClose();
      } else {
        showNotification('Failed to update student', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader title="Edit student" subtitle={student.name} icon={PencilSquareIcon} />

      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
          <StudentFormFields
            values={values}
            onChange={setField}
            teachers={teachers}
            idPrefix="student-edit"
          />
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {submitting ? 'Saving' : 'Save changes'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default StudentEditModal;
