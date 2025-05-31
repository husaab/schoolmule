// File: src/components/student/delete/StudentDeleteModal.tsx
'use client'

import React from 'react';
import Modal from '../../shared/modal';
import { deleteStudent } from '@/services/studentService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { StudentPayload } from '@/services/types/student';

interface StudentDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPayload;
  onDeleted: (id: string) => void;
}

const StudentDeleteModal: React.FC<StudentDeleteModalProps> = ({ isOpen, onClose, student, onDeleted }) => {
  const showNotification = useNotificationStore(state => state.showNotification);

  const handleDelete = async () => {
    try {
      const res = await deleteStudent(student.studentId);
      if (res.status === 'success') {
        showNotification('Student deleted', 'success');
        onDeleted(student.studentId);
        onClose();
      } else {
        showNotification('Failed to delete', 'error');
      }
    } catch (err) {
      showNotification('Error deleting student', 'error');
      console.error(err);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-sm w-11/12">
      <h2 className="text-lg font-semibold mb-4 text-black">Delete Student</h2>
      <p className="text-black mb-6">
        Are you sure you want to delete <strong>{student.name}</strong>?
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

export default StudentDeleteModal;
