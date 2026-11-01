// src/components/reports/email/BulkEmailReportModal.tsx
// Emails a term's reports (progress reports or report cards, per `doc`) to
// many families at once; each gets their own child's PDF. The send is queued
// on the server and keeps going if this window closes.
'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/shared/modal';
import ReportEmailProgress from '@/components/report-emails/ReportEmailProgress';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { Button, Field, FormSection, ModalBody, ModalFooter, ModalHeader, RecordFacts, inputClass, textareaClass } from '@/components/shared/modalKit';
import { sendBulkReportEmails, listReportEmailRuns, generateDefaultSubject, generateDefaultMessage, resolveMessagePreview } from '@/services/reportEmailService';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { SendBulkReportEmailPayload, BulkReportEmailResponse, BulkReportEmailResult } from '@/services/types/reportEmails';
import { getGradeNumericValue } from '@/lib/schoolUtils';
import type { ReportDoc } from '../reportDocs';

interface ReportRecord {
  student_id?: string;
  studentId?: string;
  term?: string;
  student_name?: string;
  studentName?: string;
  grade?: string | number | null;
  file_path?: string;
  filePath?: string;
  generated_at?: string | null;
  generatedAt?: string | null;
  school?: string;
  email_sent?: boolean | null;
  email_sent_at?: string | null;
  email_sent_by?: string;
}

interface BulkEmailReportModalProps {
  doc: ReportDoc;
  isOpen: boolean;
  onClose: () => void;
  availableReports: ReportRecord[];
  term: string;
  onEmailsSent?: () => void;
  /** Students ticked when the window opens (the page's selection); none when omitted. */
  initialSelectedIds?: string[];
}

