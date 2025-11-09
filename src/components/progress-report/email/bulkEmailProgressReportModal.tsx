'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import { PaperAirplaneIcon, UsersIcon, ChatBubbleLeftRightIcon, CheckCircleIcon, XCircleIcon, ClockIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { sendBulkReportEmails, generateDefaultSubject } from '@/services/reportEmailService';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { SendBulkReportEmailPayload, BulkReportEmailResponse, BulkReportEmailResult } from '@/services/types/reportEmails';
import { getGradeNumericValue } from '@/lib/schoolUtils';

interface ProgressReportRecord {
  student_id?: string;
  studentId?: string;
  term: string;
  student_name?: string;
  studentName?: string;
  grade?: string;
  file_path?: string;
  filePath?: string;
  generated_at?: string;
  generatedAt?: string;
  school?: string;
  email_sent?: boolean;
  email_sent_at?: string;
  email_sent_by?: string;
}

interface BulkEmailProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableReports: ProgressReportRecord[];
  term: string;
  onEmailsSent?: () => void;
}

export default function BulkEmailProgressReportModal({
  isOpen,
  onClose,
  availableReports,
  term,
  onEmailsSent
}: BulkEmailProgressReportModalProps) {
  const showNotification = useNotificationStore((state) => state.showNotification);

  // Form state
  const [ccAddresses, setCcAddresses] = useState<string[]>([]);
  const [customHeader, setCustomHeader] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  
  // Selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BulkReportEmailResult[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; sent: number; failed: number; duration: string } | null>(null);
  
  // Input states
  const [ccInput, setCcInput] = useState('');

  const reportsByGrade = availableReports.reduce((acc, report) => {
    const grade = report.grade || 'Unknown';
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(report);
    return acc;
  }, {} as Record<string, ProgressReportRecord[]>);

  const availableGrades = Object.keys(reportsByGrade).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return getGradeNumericValue(a) - getGradeNumericValue(b);
  });

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
      // Reset selections
      setSelectedStudentIds([]);
    }
  }, [isOpen, term]);

  const handleCcInputChange = (value: string) => {
    setCcInput(value);
    // Parse CC emails from comma-separated input
    const emails = value
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    setCcAddresses(emails);
  };

  // Selection handlers
  const handleGradeToggle = (grade: string) => {
    const gradeReports = reportsByGrade[grade] || [];
    const gradeStudentIds = gradeReports.map(r => r.student_id || r.studentId || '');
    
    const allSelected = gradeStudentIds.every(id => selectedStudentIds.includes(id));
    
    if (allSelected) {
      // Deselect all students in this grade
      setSelectedStudentIds(prev => prev.filter(id => !gradeStudentIds.includes(id)));
    } else {
      // Select all students in this grade
      setSelectedStudentIds(prev => [...new Set([...prev, ...gradeStudentIds])]);
    }
  };

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudentIds(prev => {
      const newSelected = prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId];
      
      // Update selected grades based on student selection
      const newSelectedGrades = [];
      for (const grade of availableGrades) {
        const gradeReports = reportsByGrade[grade] || [];
        const gradeStudentIds = gradeReports.map(r => r.student_id || r.studentId || '');
        const allSelected = gradeStudentIds.every(id => newSelected.includes(id));
        
        if (allSelected && gradeStudentIds.length > 0) {
          newSelectedGrades.push(grade);
        }
      }
      
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    const allStudentIds = availableReports.map(r => r.student_id || r.studentId || '');
    setSelectedStudentIds(allStudentIds);
  };

  const handleDeselectAll = () => {
    setSelectedStudentIds([]);
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
              Select students to email progress reports for {term}
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
              {/* Grade-Based Selection */}
              <div className="space-y-4">
                {/* Grade Selection Header */}
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    <FunnelIcon className="h-4 w-4 inline mr-1" />
                    Select by Grade
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {/* Grade Checkboxes */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableGrades.map(grade => {
                    const gradeReports = reportsByGrade[grade] || [];
                    const gradeStudentIds = gradeReports.map(r => r.student_id || r.studentId || '');
                    const selectedInGrade = gradeStudentIds.filter(id => selectedStudentIds.includes(id)).length;
                    const allSelected = selectedInGrade === gradeStudentIds.length && gradeStudentIds.length > 0;
                    
                    return (
                      <label
                        key={grade}
                        className="flex items-center p-2 rounded border border-gray-200 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => handleGradeToggle(grade)}
                          className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm">
                          Grade {grade} ({selectedInGrade}/{gradeStudentIds.length})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Student Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UsersIcon className="h-4 w-4 inline mr-1" />
                  Students ({selectedStudentIds.length} selected)
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md">
                  {availableGrades.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No progress reports available for bulk email
                    </div>
                  ) : (
                    availableGrades.map(grade => {
                      const gradeReports = reportsByGrade[grade] || [];
                      const selectedInGrade = gradeReports.filter(r => 
                        selectedStudentIds.includes(r.student_id || r.studentId || '')
                      ).length;

                      return (
                        <div key={grade} className="border-b border-gray-100 last:border-b-0">
                          <div className="p-3 bg-gray-50 font-medium text-sm text-gray-700">
                            Grade {grade} ({selectedInGrade}/{gradeReports.length} selected)
                          </div>
                          <div className="p-3 space-y-2">
                            {gradeReports.map(report => {
                              const studentId = report.student_id || report.studentId || '';
                              const studentName = report.student_name || report.studentName || '';
                              const isSelected = selectedStudentIds.includes(studentId);

                              return (
                                <label
                                  key={studentId}
                                  className="flex items-center p-2 rounded hover:bg-gray-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleStudentToggle(studentId)}
                                    className="mr-3 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <span className="text-sm">{studentName}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
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