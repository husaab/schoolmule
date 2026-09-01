'use client';

import { useState, useEffect } from 'react';
import {
  PlusCircleIcon,
  ArrowPathIcon,
  NoSymbolIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import type {
  ImportPreviewRow as Row,
  ImportDecision,
} from '@/services/types/registrationImport';

interface Props {
  row: Row;
  onDecision: (submissionId: string, decision: ImportDecision | null) => void;
  onPickMatch: (submissionId: string, entityId: string) => void;
  pickedMatchId?: string;
}

const ACTION_STYLE: Record<string, { Icon: typeof PlusCircleIcon; cls: string; label: string }> = {
  create: { Icon: PlusCircleIcon, cls: 'text-emerald-600 bg-emerald-50', label: 'Create' },
  update: { Icon: ArrowPathIcon, cls: 'text-cyan-600 bg-cyan-50', label: 'Update' },
  skip: { Icon: NoSymbolIcon, cls: 'text-slate-500 bg-slate-50', label: 'Skip' },
  error: { Icon: ExclamationTriangleIcon, cls: 'text-rose-600 bg-rose-50', label: 'Blocked' },
};

/**
 * One submission in the import preview: what it would do, why, and — unless
 * the outcome is locked — a control to override it.
 */
export default function ImportPreviewRow({ row, onDecision, onPickMatch, pickedMatchId }: Props) {
  const [expanded, setExpanded] = useState(false);

  // A row blocked only because the admin has not said which student to update
  // can't be fixed from the collapsed view, so open it for them.
  const awaitingMatchChoice = row.action === 'error' && row.matchCandidates.length > 1;
  useEffect(() => {
    if (awaitingMatchChoice) setExpanded(true);
  }, [awaitingMatchChoice]);
  const style = ACTION_STYLE[row.action] || ACTION_STYLE.skip;
  const { Icon } = style;

  const hasDetail = row.diff.length > 0 || row.matchCandidates.length > 1;
  // 'error' and already-imported rows can't be overridden into anything useful.
  const canOverride = !row.locked;
  const needsMatchChoice = row.matchCandidates.length > 1;

  return (
    <div className={`border-b border-slate-50 ${row.needsReview ? 'bg-amber-50/40' : ''}`}>
      <div className="flex items-center gap-3 px-4 py-2.5">
        <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${style.cls}`}>
          <Icon className="w-3.5 h-3.5" />
          {style.label}
        </span>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">
            {row.mappedName || <span className="text-slate-400 italic">No name</span>}
            {row.mappedGrade && (
              <span className="ml-2 text-xs font-normal text-slate-500">
                {row.mappedGrade === 'JK' || row.mappedGrade === 'SK' ? row.mappedGrade : `Grade ${row.mappedGrade}`}
              </span>
            )}
          </p>
          <p className="text-xs text-slate-500 truncate">{row.reason}</p>
        </div>

        {hasDetail && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 text-slate-400 hover:text-cyan-600 rounded transition-colors shrink-0 cursor-pointer"
            title={expanded ? 'Hide details' : 'Show details'}
          >
            {expanded ? <ChevronDownIcon className="w-4 h-4" /> : <ChevronRightIcon className="w-4 h-4" />}
          </button>
        )}

        {canOverride ? (
          <select
            value={row.action === 'error' ? '' : row.action}
            onChange={(e) => onDecision(row.submissionId, (e.target.value || null) as ImportDecision | null)}
            className={`w-28 shrink-0 px-2 py-1.5 text-xs border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer ${
              row.action === 'error' ? 'border-rose-300 text-rose-700' : 'border-slate-300'
            }`}
          >
            {/* Without a matching option the browser would display the first one
                ("Create"), contradicting the Blocked badge beside it. */}
            {row.action === 'error' && <option value="">Choose match…</option>}
            <option value="create">Create</option>
            <option value="update" disabled={!row.matchedEntityId && !needsMatchChoice}>Update</option>
            <option value="skip">Skip</option>
          </select>
        ) : (
          <span className="w-28 shrink-0 text-xs text-slate-400 text-center">—</span>
        )}
      </div>

      {expanded && (
        <div className="px-4 pb-3 pl-[4.75rem] space-y-2">
          {needsMatchChoice && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                Which existing student?
              </p>
              <div className="space-y-1">
                {row.matchCandidates.map((c) => (
                  <label key={c.entityId} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name={`match-${row.submissionId}`}
                      checked={pickedMatchId === c.entityId}
                      onChange={() => onPickMatch(row.submissionId, c.entityId)}
                      className="text-cyan-600 focus:ring-cyan-500"
                    />
                    {c.name}
                    <span className="text-xs text-slate-400">
                      {c.grade === 'JK' || c.grade === 'SK' ? c.grade : `Grade ${c.grade}`}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {row.diff.length > 0 && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1.5">
                {row.diff.length} field{row.diff.length === 1 ? '' : 's'} would be filled in
              </p>
              <div className="space-y-0.5">
                {row.diff.map((d) => (
                  <div key={d.targetField} className="flex items-baseline gap-2 text-sm">
                    <span className="text-slate-500 w-40 shrink-0 truncate">{d.label}</span>
                    <span className="text-slate-300">empty →</span>
                    <span className="text-slate-900 truncate">{d.to}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
