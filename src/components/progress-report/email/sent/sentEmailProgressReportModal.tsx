'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import { EnvelopeIcon, CalendarIcon, UserIcon, ChatBubbleLeftRightIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { getStudentEmailHistory } from '@/services/reportEmailService';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { ReportEmailRecord } from '@/services/types/reportEmails';

interface SentEmailProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  term: string;
}

export default function SentEmailProgressReportModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  term
}: SentEmailProgressReportModalProps) {
  const [emailRecord, setEmailRecord] = useState<ReportEmailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const showNotification = useNotificationStore((state) => state.showNotification);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchEmailRecord();
    }
  }, [isOpen, studentId, term]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchEmailRecord = async () => {
    try {
      setLoading(true);
      const response = await getStudentEmailHistory(studentId);
      console.log(response)
      if (response.status === 'success') {
        // Find the progress report email for this specific term
        const progressReportEmail = response.data.find(
          email => email.reportType.toLowerCase() === 'progress_report' && email.term === term
        );
        
        if (progressReportEmail) {
          setEmailRecord(progressReportEmail);
        } else {
          showNotification('No email record found for this progress report', 'error');
        }
      }
    } catch (error) {
      console.error('Error fetching email record:', error);
      showNotification('Failed to load email details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatEmailList = (emails: string[]) => {
    if (emails.length <= 2) {
      return emails.join(', ');
    }
    return `${emails.slice(0, 2).join(', ')} and ${emails.length - 2} more`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="max-w-2xl w-11/12">
      <div className="p-9">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 p-3 bg-green-50 rounded-lg">
        <div className="p-2 bg-green-100 rounded-lg">
          <CheckCircleIcon className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Email Sent Successfully
          </h3>
          <p className="text-sm text-gray-600">
            Progress Report - {studentName}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="text-black">
          {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            <span className="ml-3 text-gray-600">Loading email details...</span>
          </div>
        ) : emailRecord ? (
          <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <UserIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Student</p>
                    <p className="text-sm text-gray-900">{studentName}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">Term</p>
                    <p className="text-sm text-gray-900">{emailRecord.term}</p>
                  </div>
                </div>
              </div>

              {/* Email Details */}
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-700">Email Recipients</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">To: </span>
                        <span className="text-sm text-gray-900">
                          {formatEmailList(emailRecord.emailAddresses)}
                        </span>
                      </div>
                      {emailRecord.ccAddresses && emailRecord.ccAddresses.length > 0 && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">CC: </span>
                          <span className="text-sm text-gray-900">
                            {formatEmailList(emailRecord.ccAddresses)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Email Subject */}
                {emailRecord.customHeader && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
                      <h4 className="text-sm font-medium text-gray-700">Email Subject</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900">{emailRecord.customHeader}</p>
                    </div>
                  </div>
                )}

                {/* Custom Message */}
                {emailRecord.customMessage && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-500" />
                      <h4 className="text-sm font-medium text-gray-700">Custom Message</h4>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-900 whitespace-pre-wrap">{emailRecord.customMessage}</p>
                    </div>
                  </div>
                )}

                {/* Sent Details */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ClockIcon className="h-5 w-5 text-gray-500" />
                    <h4 className="text-sm font-medium text-gray-700">Email Details</h4>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Sent on: </span>
                        <span className="text-sm text-gray-900">
                          {formatDate(emailRecord.sentAt)}
                        </span>
                      </div>
                      {emailRecord.sentByUsername && (
                        <div>
                          <span className="text-sm font-medium text-gray-600">Sent by: </span>
                          <span className="text-sm text-gray-900">{emailRecord.sentByUsername}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-sm font-medium text-gray-600">Report Type: </span>
                        <span className="text-sm text-gray-900">Progress Report</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <EnvelopeIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Record Found</h3>
            <p className="text-gray-600">
              We couldn&apos;t find an email record for this progress report.
            </p>
          </div>
        )}
      </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}