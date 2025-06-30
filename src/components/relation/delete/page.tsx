'use client';

import React, { useState } from 'react';
import Modal from '../../shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { deleteParentStudent } from '@/services/parentStudentService';
import type { ParentStudentPayload } from '@/services/types/parentStudent';

interface DeleteRelationModalProps {
  isOpen: boolean;
  onClose: () => void;
  relation: ParentStudentPayload;
  onDeleted: (id: string) => void;
}

const DeleteRelationModal: React.FC<DeleteRelationModalProps> = ({
  isOpen,
  onClose,
  relation,
  onDeleted,
}) => {
if (!isOpen || !relation) return null;
  const showNotification = useNotificationStore(s => s.showNotification);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteParentStudent(relation.parentStudentLinkId);
      if (res.status === 'success') {
        showNotification('Relation deleted successfully', 'success');
        onDeleted(relation.parentStudentLinkId);
        onClose();
      } else {
        showNotification(res.message || 'Failed to delete relation', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error deleting relation', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12">
      <h2 className="text-xl mb-4 text-black">Confirm Delete</h2>
      <p className="text-black">
        Are you sure you want to delete the relation between{' '}
        <span className="font-semibold">{relation.student?.name}</span> and{' '}
        <span className="font-semibold">{relation.parentName}</span>?
      </p>
      <div className="flex justify-end space-x-4 pt-6">
        <button
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition cursor-pointer"
        >
          {loading ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </Modal>
  );
};

export default DeleteRelationModal;
