// src/components/reports/email/SentEmailReportModal.tsx
// What went to a family for one report (progress report or report card): who sent it and when, every
// address, the subject and the message. "Email again" re-sends from here (a
// regenerated report, a new parent address, a family that lost the email).
'use client';

import React, { useEffect, useState } from 'react';
import { CheckIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/shared/modal';
import { Button, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit';
import { getStudentEmailHistory } from '@/services/reportEmailService';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { ReportEmailRecord } from '@/services/types/reportEmails';
import type { ReportDoc } from '../reportDocs';

interface SentEmailReportModalProps {
  doc: ReportDoc;
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  studentName: string;
  term: string;
  /** Opens the send form for this student again. */
  onEmailAgain?: () => void;
}

const sentDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const sentDateTime = (iso: string) =>
  new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

export default function SentEmailReportModal({
  doc,
  isOpen,
  onClose,
  studentId,
  studentName,
  term,
  onEmailAgain,
}: SentEmailReportModalProps) {
  const [emailRecord, setEmailRecord] = useState<ReportEmailRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const showNotification = useNotificationStore((state) => state.showNotification);

  useEffect(() => {
    if (!isOpen || !studentId) return;
    // The page mounts this window fresh for each row, so it starts loading with nothing shown.
    let cancelled = false;
    getStudentEmailHistory(studentId)
      .then((response) => {
        if (cancelled || response.status !== 'success') return;
        // The newest send of this term's report.
        const record = response.data.find(
          (email) => email.reportType.toLowerCase() === doc.type && email.term === term
        );
        setEmailRecord(record ?? null);
      })
      .catch((error) => {
        console.error('Error fetching email record:', error);
        if (!cancelled) showNotification('Failed to load email details', 'error');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, studentId, term, doc.type, showNotification]);

  const title = emailRecord ? `Emailed ${sentDate(emailRecord.sentAt)}` : 'Email details';

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnEscape style="w-full max-w-lg">
      <ModalHeader
        title={title}
        subtitle={`${studentName}'s ${term} ${doc.noun}`}
        icon={emailRecord ? CheckIcon : EnvelopeIcon}
        tone={emailRecord ? 'success' : 'brand'}
      />
      <ModalBody>
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-8 text-sm text-slate-500">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-100 border-t-emerald-600" aria-hidden="true" />
            Loading what was sent…
          </div>
        ) : emailRecord ? (
          <>
            <RecordFacts
              facts={[
                { label: 'Sent by', value: emailRecord.sentByUsername || 'Someone at the school' },
                { label: 'Sent', value: sentDateTime(emailRecord.sentAt) },
              ]}
            />
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-medium text-slate-500">To</dt>
                <dd className="mt-0.5 break-words text-slate-800">{emailRecord.emailAddresses.join(', ')}</dd>
              </div>
              {emailRecord.ccAddresses && emailRecord.ccAddresses.length > 0 && (
                <div>
                  <dt className="text-xs font-medium text-slate-500">CC</dt>
                  <dd className="mt-0.5 break-words text-slate-800">{emailRecord.ccAddresses.join(', ')}</dd>
                </div>
              )}
              {emailRecord.customHeader && (
                <div>
                  <dt className="text-xs font-medium text-slate-500">Subject</dt>
                  <dd className="mt-0.5 text-slate-800">{emailRecord.customHeader}</dd>
                </div>
              )}
              {emailRecord.customMessage && (
                <div>
                  <dt className="text-xs font-medium text-slate-500">Message</dt>
                  <dd className="mt-0.5 whitespace-pre-wrap leading-relaxed text-slate-700">{emailRecord.customMessage}</dd>
                </div>
              )}
            </dl>
          </>
        ) : (
          <p className="py-6 text-center text-sm text-slate-500">
            This report is marked as emailed, but there&apos;s no record of what was sent. You can email the family again.
          </p>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Close</Button>
        {onEmailAgain && !loading && (
          <Button variant="primary" onClick={onEmailAgain}>
            Email again
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
}
