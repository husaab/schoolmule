'use client';

/**
 * The designer's working state: the draft document, selection, undo/redo and
 * the preview target. Web-only (the designer is a desktop tool), so it lives
 * with its components rather than in src/store.
 */
import { create } from 'zustand';
import type { RenderWarning, ReportData, TemplateDoc } from '@/reportkit/types';
import type { SampleKey } from '@/reportkit/sample';
import type { Selection } from './docOps';

export type PreviewTarget =
  | { kind: 'sample'; key: SampleKey }
  | { kind: 'student'; studentId: string; name: string; grade: string; term?: string };

export type SaveState = 'saved' | 'dirty' | 'saving' | 'error' | 'conflict';

const HISTORY_LIMIT = 120;
const COALESCE_MS = 900;

interface DesignerState {
  doc: TemplateDoc | null;
  past: TemplateDoc[];
  future: TemplateDoc[];
  lastCommit: { key: string; at: number } | null;
  selection: Selection;
  saveState: SaveState;
  /** Bumped on every edit; the autosave compares it to what it last saved. */
  editSeq: number;
  zoom: number;
  preview: PreviewTarget;
  previewData: ReportData | null;
  warnings: RenderWarning[];
  pageCount: number;
  editingTextId: string | null;

  load: (doc: TemplateDoc) => void;
  /** Apply an edit. Edits with the same `coalesceKey` in quick succession are one undo step. */
  commit: (doc: TemplateDoc, coalesceKey?: string) => void;
  undo: () => void;
  redo: () => void;
  select: (selection: Selection) => void;
  setSaveState: (state: SaveState) => void;
  setZoom: (zoom: number) => void;
  setPreview: (preview: PreviewTarget, data: ReportData | null) => void;
  setRenderInfo: (info: { warnings: RenderWarning[]; pageCount: number }) => void;
  setEditingText: (id: string | null) => void;
}

export const useDesignerStore = create<DesignerState>((set, get) => ({
  doc: null,
  past: [],
  future: [],
  lastCommit: null,
  selection: null,
  saveState: 'saved',
  editSeq: 0,
  zoom: 1,
  preview: { kind: 'sample', key: 'SK' },
  previewData: null,
  warnings: [],
  pageCount: 0,
  editingTextId: null,

  load: (doc) =>
    set({ doc, past: [], future: [], lastCommit: null, selection: null, saveState: 'saved', editSeq: 0, editingTextId: null }),

  commit: (doc, coalesceKey) => {
    const { doc: current, past, lastCommit, editSeq } = get();
    if (!current || doc === current) return;
    const now = Date.now();
    const coalesce = !!coalesceKey && lastCommit?.key === coalesceKey && now - lastCommit.at < COALESCE_MS;
    set({
      doc,
      past: coalesce ? past : [...past, current].slice(-HISTORY_LIMIT),
      future: [],
      lastCommit: coalesceKey ? { key: coalesceKey, at: now } : null,
      saveState: 'dirty',
      editSeq: editSeq + 1,
    });
  },

  undo: () => {
    const { doc, past, future, editSeq } = get();
    if (!doc || past.length === 0) return;
    const prev = past[past.length - 1];
    set({ doc: prev, past: past.slice(0, -1), future: [doc, ...future], lastCommit: null, saveState: 'dirty', editSeq: editSeq + 1 });
  },

  redo: () => {
    const { doc, past, future, editSeq } = get();
    if (!doc || future.length === 0) return;
    const [next, ...rest] = future;
    set({ doc: next, past: [...past, doc], future: rest, lastCommit: null, saveState: 'dirty', editSeq: editSeq + 1 });
  },

  select: (selection) => set({ selection, editingTextId: null }),
  setSaveState: (saveState) => set({ saveState }),
  setZoom: (zoom) => set({ zoom: Math.min(2, Math.max(0.4, Math.round(zoom * 100) / 100)) }),
  setPreview: (preview, previewData) => set({ preview, previewData }),
  setRenderInfo: ({ warnings, pageCount }) => set({ warnings, pageCount }),
  setEditingText: (editingTextId) => set({ editingTextId }),
}));
