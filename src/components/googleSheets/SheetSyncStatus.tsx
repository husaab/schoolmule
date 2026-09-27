'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TableCellsIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { SheetLinkState, SheetTarget } from '@/services/types/googleSheets';

interface Props {
  target: SheetTarget;
  /** Bumping this refetches — used after linking, unlinking, or an edit that queued a sync. */
  refreshKey?: number;
  onOpenSettings: () => void;
  /** Corner radius, to sit flush with the page's other buttons. */
  radius?: 'lg' | 'xl';
}

/** "3 min ago" — relative time reads better than a timestamp for freshness,
 *  and short units keep the pill from crowding the buttons beside it. */
function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * The linked sheet's freshness, in a page header.
 *
 * A stale sheet must announce itself — silent drift is the one failure mode
 * that would quietly undermine trust in the whole feature — so a failed sync or
 * a dead Google grant is shown here rather than only inside a modal.
 */
export default function SheetSyncStatus({ target, refreshKey = 0, onOpenSettings, radius = 'lg' }: Props) {
  // Whole class names, never interpolated: Tailwind only emits what it can read.
  const shape = radius === 'xl'
    ? { full: 'rounded-xl', left: 'rounded-l-xl', right: 'rounded-r-xl' }
    : { full: 'rounded-lg', left: 'rounded-l-lg', right: 'rounded-r-lg' };
  const base = 'flex items-center gap-1.5 px-3 py-2 text-sm font-medium border transition-colors cursor-pointer';
  const showNotification = useNotificationStore((s) => s.showNotification);
  const [state, setState] = useState<SheetLinkState | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await target.getLink();
      setState(res.data);
    } catch {
      // Not being able to read sync state shouldn't interrupt the page.
    }
  }, [target]);

  useEffect(() => { load(); }, [load, refreshKey]);

  // While a sync is queued, poll so "Synced just now" appears without a manual
  // refresh. Stops as soon as the queue clears.
  useEffect(() => {
    if (!state?.pendingSync) return;
    const t = setInterval(load, 4000);
    return () => clearInterval(t);
  }, [state?.pendingSync, load]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await target.syncNow();
      showNotification('Sync queued', 'success');
      await load();
    } catch (err) {
      showNotification((err as Error).message || 'Could not queue a sync', 'error');
    } finally {
      setSyncing(false);
    }
  };

  // Nothing linked: a quiet entry point rather than an empty state.
  if (!state?.linked) {
    return (
      <button
        onClick={onOpenSettings}
        className={`${base} ${shape.full} bg-white text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 border-slate-200`}
        title={target.copy.pillTitle}
      >
        <TableCellsIcon className="w-4 h-4" />
        Link a Sheet
      </button>
    );
  }

  const needsReconnect = state.connection?.status === 'needs_reconnect';
  const failed = !!state.jobError || !!state.lastError;

  if (needsReconnect) {
    return (
      <button
        onClick={onOpenSettings}
        className={`${base} ${shape.full} text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200`}
      >
        <ExclamationTriangleIcon className="w-4 h-4" />
        Reconnect Google
      </button>
    );
  }

  return (
    <div className="flex items-center">
      <button
        onClick={onOpenSettings}
        title={state.spreadsheetName || 'Linked spreadsheet'}
        className={`${base} ${shape.left} ${
          failed
            ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
            : 'bg-white text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 border-slate-200'
        }`}
      >
        <TableCellsIcon className="w-4 h-4" />
        {failed
          ? 'Sync failed'
          : state.pendingSync
            ? 'Syncing…'
            : state.lastSyncedAt
              ? `Synced ${relativeTime(state.lastSyncedAt)}`
              : 'Not synced yet'}
      </button>
      {state.spreadsheetId && (
        <a
          href={`https://docs.google.com/spreadsheets/d/${state.spreadsheetId}/edit`}
          target="_blank"
          rel="noopener noreferrer"
          title="Open in Google Sheets"
          className="flex items-center px-2.5 py-2 bg-white text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 border border-l-0 border-slate-200 transition-colors"
        >
          <ArrowTopRightOnSquareIcon className="w-4 h-4" />
        </a>
      )}
      <button
        onClick={handleSync}
        disabled={syncing}
        title="Sync now"
        className={`px-2.5 py-2 bg-white text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 border border-l-0 border-slate-200 ${shape.right} transition-colors disabled:opacity-50 cursor-pointer`}
      >
        <ArrowPathIcon className={`w-4 h-4 ${syncing || state.pendingSync ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
