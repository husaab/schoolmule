// File: src/components/student/add/studentAddModal.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import Modal from '../../shared/modal';
import { createStudent } from '@/services/studentService';
import { getTeachersBySchool } from '@/services/teacherService';
import { StudentPayload } from '@/services/types/student';
import { TeacherPayload } from '@/services/types/teacher';
import StudentFormFields, { StudentFormValues, emptyStudentForm } from '../StudentFormFields';
import { Button, ModalBody, ModalFooter, ModalHeader } from '../../shared/modalKit';
import { UserPlusIcon } from '@heroicons/react/24/outline';

interface StudentAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (student: StudentPayload) => void;
}

const StudentAddModal: React.FC<StudentAddModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [values, setValues] = useState<StudentFormValues>(emptyStudentForm);
  const [teachers, setTeachers] = useState<TeacherPayload[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const user = useUserStore((state) => state.user);
  const showNotification = useNotificationStore((state) => state.showNotification);

  const setField = <K extends keyof StudentFormValues>(field: K, value: StudentFormValues[K]) =>
    setValues((prev) => ({ ...prev, [field]: value }));

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

    const payload = {
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
      const res = await createStudent(payload);
      if (res.status === 'success') {
        // Backend now returns camelCase data
        const newStudent = res.data as StudentPayload;
        onAdd(newStudent);
        showNotification('Student added successfully', 'success');
        onClose();
        setValues(emptyStudentForm);
      } else {
        showNotification('Failed to add student', 'error');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title="Add a student"
        subtitle="Only name and grade are required — the rest can wait."
        icon={UserPlusIcon}
      />

      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
          <StudentFormFields
            values={values}
            onChange={setField}
            teachers={teachers}
            idPrefix="student-add"
          />
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            {submitting ? 'Adding' : 'Add student'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default StudentAddModal;
