'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/shared/modal';
import {
  EnvelopeIcon,
  PaperAirplaneIcon,
  UserIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { emailSingleStudentViewCertificate } from '@/services/studentViewService';
import { getStudentById } from '@/services/studentService';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { StudentPayload } from '@/services/types/student';

interface SingleEmailCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewId: string;
  viewName: string;
  studentId: string;
  studentName: string;
  onSent?: () => void;
}

export default function SingleEmailCertificateModal({
  isOpen,
  onClose,
  viewId,
  viewName,
  studentId,
  studentName,
  onSent,
}: SingleEmailCertificateModalProps) {
  const showNotification = useNotificationStore((state) => state.showNotification);

  // Form state
  const [emailAddresses, setEmailAddresses] = useState<string[]>([]);
  const [ccAddresses, setCcAddresses] = useState<string[]>([]);
  const [customHeader, setCustomHeader] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // Input states for editing
  const [emailInput, setEmailInput] = useState('');
  const [ccInput, setCcInput] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [fetchingStudent, setFetchingStudent] = useState(true);
  const [student, setStudent] = useState<StudentPayload | null>(null);

  const resetForm = useCallback(() => {
    setEmailAddresses([]);
    setCcAddresses([]);
    setCustomHeader('');
    setCustomMessage('');
    setEmailInput('');
    setCcInput('');
    setStudent(null);
  }, []);

  // Reset when the modal closes
  useEffect(() => {
    if (!isOpen) resetForm();
  }, [isOpen, resetForm]);

  const fetchStudentData = useCallback(async () => {
    try {
      setFetchingStudent(true);
      const response = await getStudentById(studentId);

      if (response.status === 'success') {
        setStudent(response.data);

        // Pre-populate both parent emails — edit down to one to send to a single parent.
        const parentEmails: string[] = [];
        if (response.data.mother?.email) parentEmails.push(response.data.mother.email);
        if (response.data.father?.email) parentEmails.push(response.data.father.email);

        setEmailAddresses(parentEmails);
        setEmailInput(parentEmails.join(', '));
        setCustomHeader(`Congratulations — ${viewName}`);
        setCustomMessage('');
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      showNotification('Failed to load student information', 'error');
    } finally {
      setFetchingStudent(false);
    }
  }, [studentId, viewName, showNotification]);

  // Fetch student data when the modal opens
  useEffect(() => {
    if (isOpen && studentId) fetchStudentData();
  }, [isOpen, studentId, fetchStudentData]);

  const parseEmails = (value: string) =>
    value
      .split(',')
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

  const handleEmailInputChange = (value: string) => {
    setEmailInput(value);
    setEmailAddresses(parseEmails(value));
  };

  const handleCcInputChange = (value: string) => {
    setCcInput(value);
    setCcAddresses(parseEmails(value));
  };

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (emailAddresses.length === 0) {
      showNotification('Please enter at least one email address', 'error');
      return false;
    }
    const invalid = emailAddresses.filter((email) => !emailRegex.test(email));
    if (invalid.length > 0) {
      showNotification(`Invalid email addresses: ${invalid.join(', ')}`, 'error');
      return false;
    }
    if (ccAddresses.length > 0) {
      const invalidCc = ccAddresses.filter((email) => !emailRegex.test(email));
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
      const response = await emailSingleStudentViewCertificate(viewId, studentId, {
        emailAddresses,
        ccAddresses: ccAddresses.length > 0 ? ccAddresses : undefined,
        customHeader: customHeader.trim() || undefined,
        customMessage: customMessage.trim() || undefined,
      });

      if (response.status === 'success') {
        showNotification(
          `Certificate email sent to ${emailAddresses.length} recipient${emailAddresses.length > 1 ? 's' : ''}`,
          'success',
        );
        onSent?.();
        onClose();
      } else {
        showNotification(response.message || 'Failed to send certificate email', 'error');
      }
    } catch (error) {
      console.error('Error sending certificate email:', error);
      showNotification('Failed to send certificate email', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="max-w-2xl w-11/12">
      <div className="p-9">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-cyan-50 rounded-lg">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <PaperAirplaneIcon className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Send Certificate</h3>
            <p className="text-sm text-gray-600">
              Email {studentName}&apos;s certificate for {viewName}
            </p>
          </div>
        </div>

        <div className="text-black">
          {fetchingStudent ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600"></div>
              <span className="ml-3 text-gray-600">Loading student information…</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Student info */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <UserIcon className="h-5 w-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Student</p>
                  <p className="text-sm text-gray-900">{studentName}</p>
                  <p className="text-xs text-gray-500">Grade {student?.grade}</p>
                </div>
              </div>

              {/* Recipients */}
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
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Both parents are pre-filled — remove one to send to a single parent.
                </p>
                {emailAddresses.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {emailAddresses.map((email, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-cyan-100 text-cyan-800 text-xs rounded-full"
                      >
                        {email}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* CC */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CC Recipients (Optional)
                </label>
                <input
                  type="text"
                  value={ccInput}
                  onChange={(e) => handleCcInputChange(e.target.value)}
                  placeholder="Enter CC email addresses separated by commas"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
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

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <ChatBubbleLeftRightIcon className="h-4 w-4 inline mr-1" />
                  Email Subject
                </label>
                <input
                  type="text"
                  value={customHeader}
                  onChange={(e) => setCustomHeader(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Message (Optional)
                </label>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Add a message for this email (optional)…"
                />
              </div>

              {/* Warning */}
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Before sending:</p>
                  <p className="text-yellow-700">
                    The certificate is generated on send. Please confirm the recipient address is correct.
                  </p>
                </div>
              </div>

              {/* Actions */}
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
                    loading || emailAddresses.length === 0 ? 'bg-gray-400' : 'bg-cyan-600 hover:bg-cyan-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Sending…
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
