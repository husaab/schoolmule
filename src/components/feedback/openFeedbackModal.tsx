'use client'

import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { upsertReportCardFeedback, getReportCardFeedback } from '@/services/reportCardService';
import { ReportCardTerm } from '@/services/types/reportCard';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  classId: string;
  termOptions?: ReportCardTerm[]; // default to 4 terms if not provided
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  studentId,
  classId,
  termOptions = ['First Term', 'Second Term', 'Midterm', 'Final Term'] as ReportCardTerm[]
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);

  const [term, setTerm] = useState<ReportCardTerm | ''>('');
  const [workHabits, setWorkHabits] = useState('');
  const [behavior, setBehavior] = useState('');
  const [comment, setComment] = useState('');

  useEffect(() => {
  if (!isOpen || !studentId || !classId || !term) return;

  const fetchFeedback = async () => {
    try {
      const res = await getReportCardFeedback(studentId, classId, term);
      if (res.status === 'success' && res.data) {
        setWorkHabits(res.data.workHabits || '');
        setBehavior(res.data.behavior || '');
        setComment(res.data.comment || '');
      } else {
        setWorkHabits('');
        setBehavior('');
        setComment('');
      }
    } catch (err) {
      // This means feedback doesn't exist yet → treat as empty
      console.warn('Feedback not found — initializing blank form');
      setWorkHabits('');
      setBehavior('');
      setComment('');
    }
  };
    fetchFeedback();
  }, [isOpen, studentId, classId, term]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term) {
      showNotification('Please select a term', 'error');
      return;
    }

    try {
      const res = await upsertReportCardFeedback({ studentId, classId, term, workHabits, behavior, comment });
      if (res.status === 'success') {
        showNotification('Feedback saved successfully', 'success');
        onClose();
      } else {
        showNotification(res.message || 'Failed to save feedback', 'error');
      }
    } catch (err) {
      console.error('Error saving feedback:', err);
      showNotification('Error saving feedback', 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <h2 className="text-xl mb-4 text-black">Report Card Feedback</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="block text-sm">Term</label>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value as ReportCardTerm)}
            className="w-full border rounded px-2 py-1"
            required
          >
            <option value="" disabled>Select term</option>
            {termOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm">Work Habits</label>
          <textarea
            value={workHabits}
            onChange={(e) => setWorkHabits(e.target.value)}
            className="w-full border rounded px-2 py-1"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm">Behavior</label>
          <textarea
            value={behavior}
            onChange={(e) => setBehavior(e.target.value)}
            className="w-full border rounded px-2 py-1"
            rows={2}
          />
        </div>

        <div>
          <label className="block text-sm">General Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border rounded px-2 py-1"
            rows={3}
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-red-500 text-white rounded-md cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 text-white rounded-md cursor-pointer"
          >
            Save Feedback
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedbackModal;
