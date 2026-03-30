'use client'

import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUserStore } from '@/store/useUserStore';
import { upsertProgressReportFeedback, getProgressReportFeedback } from '@/services/progressReportService';
import { getTermsBySchool } from '@/services/termService';
import type { TermPayload } from '@/services/types/term';
import {
  SparklesIcon,
  InformationCircleIcon,
  TableCellsIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface ProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  classId: string;
  subjectName?: string;
  studentGrade?: number;
  onNavigateToBulkProgress?: () => void;
}

const ProgressReportModal: React.FC<ProgressReportModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  classId,
  subjectName,
  studentGrade,
  onNavigateToBulkProgress,
}) => {
  const showNotification = useNotificationStore(state => state.showNotification);
  const user = useUserStore(state => state.user);

  // Term state
  const [terms, setTerms] = useState<TermPayload[]>([]);
  const [loadingTerms, setLoadingTerms] = useState(false);
  const [term, setTerm] = useState('');

  // Form state
  const [coreStandards, setCoreStandards] = useState('');
  const [workHabit, setWorkHabit] = useState('');
  const [behavior, setBehavior] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [showTermSelector, setShowTermSelector] = useState(false);

  // Load terms when modal opens
  useEffect(() => {
    if (!isOpen || !user?.school) return;

    const fetchTerms = async () => {
      setLoadingTerms(true);
      try {
        const res = await getTermsBySchool(user.school!);
        if (res.status === 'success' && res.data) {
          setTerms(res.data);
          // Set default term
          if (user.activeTerm) {
            setTerm(user.activeTerm);
          } else {
            const activeTerm = res.data.find((t: TermPayload) => t.isActive);
            if (activeTerm) {
              setTerm(activeTerm.name);
            } else if (res.data.length > 0) {
              setTerm(res.data[0].name);
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load terms:', err);
      } finally {
        setLoadingTerms(false);
      }
    };

    fetchTerms();
  }, [isOpen, user?.school, user?.activeTerm]);

  // Fetch existing feedback when modal opens and term is set
  useEffect(() => {
    if (!isOpen || !studentId || !classId || !term) return;

    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const res = await getProgressReportFeedback(studentId, classId, term);
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
  }, [isOpen, studentId, classId, term]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setCoreStandards('');
      setWorkHabit('');
      setBehavior('');
      setComment('');
      setTerm('');
      setShowTermSelector(false);
    }
  }, [isOpen]);

  const handleGenerateAIComment = async () => {
    if (!coreStandards || !workHabit || !behavior) {
      showNotification('Please select Core Standards, Work Habits, and Behavior first', 'error');
      return;
    }

    setGeneratingAI(true);
    try {
      const response = await fetch('/api/ai/generate-progress-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          subject: subjectName || 'General',
          coreStandards,
          workHabits: workHabit,
          behavior,
          term: term || 'Current Term',
          grade: studentGrade,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate comment');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!term) {
      showNotification('Please select a term', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await upsertProgressReportFeedback({
        studentId,
        classId,
        term,
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
      <h2 className="text-xl mb-4 text-black font-semibold">{studentName} Progress Report Feedback</h2>
      {loading && !coreStandards && !workHabit && !behavior && !comment ? (
        <div className="text-center py-4">
          <p className="text-gray-600">Loading feedback...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          {/* Term Selector — collapsed by default */}
          <div>
            <button
              type="button"
              onClick={() => setShowTermSelector(!showTermSelector)}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <CalendarDaysIcon className="h-4 w-4" />
              <span>{term || 'Select term'}</span>
              <ChevronDownIcon className={`h-3 w-3 transition-transform ${showTermSelector ? 'rotate-180' : ''}`} />
            </button>
            {showTermSelector && (
              <div className="mt-2">
                {loadingTerms ? (
                  <p className="text-gray-600 text-sm">Loading terms...</p>
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
                        {t.name} ({t.academicYear}){t.isActive ? ' - Active' : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

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
                  Select <span className="font-medium text-purple-800">Core Standards</span>, <span className="font-medium text-purple-800">Work Habits</span>, and <span className="font-medium text-purple-800">Behavior</span> ratings above to enable AI generation.
                  {studentGrade !== undefined && (
                    <> The AI also uses the student&apos;s <span className="font-medium text-purple-800">grade ({studentGrade.toFixed(0)}%)</span> to craft a personalized comment.</>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">Comments</label>
              <div className="relative group">
                <button
                  type="button"
                  onClick={handleGenerateAIComment}
                  disabled={generatingAI || !coreStandards || !workHabit || !behavior}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <SparklesIcon className={`w-4 h-4 ${generatingAI ? 'animate-pulse' : ''}`} />
                  {generatingAI ? 'Generating...' : 'Generate with AI'}
                </button>
                {(!coreStandards || !workHabit || !behavior) && (
                  <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    <div className="flex items-center gap-1.5">
                      <InformationCircleIcon className="w-4 h-4 text-amber-400" />
                      <span>Please select Core Standards, Work Habits, and Behavior first</span>
                    </div>
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
              disabled={loading}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingTerms}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors cursor-pointer disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Progress Report'}
            </button>
          </div>
        </form>
      )}

      {/* Bulk progress upsell banner */}
      {onNavigateToBulkProgress && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onNavigateToBulkProgress();
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 rounded-lg hover:from-emerald-100 hover:to-green-100 transition-all group cursor-pointer"
          >
            <TableCellsIcon className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium">
              Need to enter progress reports for all students? Try Bulk Progress
            </span>
            <span className="text-emerald-500 group-hover:translate-x-1 transition-transform">&rarr;</span>
          </button>
        </div>
      )}
    </Modal>
  );
};

export default ProgressReportModal;
