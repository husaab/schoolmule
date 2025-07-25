'use client';

import { useState, useEffect } from 'react';
import { generateBulkReportCards } from '@/services/reportCardService';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  studentIds: string[];
  term: string;
};

export default function GenerateReportCardModal({ isOpen, onClose, studentIds, term }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [resultMessage, setResultMessage] = useState('');

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
        if (isLoading) {
        e.preventDefault();
        e.returnValue = ''; // Required for Chrome to show confirmation dialog
        }
    };

    if (isOpen) {
      setIsLoading(true);
      window.addEventListener('beforeunload', handleBeforeUnload);
      setResultMessage('');

      generateBulkReportCards({ studentIds, term })
        .then((res) => {
          const successCount = res.generated.length;
          setResultMessage(`Generated ${successCount} report card(s).`);
        })
        .catch(() => {
          setResultMessage('An error occurred while generating report cards.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }

    return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
    } ;
  }, [isOpen, studentIds, term, isLoading]);

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
