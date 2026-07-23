'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNotificationStore } from '@/store/useNotificationStore';
import { updateAgendaPage } from '@/services/agendaService';
import type { AgendaCustomPagePayload, AgendaStampConfig } from '@/services/types/agenda';

const CHIP_PRESETS = [
  { name: 'White', background: '#ffffff' },
  { name: 'Black', background: '#1a1a1a' },
  { name: 'Navy', background: '#1a2a55' },
  { name: 'Gold', background: '#c9a227' },
];

/** Dark text on light chips, white on dark — mirrors the backend. */
const chipTextColor = (hex: string) => {
  let value = hex.slice(1);
  if (value.length === 3) value = value.split('').map((c) => c + c).join('');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 140 ? '#262626' : '#ffffff';
};

interface Props {
  agendaId: string;
  page: AgendaCustomPagePayload;
  /** 0-based page within the uploaded document */
  sourcePageIndex: number;
  /** Global book page number shown in the chip */
  pageNumber: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function ChipSettingsModal({
  agendaId,
  page,
  sourcePageIndex,
  pageNumber,
  onClose,
  onSaved,
}: Props) {
  const showNotification = useNotificationStore((state) => state.showNotification);

  const config: AgendaStampConfig = page.stampConfig || {};
  const docStyle = config.style || {};
  const override = config.pages?.[String(sourcePageIndex)] || {};

  const [enabled, setEnabled] = useState(
    override.enabled !== undefined ? override.enabled !== false : page.showPageNumber
  );
  const [background, setBackground] = useState(
    override.background || docStyle.background || '#ffffff'
  );
  const [opacity, setOpacity] = useState(
    override.opacity ?? docStyle.opacity ?? 0.82
  );
  const [saving, setSaving] = useState(false);

  const save = async (scope: 'page' | 'document') => {
    setSaving(true);
    try {
      if (scope === 'page') {
        const newConfig: AgendaStampConfig = {
          ...config,
          pages: {
            ...(config.pages || {}),
            [String(sourcePageIndex)]: { enabled, background, opacity },
          },
        };
        await updateAgendaPage(agendaId, page.pageId, { stampConfig: newConfig });
      } else {
        // Document-wide: set the default style + master toggle, clear
        // per-page tweaks so every page follows the new default
        await updateAgendaPage(agendaId, page.pageId, {
          showPageNumber: enabled,
          stampConfig: { style: { background, opacity }, pages: {} },
        });
      }
      showNotification('Page number settings saved', 'success');
      onSaved();
      onClose();
    } catch (error) {
      console.error('Error saving chip settings:', error);
      showNotification(error instanceof Error ? error.message : 'Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const isMultiPage = page.pageCount > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Page number</h2>
            <p className="text-xs text-slate-400">
              {page.title || 'Uploaded page'}
              {isMultiPage ? ` — page ${sourcePageIndex + 1} of ${page.pageCount}` : ''}
              {' '}(prints as {pageNumber})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Live sample */}
          <div className="flex items-center justify-center rounded-xl bg-slate-100 py-4">
            {enabled ? (
              <span
                className="rounded-[2px] px-1.5 py-0.5 text-[11px] font-medium shadow-sm"
                style={{
                  backgroundColor: background,
                  opacity,
                  color: chipTextColor(background),
                }}
              >
                {pageNumber}
              </span>
            ) : (
              <span className="text-xs text-slate-400">No number on this page</span>
            )}
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Show page number on this page
          </label>

          {enabled && (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Chip color</label>
                <div className="flex items-center gap-2">
                  {CHIP_PRESETS.map((preset) => (
                    <button
                      key={preset.background}
                      onClick={() => setBackground(preset.background)}
                      title={preset.name}
                      className={`w-7 h-7 rounded-lg border cursor-pointer ${
                        background === preset.background
                          ? 'border-indigo-500 ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      style={{ backgroundColor: preset.background }}
                    />
                  ))}
                  <input
                    type="color"
                    value={background}
                    onChange={(e) => setBackground(e.target.value)}
                    className="h-7 w-9 rounded cursor-pointer border border-slate-200 bg-white"
                    title="Custom color"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Chip transparency — {Math.round(opacity * 100)}%
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={Math.round(opacity * 100)}
                  onChange={(e) => setOpacity(Number(e.target.value) / 100)}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => save('page')}
              disabled={saving}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving…' : isMultiPage ? 'Save for this page only' : 'Save'}
            </button>
            {isMultiPage && (
              <button
                onClick={() => save('document')}
                disabled={saving}
                className="w-full px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl cursor-pointer disabled:opacity-50"
              >
                Apply to all {page.pageCount} pages of this file
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
