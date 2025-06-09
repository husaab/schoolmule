// File: src/components/report-cards/delete/DeleteReportCardModal.tsx
'use client';

import React from 'react';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { deleteReportCard } from '@/services/reportCardService';

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

  const handleDelete = async () => {
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
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12">
      <h2 className="text-lg font-semibold mb-4 text-black">Delete Report Card</h2>
      <p className="text-black mb-6">
        Are you sure you want to delete <strong>{studentName}</strong>'s report card for this term?
      </p>
      <div className="flex justify-end space-x-4">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 cursor-pointer"
        >
          Delete
        </button>
      </div>
    </Modal>
  );
};

export default DeleteReportCardModal;
