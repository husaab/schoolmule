'use client';

import { useEffect } from 'react';
import { EyeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

type GeneratedStudent = { studentId: string; name: string };

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  resultMessage: string;
  generatedStudents?: GeneratedStudent[];
  resolvingStudentId?: string | null;
  onPreview?: (studentId: string) => void;
  onOpenNewTab?: (studentId: string) => void;
};

export default function GenerateReportCardModal({
  isOpen,
  onClose,
  isLoading,
  resultMessage,
  generatedStudents = [],
  resolvingStudentId = null,
  onPreview,
  onOpenNewTab,
}: Props) {
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoading) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome to show confirmation dialog
      }
    };

    if (isOpen && isLoading) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isOpen, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-70">
      <div className="bg-white rounded-xl p-6 w-full max-w-md text-center shadow-lg">
        <h2 className="text-xl font-bold mb-4 text-black">Generating Report Cards</h2>
        {isLoading ? (
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-gray-700">Please wait...</p>
          </div>
        ) : (
          <>
            <p className="text-green-600 font-medium">{resultMessage}</p>

            {generatedStudents.length > 0 && (
              <div className="mt-4 max-h-64 overflow-y-auto text-left border border-gray-200 rounded-lg divide-y divide-gray-100">
                {generatedStudents.map((s) => {
                  const isResolving = resolvingStudentId === s.studentId;
                  return (
                    <div
                      key={s.studentId}
                      className="flex items-center justify-between gap-2 px-3 py-2"
                    >
                      <span className="text-sm text-gray-800 truncate">{s.name}</span>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onPreview?.(s.studentId)}
                          disabled={isResolving}
                          title="Preview report card"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-cyan-700 bg-cyan-50 rounded hover:bg-cyan-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isResolving ? (
                            <div className="w-3.5 h-3.5 border-2 border-cyan-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <EyeIcon className="w-3.5 h-3.5" />
                          )}
                          Preview
                        </button>
                        <button
                          onClick={() => onOpenNewTab?.(s.studentId)}
                          disabled={isResolving}
                          title="Open in new tab"
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                          New tab
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={onClose}
              className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded cursor-pointer"
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
