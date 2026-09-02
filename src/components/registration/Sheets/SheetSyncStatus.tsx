'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TableCellsIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import * as sheetsService from '@/services/googleSheetsService';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { SheetLinkState } from '@/services/types/googleSheets';

interface Props {
  formId: string;
  /** Bumping this refetches — used after linking or unlinking. */
  refreshKey?: number;
  onOpenSettings: () => void;
}

/** "3 minutes ago" — relative time reads better than a timestamp for freshness. */
function relativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

/**
 * The sheet's freshness, in the submissions page header.
 *
 * A stale sheet must announce itself — silent drift is the one failure mode
 * that would quietly undermine trust in the whole feature — so a failed sync or
 * a dead Google grant is shown here rather than only inside a modal.
 */
export default function SheetSyncStatus({ formId, refreshKey = 0, onOpenSettings }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);
  const [state, setState] = useState<SheetLinkState | null>(null);
  const [syncing, setSyncing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await sheetsService.getSheetLink(formId);
      setState(res.data);
    } catch {
      // Not being able to read sync state shouldn't interrupt the page.
    }
  }, [formId]);

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
      await sheetsService.syncNow(formId);
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
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
        title="Keep a Google Sheet up to date with these submissions"
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
        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
      >
        <ExclamationTriangleIcon className="w-4 h-4" />
        Reconnect Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onOpenSettings}
        title={state.spreadsheetName || 'Linked spreadsheet'}
        className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border rounded-l-lg transition-colors cursor-pointer ${
          failed
            ? 'text-rose-700 bg-rose-50 hover:bg-rose-100 border-rose-200'
            : 'text-slate-600 hover:text-cyan-600 hover:bg-cyan-50 border-slate-200'
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
      <button
        onClick={handleSync}
        disabled={syncing}
        title="Sync now"
        className="px-2.5 py-2 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 border border-l-0 border-slate-200 rounded-r-lg transition-colors disabled:opacity-50 cursor-pointer"
      >
        <ArrowPathIcon className={`w-4 h-4 ${syncing || state.pendingSync ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
