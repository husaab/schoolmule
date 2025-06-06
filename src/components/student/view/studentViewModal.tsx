// File: src/components/StudentViewModal.tsx
'use client'

import { useState, useEffect } from 'react';
import Modal from '../../shared/modal';
import { StudentPayload } from '@/services/types/student';
import { getTeacherById } from '@/services/teacherService';

interface StudentViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPayload;
}

const StudentViewModal: React.FC<StudentViewModalProps> = ({ isOpen, onClose, student }) => {
  const [teacherName, setTeacherName] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacher = async () => {
      if (!student.homeroomTeacherId) return;
      try {
        const res = await getTeacherById(student.homeroomTeacherId);
        if (res.status === 'success') {
          setTeacherName(res.data.fullName);
        }
      } catch (err) {
        console.error('Error fetching teacher', err);
      }
    };
    fetchTeacher();
  }, [student.homeroomTeacherId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <h2 className="text-xl mb-4 text-black">Student Details</h2>
      <div className="space-y-3 text-black">
        <div>
          <strong>Name:</strong> {student.name}
        </div>
        <div>
          <strong>Grade:</strong> {student.grade ?? '-'}
        </div>
        <div>
          <strong>OEN:</strong> {student.oen ?? '-'}
        </div>
        <div>
          <strong>School:</strong> {student.school}
        </div>
        <div>
          <strong>Homeroom Teacher:</strong> {teacherName ?? '—'}
        </div>
        <div>
          <strong>Mother's Name:</strong> {student.mother?.name ?? '-'}
        </div>
        <div>
          <strong>Mother's Email:</strong> {student.mother?.email ?? '-'}
        </div>
        <div>
          <strong>Mother's Phone:</strong> {student.mother?.phone ?? '-'}
        </div>
        <div>
          <strong>Father's Name:</strong> {student.father?.name ?? '-'}
        </div>
        <div>
          <strong>Father's Email:</strong> {student.father?.email ?? '-'}
        </div>
        <div>
          <strong>Father's Phone:</strong> {student.father?.phone ?? '-'}
        </div>
        <div>
          <strong>Emergency Contact:</strong> {student.emergencyContact ?? '-'}
        </div>
        <div>
          <strong>Created At:</strong> {new Date(student.createdAt).toLocaleString()}
        </div>
        <div>
          <strong>Last Modified:</strong> {new Date(student.lastModifiedAt).toLocaleString()}
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-cyan-600 text-white rounded-md cursor-pointer hover:bg-cyan-700 transition"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default StudentViewModal;
