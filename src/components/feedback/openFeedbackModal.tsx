'use client'

import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUserStore } from '@/store/useUserStore';
import { upsertReportCardFeedback, getReportCardFeedback } from '@/services/reportCardService';
import { getTermsBySchool } from '@/services/termService';
import { TermPayload } from '@/services/types/term';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  classId: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  classId
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const user = useUserStore(state => state.user);

  const [terms, setTerms] = useState<TermPayload[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [term, setTerm] = useState<string>('');
  const [workHabits, setWorkHabits] = useState('');
  const [behavior, setBehavior] = useState('');
  const [comment, setComment] = useState('');

  // Fetch terms for the school when modal opens
  useEffect(() => {
    if (!isOpen || !user?.school) return;

    const fetchTerms = async () => {
      setLoadingTerms(true);
      try {
        const res = await getTermsBySchool(user.school!);
        if (res.status === 'success') {
          setTerms(res.data);
          
          // Set default term to active term
          if (user.activeTerm) {
            setTerm(user.activeTerm);
          } else {
            // Find active term from the list
            const activeTerm = res.data.find(t => t.isActive);
            if (activeTerm) {
              setTerm(activeTerm.name);
            } else if (res.data.length > 0) {
              // Fallback to first term if no active term
              setTerm(res.data[0].name);
            }
          }
        } else {
          showNotification('Failed to load terms', 'error');
        }
      } catch (err) {
        console.error('Error fetching terms:', err);
        showNotification('Error loading terms', 'error');
      } finally {
        setLoadingTerms(false);
      }
    };

    fetchTerms();
  }, [isOpen, user?.school, user?.activeTerm, showNotification]);

  // Fetch existing feedback when term is selected
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
        console.warn('Feedback not found — initializing blank form', err);
        setWorkHabits('');
        setBehavior('');
        setComment('');
      }
    };

    fetchFeedback();
  }, [isOpen, studentId, classId, term]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setTerm('');
      setWorkHabits('');
      setBehavior('');
      setComment('');
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!term) {
      showNotification('Please select a term', 'error');
      return;
    }

    try {
      const res = await upsertReportCardFeedback({ 
        studentId, 
        classId, 
        term: term, 
        workHabits, 
        behavior, 
        comment 
      });
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
      <h2 className="text-xl mb-4 text-black">{studentName} Report Card Feedback</h2>
      <form onSubmit={handleSubmit} className="space-y-4 text-black">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
          {loadingTerms ? (
            <p className="text-gray-600">Loading terms...</p>
          ) : (
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="" disabled>Select term</option>
              {terms.map((t) => (
                <option key={t.termId} value={t.name}>
                  {t.name} ({t.academicYear})
                  {t.isActive && ' - Active'}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Work Habits</label>
          <textarea
            value={workHabits}
            onChange={(e) => setWorkHabits(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Describe the student's work habits..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Behavior</label>
          <textarea
            value={behavior}
            onChange={(e) => setBehavior(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={2}
            placeholder="Describe the student's behavior..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">General Comment</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            placeholder="Additional comments about the student's performance..."
          />
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loadingTerms}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loadingTerms ? 'Loading...' : 'Save Feedback'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default FeedbackModal;
