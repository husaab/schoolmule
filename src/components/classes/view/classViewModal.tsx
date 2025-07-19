// File: src/components/class/view/ClassViewModal.tsx
'use client'

import React, { useState, useEffect } from 'react';
import Modal from '../../shared/modal'; // adjust the path if needed
import { ClassPayload } from '@/services/types/class';
import { getAssessmentsByClass } from '@/services/classService';
import { AssessmentPayload } from '@/services/types/assessment';

interface ClassViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassPayload;
}

const ClassViewModal: React.FC<ClassViewModalProps> = ({
  isOpen,
  onClose,
  classData,
}) => {
  const [assessments, setAssessments] = useState<AssessmentPayload[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      // If modal is closed, reset state
      setAssessments([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Only fetch if modal is open
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-6 max-w-lg w-11/12">
      <h2 className="text-xl mb-4 text-black">Class Details</h2>
      <div className="space-y-3 text-black">
        <div>
          <strong>Subject:</strong> {classData.subject}
        </div>
        <div>
          <strong>Grade:</strong> {classData.grade}
        </div>
        <div>
          <strong>Homeroom Teacher:</strong> {classData.teacherName}
        </div>
        <div>
          <strong>School:</strong> {classData.school}
        </div>
        <div>
          <strong>Term:</strong> {classData.termName || 'Not assigned'}
        </div>
        <div>
          <strong>Created At:</strong>{' '}
          {new Date(classData.createdAt).toLocaleString()}
        </div>
        <div>
          <strong>Last Modified:</strong>{' '}
          {new Date(classData.lastModifiedAt).toLocaleString()}
        </div>

        {/* Assessments Section */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Assessments</h3>
          {loading && <p>Loading assessments...</p>}
          {error && <p className="text-red-600">{error}</p>}
          {!loading && !error && (
            <>
              {assessments.length === 0 ? (
                <p>No assessments found.</p>
              ) : (
                // Wrapper div: if more than 5 items, make it scrollable
                <div
                  className={`mt-2 ${
                    assessments.length > 5 ? 'max-h-60 overflow-y-auto' : ''
                  }`}
                >
                  <ul className="space-y-2">
                    {assessments.map((a) => (
                      <li
                        key={a.assessmentId}
                        className="p-3 border border-gray-300 rounded"
                      >
                        <p className="font-medium">{a.name}</p>
                        <p className="text-sm text-gray-600">
                          Weight: {a.weightPercent}%
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {new Date(a.createdAt).toLocaleDateString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition cursor-pointer"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};

export default ClassViewModal;
