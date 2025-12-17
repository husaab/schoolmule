// File: src/components/student/archive/StudentUnarchiveModal.tsx
'use client'

import React, { useState } from 'react';
import Modal from '../../shared/modal';
import { unarchiveStudent } from '@/services/studentService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { StudentPayload } from '@/services/types/student';

interface StudentUnarchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPayload;
  onUnarchived: (student: StudentPayload) => void;
}

const StudentUnarchiveModal: React.FC<StudentUnarchiveModalProps> = ({ 
  isOpen, 
  onClose, 
  student, 
  onUnarchived 
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const [isUnarchiving, setIsUnarchiving] = useState(false);

  const handleUnarchive = async () => {
    setIsUnarchiving(true);
    try {
      const res = await unarchiveStudent(student.studentId);
      if (res.status === 'success') {
        showNotification('Student restored successfully', 'success');
        onUnarchived(res.data);
        onClose();
      } else {
        showNotification(res.message || 'Failed to restore student', 'error');
      }
    } catch (err) {
      showNotification('Error restoring student', 'error');
      console.error(err);
    } finally {
      setIsUnarchiving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <h2 className="text-xl font-semibold mb-4 text-black">Restore Student</h2>
      
      <div className="space-y-4 text-black">
        <p>
          Are you sure you want to restore <strong>{student.name}</strong>?
        </p>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-medium text-green-800 mb-2">
            What happens when you restore a student:
          </p>
          <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
            <li>Student will appear in active student lists</li>
            <li>Student can be enrolled in new classes</li>
            <li>All historical data remains intact</li>
            <li>Student will be treated as an active student</li>
          </ul>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Grade:</strong> {student.grade || 'Not assigned'}</p>
          <p><strong>OEN:</strong> {student.oen || 'Not provided'}</p>
          {student.archivedAt && (
            <p><strong>Archived on:</strong> {new Date(student.archivedAt).toLocaleDateString()}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={onClose}
          disabled={isUnarchiving}
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleUnarchive}
          disabled={isUnarchiving}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isUnarchiving ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Restoring...</span>
            </>
          ) : (
            <span>Restore Student</span>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default StudentUnarchiveModal;