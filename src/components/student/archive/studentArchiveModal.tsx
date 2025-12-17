// File: src/components/student/archive/StudentArchiveModal.tsx
'use client'

import React, { useState } from 'react';
import Modal from '../../shared/modal';
import { archiveStudent } from '@/services/studentService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { StudentPayload } from '@/services/types/student';

interface StudentArchiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPayload;
  onArchived: (student: StudentPayload) => void;
}

const StudentArchiveModal: React.FC<StudentArchiveModalProps> = ({ 
  isOpen, 
  onClose, 
  student, 
  onArchived 
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      const res = await archiveStudent(student.studentId);
      if (res.status === 'success') {
        showNotification('Student archived successfully', 'success');
        onArchived(res.data);
        onClose();
      } else {
        showNotification(res.message || 'Failed to archive student', 'error');
      }
    } catch (err) {
      showNotification('Error archiving student', 'error');
      console.error(err);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <h2 className="text-xl font-semibold mb-4 text-black">Archive Student</h2>
      
      <div className="space-y-4 text-black">
        <p>
          Are you sure you want to archive <strong>{student.name}</strong>?
        </p>
        
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-800 mb-2">
            What happens when you archive a student:
          </p>
          <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
            <li>Student will be hidden from active student lists</li>
            <li>Historical data (grades, attendance, reports) will be preserved</li>
            <li>Student cannot be enrolled in new classes</li>
            <li>You can restore the student at any time</li>
          </ul>
        </div>

        <div className="text-sm text-gray-600">
          <p><strong>Grade:</strong> {student.grade || 'Not assigned'}</p>
          <p><strong>OEN:</strong> {student.oen || 'Not provided'}</p>
        </div>
      </div>

      <div className="flex justify-end space-x-4 mt-6">
        <button
          onClick={onClose}
          disabled={isArchiving}
          className="px-4 py-2 bg-gray-300 text-black rounded-md hover:bg-gray-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancel
        </button>
        <button
          onClick={handleArchive}
          disabled={isArchiving}
          className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isArchiving ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Archiving...</span>
            </>
          ) : (
            <span>Archive Student</span>
          )}
        </button>
      </div>
    </Modal>
  );
};

export default StudentArchiveModal;