export default function BulkEmailReportModal({
  doc,
  isOpen,
  onClose,
  availableReports,
  term,
  onEmailsSent,
  initialSelectedIds
}: BulkEmailReportModalProps) {
  const showNotification = useNotificationStore((state) => state.showNotification);

  // Form state
  const [ccAddresses, setCcAddresses] = useState<string[]>([]);
  const [customHeader, setCustomHeader] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  
  // Selection state
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  // The queued send this window follows: the one just made, or one still
  // going when the window was opened (closing never stops a send).
  const [runId, setRunId] = useState<string | null>(null);
  const [resumed, setResumed] = useState(false);
  const [results, setResults] = useState<BulkReportEmailResult[] | null>(null);
  const [summary, setSummary] = useState<{ total: number; sent: number; failed: number; duration: string } | null>(null);
  
  // Input states
  const [ccInput, setCcInput] = useState('');

  // Sample student name for the live message preview (the real name is
  // substituted per recipient when each email is sent).
  const previewReport =
    availableReports.find((r) => (r.student_id || r.studentId) === selectedStudentIds[0]) ||
    availableReports[0];
  const sampleStudentName = previewReport?.student_name || previewReport?.studentName || 'the student';

  const reportsByGrade = availableReports.reduce((acc, report) => {
    const grade = report.grade ? String(report.grade) : 'Unknown';
    if (!acc[grade]) acc[grade] = [];
    acc[grade].push(report);
    return acc;
  }, {} as Record<string, ReportRecord[]>);

  const availableGrades = Object.keys(reportsByGrade).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return getGradeNumericValue(a) - getGradeNumericValue(b);
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      // Set default subject for bulk emails
      setCustomHeader(generateDefaultSubject(doc.emailSubject, doc.type, term));
      setCustomMessage(generateDefaultMessage(doc.type));
      setCcAddresses([]);
      setCcInput('');
      setResults(null);
      setSummary(null);
      setRunId(null);
      setResumed(false);
      // Start from the page's selection, limited to reports this window can send.
      const sendable = new Set(availableReports.map((r) => r.student_id || r.studentId || ''));
      setSelectedStudentIds((initialSelectedIds ?? []).filter((id) => sendable.has(id)));
    }
  }, [isOpen, term]); // eslint-disable-line react-hooks/exhaustive-deps -- seed once per open

  // A send of this term still going (the window was closed mid-send): follow it.
  useEffect(() => {
    if (!isOpen) return undefined;
    let cancelled = false;
    listReportEmailRuns({ reportType: doc.type, term, limit: 1 })
      .then((res) => {
        const latest = res.data?.[0];
        if (!cancelled && latest && latest.counts.pending > 0) {
          setRunId(latest.runId);
          setResumed(true);
        }
      })
      .catch(() => { /* nothing to resume */ });
    return () => {
      cancelled = true;
    };
  }, [isOpen, term, doc.type]);

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
    setSelectedStudentIds(prev =>
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
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
        reportType: doc.type,
        studentIds: selectedStudentIds,
        term,
        bulkConfig: {
          customHeader: customHeader.trim() || undefined,
          customMessage: customMessage.trim() || undefined,
          ccAddresses: ccAddresses.length > 0 ? ccAddresses : undefined
        }
      };

      const response: BulkReportEmailResponse = await sendBulkReportEmails(payload);

      if (response.status === 'queued') {
        // Queued: the emails go out from the server's queue now; this window follows them.
        setRunId(response.runId);
        const { queued, skipped } = response.summary;
        showNotification(
          `Sending ${queued} ${doc.noun} email${queued === 1 ? '' : 's'}${skipped ? ` · ${skipped} with nothing to send` : ''}`,
          'success'
        );
      } else if (response.status === 'completed') {
        setResults(response.results);
        setSummary(response.summary);
        
        const successCount = response.summary.sent;
        const failureCount = response.summary.failed;
        
        if (failureCount === 0) {
          showNotification(`Successfully sent ${successCount} ${doc.noun} emails`, 'success');
        } else if (successCount === 0) {
          showNotification(`Failed to send all ${failureCount} ${doc.noun} emails`, 'error');
        } else {
          showNotification(`Sent ${successCount} emails, ${failureCount} failed`, 'error');
        }

        onEmailsSent?.();
      } else {
        showNotification('Failed to send bulk emails', 'error');
      }
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      showNotification(`Failed to send bulk ${doc.noun} emails`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const selectedCount = selectedStudentIds.length;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} closeOnEscape={!loading} style="w-full max-w-3xl">
      <ModalHeader
        title="Email families"
        subtitle={`${term} ${doc.nouns}. Each family gets their own child's ${doc.noun}.`}
        icon={EnvelopeIcon}
      />

      {runId ? (
        <>
          <ModalBody>
            {resumed && (
              <p className="rounded-xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm text-cyan-900">
                A send for {term} is still going. It keeps going if you close this window.
              </p>
            )}
            <ReportEmailProgress runId={runId} reportType={doc.type} onFinished={onEmailsSent} />
          </ModalBody>
          <ModalFooter>
            {resumed && (
              <Button variant="secondary" onClick={() => { setRunId(null); setResumed(false); }}>
                New send
              </Button>
            )}
            <Button variant="secondary" onClick={handleClose}>Close</Button>
          </ModalFooter>
        </>
      ) : results ? (
        <>
          <ModalBody>
            <RecordFacts
              facts={[
                { label: 'Sent', value: <span className="text-emerald-700">{summary?.sent}</span> },
                { label: 'Failed', value: <span className={summary?.failed ? 'text-rose-700' : ''}>{summary?.failed}</span> },
                { label: 'Total', value: summary?.total },
                { label: 'Took', value: summary?.duration },
              ]}
            />
            <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
              {results.map((result) => (
                <li key={result.studentId} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{result.studentName}</p>
                    {result.status === 'success' && result.sentTo && (
                      <p className="mt-0.5 truncate text-xs text-slate-500">To {result.sentTo.join(', ')}</p>
                    )}
                    {result.status === 'failed' && <p className="mt-0.5 text-xs text-rose-700">{result.error}</p>}
                  </div>
                  <span className={result.status === 'success' ? 'text-emerald-700' : 'text-rose-700'}>
                    {result.status === 'success' ? 'Sent' : 'Failed'}
                  </span>
                </li>
              ))}
            </ul>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={handleClose}>Close</Button>
          </ModalFooter>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <FormSection label="Families">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-slate-600">
                  <span className="font-medium text-slate-900">{selectedCount}</span> of {availableReports.length} selected
                </p>
                <div className="flex gap-1.5">
                  <button type="button" onClick={handleSelectAll} className="cursor-pointer rounded-lg px-2.5 py-1 text-sm font-medium text-cyan-700 hover:bg-cyan-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500">
                    Select all
                  </button>
                  <button type="button" onClick={handleDeselectAll} disabled={selectedCount === 0} className="cursor-pointer rounded-lg px-2.5 py-1 text-sm text-slate-600 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50">
                    Clear
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-2" role="group" aria-label="Select a whole grade">
                {availableGrades.map(grade => {
                  const gradeStudentIds = (reportsByGrade[grade] || []).map(r => r.student_id || r.studentId || '');
                  const selectedInGrade = gradeStudentIds.filter(id => selectedStudentIds.includes(id)).length;
                  const allSelected = selectedInGrade === gradeStudentIds.length && gradeStudentIds.length > 0;
                  return (
                    <button
                      key={grade}
                      type="button"
                      aria-pressed={allSelected}
                      onClick={() => handleGradeToggle(grade)}
                      className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                        allSelected
                          ? 'border-cyan-200 bg-cyan-50 font-medium text-cyan-800'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {grade === 'Unknown' ? 'No grade' : `Grade ${grade}`}
                      <span className="ml-1.5 text-xs tabular-nums text-slate-400">{selectedInGrade}/{gradeStudentIds.length}</span>
                    </button>
                  );
                })}
              </div>

              <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-100">
                {availableGrades.length === 0 ? (
                  <p className="p-4 text-center text-sm text-slate-500">Every report this term has already been emailed.</p>
                ) : (
                  availableGrades.map(grade => (
                    <div key={grade}>
                      <p className="sticky top-0 bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-500">
                        {grade === 'Unknown' ? 'No grade' : `Grade ${grade}`}
                      </p>
                      {(reportsByGrade[grade] || []).map(report => {
                        const studentId = report.student_id || report.studentId || '';
                        const studentName = report.student_name || report.studentName || '';
                        return (
                          <label key={studentId} className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50">
                            <input
                              type="checkbox"
                              checked={selectedStudentIds.includes(studentId)}
                              onChange={() => handleStudentToggle(studentId)}
                              className="h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                            />
                            {studentName}
                          </label>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-500">Each email goes to that student&apos;s parent addresses. Students with no parent email are skipped.</p>
            </FormSection>

            <FormSection label="Email">
              <Field label="CC" htmlFor="pr-bulk-cc" hint="Optional, e.g. the office. Separate addresses with commas.">
                <input
                  id="pr-bulk-cc"
                  type="text"
                  value={ccInput}
                  onChange={(e) => handleCcInputChange(e.target.value)}
                  placeholder="Optional"
                  className={inputClass}
                />
              </Field>
              <Field label="Subject" htmlFor="pr-bulk-subject" hint="Each family's subject carries their child's name.">
                <input
                  id="pr-bulk-subject"
                  type="text"
                  value={customHeader}
                  onChange={(e) => setCustomHeader(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Message" htmlFor="pr-bulk-message" hint="[Student Name] and [Term] are filled in for each family.">
                <textarea
                  id="pr-bulk-message"
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={5}
                  className={textareaClass}
                  placeholder="Write the email body parents will see..."
                />
              </Field>
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                <p className="text-xs font-medium text-slate-500">What {sampleStudentName}&apos;s family reads</p>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-700">
                  {resolveMessagePreview(customMessage, { studentName: sampleStudentName, term })}
                </p>
              </div>
            </FormSection>
          </ModalBody>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button type="submit" loading={loading} disabled={selectedCount === 0}>
              {loading ? 'Sending' : `Send ${selectedCount} email${selectedCount !== 1 ? 's' : ''}`}
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
}