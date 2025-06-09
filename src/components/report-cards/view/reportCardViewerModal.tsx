'use client';

import { XMarkIcon } from '@heroicons/react/24/solid';

interface ReportCardViewerModalProps {
  url: string;
  onClose: () => void;
}

export default function ReportCardViewerModal({ url, onClose }: ReportCardViewerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-[70%] h-[90%] bg-white rounded-lg shadow-lg overflow-hidden flex flex-col">
        
        {/* Header Bar */}
        <div className="flex justify-end items-center bg-white px-4 py-2 border-b shadow-sm z-10">
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-red-600 transition cursor-pointer"
            title="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* PDF Viewer */}
        <iframe
          src={url}
          title="Report Card PDF"
          className="flex-1 w-full border-none"
        />
      </div>
    </div>
  );
}
