'use client';

import { useState } from 'react';
import { XMarkIcon, ScissorsIcon, DocumentIcon } from '@heroicons/react/24/outline';
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
  // Cut position: pages 1..afterPage stay in part 1, the rest go to part 2
  const [afterPage, setAfterPage] = useState(Math.ceil(page.pageCount / 2));
  const [saving, setSaving] = useState(false);

  const handleSplit = async () => {
    setSaving(true);
    try {
      await splitAgendaPage(agendaId, page.pageId, afterPage);
      showNotification('Split! You can now drag other pages into the gap', 'success');
      onSplit();
      onClose();
    } catch (error) {
      console.error('Error splitting page:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to split', 'error');
    } finally {
      setSaving(false);
    }
  };

  const pages = Array.from({ length: page.pageCount }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Make room between pages</h2>
            <p className="text-xs text-slate-400">{page.title || 'Uploaded PDF'} · {page.pageCount} pages</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">Click between two pages</span> to choose
            where the gap goes. This document becomes two pieces at that spot, so you can drag
            other pages into the gap. No pages are changed or lost.
          </p>

          {/* Page tiles with clickable cut gaps */}
          <div className="flex flex-wrap items-center justify-center gap-y-3 rounded-xl bg-slate-50 px-3 py-4">
            {pages.map((p) => (
              <span key={p} className="flex items-center">
                <span
                  className={`flex h-14 w-11 flex-col items-center justify-center rounded-md border bg-white shadow-sm ${
                    p <= afterPage ? 'border-indigo-300' : 'border-teal-300'
                  }`}
                >
                  <DocumentIcon className={`w-4 h-4 ${p <= afterPage ? 'text-indigo-400' : 'text-teal-400'}`} />
                  <span className="mt-0.5 text-[11px] font-semibold text-slate-600">{p}</span>
                </span>
                {p < page.pageCount && (
                  <button
                    type="button"
                    onClick={() => setAfterPage(p)}
                    title={`Put the gap between page ${p} and page ${p + 1}`}
                    className="group relative mx-0.5 flex h-14 w-7 items-center justify-center cursor-pointer"
                  >
                    {p === afterPage ? (
                      <span className="flex flex-col items-center">
                        <ScissorsIcon className="w-4 h-4 text-indigo-600 rotate-90" />
                        <span className="mt-0.5 h-8 border-l-2 border-dashed border-indigo-500" />
                      </span>
                    ) : (
                      <span className="h-10 border-l-2 border-dotted border-slate-200 group-hover:border-indigo-300" />
                    )}
                  </button>
                )}
              </span>
            ))}
          </div>

          {/* Plain-English result */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 font-medium text-indigo-700">
              {afterPage === 1 ? 'Page 1' : `Pages 1–${afterPage}`}
            </span>
            <span className="text-slate-400 text-xs font-medium">new pages go here</span>
            <span className="rounded-lg bg-teal-50 border border-teal-100 px-2.5 py-1 font-medium text-teal-700">
              {afterPage === page.pageCount - 1
                ? `Page ${page.pageCount}`
                : `Pages ${afterPage + 1}–${page.pageCount}`}
            </span>
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
              {saving ? 'Splitting…' : `Split between pages ${afterPage} & ${afterPage + 1}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
