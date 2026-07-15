'use client';

import { useState } from 'react';
import { CheckIcon, SwatchIcon } from '@heroicons/react/24/outline';

const PRESETS: { name: string; background: string }[] = [
  { name: 'White', background: '#ffffff' },
  { name: 'Off-White', background: '#faf7f0' },
  { name: 'Ivory', background: '#fffbef' },
  { name: 'Beige', background: '#f5ecd9' },
  { name: 'Cream', background: '#fdf6e3' },
  { name: 'Soft Gray', background: '#f4f4f5' },
  { name: 'Blush', background: '#fdf2f0' },
  { name: 'Sage', background: '#f2f6ee' },
];

interface Props {
  /** Current background hex ('#ffffff' when unset) */
  background: string;
  onChange: (background: string) => void;
}

export default function ThemePicker({ background, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const current = (background || '#ffffff').toLowerCase();
  const activePreset = PRESETS.find((p) => p.background === current);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
        title="Page color of the agenda's generated pages"
      >
        <SwatchIcon className="w-4 h-4 text-indigo-500" />
        Page color
        <span
          className="w-4 h-4 rounded-full border border-slate-300"
          style={{ backgroundColor: current }}
        />
        <span className="text-slate-400">{activePreset?.name || current}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-40 w-64 bg-white rounded-2xl border border-slate-100 shadow-xl p-3">
            <p className="text-xs font-medium text-slate-500 mb-2">
              Background of calendar &amp; planner pages
            </p>
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.background}
                  onClick={() => { onChange(preset.background); setOpen(false); }}
                  title={preset.name}
                  className="group flex flex-col items-center gap-1 cursor-pointer"
                >
                  <span
                    className={`relative w-10 h-10 rounded-lg border ${
                      current === preset.background
                        ? 'border-indigo-500 ring-2 ring-indigo-200'
                        : 'border-slate-200 group-hover:border-slate-300'
                    }`}
                    style={{ backgroundColor: preset.background }}
                  >
                    {current === preset.background && (
                      <CheckIcon className="absolute inset-0 m-auto w-4 h-4 text-indigo-600" />
                    )}
                  </span>
                  <span className="text-[10px] text-slate-500">{preset.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
              <span className="text-xs text-slate-500">Custom</span>
              <input
                type="color"
                value={current}
                onChange={(e) => onChange(e.target.value)}
                className="h-7 w-10 rounded cursor-pointer border border-slate-200 bg-white"
              />
              <span className="text-xs text-slate-400 font-mono">{current}</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
