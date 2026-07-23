'use client';

import { useEffect, useRef, useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { AgendaCustomPagePayload, AgendaAnchor, AgendaFitMode } from '@/services/types/agenda';
import {
  Bars3Icon,
  TrashIcon,
  DocumentIcon,
  PhotoIcon,
  ExclamationTriangleIcon,
  PencilSquareIcon,
  HashtagIcon,
} from '@heroicons/react/24/outline';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface Props {
  page: AgendaCustomPagePayload;
  /** Agenda months in book order (e.g. [9,10,...,6]) for the anchor dropdown */
  monthOptions: number[];
  onMove: (pageId: string, anchor: AgendaAnchor, anchorMonth: number | null) => void;
  onRename: (pageId: string, title: string) => void;
  onSetFitMode: (pageId: string, fitMode: AgendaFitMode) => void;
  onToggleNumber: (pageId: string, showPageNumber: boolean) => void;
  onDelete: (pageId: string) => void;
}

export default function CustomPageCard({ page, monthOptions, onMove, onRename, onSetFitMode, onToggleNumber, onDelete }: Props) {
  const [editing, setEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(page.title || '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // Keep the draft in sync when the title changes from a refetch
  useEffect(() => {
    if (!editing) setTitleDraft(page.title || '');
  }, [page.title, editing]);

  const commitTitle = () => {
    setEditing(false);
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== (page.title || '')) {
      onRename(page.pageId, trimmed);
    } else {
      setTitleDraft(page.title || '');
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.pageId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const anchorValue = page.anchor === 'month' ? `month-${page.anchorMonth}` : page.anchor;

  const handleAnchorChange = (value: string) => {
    if (value.startsWith('month-')) {
      onMove(page.pageId, 'month', Number(value.slice(6)));
    } else {
      onMove(page.pageId, value as AgendaAnchor, null);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 bg-white rounded-xl border border-slate-200 px-3 py-2.5 group hover:border-indigo-200 hover:shadow-sm transition-all ${
        isDragging ? 'shadow-lg z-10' : ''
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 touch-none"
      >
        <Bars3Icon className="w-4 h-4" />
      </button>

      {page.fileType === 'pdf' ? (
        <DocumentIcon className="w-4 h-4 flex-shrink-0 text-rose-400" />
      ) : (
        <PhotoIcon className="w-4 h-4 flex-shrink-0 text-cyan-500" />
      )}

      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitTitle();
              if (e.key === 'Escape') {
                setTitleDraft(page.title || '');
                setEditing(false);
              }
            }}
            className="w-full rounded-lg border border-indigo-300 px-1.5 py-0.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Click to rename"
            className="group/title flex items-center gap-1.5 max-w-full text-left cursor-text"
          >
            <span className="text-sm font-medium text-slate-800 truncate">
              {page.title || 'Untitled page'}
            </span>
            <PencilSquareIcon className="w-3.5 h-3.5 flex-shrink-0 text-slate-300 opacity-0 group-hover/title:opacity-100 group-hover:opacity-100 transition-opacity" />
          </button>
        )}
        <p className="text-xs text-slate-400">
          {page.pageCount} {page.pageCount === 1 ? 'page' : 'pages'} · {page.fileType.toUpperCase()}
        </p>
      </div>

      {page.sizeWarning && (
        <span title={page.sizeWarning}>
          <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
        </span>
      )}

      <button
        type="button"
        onClick={() => onToggleNumber(page.pageId, !page.showPageNumber)}
        title={page.showPageNumber
          ? 'Page number is printed on this page — click to hide'
          : 'Page number hidden on this page — click to print it'}
        className={`p-1 rounded-lg cursor-pointer transition-colors ${
          page.showPageNumber
            ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
            : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'
        }`}
      >
        <HashtagIcon className="w-4 h-4" />
      </button>

      {page.fileType === 'image' && (
        <div
          className="flex rounded-lg border border-slate-200 overflow-hidden text-[10px] font-medium"
          title="Fit: whole image visible (white margins if needed). Fill: edge-to-edge (may crop)."
        >
          <button
            type="button"
            onClick={() => onSetFitMode(page.pageId, 'contain')}
            className={`px-1.5 py-1 cursor-pointer transition-colors ${
              page.fitMode !== 'cover'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Fit
          </button>
          <button
            type="button"
            onClick={() => onSetFitMode(page.pageId, 'cover')}
            className={`px-1.5 py-1 cursor-pointer transition-colors ${
              page.fitMode === 'cover'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
            }`}
          >
            Fill
          </button>
        </div>
      )}

      <select
        value={anchorValue}
        onChange={(e) => handleAnchorChange(e.target.value)}
        className="text-xs rounded-lg border border-slate-200 px-1.5 py-1 text-slate-600 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-400 cursor-pointer"
        title="Move to a different section"
      >
        <option value="intro">Intro</option>
        {monthOptions.map((m) => (
          <option key={m} value={`month-${m}`}>{MONTH_NAMES[m - 1].slice(0, 3)}</option>
        ))}
        <option value="closing">Closing</option>
      </select>

      <button
        onClick={() => onDelete(page.pageId)}
        className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
        title="Remove page"
      >
        <TrashIcon className="w-4 h-4" />
      </button>
    </div>
  );
}
