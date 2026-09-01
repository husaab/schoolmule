'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ArrowDownTrayIcon, Cog6ToothIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/shared/modal';
import ImportSummaryBar from './ImportSummaryBar';
import ImportPreviewRowItem from './ImportPreviewRow';
import * as importService from '@/services/registrationImportService';
import { getTeachersBySchool } from '@/services/teacherService';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useUserStore } from '@/store/useUserStore';
import type { TeacherPayload } from '@/services/types/teacher';
import type {
  ImportScope,
  ImportPreviewRow,
  ImportSummary,
  ImportDecision,
} from '@/services/types/registrationImport';

interface Props {
  formId: string;
  scope: ImportScope | null;
  isOpen: boolean;
  onClose: () => void;
  onImported: () => void;
  onConfigureMapping: () => void;
}

/**
 * Shows what an import would do, lets the admin override any row, then runs it.
 *
 * The preview is advisory: execute re-derives the classification server-side, so
 * only the admin's decisions travel from here to the write.
 */
export default function ImportPreviewModal({
  formId, scope, isOpen, onClose, onImported, onConfigureMapping,
}: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);
  const user = useUserStore((s) => s.user);

  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [needsMapping, setNeedsMapping] = useState(false);
  const [rows, setRows] = useState<ImportPreviewRow[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [maxRows, setMaxRows] = useState<number | undefined>();

  // Admin overrides, sent with both the re-preview and the final execute.
  const [decisions, setDecisions] = useState<Record<string, ImportDecision>>({});
  const [matchPicks, setMatchPicks] = useState<Record<string, string>>({});

  // Optional batch side effects
  const [homeroomTeacherId, setHomeroomTeacherId] = useState('');
  const [autoEnroll, setAutoEnroll] = useState(false);
  const [teachers, setTeachers] = useState<TeacherPayload[]>([]);

  const fetchPreview = useCallback(async () => {
    if (!scope) return;
    setLoading(true);
    try {
      const res = await importService.previewImport(formId, {
        scope,
        overrides: decisions,
        overrideMatchIds: matchPicks,
      });
      setNeedsMapping(res.data.needsMapping);
      setRows(res.data.rows);
      setSummary(res.data.summary);
      setTruncated(res.data.truncated);
      setMaxRows(res.data.maxRows);
    } catch (err) {
      showNotification((err as Error).message || 'Error previewing import', 'error');
    } finally {
      setLoading(false);
    }
  }, [formId, scope, decisions, matchPicks, showNotification]);

  useEffect(() => {
    if (isOpen) fetchPreview();
  }, [isOpen, fetchPreview]);

  // Reset per-run state whenever a new import is started.
  useEffect(() => {
    if (!isOpen) {
      setDecisions({});
      setMatchPicks({});
      setHomeroomTeacherId('');
      setAutoEnroll(false);
      setRows([]);
      setSummary(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !user?.school) return;
    (async () => {
      try {
        const res = await getTeachersBySchool(user.school!);
        if (res.status === 'success') setTeachers(res.data);
      } catch {
        // A missing teacher list only disables an optional extra, so it isn't
        // worth interrupting the import with an error toast.
      }
    })();
  }, [isOpen, user?.school]);

  const handleDecision = (submissionId: string, decision: ImportDecision | null) => {
    setDecisions((prev) => {
      const next = { ...prev };
      if (decision === null) delete next[submissionId];
      else next[submissionId] = decision;
      return next;
    });
  };

  const handlePickMatch = (submissionId: string, entityId: string) => {
    setMatchPicks((prev) => ({ ...prev, [submissionId]: entityId }));
  };

  const importableCount = useMemo(
    () => (summary ? summary.create + summary.update : 0),
    [summary],
  );

  const handleRun = async () => {
    if (!scope) return;
    setRunning(true);
    try {
      const res = await importService.executeImport(formId, {
        scope,
        overrides: decisions,
        overrideMatchIds: matchPicks,
        sideEffects: {
          homeroomTeacherId: homeroomTeacherId || null,
          autoEnroll,
        },
      });

      const { created, updated, errored } = res.data.summary;
      const parts: string[] = [];
      if (created) parts.push(`${created} student${created === 1 ? '' : 's'} created`);
      if (updated) parts.push(`${updated} updated`);
      if (errored) parts.push(`${errored} blocked`);

      showNotification(parts.length ? parts.join(', ') : 'Nothing to import', errored ? 'error' : 'success');
      onImported();
      onClose();
    } catch (err) {
      showNotification((err as Error).message || 'Error importing submissions', 'error');
    } finally {
      setRunning(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import as students" size="4xl">
      <div className="flex flex-col">
        {/* Mapping not configured — nothing else in this modal is usable yet. */}
        {needsMapping && !loading && (
          <div className="px-6 py-12 text-center">
            <Cog6ToothIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-slate-700 mb-1">Set up the field mapping first</h3>
            <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
              Tell us which form questions hold the student&apos;s name, grade and contact details.
              You only have to do this once for this form.
            </p>
            <button
              onClick={() => { onClose(); onConfigureMapping(); }}
              className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors cursor-pointer"
            >
              Configure mapping
            </button>
          </div>
        )}

        {loading && (
          <div className="px-6 py-16 text-center text-slate-400">
            <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2" />
            <p className="text-sm">Checking submissions...</p>
          </div>
        )}

        {!loading && !needsMapping && summary && (
          <>
            <div className="px-6 pt-4 pb-3 space-y-3">
              <ImportSummaryBar summary={summary} />

              {truncated && (
                <div className="flex items-start gap-2 px-3 py-2 bg-amber-50 border border-amber-100 rounded-xl">
                  <ExclamationTriangleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-900">
                    Showing the first {maxRows} submissions. Narrow your filters and import in
                    smaller batches.
                  </p>
                </div>
              )}
            </div>

            <div className="border-y border-slate-100 max-h-[45vh] overflow-y-auto">
              {rows.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-400">
                  No submissions in this selection.
                </p>
              ) : (
                rows.map((row) => (
                  <ImportPreviewRowItem
                    key={row.submissionId}
                    row={row}
                    onDecision={handleDecision}
                    onPickMatch={handlePickMatch}
                    pickedMatchId={matchPicks[row.submissionId]}
                  />
                ))
              )}
            </div>

            {/* Optional batch extras */}
            <div className="px-6 py-4 space-y-3 bg-slate-50/60">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Also apply to imported students
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-sm text-slate-600 sm:w-40 shrink-0">Homeroom teacher</label>
                <select
                  value={homeroomTeacherId}
                  onChange={(e) => setHomeroomTeacherId(e.target.value)}
                  className="w-full sm:w-64 px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
                >
                  <option value="">— Leave unassigned —</option>
                  {teachers.map((t) => (
                    <option key={t.userId} value={t.userId}>{t.fullName}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoEnroll}
                  onChange={(e) => setAutoEnroll(e.target.checked)}
                  className="rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                />
                Enrol them in the classes for their grade
              </label>
            </div>
          </>
        )}

        {!needsMapping && (
          <div className="sticky bottom-0 bg-white px-6 py-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => { onClose(); onConfigureMapping(); }}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-cyan-600 transition-colors cursor-pointer"
            >
              <Cog6ToothIcon className="w-4 h-4" />
              Edit mapping
            </button>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={running}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleRun}
                disabled={running || loading || importableCount === 0}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                {running
                  ? 'Importing...'
                  : importableCount === 0
                    ? 'Nothing to import'
                    : `Import ${importableCount} student${importableCount === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
