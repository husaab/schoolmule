// File: src/components/progress-report/ProgressReportModal.tsx
'use client'

import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUserStore } from '@/store/useUserStore';
import { upsertProgressReportFeedback, getProgressReportFeedback } from '@/services/progressReportService';
import { getTermsBySchool } from '@/services/termService';
import type { TermPayload } from '@/services/types/term';
import {
  Button,
  Field,
  ModalBody,
  ModalFooter,
  ModalHeader,
  selectClass,
  textareaClass,
} from '@/components/shared/modalKit';
import {
  SparklesIcon,
  InformationCircleIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

interface ProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  classId: string;
  subjectName?: string;
  studentGrade?: number;
  initialTerm?: string;
}

const ProgressReportModal: React.FC<ProgressReportModalProps> = ({
  isOpen,
  onClose,
  studentId,
  studentName,
  classId,
  subjectName,
  studentGrade,
  initialTerm,
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
  // `loading` covers both the initial feedback fetch and the save, so it can't
  // tell the footer button which one is running. `saving` is presentation only.
  const [saving, setSaving] = useState(false);
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
          if (initialTerm) {
            setTerm(initialTerm);
          } else if (user.activeTerm) {
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
  }, [isOpen, user?.school, user?.activeTerm, initialTerm]);

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
      setSaving(true);
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
      setSaving(false);
    }
  };

  const ratingsIncomplete = !coreStandards || !workHabit || !behavior;

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-lg">
      <ModalHeader
        title="Progress report feedback"
        subtitle={subjectName ? `${studentName} · ${subjectName}` : studentName}
        icon={ClipboardDocumentListIcon}
      />

      {loading && !coreStandards && !workHabit && !behavior && !comment ? (
        <ModalBody>
          <div className="space-y-4" aria-label="Loading feedback">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <div className="h-3.5 w-24 animate-pulse rounded bg-slate-100" />
                <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
              </div>
            ))}
          </div>
        </ModalBody>
      ) : (
        <form onSubmit={handleSubmit}>
          <ModalBody>
            {/* Term selector — collapsed by default, since it is almost always
                already correct and only occasionally needs changing. */}
            <div>
              <button
                type="button"
                onClick={() => setShowTermSelector(!showTermSelector)}
                className="inline-flex cursor-pointer items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-700"
              >
                <CalendarDaysIcon className="h-4 w-4" />
                <span>{term || 'Select term'}</span>
                <ChevronDownIcon
                  className={`h-3 w-3 transition-transform ${showTermSelector ? 'rotate-180' : ''}`}
                />
              </button>
              {showTermSelector && (
                <div className="mt-2">
                  {loadingTerms ? (
                    <div className="h-10 w-full animate-pulse rounded-xl bg-slate-100" />
                  ) : (
                    <select
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      className={selectClass}
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

            <Field label="Core standards" htmlFor="pr-core-standards">
              <select
                id="pr-core-standards"
                value={coreStandards}
                onChange={(e) => setCoreStandards(e.target.value)}
                className={selectClass}
              >
                <option value="">Select core standards rating</option>
                <option value="Exceeding Common Core Standards">Exceeding Common Core Standards</option>
                <option value="Meeting Common Core Standards">Meeting Common Core Standards</option>
                <option value="Working towards Common Core Standards">Working towards Common Core Standards</option>
                <option value="Not Meeting Common Core Standards">Not Meeting Common Core Standards</option>
              </select>
            </Field>

            <Field label="Work habits" htmlFor="pr-work-habits">
              <select
                id="pr-work-habits"
                value={workHabit}
                onChange={(e) => setWorkHabit(e.target.value)}
                className={selectClass}
              >
                <option value="">Select work habits rating</option>
                <option value="E">E - Excellent</option>
                <option value="G">G - Good</option>
                <option value="S">S - Satisfactory</option>
                <option value="N">N - Needs Improvement</option>
              </select>
            </Field>

            <Field label="Behavior" htmlFor="pr-behavior">
              <select
                id="pr-behavior"
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                className={selectClass}
              >
                <option value="">Select behavior rating</option>
                <option value="E">E - Excellent</option>
                <option value="G">G - Good</option>
                <option value="S">S - Satisfactory</option>
                <option value="N">N - Needs Improvement</option>
              </select>
            </Field>

            {/* AI feature info card */}
            <div className="relative overflow-hidden rounded-xl border border-purple-100/60 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 p-4">
              <div className="absolute right-0 top-0 h-24 w-24 -translate-y-1/2 translate-x-1/2 rounded-full bg-gradient-to-br from-purple-200/30 to-transparent blur-2xl" />
              <div className="relative flex gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-500 shadow-sm shadow-purple-200">
                  <SparklesIcon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="mb-1 text-sm font-semibold text-purple-900">AI-powered comments</h4>
                  <p className="text-xs leading-relaxed text-purple-700/80">
                    Select <span className="font-medium text-purple-800">Core standards</span>, <span className="font-medium text-purple-800">Work habits</span>, and <span className="font-medium text-purple-800">Behavior</span> ratings above to enable AI generation.
                    {studentGrade !== undefined && (
                      <> The AI also uses the student&apos;s <span className="font-medium text-purple-800">grade ({studentGrade.toFixed(0)}%)</span> to craft a personalized comment.</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="pr-comment" className="block text-sm font-medium text-slate-700">
                  Comments
                </label>
                <div className="group relative">
                  <Button
                    type="button"
                    variant="violet"
                    onClick={handleGenerateAIComment}
                    loading={generatingAI}
                    disabled={ratingsIncomplete}
                    className="px-3 py-1.5 text-xs"
                  >
                    {!generatingAI && <SparklesIcon className="h-4 w-4" />}
                    {generatingAI ? 'Generating' : 'Generate with AI'}
                  </Button>
                  {ratingsIncomplete && (
                    <div className="pointer-events-none absolute bottom-full right-0 z-50 mb-2 whitespace-nowrap rounded-lg bg-slate-800 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity duration-200 group-hover:opacity-100">
                      <div className="flex items-center gap-1.5">
                        <InformationCircleIcon className="h-4 w-4 text-amber-400" />
                        <span>Please select Core Standards, Work Habits, and Behavior first</span>
                      </div>
                      <div className="absolute right-4 top-full border-4 border-transparent border-t-slate-800" />
                    </div>
                  )}
                </div>
              </div>
              <textarea
                id="pr-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={textareaClass}
                rows={4}
                placeholder="Generate with AI, or write your own comment…"
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving} disabled={loading || loadingTerms}>
              {saving ? 'Saving' : 'Save feedback'}
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
};

export default ProgressReportModal;
