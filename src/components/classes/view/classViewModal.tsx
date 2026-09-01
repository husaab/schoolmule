// File: src/components/classes/view/classViewModal.tsx
'use client'

import React, { useState, useEffect } from 'react';
import Modal from '../../shared/modal';
import { ClassPayload } from '@/services/types/class';
import { getAssessmentsByClass } from '@/services/classService';
import { AssessmentPayload } from '@/services/types/assessment';
import { getGradeDisplayName, getSchoolName } from '@/lib/schoolUtils';
import { Button, ModalBody, ModalFooter } from '../../shared/modalKit';
import {
  AcademicCapIcon,
  CalendarDaysIcon,
  PencilIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface ClassViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassPayload;
  /** Optional: jump straight from viewing to editing this class. */
  onEdit?: () => void;
}

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{children}</h3>
);

const ClassViewModal: React.FC<ClassViewModalProps> = ({
  isOpen,
  onClose,
  classData,
  onEdit,
}) => {
  const [assessments, setAssessments] = useState<AssessmentPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setAssessments([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    getAssessmentsByClass(classData.classId)
      .then((res) => {
        if (res.status === 'success') {
          setAssessments(res.data);
        } else {
          setError(res.message || 'Failed to fetch assessments');
        }
      })
      .catch((err) => {
        console.error('Error fetching assessments:', err);
        setError('Error fetching assessments');
      })
      .finally(() => setLoading(false));
  }, [isOpen, classData.classId]);

  // Children roll up under their parent in the gradebook, so the top level is
  // what actually describes the marking scheme.
  const topLevel = assessments.filter((a) => !a.parentAssessmentId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-md">
      {/* Identity */}
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-gradient-to-br from-cyan-50 via-white to-teal-50 px-6 pt-6 pb-5">
        <div className="pr-10">
          <h2 className="truncate text-xl font-semibold text-slate-900">{classData.subject}</h2>
          <p className="mt-0.5 truncate text-sm text-slate-500">{getSchoolName(classData.school)}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1 text-sm font-medium text-purple-700">
            <AcademicCapIcon className="h-4 w-4" />
            {classData.grade ? getGradeDisplayName(classData.grade) : 'No grade'}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-sm text-slate-600 ring-1 ring-slate-200">
            <CalendarDaysIcon className="h-4 w-4 text-slate-400" />
            {classData.termName || 'No term'}
          </span>
        </div>
      </header>

      <ModalBody className="space-y-6">
        {/* Teaching staff */}
        <section className="space-y-2">
          <SectionLabel>Teacher</SectionLabel>
          <div className="flex items-center gap-2 text-sm">
            <UserIcon className="h-4 w-4 flex-shrink-0 text-slate-400" />
            <span className="text-slate-700">{classData.teacherName || 'Unassigned'}</span>
          </div>
          {classData.additionalTeachers?.length > 0 && (
            <div className="space-y-1.5 pl-6">
              {classData.additionalTeachers.map((t) => (
                <p key={t.teacherId} className="text-sm text-slate-500">
                  {t.fullName}
                  <span className="ml-1.5 text-xs text-slate-400">also teaching</span>
                </p>
              ))}
            </div>
          )}
        </section>

        {/* Assessments */}
        <section className="space-y-2">
          <div className="flex items-baseline justify-between gap-3">
            <SectionLabel>Assessments</SectionLabel>
            {!loading && !error && topLevel.length > 0 && (
              <span className="text-xs text-slate-400">
                {topLevel.length} item{topLevel.length === 1 ? '' : 's'}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : topLevel.length === 0 ? (
            <p className="text-sm text-slate-400">
              No assessments yet — add them from the class to start recording marks.
            </p>
          ) : (
            <ul className={`space-y-2 ${topLevel.length > 5 ? 'max-h-64 overflow-y-auto pr-1' : ''}`}>
              {topLevel.map((a) => (
                <li
                  key={a.assessmentId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">{a.name}</p>
                    {a.date && (
                      <p className="mt-0.5 text-xs text-slate-400">{formatDate(a.date)}</p>
                    )}
                  </div>
                  <span className="flex-shrink-0 rounded-lg bg-white px-2 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                    {a.weightPoints != null ? `${a.weightPoints} pts` : `${a.weightPercent}%`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </ModalBody>

      <ModalFooter>
        <p className="mr-auto text-xs text-slate-400">
          Added {formatDate(classData.createdAt)} · Updated {formatDate(classData.lastModifiedAt)}
        </p>
        {onEdit && (
          <Button variant="secondary" onClick={onEdit}>
            <PencilIcon className="h-4 w-4" />
            Edit
          </Button>
        )}
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default ClassViewModal;
