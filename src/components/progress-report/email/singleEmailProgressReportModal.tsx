'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/shared/modal';
import ReportEmailProgress from '@/components/report-emails/ReportEmailProgress';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { Button, Field, ModalBody, ModalFooter, ModalHeader, inputClass, textareaClass } from '@/components/shared/modalKit';
import { sendReportEmail, generateDefaultSubject, generateDefaultMessage, resolveMessagePreview, validateEmailAddresses } from '@/services/reportEmailService';
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
  // The queued send this window follows once Send is pressed.
  const [runId, setRunId] = useState<string | null>(null);
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

  const fetchStudentData = useCallback(async () => {
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
        setCustomMessage(generateDefaultMessage('progress_report'));
      }
    } catch (error) {
      console.error('Error fetching student data:', error);
      showNotification('Failed to load student information', 'error');
    } finally {
      setFetchingStudent(false);
    }
  }, [studentId, studentName, term, showNotification]);

    // Fetch student data when modal opens
  useEffect(() => {
    if (isOpen && studentId) {
      fetchStudentData();
    }
  }, [isOpen, studentId, fetchStudentData]);

  const resetForm = () => {
    setRunId(null);
    setEmailAddresses([]);
    setCcAddresses([]);
    setCustomHeader('');
    setCustomMessage(generateDefaultMessage('progress_report'));
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

      if (response.status === 'queued' && 'runId' in response) {
        // Queued: the email goes out from the server's queue at once; this window follows it.
        setRunId(response.runId);
      } else if (response.status === 'success') {
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

  const sendLabel = `Send email${emailAddresses.length > 1 ? ` to ${emailAddresses.length}` : ''}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnEscape={!loading} style="w-full max-w-xl">
      <ModalHeader
        title={`Email ${studentName}'s family`}
        subtitle={`${term} progress report, attached as a PDF${student?.grade ? ` · Grade ${student.grade}` : ''}`}
        icon={EnvelopeIcon}
      />

      {runId ? (
        <>
          <ModalBody>
            <ReportEmailProgress runId={runId} reportType="progress_report" onFinished={onEmailSent} />
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </ModalFooter>
        </>
      ) : fetchingStudent ? (
        <ModalBody>
          <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-100 border-t-cyan-600" aria-hidden="true" />
            Loading the family&apos;s contacts…
          </div>
        </ModalBody>
      ) : (
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <Field label="To" htmlFor="pr-email-to" required hint="Filled in from the student's parent contacts. Separate addresses with commas.">
              <input
                id="pr-email-to"
                type="text"
                value={emailInput}
                onChange={(e) => handleEmailInputChange(e.target.value)}
                placeholder="parent@example.com"
                className={inputClass}
                required
              />
            </Field>
            {emailAddresses.length > 0 && (
              <div className="-mt-3 flex flex-wrap gap-1.5">
                {emailAddresses.map((email, index) => (
                  <span key={index} className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-700">
                    {email}
                  </span>
                ))}
              </div>
            )}

            <Field label="CC" htmlFor="pr-email-cc" hint="Optional. Separate addresses with commas.">
              <input
                id="pr-email-cc"
                type="text"
                value={ccInput}
                onChange={(e) => handleCcInputChange(e.target.value)}
                placeholder="Optional"
                className={inputClass}
              />
            </Field>

            <Field label="Subject" htmlFor="pr-email-subject">
              <input
                id="pr-email-subject"
                type="text"
                value={customHeader}
                onChange={(e) => setCustomHeader(e.target.value)}
                className={inputClass}
              />
            </Field>

            <Field label="Message" htmlFor="pr-email-message" hint="[Student Name] and [Term] are filled in when the email is sent.">
              <textarea
                id="pr-email-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
                className={textareaClass}
                placeholder="Write the email body parents will see..."
              />
            </Field>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
              <p className="text-xs font-medium text-slate-500">What the family reads</p>
              <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                {resolveMessagePreview(customMessage, { studentName, term })}
              </p>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" loading={loading} disabled={emailAddresses.length === 0}>
              {loading ? 'Sending' : sendLabel}
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}