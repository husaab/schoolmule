'use client';

// One payment request, for the office: how far along it is, and each
// student's payment. From here: open a family's payment (record cash, waive,
// refund), remind everyone still owing, send it to more students, take a
// student off (before they paid), edit the request, or delete it (before
// anyone paid). Every action asks first, inside the modal.

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ClipboardDocumentListIcon, EnvelopeIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/shared/modal';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit';
import { useNotificationStore } from '@/store/useNotificationStore';
import {
  addPaymentRequestStudents, deletePaymentRequest, getPaymentRequest, getPaymentsRoster, remindPaymentRequest, removePaymentRequestCharge,
} from '@/services/paymentsService';
import type { PaymentRequestCharge, PaymentRequestDetail, PaymentRequestTarget, PaymentsRoster } from '@/services/types/payments';
import { dueStatus, emptyTarget, formatDay, gradeLabel, perStudentLabel, settledPercent, targetIsEmpty } from '@/lib/paymentRequests';
import { formatCents } from '@/lib/paymentField';
import { errorMessage } from '@/components/finance/format';
import PaymentChip from './PaymentChip';
import ChargeDetailModal from './ChargeDetailModal';
import AudiencePicker from './AudiencePicker';
import PaymentRequestEditor from './PaymentRequestEditor';

interface Props {
  requestId: string | null;
  online: boolean;
  onClose: () => void;
  /** After any change (or a delete), so the list can reload. */
  onChanged: () => void;
  /** The school uses tax: a family's payment without any says "Untaxed". */
  taxContext?: boolean;
}

type Panel = null | 'remind' | 'add' | 'delete' | { remove: PaymentRequestCharge };

const DUE_TONE = { neutral: 'text-slate-600', soon: 'text-amber-700', overdue: 'text-rose-700' } as const;
const isOpenStatus = (s: string) => s === 'unpaid' || s === 'partially_paid';

