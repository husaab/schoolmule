// File: src/components/student/delete/studentDeleteModal.tsx
'use client'

import React, { useState } from 'react';
import Modal from '../../shared/modal';
import { deleteStudent } from '@/services/studentService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { StudentPayload } from '@/services/types/student';
import { getGradeDisplayName } from '@/lib/schoolUtils';
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '../../shared/modalKit';
import { TrashIcon } from '@heroicons/react/24/outline';

interface StudentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPayload;
  onDeleted: (id: string) => void;
}

const StudentDeleteModal: React.FC<StudentDeleteModalProps> = ({ isOpen, onClose, student, onDeleted }) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteStudent(student.studentId);
      if (res.status === 'success') {
        showNotification('Student deleted', 'success');
        onDeleted(student.studentId);
        onClose();
      } else {
        showNotification('Failed to delete', 'error');
      }
    } catch (err) {
      showNotification('Error deleting student', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Delete student"
        subtitle="This cannot be undone."
        icon={TrashIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: 'Deleting removes everything tied to this student:',
            items: [
              'Grades, assessment scores, and report cards',
              'Attendance history in every class',
              'Class enrolments and parent links',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{student.name}</strong> will be permanently
          removed. To keep the records and just take the student off active lists, archive them instead.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Grade', value: student.grade ? getGradeDisplayName(student.grade) : 'Not assigned' },
            { label: 'OEN', value: student.oen || 'Not provided' },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={loading}>
          {loading ? 'Deleting' : 'Delete student'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default StudentDeleteModal;
