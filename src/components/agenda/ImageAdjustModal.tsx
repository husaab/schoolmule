'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { XMarkIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { getAgendaPageSignedUrl } from '@/services/agendaService';
import type { AgendaCustomPagePayload, AgendaFitMode } from '@/services/types/agenda';
import {
  placementToBox,
  boxToPlacement,
  clampZoom,
  DEFAULT_PLACEMENT,
  LETTER_W,
  LETTER_H,
  type Placement,
  type PlacementBox,
} from './imagePlacement';

type Handle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

const HANDLE_POSITION: Record<Handle, string> = {
  nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize',
  n: 'left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize',
  ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize',
  e: 'right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
  se: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize',
  s: 'left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize',
  sw: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize',
  w: 'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize',
};

interface Props {
  agendaId: string;
  page: AgendaCustomPagePayload;
  onClose: () => void;
  /** Persist the placement; parent refreshes the preview */
  onSave: (placement: Placement) => Promise<void>;
}

interface DragState {
  kind: 'move' | Handle;
  startX: number;
  startY: number;
  box0: PlacementBox;
}

export default function ImageAdjustModal({ agendaId, page, onClose, onSave }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [fitMode, setFitMode] = useState<AgendaFitMode>(page.fitMode || 'contain');
  const [box, setBox] = useState<PlacementBox | null>(null);

  useEffect(() => {
    let cancelled = false;
    getAgendaPageSignedUrl(agendaId, page.pageId).then((signed) => {
      if (!cancelled) setUrl(signed);
    });
    return () => { cancelled = true; };
  }, [agendaId, page.pageId]);

  // Initialize the box from the saved placement once image dimensions load
  useEffect(() => {
    if (natural && !box) {
      setBox(placementToBox(natural.w, natural.h, {
        fitMode: page.fitMode || 'contain',
        zoom: page.zoom ?? 1,
        zoomY: page.zoomY ?? null,
        offsetX: page.offsetX ?? 0,
        offsetY: page.offsetY ?? 0,
      }));
    }
  }, [natural, box, page]);

  // Width/height bounds derived from the zoom clamps (0.2 - 4)
  const bounds = useMemo(() => {
    if (!natural) return null;
    const base = fitMode === 'cover'
      ? Math.max(LETTER_W / natural.w, LETTER_H / natural.h)
      : Math.min(LETTER_W / natural.w, LETTER_H / natural.h);
    return {
      minW: (natural.w * base * 0.2) / LETTER_W,
      maxW: (natural.w * base * 4) / LETTER_W,
      minH: (natural.h * base * 0.2) / LETTER_H,
      maxH: (natural.h * base * 4) / LETTER_H,
    };
  }, [natural, fitMode]);

  const currentZoom = natural && box
    ? boxToPlacement(natural.w, natural.h, fitMode, box).zoom
    : 1;

  const startDrag = (kind: DragState['kind']) => (e: React.PointerEvent) => {
    if (!box) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { kind, startX: e.clientX, startY: e.clientY, box0: box };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const frame = frameRef.current;
    if (!drag || !frame || !bounds) return;

    const dx = (e.clientX - drag.startX) / frame.clientWidth;
    const dy = (e.clientY - drag.startY) / frame.clientHeight;
    const b = drag.box0;
    const clampW = (w: number) => Math.min(bounds.maxW, Math.max(bounds.minW, w));
    const clampH = (h: number) => Math.min(bounds.maxH, Math.max(bounds.minH, h));

    if (drag.kind === 'move') {
      setBox({ ...b, left: b.left + dx, top: b.top + dy });
      return;
    }

    let { left, top, width, height } = b;
    const kind = drag.kind;

    if (kind === 'e' || kind === 'w') {
      width = clampW(kind === 'e' ? b.width + dx : b.width - dx);
      if (kind === 'w') left = b.left + b.width - width;
    } else if (kind === 'n' || kind === 's') {
      height = clampH(kind === 's' ? b.height + dy : b.height - dy);
      if (kind === 'n') top = b.top + b.height - height;
    } else {
      // Corners: proportional scale anchored at the opposite corner
      const wantW = kind.includes('e') ? b.width + dx : b.width - dx;
      let f = wantW / b.width;
      f = Math.min(f, bounds.maxW / b.width, bounds.maxH / b.height);
      f = Math.max(f, bounds.minW / b.width, bounds.minH / b.height);
      width = b.width * f;
      height = b.height * f;
      if (kind.includes('w')) left = b.left + b.width - width;
      if (kind.includes('n')) top = b.top + b.height - height;
    }

    setBox({ left, top, width, height });
  };

  const handlePointerUp = () => { dragRef.current = null; };

  const scaleAboutCenter = (factor: number) => {
    if (!box || !bounds) return;
    const f = Math.max(
      Math.min(factor, bounds.maxW / box.width, bounds.maxH / box.height),
      bounds.minW / box.width, bounds.minH / box.height
    );
    setBox({
      left: box.left + (box.width * (1 - f)) / 2,
      top: box.top + (box.height * (1 - f)) / 2,
      width: box.width * f,
      height: box.height * f,
    });
  };

  const applyPreset = (mode: AgendaFitMode) => {
    setFitMode(mode);
    if (natural) {
      setBox(placementToBox(natural.w, natural.h, { fitMode: mode, ...DEFAULT_PLACEMENT }));
    }
  };

  const handleSave = async () => {
    if (!natural || !box) return;
    setSaving(true);
    try {
      await onSave(boxToPlacement(natural.w, natural.h, fitMode, box));
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const boxStyle = box ? {
    left: `${box.left * 100}%`,
    top: `${box.top * 100}%`,
    width: `${box.width * 100}%`,
    height: `${box.height * 100}%`,
  } : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Adjust placement</h2>
            <p className="text-xs text-slate-400">
              {page.title || 'Image page'} — drag to move, pull corners to resize, pull sides to stretch
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Page canvas */}
        <div className="flex-1 overflow-auto bg-slate-100 p-6 flex justify-center">
          <div
            ref={frameRef}
            onWheel={(e) => scaleAboutCenter(e.deltaY < 0 ? 1.05 : 1 / 1.05)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative bg-white shadow-md overflow-hidden select-none touch-none flex-shrink-0"
            style={{ aspectRatio: '8.5 / 11', height: 'min(62vh, 640px)' }}
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt=""
                draggable={false}
                onLoad={(e) => {
                  const img = e.currentTarget;
                  setNatural({ w: img.naturalWidth, h: img.naturalHeight });
                }}
                className="absolute max-w-none pointer-events-none"
                style={box ? boxStyle : { opacity: 0 }}
              />
            ) : (
              <div className="absolute inset-0 animate-pulse bg-slate-50" />
            )}

            {/* Selection frame with resize handles */}
            {box && (
              <div
                className="absolute ring-2 ring-indigo-500/80 cursor-move"
                style={boxStyle}
                onPointerDown={startDrag('move')}
              >
                {HANDLES.map((handle) => (
                  <span
                    key={handle}
                    onPointerDown={startDrag(handle)}
                    className={`absolute w-3 h-3 rounded-full bg-white border-2 border-indigo-500 shadow ${HANDLE_POSITION[handle]}`}
                  />
                ))}
              </div>
            )}

            {/* Page edge guide */}
            <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-slate-300/60" />
          </div>
        </div>

        {/* Controls */}
        <div className="px-5 py-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 w-12">Zoom</span>
            <input
              type="range"
              min={20}
              max={400}
              value={Math.round(clampZoom(currentZoom) * 100)}
              onChange={(e) => scaleAboutCenter((Number(e.target.value) / 100) / currentZoom)}
              className="flex-1 accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs text-slate-500 w-12 text-right">
              {Math.round(currentZoom * 100)}%
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
                <button
                  onClick={() => applyPreset('contain')}
                  className="px-2.5 py-1.5 cursor-pointer bg-slate-50 text-slate-500 hover:bg-slate-100"
                >
                  Fit
                </button>
                <button
                  onClick={() => applyPreset('cover')}
                  className="px-2.5 py-1.5 cursor-pointer bg-slate-50 text-slate-500 hover:bg-slate-100"
                >
                  Fill
                </button>
              </div>
              <button
                onClick={() => applyPreset(fitMode)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                title="Reset size and position"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" /> Reset
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !box}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Save placement'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
