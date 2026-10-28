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
        subtitle="You can restore them from Recently deleted."
        icon={TrashIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: 'Deleting hides this student everywhere:',
            items: [
              'Every student list, class roster and report',
              'The Archived tab',
              'The parent and student portals',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{student.name}</strong>&rsquo;s grades,
          attendance and report cards are kept, and Students &rarr; Recently deleted brings them back.
          If they&rsquo;ve left the school, archive them instead so they stay in Archived.
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
