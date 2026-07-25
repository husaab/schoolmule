'use client';

import { useState } from 'react';
import { XMarkIcon, ScissorsIcon } from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/store/useNotificationStore';
import { splitAgendaPage } from '@/services/agendaService';
import type { AgendaCustomPagePayload } from '@/services/types/agenda';

interface Props {
  agendaId: string;
  page: AgendaCustomPagePayload;
  onClose: () => void;
  onSplit: () => void;
}

export default function SplitPageModal({ agendaId, page, onClose, onSplit }: Props) {
  const showNotification = useNotificationStore((state) => state.showNotification);
  const [afterPage, setAfterPage] = useState(1);
  const [saving, setSaving] = useState(false);

  const handleSplit = async () => {
    setSaving(true);
    try {
      await splitAgendaPage(agendaId, page.pageId, afterPage);
      showNotification('Split done — drag pages between the two parts', 'success');
      onSplit();
      onClose();
    } catch (error) {
      console.error('Error splitting page:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to split', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Split PDF</h2>
            <p className="text-xs text-slate-400">{page.title || 'Uploaded PDF'} · {page.pageCount} pages</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">
            Splitting turns this file into two independent items so you can drag other pages
            in between — no external PDF tools needed. The file itself isn&apos;t changed.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Split point</label>
            <select
              value={afterPage}
              onChange={(e) => setAfterPage(Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {Array.from({ length: page.pageCount - 1 }, (_, i) => i + 1).map((k) => (
                <option key={k} value={k}>
                  After page {k} — parts become {k} + {page.pageCount - k} pages
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSplit}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              <ScissorsIcon className="w-4 h-4" />
              {saving ? 'Splitting…' : 'Split'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
