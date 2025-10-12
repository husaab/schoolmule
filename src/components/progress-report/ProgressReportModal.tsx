'use client'

import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { upsertProgressReportFeedback, getProgressReportFeedback } from '@/services/progressReportService';

interface ProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  classId: string;
}

const ProgressReportModal: React.FC<ProgressReportModalProps> = ({
  isOpen,
  onClose,
  studentId,
  classId
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);

  const [coreStandards, setCoreStandards] = useState('');
  const [workHabit, setWorkHabit] = useState('');
  const [behavior, setBehavior] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch existing feedback when modal opens
  useEffect(() => {
    if (!isOpen || !studentId || !classId) return;

    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const res = await getProgressReportFeedback(studentId, classId);
        if (res.status === 'success' && res.data) {
          setCoreStandards(res.data.coreStandards || '');
          setWorkHabit(res.data.workHabit || '');
          setBehavior(res.data.behavior || '');
          setComment(res.data.comment || '');
        } else {
          setCoreStandards('');
          setWorkHabit('');
          setBehavior('');
          setComment('');
        }
      } catch (err) {
        // This means feedback doesn't exist yet → treat as empty
        console.warn('Progress report feedback not found — initializing blank form', err);
        setCoreStandards('');
        setWorkHabit('');
        setBehavior('');
        setComment('');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, [isOpen, studentId, classId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCoreStandards('');
      setWorkHabit('');
      setBehavior('');
      setComment('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      const res = await upsertProgressReportFeedback({ 
        studentId, 
        classId, 
        coreStandards, 
        workHabit, 
        behavior, 
        comment 
      });
      if (res.status === 'success') {
        showNotification('Progress report feedback saved successfully', 'success');
        onClose();
      } else {
        showNotification(res.message || 'Failed to save progress report feedback', 'error');
      }
    } catch (err) {
      console.error('Error saving progress report feedback:', err);
      showNotification('Error saving progress report feedback', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <h2 className="text-xl mb-4 text-black font-semibold">Progress Report Feedback</h2>
      
      {loading && !coreStandards && !workHabit && !behavior && !comment ? (
        <div className="text-center py-4">
          <p className="text-gray-600">Loading feedback...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Core Standards</label>
            <select
              value={coreStandards}
              onChange={(e) => setCoreStandards(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select core standards rating</option>
              <option value="Exceeding Common Core Standards">Exceeding Common Core Standards</option>
              <option value="Meeting Common Core Standards">Meeting Common Core Standards</option>
              <option value="Working towards Common Core Standards">Working towards Common Core Standards</option>
              <option value="Not Meeting Common Core Standards">Not Meeting Common Core Standards</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Habits</label>
            <select
              value={workHabit}
              onChange={(e) => setWorkHabit(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select work habits rating</option>
              <option value="E">E - Excellent</option>
              <option value="G">G - Good</option>
              <option value="S">S - Satisfactory</option>
              <option value="N">N - Needs Improvement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Behavior</label>
            <select
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select behavior rating</option>
              <option value="E">E - Excellent</option>
              <option value="G">G - Good</option>
              <option value="S">S - Satisfactory</option>
              <option value="N">N - Needs Improvement</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Any observations or recommendations for the student..."
            />
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Progress Report'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default ProgressReportModal;