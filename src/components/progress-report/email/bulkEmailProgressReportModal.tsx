'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import { PaperAirplaneIcon, UsersIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, XCircleIcon, ClockIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { sendBulkReportEmails, generateDefaultSubject } from '@/services/reportEmailService';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { SendBulkReportEmailPayload, BulkReportEmailResponse, BulkReportEmailResult } from '@/services/types/reportEmails';

interface BulkEmailProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentIds: string[];
  studentNames: string[]; // Array of student names for display
  term: string;
  onEmailsSent?: () => void;
}

export default function BulkEmailProgressReportModal({
  isOpen,
  onClose,
  studentIds,
  studentNames,
  term,
  onEmailsSent
}: BulkEmailProgressReportModalProps) {
  const showNotification = useNotificationStore((state) => state.showNotification);

  // Form state
  const [ccAddresses, setCcAddresses] = useState<string[]>([]);
  const [customHeader, setCustomHeader] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  
  // Selected students state (allows deselection)
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>(studentIds);
  const [selectedStudentNames, setSelectedStudentNames] = useState<string[]>(studentNames);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkReportEmailResult[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; sent: number; failed: number; duration: string } | null>(null);
  
  // Input states
  const [ccInput, setCcInput] = useState('');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Set default subject for bulk emails
      setCustomHeader(generateDefaultSubject('Progress Reports', 'progress_report', term));
      setCustomMessage('');
      setCcAddresses([]);
      setCcInput('');
      setResults(null);
      setSummary(null);
      // Reset selected students to original list
      setSelectedStudentIds(studentIds);
      setSelectedStudentNames(studentNames);
    }
  }, [isOpen, term, studentIds, studentNames]);

  const handleCcInputChange = (value: string) => {
    setCcInput(value);
    // Parse CC emails from comma-separated input
    const emails = value
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    setCcAddresses(emails);
  };

  const handleRemoveStudent = (indexToRemove: number) => {
    setSelectedStudentIds(prev => prev.filter((_, index) => index !== indexToRemove));
    setSelectedStudentNames(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const validateForm = () => {
    if (selectedStudentIds.length === 0) {
      showNotification('No students selected for bulk email', 'error');
      return false;
    }

    if (ccAddresses.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = ccAddresses.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        showNotification(`Invalid CC email addresses: ${invalidEmails.join(', ')}`, 'error');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);
      setResults(null);
      setSummary(null);

      const payload: SendBulkReportEmailPayload = {
        reportType: 'progress_report',
        studentIds: selectedStudentIds,
        term,
        bulkConfig: {
          customHeader: customHeader.trim() || undefined,
          customMessage: customMessage.trim() || undefined,
          ccAddresses: ccAddresses.length > 0 ? ccAddresses : undefined
        }
      };

      const response: BulkReportEmailResponse = await sendBulkReportEmails(payload);

      if (response.status === 'completed') {
        setResults(response.results);
        setSummary(response.summary);
        
        const successCount = response.summary.sent;
        const failureCount = response.summary.failed;
        
        if (failureCount === 0) {
          showNotification(`Successfully sent ${successCount} progress report emails`, 'success');
        } else if (successCount === 0) {
          showNotification(`Failed to send all ${failureCount} progress report emails`, 'error');
        } else {
          showNotification(`Sent ${successCount} emails, ${failureCount} failed`, 'error');
        }

        onEmailsSent?.();
      } else {
        showNotification('Failed to send bulk emails', 'error');
      }
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      showNotification('Failed to send bulk progress report emails', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const getStatusIcon = (status: 'success' | 'failed') => {
    if (status === 'success') {
      return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
    }
    return <XCircleIcon className="h-4 w-4 text-red-500" />;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style="max-w-4xl w-11/12">
      <div className="p-9">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="p-2 bg-blue-100 rounded-lg">
            <PaperAirplaneIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Send Bulk Progress Report Emails
            </h3>
            <p className="text-sm text-gray-600">
              Email progress reports for {selectedStudentIds.length} student{selectedStudentIds.length !== 1 ? 's' : ''} - {term}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="text-black">
          {results ? (
            /* Results View */
            <div className="space-y-6">
              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Email Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total</p>
                    <p className="font-semibold">{summary?.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sent</p>
                    <p className="font-semibold text-green-600">{summary?.sent}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Failed</p>
                    <p className="font-semibold text-red-600">{summary?.failed}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-semibold">{summary?.duration}</p>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Detailed Results</h4>
                <div className="max-h-80 overflow-y-auto border border-gray-300 rounded-md">
                  {results.map((result) => (
                    <div
                      key={result.studentId}
                      className={`flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 ${
                        result.status === 'success' ? 'bg-green-50' : 'bg-red-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getStatusIcon(result.status)}
                        <div>
                          <p className="font-medium">{result.studentName}</p>
                          {result.status === 'success' && result.sentTo && (
                            <p className="text-xs text-gray-600">
                              Sent to: {result.sentTo.join(', ')}
                            </p>
                          )}
                          {result.status === 'failed' && (
                            <p className="text-xs text-red-600">{result.error}</p>
                          )}
                        </div>
                      </div>
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          result.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {result.status === 'success' ? 'Sent' : 'Failed'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Close Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={handleClose}
                  className="px-6 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            /* Form View */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Selected Students */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UsersIcon className="h-4 w-4 inline mr-1" />
                  Selected Students ({selectedStudentIds.length})
                </label>
                <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-3 bg-gray-50">
                  {selectedStudentNames.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">
                      No students selected. Please select students from the progress reports page.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedStudentNames.map((name, index) => (
                        <span
                          key={index}
                          className="group px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1 hover:bg-blue-200 transition-colors"
                        >
                          {name}
                          <button
                            type="button"
                            onClick={() => handleRemoveStudent(index)}
                            className="ml-1 p-0.5 rounded-full hover:bg-blue-300 transition-colors group-hover:opacity-100 opacity-70"
                            title={`Remove ${name}`}
                          >
                            <XMarkIcon className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {selectedStudentNames.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Click the ✕ next to a student&apos;s name to remove them from the email list.
                  </p>
                )}
              </div>

              {/* Individual Parent Emails Notice */}
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Each student will be emailed individually to their parent email addresses. 
                  Students without parent emails will be skipped.
                </p>
              </div>

              {/* CC Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CC Recipients (Optional)
                </label>
                <input
                  type="text"
                  value={ccInput}
                  onChange={(e) => handleCcInputChange(e.target.value)}
                  placeholder="Enter CC email addresses separated by commas (e.g., admin@school.com)"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {ccAddresses.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ccAddresses.map((email, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full"
                      >
                        {email}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Custom Header */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-1" />
                  Email Subject (Shared)
                </label>
                <input
                  type="text"
                  value={customHeader}
                  onChange={(e) => setCustomHeader(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This subject will be used for all emails (individual student names will be added automatically)
                </p>
              </div>

              {/* Custom Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message (Optional)
                </label>
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Default email message:</strong>
                  </p>
                  <p className="text-sm text-blue-700 italic">
                    &quot;Dear Parent/Guardian, Please find attached the progress report for [Student Name] for {term}. If you have any questions about your child&apos;s progress, please don&apos;t hesitate to contact us.&quot;
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Would you like to add a shared custom message for all emails?
                  </p>
                </div>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add your shared custom message here (optional)..."
                />
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedStudentIds.length === 0}
                  className={`px-6 py-2 text-sm font-medium text-white rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed ${
                    loading || selectedStudentIds.length === 0
                      ? 'bg-gray-400'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 animate-spin" />
                      Sending Emails...
                    </div>
                  ) : (
                    `Send ${selectedStudentIds.length} Email${selectedStudentIds.length !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Modal>
  );
}