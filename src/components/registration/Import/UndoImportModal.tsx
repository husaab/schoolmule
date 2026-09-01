'use client';

import { useState, useEffect } from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/shared/modal';
import * as importService from '@/services/registrationImportService';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { UndoBlocker } from '@/services/types/registrationImport';

interface Props {
  submissionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onUndone: () => void;
}

/**
 * Reverses an import. Always unlinks; offers to delete the created student only
 * when nothing depends on it — deleting a student cascades to attendance,
 * assessments and report card feedback, so that has to be an informed choice.
 */
export default function UndoImportModal({ submissionId, isOpen, onClose, onUndone }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);

  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [studentName, setStudentName] = useState<string | null>(null);
  const [blockedBy, setBlockedBy] = useState<UndoBlocker[]>([]);
  const [canDelete, setCanDelete] = useState(false);
  const [deleteStudent, setDeleteStudent] = useState(false);

  useEffect(() => {
    if (!isOpen || !submissionId) return;
    setLoading(true);
    setDeleteStudent(false);
    (async () => {
      try {
        const res = await importService.getUndoInfo(submissionId);
        setStudentName(res.data.studentName);
        setBlockedBy(res.data.blockedBy);
        setCanDelete(res.data.canDelete);
        // Deleting is the usual intent when the student is untouched, so make
        // it the default — but only when it's actually safe.
        setDeleteStudent(res.data.canDelete);
      } catch (err) {
        showNotification((err as Error).message || 'Error loading import details', 'error');
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, submissionId, showNotification, onClose]);

  const handleUndo = async () => {
    if (!submissionId) return;
    setWorking(true);
    try {
      const res = await importService.undoImport(submissionId, deleteStudent);
      showNotification(res.message, 'success');
      onUndone();
      onClose();
    } catch (err) {
      showNotification((err as Error).message || 'Error undoing import', 'error');
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Undo import" size="lg">
      <div className="flex flex-col">
        {loading ? (
          <div className="px-6 py-12 text-center text-slate-400">
            <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm">Checking...</p>
          </div>
        ) : (
          <div className="px-6 py-4 space-y-4">
            <p className="text-sm text-slate-600">
              This submission was imported as{' '}
              <span className="font-medium text-slate-900">{studentName || 'a student'}</span>.
              Undoing it will unlink the two, so the submission can be imported again.
            </p>

            {canDelete ? (
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={!deleteStudent}
                    onChange={() => setDeleteStudent(false)}
                    className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>
                    <span className="font-medium">Unlink only</span>
                    <span className="block text-xs text-slate-500">Keep the student record.</span>
                  </span>
                </label>
                <label className="flex items-start gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="radio"
                    checked={deleteStudent}
                    onChange={() => setDeleteStudent(true)}
                    className="mt-0.5 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>
                    <span className="font-medium">Unlink and delete the student</span>
                    <span className="block text-xs text-slate-500">
                      Nothing depends on this student yet, so it can be removed cleanly.
                    </span>
                  </span>
                </label>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-medium mb-1">The student record will be kept.</p>
                  <p>
                    Other records now depend on it —{' '}
                    <span className="font-medium">{blockedBy.map((b) => b.label).join(', ')}</span> —
                    and deleting the student would take those with it. Delete it from the students
                    page if you really want it gone.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="sticky bottom-0 bg-white px-6 py-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={working}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUndo}
            disabled={working || loading}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 cursor-pointer ${
              deleteStudent ? 'bg-rose-600 hover:bg-rose-700' : 'bg-cyan-600 hover:bg-cyan-700'
            }`}
          >
            {working ? 'Undoing...' : deleteStudent ? 'Undo and delete student' : 'Undo import'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
