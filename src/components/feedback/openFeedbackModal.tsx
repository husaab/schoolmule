'use client'

import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUserStore } from '@/store/useUserStore';
import { upsertReportCardFeedback, getReportCardFeedback } from '@/services/reportCardService';
import { getTermsBySchool } from '@/services/termService';
import { TermPayload } from '@/services/types/term';
import { SparklesIcon, TableCellsIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

// Rating options for Work Habits and Behavior dropdowns
const RATING_OPTIONS = [
  { value: '', label: 'Select rating' },
  { value: 'E', label: 'E - Excellent' },
  { value: 'G', label: 'G - Good' },
  { value: 'S', label: 'S - Satisfactory' },
  { value: 'N', label: 'N - Needs Improvement' },
];

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  classId: string;
  subjectName?: string;
  studentGrade?: number;
  onNavigateToBulkFeedback?: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  classId,
  subjectName,
  studentGrade,
  onNavigateToBulkFeedback
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const user = useUserStore(state => state.user);

  const [terms, setTerms] = useState<TermPayload[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [term, setTerm] = useState<string>('');
  const [workHabits, setWorkHabits] = useState('');
  const [behavior, setBehavior] = useState('');
  const [comment, setComment] = useState('');
  const [generatingAI, setGeneratingAI] = useState(false);

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

  // Generate AI comment based on ratings
  const handleGenerateAIComment = async () => {
    if (!workHabits || !behavior) {
      showNotification('Please select Work Habits and Behavior ratings first', 'error');
      return;
    }

    setGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/generate-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          subject: subjectName || 'General',
          workHabits,
          behavior,
          term: term || 'Current Term',
          grade: studentGrade // Pass grade to AI (may be undefined)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate comment');
      }

      const data = await response.json();
      if (data.comment) {
        setComment(data.comment);
        showNotification('Comment generated successfully', 'success');
      } else {
        throw new Error('No comment returned');
      }
    } catch (err) {
      console.error('Error generating AI comment:', err);
      showNotification('Failed to generate comment. Please try again.', 'error');
    } finally {
      setGeneratingAI(false);
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Work Habits</label>
            <select
              value={workHabits}
              onChange={(e) => setWorkHabits(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {RATING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Behavior</label>
            <select
              value={behavior}
              onChange={(e) => setBehavior(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {RATING_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* AI Feature Info Card */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border border-purple-100/60 p-4">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-200/30 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center shadow-sm shadow-purple-200">
              <SparklesIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-purple-900 mb-1">AI-Powered Comments</h4>
              <p className="text-xs text-purple-700/80 leading-relaxed">
                Select <span className="font-medium text-purple-800">Work Habits</span> and <span className="font-medium text-purple-800">Behavior</span> ratings above to enable AI generation.
                The AI uses these ratings{studentGrade !== undefined ? <> along with the student&apos;s <span className="font-medium text-purple-800">grade ({studentGrade.toFixed(0)}%)</span></> : ''} to craft a personalized comment.
              </p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">General Comment</label>
            <div className="relative group">
              <button
                type="button"
                onClick={handleGenerateAIComment}
                disabled={generatingAI || !workHabits || !behavior}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <SparklesIcon className={`w-4 h-4 ${generatingAI ? 'animate-pulse' : ''}`} />
                {generatingAI ? 'Generating...' : 'Generate with AI'}
              </button>
              {/* Tooltip - shows when button is disabled */}
              {(!workHabits || !behavior) && (
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                  <div className="flex items-center gap-1.5">
                    <InformationCircleIcon className="w-4 h-4 text-amber-400" />
                    <span>Please select Work Habits and Behavior first to generate AI comments</span>
                  </div>
                  {/* Tooltip arrow */}
                  <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-800" />
                </div>
              )}
            </div>
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Click 'Generate with AI' or type your own comment..."
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

      {/* Promotional banner for bulk feedback */}
      {onNavigateToBulkFeedback && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToBulkFeedback();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gradient-to-r from-cyan-50 to-teal-50 text-cyan-700 rounded-lg hover:from-cyan-100 hover:to-teal-100 transition-all group cursor-pointer"
          >
            <TableCellsIcon className="w-5 h-5 text-cyan-600" />
            <span className="text-sm font-medium">
              Need to enter feedback for all students? Try Bulk Feedback
            </span>
            <span className="text-cyan-500 group-hover:translate-x-1 transition-transform">&rarr;</span>
          </button>
        </div>
      )}
    </Modal>
  );
};

export default FeedbackModal;
