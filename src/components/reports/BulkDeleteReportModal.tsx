// File: src/components/reports/BulkDeleteReportModal.tsx
// Deletes a selection of generated reports (progress reports or report cards, per `doc`).
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
} from '@/components/shared/modalKit';
import { TrashIcon } from '@heroicons/react/24/outline';

interface BulkDeleteReportModalProps {
  doc: ReportDoc;
  isOpen: boolean;
  onClose: () => void;
  filePaths: string[];
  onDeleted: (filePaths: string[]) => void;
}

const BulkDeleteReportModal: React.FC<BulkDeleteReportModalProps> = ({
  doc,
  isOpen,
  onClose,
  filePaths,
  onDeleted,
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const [loading, setLoading] = useState(false);

  const count = filePaths.length;
  const noun = count !== 1 ? doc.nouns : doc.noun;

  const handleDelete = async () => {
    if (count === 0) return;
    try {
      setLoading(true);
      const res = await doc.removeMany(filePaths);
      if (res.status === 'success') {
        showNotification(`${count} ${noun} deleted`, 'success');
        onDeleted(filePaths);
        onClose();
      } else {
        showNotification(`Failed to delete ${doc.nouns}`, 'error');
      }
    } catch (err) {
      showNotification(`Error deleting ${doc.nouns}`, 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title={`Delete ${count} ${noun}?`}
        subtitle="This cannot be undone."
        icon={TrashIcon}
        tone="danger"
      />

      <ModalBody>
        <ConfirmBody
          tone="danger"
          consequences={{
            title: `Deleting these ${noun}:`,
            items: [
              'Removes the generated PDFs from storage',
              `Removes them from the ${doc.nouns} list`,
              `Leaves ${doc.keeps} intact, so you can generate them again`,
            ],
          }}
        >
          <strong className="font-semibold text-slate-900">
            {count} {noun}
          </strong>{' '}
          will be permanently removed.
        </ConfirmBody>
      </ModalBody>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleDelete}
          loading={loading}
          disabled={count === 0}
        >
          {loading ? 'Deleting' : `Delete ${count} ${noun}`}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default BulkDeleteReportModal;
