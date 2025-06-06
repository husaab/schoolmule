// File: src/components/StudentAddModal.tsx
'use client'

import React, { useState, useEffect } from 'react';
import { useUserStore } from '@/store/useUserStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import Modal from '../../shared/modal';
import { createStudent } from '@/services/studentService';
import { getTeachersBySchool } from '@/services/teacherService';
import { StudentPayload } from '@/services/types/student';
import { TeacherPayload } from '@/services/types/teacher';

interface StudentAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (student: StudentPayload) => void;
}

const StudentAddModal: React.FC<StudentAddModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [grade, setGrade] = useState<number | ''>('');
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
  const [loadingTeachers, setLoadingTeachers] = useState(false);

  const user = useUserStore((state) => state.user);
  const showNotification = useNotificationStore((state) => state.showNotification);

  useEffect(() => {
    if (!isOpen || !user?.school) return;

    const fetchTeachers = async () => {
      setLoadingTeachers(true);
      try {
        const res = await getTeachersBySchool(user.school!);
        if (res.status === 'success') {
          setTeachers(res.data);
        } else {
          showNotification('Failed to load teachers', 'error');
        }
      } catch (err) {
        showNotification('Error fetching teachers', 'error');
      } finally {
        setLoadingTeachers(false);
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
    const payload = {
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

    const res = await createStudent(payload);
    if (res.status === 'success') {
      const raw = res.data as any;
      const newStudent: StudentPayload = {
        studentId: raw.student_id,
        name: raw.name,
        homeroomTeacherId: raw.homeroom_teacher_id,
        school: raw.school,
        grade: raw.grade === null ? null : Number(raw.grade),
        oen: raw.oen,
        mother: {
          name: raw.mother_name,
          email: raw.mother_email,
          phone: raw.mother_number,
        },
        father: {
          name: raw.father_name,
          email: raw.father_email,
          phone: raw.father_number,
        },
        emergencyContact: raw.emergency_contact,
        createdAt: raw.created_at,
        lastModifiedAt: raw.last_modified_at,
      };
      onAdd(newStudent);
      showNotification('Student added successfully', 'success');
      onClose();
      setName('');
      setGrade('');
      setOen('');
      setMotherName('');
      setMotherEmail('');
      setMotherPhone('');
      setFatherName('');
      setFatherEmail('');
      setFatherPhone('');
      setEmergencyContact('');
      setHomeroomTeacherId('');
    } else {
      showNotification('Failed to add student', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-md w-11/12">
      <h2 className="text-xl mb-4 text-black">Add New Student</h2>
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
            onChange={(e) => setGrade(Number(e.target.value))}
            className="w-full border rounded px-2 py-1"
          >
            <option value="" disabled>Select grade</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm">OEN</label>
          <input
            value={oen}
            placeholder='e.g. 423-654-432'
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
            placeholder='e.g. marydoe@gmail.com'
            onChange={(e) => setMotherEmail(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Mother Phone</label>
          <input
            value={motherPhone}
            placeholder='e.g. 416-654-034'
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
            placeholder='e.g. johndoe@gmail.com'
            onChange={(e) => setFatherEmail(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Father Phone</label>
          <input
            value={fatherPhone}
            placeholder='e.g. 416-654-034'
            onChange={(e) => setFatherPhone(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="block text-sm">Emergency Contact</label>
          <input
            value={emergencyContact}
            placeholder='Phone Number'
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
            className="px-4 py-2 bg-green-400 text-white rounded-md cursor-pointer"
          >
            Add Student
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StudentAddModal;
