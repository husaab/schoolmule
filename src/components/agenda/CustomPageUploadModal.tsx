'use client';

import { useRef, useState } from 'react';
import { XMarkIcon, ArrowUpTrayIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/store/useNotificationStore';
import { uploadAgendaPage } from '@/services/agendaService';
import type { AgendaAnchor } from '@/services/types/agenda';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Props {
  agendaId: string;
  monthOptions: number[];
  /** Slot the modal was opened from */
  defaultAnchor?: AgendaAnchor;
  defaultAnchorMonth?: number | null;
  onClose: () => void;
  onUploaded: (sizeWarning?: string | null) => void;
}

export default function CustomPageUploadModal({
  agendaId,
  monthOptions,
  defaultAnchor = 'intro',
  defaultAnchorMonth = null,
  onClose,
  onUploaded,
}: Props) {
  const showNotification = useNotificationStore((state) => state.showNotification);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [anchorValue, setAnchorValue] = useState(
    defaultAnchor === 'month' && defaultAnchorMonth ? `month-${defaultAnchorMonth}` : defaultAnchor
  );
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (selected: File | null) => {
    setFile(selected);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(selected && selected.type.startsWith('image/') ? URL.createObjectURL(selected) : null);
    if (selected && !title) {
      setTitle(selected.name.replace(/\.[^.]+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      showNotification('Choose a PDF or image file first', 'error');
      return;
    }

    const anchor: AgendaAnchor = anchorValue.startsWith('month-') ? 'month' : (anchorValue as AgendaAnchor);
    const anchorMonth = anchorValue.startsWith('month-') ? Number(anchorValue.slice(6)) : null;

    setUploading(true);
    try {
      const response = await uploadAgendaPage(agendaId, file, anchor, anchorMonth, title.trim() || undefined);
      showNotification('Page uploaded', 'success');
      onUploaded(response.data.sizeWarning);
      onClose();
    } catch (error) {
      console.error('Error uploading page:', error);
      showNotification(error instanceof Error ? error.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Add Custom Page</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* File picker */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors cursor-pointer"
          >
            {file ? (
              previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="Preview" className="mx-auto max-h-40 rounded-lg shadow-sm" />
              ) : (
                <span className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <DocumentIcon className="w-5 h-5 text-rose-400" /> {file.name}
                </span>
              )
            ) : (
              <span className="flex flex-col items-center gap-2 text-sm text-slate-400">
                <ArrowUpTrayIcon className="w-6 h-6" />
                Click to choose a PDF or image (max 25MB)
                <span className="text-xs">Design pages in Canva or similar, export as PDF, upload here</span>
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/png,image/jpeg"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
          />

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Welcome Letter"
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
            <select
              value={anchorValue}
              onChange={(e) => setAnchorValue(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="intro">Beginning of agenda (intro)</option>
              {monthOptions.map((m) => (
                <option key={m} value={`month-${m}`}>Start of {MONTH_NAMES[m - 1]}</option>
              ))}
              <option value="closing">End of agenda (closing)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload Page'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
