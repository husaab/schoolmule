// File: src/components/student/archive/studentArchiveModal.tsx
'use client'

import React, { useState } from 'react';
import Modal from '../../shared/modal';
import { archiveStudent } from '@/services/studentService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { StudentPayload } from '@/services/types/student';
import { getGradeDisplayName } from '@/lib/schoolUtils';
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '../../shared/modalKit';
import { ArchiveBoxArrowDownIcon } from '@heroicons/react/24/outline';

interface StudentArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPayload;
  onArchived: (student: StudentPayload) => void;
}

const StudentArchiveModal: React.FC<StudentArchiveModalProps> = ({
  isOpen,
  onClose,
  student,
  onArchived,
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const res = await archiveStudent(student.studentId);
      if (res.status === 'success') {
        showNotification('Student archived successfully', 'success');
        onArchived(res.data);
        onClose();
      } else {
        showNotification(res.message || 'Failed to archive student', 'error');
      }
    } catch (err) {
      showNotification('Error archiving student', 'error');
      console.error(err);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Archive student"
        subtitle="You can restore them at any time."
        icon={ArchiveBoxArrowDownIcon}
        tone="warning"
      />

      <ModalBody>
        <ConfirmBody
          tone="warning"
          consequences={{
            title: 'While archived:',
            items: [
              'They are hidden from active student lists',
              'Grades, attendance, and reports are all preserved',
              'They cannot be enrolled in new classes',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{student.name}</strong> will be moved to the
          archive. Nothing is deleted.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Grade', value: student.grade ? getGradeDisplayName(student.grade) : 'Not assigned' },
            { label: 'OEN', value: student.oen || 'Not provided' },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isArchiving}>
          Cancel
        </Button>
        <Button variant="warning" onClick={handleArchive} loading={isArchiving}>
          {isArchiving ? 'Archiving' : 'Archive student'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default StudentArchiveModal;
