// File: src/components/progress-report/delete/bulkDeleteProgressReportModal.tsx
'use client';

import React, { useState } from 'react';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { deleteBulkProgressReports } from '@/services/progressReportService';
import {
  Button,
  ConfirmBody,
  ModalBody,
  ModalFooter,
  ModalHeader,
} from '@/components/shared/modalKit';
import { TrashIcon } from '@heroicons/react/24/outline';

interface BulkDeleteProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  filePaths: string[];
  onDeleted: (filePaths: string[]) => void;
}

const BulkDeleteProgressReportModal: React.FC<BulkDeleteProgressReportModalProps> = ({
  isOpen,
  onClose,
  filePaths,
  onDeleted,
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const [loading, setLoading] = useState(false);

  const count = filePaths.length;
  const noun = `progress report${count !== 1 ? 's' : ''}`;

  const handleDelete = async () => {
    if (count === 0) return;
    try {
      setLoading(true);
      const res = await deleteBulkProgressReports(filePaths);
      if (res.status === 'success') {
        showNotification(`${count} progress report${count !== 1 ? 's' : ''} deleted`, 'success');
        onDeleted(filePaths);
        onClose();
      } else {
        showNotification('Failed to delete progress reports', 'error');
      }
    } catch (err) {
      showNotification('Error deleting progress reports', 'error');
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
              'Removes their entries from the generated progress reports list',
              'Leaves the saved feedback intact, so you can generate them again',
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

export default BulkDeleteProgressReportModal;
