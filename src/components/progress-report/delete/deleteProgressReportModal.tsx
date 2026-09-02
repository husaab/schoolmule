// File: src/components/progress-report/delete/deleteProgressReportModal.tsx
'use client';

import React, { useState } from 'react';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { deleteProgressReport } from '@/services/progressReportService';
import {
  Button,
  ConfirmBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RecordFacts,
} from '@/components/shared/modalKit';
import { TrashIcon } from '@heroicons/react/24/outline';

interface DeleteProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  filePath: string;
  onDeleted: (filePath: string) => void;
}

const DeleteProgressReportModal: React.FC<DeleteProgressReportModalProps> = ({
  isOpen,
  onClose,
  studentName,
  filePath,
  onDeleted,
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteProgressReport(filePath);
      showNotification('Progress report deleted', 'success');
      onDeleted(filePath);
      onClose();
    } catch (err) {
      showNotification('Error deleting progress report', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fileName = filePath.split('/').pop() || filePath;

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Delete progress report"
        subtitle="This cannot be undone."
        icon={TrashIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: 'Deleting this progress report:',
            items: [
              'Removes the generated PDF from storage',
              'Removes its entry from the generated progress reports list',
              'Leaves the saved feedback intact, so you can generate it again',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{studentName}</strong>&apos;s progress
          report for this term will be permanently removed.
        </ConfirmBody>

        <RecordFacts
          facts={[
            { label: 'Student', value: studentName },
            { label: 'File', value: fileName },
          ]}
        />
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant="danger" onClick={handleDelete} loading={loading}>
          {loading ? 'Deleting' : 'Delete progress report'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteProgressReportModal;
