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
  const showNotification = useNotificationStore(s => s.showNotification);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res = await deleteParentStudent(relation.parentStudentLinkId);
      if (res.status === 'success') {
        showNotification('Relation removed', 'success');
        onDeleted(relation.parentStudentLinkId);
        onClose();
      } else {
        showNotification(res.message || 'Failed to remove relation', 'error');
      }
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Error removing relation', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Remove Relation" size="sm">
      <div className="p-6">
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          This removes the link between the parent and student. It does not delete the
          parent&apos;s account or the student.
          {relation.parentUser && (
            <span className="block mt-1">
              The linked account will lose access to this student.
            </span>
          )}
        </div>

        <p className="mt-4 text-sm text-slate-600">
          Remove{' '}
          <span className="font-semibold text-slate-900">
            {relation.parentName ||
              (relation.parentUser
                ? `${relation.parentUser.firstName} ${relation.parentUser.lastName}`
                : 'this parent')}
          </span>{' '}
          ({relation.relation}) from{' '}
          <span className="font-semibold text-slate-900">{relation.student?.name}</span>?
        </p>

        <div className="flex justify-end gap-3 pt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-all font-medium text-sm cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all font-medium text-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Removing…' : 'Remove'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default DeleteRelationModal;
