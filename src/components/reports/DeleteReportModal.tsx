// File: src/components/reports/DeleteReportModal.tsx
// Deletes one student's generated report (a progress report or report card, per `doc`).
'use client';

import React, { useState } from 'react';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { ReportDoc } from './reportDocs';
import {
  Button,
  ConfirmBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
  RecordFacts,
} from '@/components/shared/modalKit';
import { TrashIcon } from '@heroicons/react/24/outline';

interface DeleteReportModalProps {
  doc: ReportDoc;
  isOpen: boolean;
  onClose: () => void;
  studentName: string;
  filePath: string;
  onDeleted: (filePath: string) => void;
}

const DeleteReportModal: React.FC<DeleteReportModalProps> = ({
  doc,
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
      await doc.remove(filePath);
      showNotification(`${doc.noun[0].toUpperCase()}${doc.noun.slice(1)} deleted`, 'success');
      onDeleted(filePath);
      onClose();
    } catch (err) {
      showNotification(`Error deleting ${doc.noun}`, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fileName = filePath.split('/').pop() || filePath;

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      <ModalHeader
        title={`Delete ${doc.noun}`}
        subtitle="This cannot be undone."
        icon={TrashIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: `Deleting this ${doc.noun}:`,
            items: [
              'Removes the generated PDF from storage',
              `Removes it from the ${doc.nouns} list`,
              `Leaves ${doc.keeps} intact, so you can generate it again`,
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">{studentName}</strong>&apos;s {doc.noun}{' '}
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
          {loading ? 'Deleting' : `Delete ${doc.noun}`}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default DeleteReportModal;
