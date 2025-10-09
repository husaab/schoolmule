'use client'

import React from 'react'
import Modal from '../../shared/modal'
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline'

interface StudentSummaryReportModalProps {
  isOpen: boolean
  onClose: () => void
  pdfBlob: Blob | null
  studentName: string
  className: string
  termName: string
  onDownload: () => void
}

const StudentSummaryReportModal: React.FC<StudentSummaryReportModalProps> = ({
  isOpen,
  onClose,
  pdfBlob,
  studentName,
  className,
  termName,
  onDownload,
}) => {
  const pdfUrl = pdfBlob ? URL.createObjectURL(pdfBlob) : null

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="p-0 max-w-6xl w-11/12 h-[90vh]">
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div>
            <h2 className="text-xl font-semibold text-black">Student Report Preview</h2>
            <p className="text-sm text-gray-600 mt-1">
              {studentName} - {className} - {termName}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onDownload}
              className="cursor-pointer flex items-center px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium mr-15"
            >
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Download PDF
            </button>

          </div>
        </div>
        
        {/* PDF Viewer */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0"
              title="Student Report PDF Preview"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No PDF available for preview</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default StudentSummaryReportModal