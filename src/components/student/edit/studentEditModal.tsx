// File: src/components/student/edit/StudentEditModal.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import Modal from '../../shared/modal';
import { updateStudent } from '@/services/studentService';
import { getTeachersBySchool } from '@/services/teacherService';
import { StudentPayload } from '@/services/types/student';
import { TeacherPayload } from '@/services/types/teacher';
import { getGradeOptions, GradeValue } from '@/lib/schoolUtils';

interface StudentEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentPayload;
  onUpdate: (updated: StudentPayload) => void;
}

const StudentEditModal: React.FC<StudentEditModalProps> = ({ isOpen, onClose, student, onUpdate }) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<GradeValue | ''>('');
  const [oen, setOen] = useState('');
  const [motherName, setMotherName] = useState('');
  const [motherEmail, setMotherEmail] = useState('');
  const [motherPhone, setMotherPhone] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [fatherEmail, setFatherEmail] = useState('');
  const [fatherPhone, setFatherPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [homeroomTeacherId, setHomeroomTeacherId] = useState('');
  const [teachers, setTeachers] = useState<TeacherPayload[]>([]);

  const user = useUserStore((state) => state.user);
  const showNotification = useNotificationStore((state) => state.showNotification);

  useEffect(() => {
    if (isOpen) {
      setName(student.name || '');
      setGrade(student.grade ?? '');
      setOen(student.oen || '');
      setMotherName(student.mother?.name || '');
      setMotherEmail(student.mother?.email || '');
      setMotherPhone(student.mother?.phone || '');
      setFatherName(student.father?.name || '');
      setFatherEmail(student.father?.email || '');
      setFatherPhone(student.father?.phone || '');
      setEmergencyContact(student.emergencyContact || '');
      setHomeroomTeacherId(student.homeroomTeacherId || '');
    }
  }, [isOpen, student]);

  useEffect(() => {
    if (!isOpen || !user?.school) return;
    const fetchTeachers = async () => {
      try {
        const res = await getTeachersBySchool(user.school!);
        if (res.status === 'success') {
          setTeachers(res.data);
        } else {
          showNotification('Failed to load teachers', 'error');
        }
      } catch {
        showNotification('Error fetching teachers', 'error');
      }
    };
    fetchTeachers();
  }, [isOpen, user?.school, showNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || grade === '') {
      showNotification('Name and grade are required', 'error');
      return;
    }

    const updateData: Partial<Omit<StudentPayload, 'studentId' | 'createdAt' | 'lastModifiedAt'>> = {
      name: name.trim(),
      grade: grade,
      oen: oen || null,
      school: user?.school || '',
      homeroomTeacherId: homeroomTeacherId || null,
      mother: {
        name: motherName || null,
        email: motherEmail || null,
        phone: motherPhone || null
      },
      father: {
        name: fatherName || null,
        email: fatherEmail || null,
        phone: fatherPhone || null
      },
      emergencyContact: emergencyContact || null
    };

    const res = await updateStudent(student.studentId, updateData);
    // Backend now returns camelCase data
    const updated = res.data as StudentPayload;

    if (res.status === 'success') {
      onUpdate(updated);
      showNotification('Student updated successfully', 'success');
      onClose();
    } else {
      showNotification('Failed to update student', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <h2 className="text-xl mb-4 text-black">Edit Student</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="block text-sm">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Grade</label>
          <select
            required
            value={grade}
            onChange={(e) => setGrade(e.target.value as GradeValue)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="" disabled>Select grade</option>
            {getGradeOptions().map((gradeOption) => (
              <option key={gradeOption.value} value={gradeOption.value}>{gradeOption.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm">OEN</label>
          <input
            value={oen}
            onChange={(e) => setOen(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Homeroom Teacher</label>
          <select
            value={homeroomTeacherId}
            onChange={(e) => setHomeroomTeacherId(e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="">Select teacher</option>
            {teachers.map((t) => (
              <option key={t.userId} value={t.userId}>{t.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm">Mother Name</label>
          <input
            value={motherName}
            onChange={(e) => setMotherName(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Mother Email</label>
          <input
            type="email"
            value={motherEmail}
            onChange={(e) => setMotherEmail(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Mother Phone</label>
          <input
            value={motherPhone}
            onChange={(e) => setMotherPhone(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Father Name</label>
          <input
            value={fatherName}
            onChange={(e) => setFatherName(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Father Email</label>
          <input
            type="email"
            value={fatherEmail}
            onChange={(e) => setFatherEmail(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Father Phone</label>
          <input
            value={fatherPhone}
            onChange={(e) => setFatherPhone(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Emergency Contact</label>
          <input
            value={emergencyContact}
            onChange={(e) => setEmergencyContact(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-cyan-600 text-white rounded-md cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StudentEditModal;
