'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import {
  PaperAirplaneIcon,
  UsersIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { emailStudentViewCertificates } from '@/services/studentViewService';
import { useNotificationStore } from '@/store/useNotificationStore';
import type {
  EvaluatedStudent,
  CertificateEmailResult,
  CertificateEmailResponse,
} from '@/services/types/studentView';

interface EmailCertificatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewId: string;
  viewName: string;
  /** Students pre-selected on the detail page; recipients default to all of them. */
  students: EvaluatedStudent[];
  onSent?: () => void;
}

export default function EmailCertificatesModal({
  isOpen,
  onClose,
  viewId,
  viewName,
  students,
  onSent,
}: EmailCertificatesModalProps) {
  const showNotification = useNotificationStore((state) => state.showNotification);

  // Form state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [ccAddresses, setCcAddresses] = useState<string[]>([]);
  const [customHeader, setCustomHeader] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CertificateEmailResult[] | null>(null);
  const [summary, setSummary] = useState<
    { total: number; sent: number; failed: number; duration: string } | null
  >(null);

  // Reset whenever the modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedStudentIds(students.map((s) => s.studentId));
      setCcInput('');
      setCcAddresses([]);
      setCustomHeader(`Congratulations — ${viewName}`);
      setCustomMessage('');
      setResults(null);
      setSummary(null);
    }
  }, [isOpen, students, viewName]);

  const handleCcInputChange = (value: string) => {
    setCcInput(value);
    setCcAddresses(
      value
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email.length > 0),
    );
  };

  const toggleStudent = (id: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const selectAll = () => setSelectedStudentIds(students.map((s) => s.studentId));
  const deselectAll = () => setSelectedStudentIds([]);

  const validateForm = () => {
    if (selectedStudentIds.length === 0) {
      showNotification('Select at least one student', 'error');
      return false;
    }
    if (ccAddresses.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalid = ccAddresses.filter((email) => !emailRegex.test(email));
      if (invalid.length > 0) {
        showNotification(`Invalid CC email addresses: ${invalid.join(', ')}`, 'error');
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

      const response: CertificateEmailResponse = await emailStudentViewCertificates(viewId, {
        studentIds: selectedStudentIds,
        customHeader: customHeader.trim() || undefined,
        customMessage: customMessage.trim() || undefined,
        ccAddresses: ccAddresses.length > 0 ? ccAddresses : undefined,
      });

      if (response.status === 'completed' && response.summary && response.results) {
        setResults(response.results);
        setSummary(response.summary);

        const { sent, failed } = response.summary;
        if (failed === 0) {
          showNotification(`Successfully sent ${sent} certificate email${sent !== 1 ? 's' : ''}`, 'success');
        } else if (sent === 0) {
          showNotification(`Failed to send all ${failed} certificate emails`, 'error');
        } else {
          showNotification(`Sent ${sent} email${sent !== 1 ? 's' : ''}, ${failed} failed`, 'error');
        }

        onSent?.();
      } else {
        showNotification('Failed to send certificate emails', 'error');
      }
    } catch (error) {
      console.error('Error sending certificate emails:', error);
      showNotification('Failed to send certificate emails', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  const statusIcon = (status: 'success' | 'failed') =>
    status === 'success' ? (
      <CheckCircleIcon className="h-4 w-4 text-green-500" />
    ) : (
      <XCircleIcon className="h-4 w-4 text-red-500" />
    );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} style="max-w-3xl w-11/12">
      <div className="p-9">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-cyan-50 rounded-lg">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <PaperAirplaneIcon className="h-6 w-6 text-cyan-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Email Certificates to Parents</h3>
            <p className="text-sm text-gray-600">
              Each student&apos;s certificate for <span className="font-medium">{viewName}</span> is
              attached and sent to their parents
            </p>
          </div>
        </div>

        <div className="text-black">
          {results && summary ? (
            /* Results view */
            <div className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Email Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total</p>
                    <p className="font-semibold">{summary.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Sent</p>
                    <p className="font-semibold text-green-600">{summary.sent}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Failed</p>
                    <p className="font-semibold text-red-600">{summary.failed}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Duration</p>
                    <p className="font-semibold">{summary.duration}</p>
                  </div>
                </div>
              </div>

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
                        {statusIcon(result.status)}
                        <div>
                          <p className="font-medium">{result.studentName}</p>
                          {result.status === 'success' && result.sentTo && (
                            <p className="text-xs text-gray-600">Sent to: {result.sentTo.join(', ')}</p>
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
            /* Form view */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Recipient selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <UsersIcon className="h-4 w-4 inline mr-1" />
                    Students ({selectedStudentIds.length} selected)
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAll}
                      className="text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200 transition-colors cursor-pointer"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md divide-y divide-gray-100">
                  {students.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No students selected</div>
                  ) : (
                    students.map((s) => (
                      <label
                        key={s.studentId}
                        className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(s.studentId)}
                            onChange={() => toggleStudent(s.studentId)}
                            className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                          />
                          <span className="text-sm">{s.studentName}</span>
                          <span className="text-xs text-gray-500">Grade {s.grade}</span>
                        </div>
                        <span className="text-xs text-gray-600">{s.displayMetric.toFixed(1)}%</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Notice */}
              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Each student is emailed individually with their own certificate
                  attached, sent to their parent email addresses. Students without a parent email are skipped.
                </p>
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
                  placeholder="Enter CC email addresses separated by commas (e.g., principal@school.com)"
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
                  Email Subject (Shared)
                </label>
                <input
                  type="text"
                  value={customHeader}
                  onChange={(e) => setCustomHeader(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to use a per-student subject (e.g. &quot;Alice Adams — {viewName}&quot;).
                </p>
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
                  placeholder="Add a shared message for all emails (optional)…"
                />
              </div>

              {/* Actions */}
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
                      : 'bg-cyan-600 hover:bg-cyan-700'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <ClockIcon className="h-4 w-4 animate-spin" />
                      Sending Emails…
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
