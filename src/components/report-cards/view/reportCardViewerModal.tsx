'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';
import React from 'react';
import { createPortal } from 'react-dom';

interface ReportCardViewerModalProps {
  url: string;
  onClose: () => void;
}

export default function ReportCardViewerModal({ url, onClose }: ReportCardViewerModalProps) {

  return createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* Modal content */}
      <div className="relative z-10 w-[70%] h-[90%] bg-white rounded-lg overflow-hidden flex flex-col">
        <div className="flex justify-end p-2 border-b">
          <button onClick={onClose} className="text-gray-600 hover:text-red-600 transition cursor-pointer">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <iframe src={url} title="Report Card PDF" className="flex-1 w-full border-none" />
      </div>
    </div>,
    document.body
  );
}