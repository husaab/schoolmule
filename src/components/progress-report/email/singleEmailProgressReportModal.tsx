'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import { EnvelopeIcon, PaperAirplaneIcon, UserIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { sendReportEmail, generateDefaultSubject, validateEmailAddresses } from '@/services/reportEmailService';
import { getStudentById } from '@/services/studentService';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { SendReportEmailPayload } from '@/services/types/reportEmails';
import type { StudentPayload } from '@/services/types/student';

interface SingleEmailProgressReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  term: string;
  onEmailSent?: () => void;
}

export default function SingleEmailProgressReportModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  term,
  onEmailSent
}: SingleEmailProgressReportModalProps) {
  const showNotification = useNotificationStore((state) => state.showNotification);

  // Form state
  const [emailAddresses, setEmailAddresses] = useState<string[]>([]);
  const [ccAddresses, setCcAddresses] = useState<string[]>([]);
  const [customHeader, setCustomHeader] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [fetchingStudent, setFetchingStudent] = useState(true);
  const [student, setStudent] = useState<StudentPayload | null>(null);
  
  // Input states for email editing
  const [emailInput, setEmailInput] = useState('');
  const [ccInput, setCcInput] = useState('');

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const fetchStudentData = async () => {
    try {
      setFetchingStudent(true);
      const response = await getStudentById(studentId);
      
      if (response.status === 'success') {
        setStudent(response.data);
        
        // Pre-populate parent emails
        const parentEmails = [];
        if (response.data.mother?.email) {
          parentEmails.push(response.data.mother.email);
        }
        if (response.data.father?.email) {
          parentEmails.push(response.data.father.email);
        }
        
        setEmailAddresses(parentEmails);
        setEmailInput(parentEmails.join(', '));
        
        // Set default subject
        setCustomHeader(generateDefaultSubject(studentName, 'progress_report', term));
        
        // Set default message
        setCustomMessage('');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      showNotification('Failed to load student information', 'error');
    } finally {
      setFetchingStudent(false);
    }
  };

    // Fetch student data when modal opens
  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentData();
    }
  }, [isOpen, studentId, fetchStudentData]);

  const resetForm = () => {
    setEmailAddresses([]);
    setCcAddresses([]);
    setCustomHeader('');
    setCustomMessage('');
    setEmailInput('');
    setCcInput('');
    setStudent(null);
  };

  const handleEmailInputChange = (value: string) => {
    setEmailInput(value);
    // Parse emails from comma-separated input
    const emails = value
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    setEmailAddresses(emails);
  };

  const handleCcInputChange = (value: string) => {
    setCcInput(value);
    // Parse CC emails from comma-separated input
    const emails = value
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0);
    setCcAddresses(emails);
  };

  const validateForm = () => {
    if (emailAddresses.length === 0) {
      showNotification('Please enter at least one email address', 'error');
      return false;
    }

    const { invalid } = validateEmailAddresses(emailAddresses);
    if (invalid.length > 0) {
      showNotification(`Invalid email addresses: ${invalid.join(', ')}`, 'error');
      return false;
    }

    if (ccAddresses.length > 0) {
      const { invalid: invalidCc } = validateEmailAddresses(ccAddresses);
      if (invalidCc.length > 0) {
        showNotification(`Invalid CC email addresses: ${invalidCc.join(', ')}`, 'error');
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

      const payload: SendReportEmailPayload = {
        reportType: 'progress_report',
        studentId,
        term,
        emailAddresses,
        ccAddresses: ccAddresses.length > 0 ? ccAddresses : undefined,
        customHeader: customHeader.trim() || undefined,
        customMessage: customMessage.trim() || undefined
      };

      const response = await sendReportEmail(payload);

      if (response.status === 'success') {
        showNotification(`Progress report email sent successfully to ${emailAddresses.length} recipient${emailAddresses.length > 1 ? 's' : ''}`, 'success');
        onEmailSent?.();
        onClose();
      } else {
        showNotification(response.message || 'Failed to send email', 'error');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      showNotification('Failed to send progress report email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="max-w-2xl w-11/12">
      <div className="p-9">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="p-2 bg-blue-100 rounded-lg">
            <PaperAirplaneIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Send Progress Report
            </h3>
            <p className="text-sm text-gray-600">
              Email progress report for {studentName} - {term}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="text-black">
          {fetchingStudent ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading student information...</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student Info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Student</p>
                  <p className="text-sm text-gray-900">{studentName}</p>
                  <p className="text-xs text-gray-500">Grade {student?.grade} - {term}</p>
                </div>
              </div>

              {/* Email Recipients */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                  Email Recipients *
                </label>
                <input
                  type="text"
                  value={emailInput}
                  onChange={(e) => handleEmailInputChange(e.target.value)}
                  placeholder="Enter email addresses separated by commas"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Separate multiple email addresses with commas
                </p>
                {emailAddresses.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {emailAddresses.map((email, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {email}
                      </span>
                    ))}
                  </div>
                )}
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
                  placeholder="Enter CC email addresses separated by commas"
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
                  Email Subject
                </label>
                <input
                  type="text"
                  value={customHeader}
                  onChange={(e) => setCustomHeader(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
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
                    &quot;Dear Parent/Guardian, Please find attached the progress report for {studentName} for {term}. If you have any questions about your child&apos;s progress, please don&apos;t hesitate to contact us.&quot;
                  </p>
                  <p className="text-xs text-blue-600 mt-2">
                    Would you like to add a custom message in addition to the default text?
                  </p>
                </div>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add your custom message here (optional)..."
                />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Before sending:</p>
                  <p className="text-yellow-700">
                    Please ensure the progress report has been generated and the email addresses are correct.
                  </p>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || emailAddresses.length === 0}
                  className={`px-6 py-2 text-sm font-medium text-white rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed ${
                    loading || emailAddresses.length === 0
                      ? 'bg-gray-400'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending...
                    </div>
                  ) : (
                    `Send Email${emailAddresses.length > 1 ? ` (${emailAddresses.length})` : ''}`
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