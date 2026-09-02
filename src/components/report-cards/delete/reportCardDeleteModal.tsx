// File: src/components/report-cards/delete/reportCardDeleteModal.tsx
'use client';

import React, { useState } from 'react';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { deleteReportCard } from '@/services/reportCardService';
import {
  Button,
  ConfirmBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RecordFacts,
} from '@/components/shared/modalKit';
import { TrashIcon } from '@heroicons/react/24/outline';

interface DeleteReportCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  filePath: string;
  onDeleted: (filePath: string) => void;
}

const DeleteReportCardModal: React.FC<DeleteReportCardModalProps> = ({
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
      const res = await deleteReportCard(filePath);
      if (res.status === 'success') {
        showNotification('Report card deleted', 'success');
        onDeleted(filePath);
        onClose();
      } else {
        showNotification('Failed to delete report card', 'error');
      }
    } catch (err) {
      showNotification('Error deleting report card', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fileName = filePath.split('/').pop() || filePath;

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title="Delete report card"
        subtitle="This cannot be undone."
        icon={TrashIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: 'Deleting this report card:',
            items: [
              'Removes the generated PDF from storage',
              'Removes its entry from the generated report cards list',
              'Leaves grades and teacher feedback intact, so you can generate it again',
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{studentName}</strong>&apos;s report card
          for this term will be permanently removed.
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
          {loading ? 'Deleting' : 'Delete report card'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteReportCardModal;