export default function PaymentRequestDetailModal({ requestId, online, onClose, onChanged, taxContext = false }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);
  const [request, setRequest] = useState<PaymentRequestDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openCharge, setOpenCharge] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [roster, setRoster] = useState<PaymentsRoster | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);
  const [target, setTarget] = useState<Required<PaymentRequestTarget>>(emptyTarget());

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoadError(null);
    try {
      const res = await getPaymentRequest(requestId);
      setRequest(res.data);
    } catch (err) {
      setLoadError(errorMessage(err, 'Could not load this request'));
    }
  }, [requestId]);

  useEffect(() => {
    setRequest(null);
    setPanel(null);
    load();
  }, [load]);

  const open = (next: Panel) => {
    setError(null);
    if (next === 'add') {
      setTarget(emptyTarget());
      if (!roster) getPaymentsRoster().then((r) => setRoster(r.data)).catch((err) => setRosterError(errorMessage(err, 'Could not load your students')));
    }
    setPanel(next);
  };

  const run = async (action: () => Promise<{ data: PaymentRequestDetail }>, done: (r: PaymentRequestDetail) => string) => {
    setBusy(true);
    setError(null);
    try {
      const res = await action();
      setRequest(res.data);
      setPanel(null);
      onChanged();
      showNotification(done(res.data), 'success');
    } catch (err) {
      setError(errorMessage(err, 'That didn’t work'));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!request || !panel) return;
    if (panel === 'remind') {
      return run(() => remindPaymentRequest(request.requestId), (r) => `Reminder emailed to ${r.result?.reminded ?? 0} ${r.result?.reminded === 1 ? 'family' : 'families'}`);
    }
    if (panel === 'add') {
      if (targetIsEmpty(target)) return setError('Choose a grade, a class or students.');
      return run(() => addPaymentRequestStudents(request.requestId, target), (r) => (r.result?.added ? `Sent to ${r.result.added} more ${r.result.added === 1 ? 'student' : 'students'}` : 'Everyone was on it already'));
    }
    if (panel === 'delete') {
      setBusy(true);
      setError(null);
      try {
        await deletePaymentRequest(request.requestId);
        showNotification('Request deleted', 'success');
        onChanged();
        onClose();
      } catch (err) {
        setError(errorMessage(err, 'Could not delete the request'));
      } finally {
        setBusy(false);
      }
      return;
    }
    const { remove } = panel;
    return run(() => removePaymentRequestCharge(request.requestId, remove.chargeId), () => `${remove.studentName || 'Student'} taken off the request`);
  };

  const onRequest = useMemo(() => new Set((request?.charges || []).map((c) => c.studentId).filter((id): id is string => Boolean(id))), [request]);
  const owing = (request?.charges || []).filter((c) => isOpenStatus(c.status));
  const reachable = owing.filter((c) => c.guardianEmails.length > 0 || c.payerEmail);
  const anyPaid = Boolean(request && (request.stats.settled > 0 || request.stats.collectedCents > 0));
  const due = request ? dueStatus(request.dueDate) : null;
  const pct = request ? settledPercent(request.stats) : 0;

  const panelTitle = panel === 'remind' ? 'Remind families still owing'
    : panel === 'add' ? 'Send to more students'
      : panel === 'delete' ? 'Delete this request'
        : panel ? `Take ${panel.remove.studentName || 'this student'} off the request` : '';

  return (
    <>
      <Modal isOpen={Boolean(requestId)} onClose={busy ? () => {} : onClose} closeOnEscape={!busy && !panel} size="4xl" ariaLabel="Payment request">
        <ModalHeader
          title={request?.title || 'Payment request'}
          subtitle={request ? `${perStudentLabel(request)}${request.dueDate ? ` · due ${formatDay(request.dueDate)}` : ''}${request.createdByName ? ` · sent by ${request.createdByName}` : ''}` : undefined}
          icon={ClipboardDocumentListIcon}
          actions={request && !panel ? <Button variant="secondary" onClick={() => setEditing(true)}>Edit</Button> : null}
        />
        <ModalBody>
          {!request && !loadError && <div className="flex justify-center py-10"><div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" /></div>}
          {loadError && <p role="alert" className="text-sm text-rose-600">{loadError}</p>}

          {request && (
            <>
              <div>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-slate-900">{request.stats.settled} of {request.stats.students} settled</span>
                  {due && request.stats.open > 0 && <span className={`text-xs font-medium ${DUE_TONE[due.tone]}`}>{due.label}</span>}
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Families settled">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500" style={{ width: `${pct}%` }} />
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ['Asked for', request.stats.expectedCents],
                  ['Collected', request.stats.collectedCents],
                  ['Still owed', request.stats.outstandingCents],
                  ['Waived', request.stats.waivedCents],
                ].map(([label, cents]) => (
                  <div key={label as string} className="rounded-xl bg-slate-50 px-3 py-2">
                    <dt className="text-xs text-slate-500">{label}</dt>
                    <dd className="text-sm font-semibold tabular-nums text-slate-900">{formatCents(cents as number)}</dd>
                  </div>
                ))}
              </dl>

              {request.description && <p className="whitespace-pre-line rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-600">{request.description}</p>}

              {panel && (
                <section className="space-y-3 rounded-xl border border-cyan-100 bg-cyan-50/40 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">{panelTitle}</h3>
                  {panel === 'remind' && (
                    <p className="text-sm text-slate-600">
                      {reachable.length === 0
                        ? 'Nobody still owing has an email on file.'
                        : `${reachable.length} ${reachable.length === 1 ? 'family gets' : 'families get'} an email with a button to pay what is left.`}
                      {owing.length > reachable.length && ` ${owing.length - reachable.length} with no email won’t hear from you.`}
                    </p>
                  )}
                  {panel === 'add' && <AudiencePicker roster={roster} rosterError={rosterError} target={target} onChange={setTarget} alreadyOn={onRequest} />}
                  {panel === 'delete' && (
                    <p className="text-sm text-slate-600">
                      The request and every family’s payment page go. Families who were emailed will find the link no longer works.
                    </p>
                  )}
                  {typeof panel === 'object' && panel && (
                    <p className="text-sm text-slate-600">Their payment page goes, and they won’t be reminded. Nothing has been paid on it.</p>
                  )}
                  {error && <p role="alert" className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
                  <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={() => setPanel(null)} disabled={busy}>Cancel</Button>
                    <Button
                      variant={panel === 'delete' || typeof panel === 'object' ? 'danger' : 'primary'}
                      onClick={confirm}
                      loading={busy}
                      disabled={panel === 'remind' && reachable.length === 0}
                    >
                      {panel === 'remind' ? 'Send reminders' : panel === 'add' ? 'Send' : panel === 'delete' ? 'Delete request' : 'Take off'}
                    </Button>
                  </div>
                </section>
              )}

              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Families</h3>
                {request.charges.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-500">Nobody is on this request. Send it to a grade, a class or students.</p>
                ) : (
                  <div className="mt-2 overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm tabular-nums">
                      <thead>
                        <tr className="whitespace-nowrap border-b border-slate-100 bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                          <th className="px-4 py-2.5">Student</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Paid</th>
                          <th className="px-4 py-2.5 text-right">Still owed</th>
                          <th className="px-4 py-2.5">Emailed to</th>
                          <th className="px-4 py-2.5"><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {request.charges.map((c) => {
                          const untouched = c.status === 'unpaid' && c.amountPaidCents === 0;
                          const emails = c.payerEmail ? [c.payerEmail] : c.guardianEmails;
                          return (
                            <tr key={c.chargeId} className="border-b border-slate-50 last:border-0 hover:bg-cyan-50/30">
                              <td className="whitespace-nowrap px-4 py-2.5">
                                <button type="button" onClick={() => setOpenCharge(c.chargeId)} className="text-left font-medium text-slate-900 hover:text-cyan-700 hover:underline">
                                  {c.studentName || 'Student'}
                                </button>
                                <div className="text-xs text-slate-500">{gradeLabel(c.studentGrade)}</div>
                              </td>
                              <td className="px-4 py-2.5"><PaymentChip status={c.status} offline={false} disputeStatus={c.disputeStatus} /></td>
                              <td className="px-4 py-2.5 text-right text-slate-700">{c.amountPaidCents ? formatCents(c.amountPaidCents) : ''}</td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-right text-slate-900">{c.balanceCents ? formatCents(c.balanceCents) : ''}</td>
                              <td className="max-w-[220px] px-4 py-2.5 text-xs text-slate-500">
                                {emails.length > 0 ? (
                                  <span className="flex items-center gap-1 truncate" title={emails.join(', ')}>
                                    <EnvelopeIcon className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{emails.join(', ')}</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-amber-700"><ExclamationTriangleIcon className="h-3.5 w-3.5" /> No email on file</span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-4 py-2.5 text-right">
                                {untouched && !panel && (
                                  <button type="button" onClick={() => open({ remove: c })} className="rounded-lg px-2 py-1 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-700">
                                    Take off
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}
        </ModalBody>
        {request && !panel && (
          <ModalFooter>
            <div className="flex w-full flex-wrap justify-end gap-2">
              {!anyPaid && <Button variant="secondary" onClick={() => open('delete')} className="sm:mr-auto">Delete</Button>}
              <Button variant="secondary" onClick={() => open('add')}>Send to more students</Button>
              {owing.length > 0 && <Button onClick={() => open('remind')}>Remind {owing.length} still owing</Button>}
              {owing.length === 0 && <Button variant="secondary" onClick={onClose}>Close</Button>}
            </div>
          </ModalFooter>
        )}
      </Modal>

      <ChargeDetailModal chargeId={openCharge} onClose={() => setOpenCharge(null)} onChanged={() => { load(); onChanged(); }} taxContext={taxContext || Boolean(request?.taxRateId)} />
      <PaymentRequestEditor
        isOpen={editing}
        request={request}
        online={online}
        onClose={() => setEditing(false)}
        onSaved={(r) => { setRequest(r); setEditing(false); onChanged(); showNotification('Request saved', 'success'); }}
      />
    </>
  );
}
