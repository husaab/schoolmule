// File: src/components/progress-report/delete/bulkDeleteProgressReportModal.tsx
'use client';

import React, { useState } from 'react';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { deleteBulkProgressReports } from '@/services/progressReportService';

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
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12">
      <h2 className="text-lg font-semibold mb-4 text-black">Delete Progress Reports</h2>
      <p className="text-black mb-6">
        Are you sure you want to delete <strong>{count} progress report{count !== 1 ? 's' : ''}</strong>?
        This action cannot be undone.
      </p>
      <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 cursor-pointer disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading || count === 0}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer disabled:bg-red-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Deleting…' : `Delete ${count}`}
        </button>
      </div>
    </Modal>
  );
};

export default BulkDeleteProgressReportModal;
