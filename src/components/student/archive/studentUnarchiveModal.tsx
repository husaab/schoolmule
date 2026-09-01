// File: src/components/student/archive/studentUnarchiveModal.tsx
'use client'

import React, { useState } from 'react';
import Modal from '../../shared/modal';
import { unarchiveStudent } from '@/services/studentService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { StudentPayload } from '@/services/types/student';
import { getGradeDisplayName } from '@/lib/schoolUtils';
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '../../shared/modalKit';
import { ArchiveBoxIcon } from '@heroicons/react/24/outline';

interface StudentUnarchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPayload;
  onUnarchived: (student: StudentPayload) => void;
}

const StudentUnarchiveModal: React.FC<StudentUnarchiveModalProps> = ({
  isOpen,
  onClose,
  student,
  onUnarchived,
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  const handleUnarchive = async () => {
    setIsUnarchiving(true);
    try {
      const res = await unarchiveStudent(student.studentId);
      if (res.status === 'success') {
        showNotification('Student restored successfully', 'success');
        onUnarchived(res.data);
        onClose();
      } else {
        showNotification(res.message || 'Failed to restore student', 'error');
      }
    } catch (err) {
      showNotification('Error restoring student', 'error');
      console.error(err);
    } finally {
      setIsUnarchiving(false);
    }
  };

  const facts = [
    { label: 'Grade', value: student.grade ? getGradeDisplayName(student.grade) : 'Not assigned' },
    { label: 'OEN', value: student.oen || 'Not provided' },
  ];
  if (student.archivedAt) {
    facts.push({
      label: 'Archived on',
      value: new Date(student.archivedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    });
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Restore student"
        subtitle="Bring them back to the active roster."
        icon={ArchiveBoxIcon}
        tone="success"
      />

      <ModalBody>
        <ConfirmBody
          tone="success"
          consequences={{
            title: 'Once restored:',
            items: [
              'They appear in active student lists again',
              'They can be enrolled in new classes',
              'All historical data stays exactly as it is',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{student.name}</strong> will be treated as an
          active student again.
        </ConfirmBody>

        <RecordFacts facts={facts} />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isUnarchiving}>
          Cancel
        </Button>
        <Button variant="success" onClick={handleUnarchive} loading={isUnarchiving}>
          {isUnarchiving ? 'Restoring' : 'Restore student'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default StudentUnarchiveModal;
