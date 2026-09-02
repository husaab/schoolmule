'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  TableCellsIcon,
  ArrowTopRightOnSquareIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import Modal from '@/components/shared/modal';
import { useGooglePicker } from './useGooglePicker';
import * as sheetsService from '@/services/googleSheetsService';
import { useNotificationStore } from '@/store/useNotificationStore';
import type { SheetLinkState } from '@/services/types/googleSheets';

interface Props {
  formId: string;
  formTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}

/**
 * Connect Google, then point this form at a spreadsheet tab.
 *
 * Three states in one modal, because they're one linear task: not connected →
 * connected but unlinked → linked.
 */
export default function LinkSheetModal({ formId, formTitle, isOpen, onClose, onChanged }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification);
  const { pick, loading: picking } = useGooglePicker();

  const [state, setState] = useState<SheetLinkState | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await sheetsService.getSheetLink(formId);
      setState(res.data);
    } catch (err) {
      showNotification((err as Error).message || 'Error loading sheet link', 'error');
    } finally {
      setLoading(false);
    }
  }, [formId, showNotification]);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  const handleConnect = async () => {
    setWorking(true);
    try {
      // The backend hands back the URL rather than redirecting, so that the
      // request identifying our school carries the auth token.
      const res = await sheetsService.getAuthUrl();
      window.location.href = res.data.url;
    } catch (err) {
      showNotification((err as Error).message || 'Could not start Google sign-in', 'error');
      setWorking(false);
    }
  };

  const handleChoose = async () => {
    setWorking(true);
    try {
      const picked = await pick();
      if (!picked) return; // cancelled
      await sheetsService.linkExistingSheet(formId, picked.spreadsheetId);
      showNotification(`Linked to "${picked.name}"`, 'success');
      await load();
      onChanged();
    } catch (err) {
      showNotification((err as Error).message || 'Could not link that sheet', 'error');
    } finally {
      setWorking(false);
    }
  };

  const handleCreate = async () => {
    setWorking(true);
    try {
      await sheetsService.linkNewSheet(formId, `${formTitle} — Submissions`);
      showNotification('Spreadsheet created and linked', 'success');
      await load();
      onChanged();
    } catch (err) {
      showNotification((err as Error).message || 'Could not create a sheet', 'error');
    } finally {
      setWorking(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Unlink this sheet? The spreadsheet and everything in it stays exactly as it is — we just stop updating it.')) return;
    setWorking(true);
    try {
      const res = await sheetsService.unlinkSheet(formId);
      showNotification(res.message, 'success');
      await load();
      onChanged();
    } catch (err) {
      showNotification((err as Error).message || 'Could not unlink', 'error');
    } finally {
      setWorking(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google for the whole school? Every form linked to a sheet will stop syncing.')) return;
    setWorking(true);
    try {
      await sheetsService.disconnectGoogle();
      showNotification('Google account disconnected', 'success');
      await load();
      onChanged();
    } catch (err) {
      showNotification((err as Error).message || 'Could not disconnect', 'error');
    } finally {
      setWorking(false);
    }
  };

  const connection = state?.connection;
  const needsReconnect = connection?.status === 'needs_reconnect';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Google Sheet" size="lg">
      {loading ? (
        <div className="px-6 py-12 text-center text-slate-400">
          <div className="animate-spin h-6 w-6 border-2 border-cyan-500 border-t-transparent rounded-full mx-auto mb-2" />
          <p className="text-sm">Loading…</p>
        </div>
      ) : (
        <div className="flex flex-col">
          <div className="px-6 py-4 space-y-4">
            {/* 1 — not connected, or the grant died */}
            {(!connection?.connected || needsReconnect) && (
              <div className="text-center py-6">
                <TableCellsIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-slate-700 mb-1">
                  {needsReconnect ? 'Reconnect Google' : 'Connect a Google account'}
                </h3>
                <p className="text-sm text-slate-500 mb-5 max-w-md mx-auto">
                  {needsReconnect
                    ? 'Access was revoked, so the sheet has stopped updating. Reconnecting resumes it.'
                    : 'Keep a spreadsheet up to date with these submissions, instead of exporting a CSV each time.'}
                </p>
                <button
                  onClick={handleConnect}
                  disabled={working}
                  className="px-4 py-2 text-sm font-medium text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {working ? 'Redirecting…' : needsReconnect ? 'Reconnect Google' : 'Connect Google'}
                </button>
                <p className="text-xs text-slate-400 mt-4 max-w-md mx-auto">
                  We only ever get access to the one spreadsheet you pick or that we create —
                  never the rest of your Drive.
                </p>
              </div>
            )}

            {/* 2 — connected, nothing linked yet */}
            {connection?.connected && !needsReconnect && !state?.linked && (
              <>
                <p className="text-sm text-slate-500">
                  Connected as <span className="font-medium text-slate-700">{connection.googleEmail}</span>
                </p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleChoose}
                    disabled={working || picking}
                    className="p-4 border border-slate-200 rounded-xl text-left hover:border-cyan-300 hover:bg-cyan-50/40 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <TableCellsIcon className="w-6 h-6 text-cyan-600 mb-2" />
                    <p className="text-sm font-medium text-slate-900">Choose an existing sheet</p>
                    <p className="text-xs text-slate-500 mt-0.5">Pick one from your Drive</p>
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={working}
                    className="p-4 border border-slate-200 rounded-xl text-left hover:border-cyan-300 hover:bg-cyan-50/40 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <LinkIcon className="w-6 h-6 text-cyan-600 mb-2" />
                    <p className="text-sm font-medium text-slate-900">Create one for me</p>
                    <p className="text-xs text-slate-500 mt-0.5">A new spreadsheet in your Drive</p>
                  </button>
                </div>
                <p className="text-xs text-slate-400">
                  This form gets its own tab, so several forms can share one spreadsheet without
                  overwriting each other.
                </p>
              </>
            )}

            {/* 3 — linked */}
            {connection?.connected && !needsReconnect && state?.linked && (
              <>
                <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-emerald-900 truncate">
                      {state.spreadsheetName || 'Linked spreadsheet'}
                    </p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Tab: {state.sheetTabName}
                    </p>
                    <a
                      href={`https://docs.google.com/spreadsheets/d/${state.spreadsheetId}/edit`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-900 underline mt-1.5"
                    >
                      Open in Google Sheets
                      <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {state.lastError && (
                  <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-900">
                      Last sync failed: {state.lastError}
                    </p>
                  </div>
                )}

                <p className="text-xs text-slate-400">
                  We keep the first {state.ownedColumns} columns up to date. Anything you add to the
                  right of those is yours — we never read or change it.
                </p>

                <button
                  onClick={handleUnlink}
                  disabled={working}
                  className="text-sm text-rose-600 hover:text-rose-700 font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Unlink this sheet
                </button>
              </>
            )}
          </div>

          <div className="px-6 py-3 border-t border-slate-100 flex items-center justify-between">
            {connection?.connected ? (
              <button
                onClick={handleDisconnect}
                disabled={working}
                className="text-xs text-slate-400 hover:text-rose-600 transition-colors disabled:opacity-50 cursor-pointer"
              >
                Disconnect Google
              </button>
            ) : <span />}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
