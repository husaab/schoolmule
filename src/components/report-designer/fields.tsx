'use client';

/** Compact form controls for the designer's inspector panels. */
import { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon, PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { FONT_FAMILIES } from '@/reportkit/fonts';
import { catalogFor, type CatalogField } from '@/reportkit/catalog';
import { GRADES } from '@/reportkit/format';
import { downscaleImage } from '@/lib/imageDownscale';
import type { BarStyle, ColumnDef, Condition, ConditionOp, ExtraFieldDef, ImageSource, TableLook, TextStyle } from '@/reportkit/types';

export const inputCls =
  'w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:bg-slate-50 disabled:text-slate-400';

export function Section({ title, children, defaultOpen = true, actions }: { title: string; children: React.ReactNode; defaultOpen?: boolean; actions?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-slate-100 py-3">
      <div className="flex items-center justify-between px-4">
        <button type="button" onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 hover:text-slate-800">
          <ChevronDownIcon className={`h-3 w-3 transition-transform ${open ? '' : '-rotate-90'}`} />
          {title}
        </button>
        {actions}
      </div>
      {open && <div className="mt-2.5 space-y-2.5 px-4">{children}</div>}
    </section>
  );
}

export function Row({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">{label}</span>
      {children}
      {hint && <span className="mt-0.5 block text-[10px] leading-snug text-slate-400">{hint}</span>}
    </label>
  );
}

export function Grid({ children, cols = 2 }: { children: React.ReactNode; cols?: 2 | 3 | 4 }) {
  return <div className={`grid gap-2 ${cols === 2 ? 'grid-cols-2' : cols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>{children}</div>;
}

/** A number input that commits on change but tolerates an empty/partial value while typing. */
export function NumberInput({ value, onChange, min, max, step = 1, placeholder, suffix, testId }: { value: number | undefined; onChange: (v: number | undefined) => void; min?: number; max?: number; step?: number; placeholder?: string; suffix?: string; testId?: string }) {
  const [text, setText] = useState(value === undefined ? '' : String(value));
  useEffect(() => setText(value === undefined ? '' : String(value)), [value]);
  return (
    <div className="relative">
      <input
        type="number"
        className={`${inputCls} ${suffix ? 'pr-7' : ''}`}
        value={text}
        min={min}
        max={max}
        step={step}
        placeholder={placeholder}
        data-testid={testId}
        onChange={(e) => {
          setText(e.target.value);
          if (e.target.value === '') return onChange(undefined);
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(min !== undefined || max !== undefined ? Math.min(max ?? n, Math.max(min ?? n, n)) : n);
        }}
      />
      {suffix && <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">{suffix}</span>}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, testId }: { value: string | undefined; onChange: (v: string) => void; placeholder?: string; testId?: string }) {
  return <input className={inputCls} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} data-testid={testId} />;
}

const SWATCHES = ['#000000', '#333333', '#ffffff', '#2c5aa0', '#4472c4', '#9bc2e6', '#bdd7ee', '#d6e4f0', '#d0cece', '#d9d9d9', '#f2f2f2', '#d4edda', '#fff3cd', '#f8d7da', '#c00000', '#7030a0'];

export function ColorInput({ value, onChange, allowEmpty = true }: { value: string | undefined; onChange: (v: string | undefined) => void; allowEmpty?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={`${inputCls} flex items-center gap-2 text-left`}>
        <span className="h-4 w-4 shrink-0 rounded border border-slate-300" style={{ background: value || 'transparent', backgroundImage: value ? undefined : 'linear-gradient(45deg,#e2e8f0 25%,transparent 25%,transparent 75%,#e2e8f0 75%),linear-gradient(45deg,#e2e8f0 25%,transparent 25%,transparent 75%,#e2e8f0 75%)', backgroundSize: '6px 6px', backgroundPosition: '0 0,3px 3px' }} />
        <span className="truncate font-mono text-[11px]">{value || 'None'}</span>
      </button>
      {open && (
        <div className="absolute left-0 z-30 mt-1 w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-xl">
          <div className="grid grid-cols-8 gap-1">
            {SWATCHES.map((c) => (
              <button key={c} type="button" title={c} onClick={() => (onChange(c), setOpen(false))} className="h-5 w-5 rounded border border-slate-300" style={{ background: c }} />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <input type="color" value={value && /^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={(e) => onChange(e.target.value)} className="h-7 w-9 cursor-pointer rounded border border-slate-200" />
            <input className={inputCls} value={value ?? ''} placeholder="#hex" onChange={(e) => onChange(e.target.value || undefined)} />
          </div>
          {allowEmpty && (
            <button type="button" onClick={() => (onChange(undefined), setOpen(false))} className="mt-2 w-full rounded-md py-1 text-[11px] text-slate-500 hover:bg-slate-100">
              No colour
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function Select<T extends string>({ value, onChange, options, testId }: { value: T | undefined; onChange: (v: T) => void; options: Array<{ value: T; label: string }>; testId?: string }) {
  return (
    <select className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value as T)} data-testid={testId}>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ checked, onChange, label, hint, testId }: { checked: boolean | undefined; onChange: (v: boolean) => void; label: string; hint?: string; testId?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={!!checked}
        onClick={() => onChange(!checked)}
        data-testid={testId}
        className={`relative mt-0.5 h-4 w-7 shrink-0 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-300'}`}
      >
        <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow transition-all ${checked ? 'left-3.5' : 'left-0.5'}`} />
      </button>
      <span className="text-xs leading-tight text-slate-700">
        {label}
        {hint && <span className="mt-0.5 block text-[10px] text-slate-400">{hint}</span>}
      </span>
    </label>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T | undefined; onChange: (v: T) => void; options: Array<{ value: T; label: React.ReactNode; title?: string }> }) {
  return (
    <div className="flex rounded-md border border-slate-200 bg-slate-50 p-0.5">
      {options.map((o) => (
        <button key={o.value} type="button" title={o.title} onClick={() => onChange(o.value)} className={`flex-1 rounded px-1.5 py-1 text-[11px] font-medium ${value === o.value ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const FONT_OPTIONS = [{ value: '', label: 'Template font' }, ...FONT_FAMILIES.map((f) => ({ value: f.id, label: f.label }))];
const WEIGHTS = [
  { value: '400', label: 'Regular' },
  { value: '600', label: 'Semibold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra bold' },
];

export function TextStyleEditor({ value, onChange, showAlign = true, showVertical = false }: { value: TextStyle | undefined; onChange: (v: TextStyle) => void; showAlign?: boolean; showVertical?: boolean }) {
  const s = value ?? {};
  const set = (patch: Partial<TextStyle>) => onChange({ ...s, ...patch });
  return (
    <div className="space-y-2">
      <Grid>
        <Row label="Font">
          <select className={inputCls} value={s.fontFamily ?? ''} onChange={(e) => set({ fontFamily: e.target.value || undefined })}>
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Size">
          <NumberInput value={s.fontSize} min={5} max={120} step={0.5} suffix="px" placeholder="—" onChange={(v) => set({ fontSize: v })} />
        </Row>
      </Grid>
      <Grid>
        <Row label="Weight">
          <select className={inputCls} value={String(s.fontWeight ?? '')} onChange={(e) => set({ fontWeight: e.target.value ? (Number(e.target.value) as TextStyle['fontWeight']) : undefined })}>
            <option value="">Default</option>
            {WEIGHTS.map((w) => (
              <option key={w.value} value={w.value}>
                {w.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Colour">
          <ColorInput value={s.color} onChange={(v) => set({ color: v })} />
        </Row>
      </Grid>
      {showAlign && (
        <Segmented
          value={s.align ?? 'left'}
          onChange={(v) => set({ align: v })}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Centre' },
            { value: 'right', label: 'Right' },
            { value: 'justify', label: 'Justify' },
          ]}
        />
      )}
      {showVertical && (
        <Segmented
          value={s.verticalAlign ?? 'top'}
          onChange={(v) => set({ verticalAlign: v })}
          options={[
            { value: 'top', label: 'Top' },
            { value: 'middle', label: 'Middle' },
            { value: 'bottom', label: 'Bottom' },
          ]}
        />
      )}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        <Toggle checked={s.italic} onChange={(v) => set({ italic: v || undefined })} label="Italic" />
        <Toggle checked={s.underline} onChange={(v) => set({ underline: v || undefined })} label="Underline" />
        <Toggle checked={s.uppercase} onChange={(v) => set({ uppercase: v || undefined })} label="CAPS" />
      </div>
      <Grid>
        <Row label="Line height">
          <NumberInput value={s.lineHeight} min={0.8} max={3} step={0.05} placeholder="1.3" onChange={(v) => set({ lineHeight: v })} />
        </Row>
        <Row label="Letter spacing">
          <NumberInput value={s.letterSpacing} min={-2} max={20} step={0.25} suffix="px" placeholder="0" onChange={(v) => set({ letterSpacing: v })} />
        </Row>
      </Grid>
    </div>
  );
}

export function BarStyleEditor({ label, value, onChange }: { label: string; value: BarStyle | undefined; onChange: (v: BarStyle) => void }) {
  const b = value ?? {};
  const set = (patch: Partial<BarStyle>) => onChange({ ...b, ...patch });
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
      <div className="mb-2 text-[11px] font-semibold text-slate-600">{label}</div>
      <Grid>
        <Row label="Fill">
          <ColorInput value={b.background} onChange={(v) => set({ background: v })} />
        </Row>
        <Row label="Text">
          <ColorInput value={b.color} onChange={(v) => set({ color: v })} />
        </Row>
      </Grid>
      <div className="mt-2 grid grid-cols-[1fr_70px] gap-2">
        <Segmented
          value={b.align ?? 'left'}
          onChange={(v) => set({ align: v })}
          options={[
            { value: 'left', label: 'Left' },
            { value: 'center', label: 'Centre' },
            { value: 'right', label: 'Right' },
          ]}
        />
        <NumberInput value={b.fontSize} min={6} max={40} step={0.5} suffix="px" placeholder="—" onChange={(v) => set({ fontSize: v })} />
      </div>
      <div className="mt-2">
        <Toggle checked={b.uppercase} onChange={(v) => set({ uppercase: v || undefined })} label="CAPITALS" />
      </div>
    </div>
  );
}

export function TableLookEditor({ value, onChange }: { value: TableLook; onChange: (v: Partial<TableLook>) => void }) {
  return (
    <div className="space-y-2">
      <Grid cols={3}>
        <Row label="Lines">
          <NumberInput value={value.borderWidth} min={0} max={6} step={0.5} suffix="px" placeholder="1" onChange={(v) => onChange({ borderWidth: v })} />
        </Row>
        <Row label="Outline">
          <NumberInput value={value.outerBorderWidth} min={0} max={8} step={0.5} suffix="px" placeholder="=" onChange={(v) => onChange({ outerBorderWidth: v })} />
        </Row>
        <Row label="Padding">
          <NumberInput value={value.cellPadding} min={0} max={30} suffix="px" placeholder="4" onChange={(v) => onChange({ cellPadding: v })} />
        </Row>
      </Grid>
      <Grid>
        <Row label="Line colour">
          <ColorInput value={value.borderColor} onChange={(v) => onChange({ borderColor: v })} />
        </Row>
        <Row label="Text size">
          <NumberInput value={value.fontSize} min={5} max={40} step={0.5} suffix="px" placeholder="—" onChange={(v) => onChange({ fontSize: v })} />
        </Row>
      </Grid>
      <Row label="Font">
        <select className={inputCls} value={value.fontFamily ?? ''} onChange={(e) => onChange({ fontFamily: e.target.value || undefined })}>
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </Row>
    </div>
  );
}

/** Columns of a data table: label, which value, width %, alignment. */
export function ColumnsEditor<K extends string>({ value, onChange, keys }: { value: ColumnDef<K>[]; onChange: (v: ColumnDef<K>[]) => void; keys: Array<{ value: K; label: string }> }) {
  const set = (i: number, patch: Partial<ColumnDef<K>>) => onChange(value.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const move = (i: number, d: number) => {
    const next = [...value];
    const [c] = next.splice(i, 1);
    next.splice(Math.max(0, Math.min(next.length, i + d)), 0, c);
    onChange(next);
  };
  const total = value.reduce((s, c) => s + (c.width || 0), 0);
  return (
    <div className="space-y-1.5">
      {value.map((c, i) => (
        <div key={i} className="rounded-lg border border-slate-100 bg-slate-50/60 p-2">
          <div className="grid grid-cols-[1fr_60px] gap-1.5">
            <input className={inputCls} value={c.label} placeholder="Heading" onChange={(e) => set(i, { label: e.target.value })} />
            <NumberInput value={c.width} min={1} max={100} suffix="%" onChange={(v) => set(i, { width: v ?? 10 })} />
          </div>
          <div className="mt-1.5 grid grid-cols-[1fr_auto] gap-1.5">
            <select className={inputCls} value={c.key} onChange={(e) => set(i, { key: e.target.value as K })}>
              {keys.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-0.5">
              <Segmented
                value={c.align ?? 'left'}
                onChange={(v) => set(i, { align: v })}
                options={[
                  { value: 'left', label: 'L', title: 'Left' },
                  { value: 'center', label: 'C', title: 'Centre' },
                  { value: 'right', label: 'R', title: 'Right' },
                ]}
              />
              <IconBtn title="Move up" onClick={() => move(i, -1)}>
                <ArrowUpIcon className="h-3 w-3" />
              </IconBtn>
              <IconBtn title="Move down" onClick={() => move(i, 1)}>
                <ArrowDownIcon className="h-3 w-3" />
              </IconBtn>
              <IconBtn title="Remove column" danger onClick={() => onChange(value.filter((_, j) => j !== i))} disabled={value.length <= 1}>
                <TrashIcon className="h-3 w-3" />
              </IconBtn>
            </div>
          </div>
        </div>
      ))}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => onChange([...value, { key: keys[0].value, label: keys[0].label, width: 15, align: 'center' }])} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">
          <PlusIcon className="h-3 w-3" /> Add column
        </button>
        <span className={`text-[10px] ${Math.round(total) === 100 ? 'text-slate-400' : 'text-amber-600'}`}>widths total {Math.round(total)}%{Math.round(total) === 100 ? '' : ' (scaled to fit)'}</span>
      </div>
    </div>
  );
}

export function IconBtn({ children, onClick, title, danger, disabled, testId }: { children: React.ReactNode; onClick: () => void; title: string; danger?: boolean; disabled?: boolean; testId?: string }) {
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} disabled={disabled} data-testid={testId} className={`rounded p-1 disabled:opacity-30 ${danger ? 'text-rose-500 hover:bg-rose-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
      {children}
    </button>
  );
}

/** Text with an "Insert field" menu for {{merge}} fields. */
export function MergeTextArea({ value, onChange, fields, rows = 3, testId }: { value: string; onChange: (v: string) => void; fields: ExtraFieldDef[]; rows?: number; testId?: string }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [open, setOpen] = useState(false);
  const insert = (path: string) => {
    const ta = ref.current;
    const token = `{{${path}}}`;
    if (!ta) return onChange(value + token);
    const start = ta.selectionStart ?? value.length;
    const end = ta.selectionEnd ?? value.length;
    const next = value.slice(0, start) + token + value.slice(end);
    onChange(next);
    setOpen(false);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + token.length, start + token.length);
    });
  };
  const groups = groupCatalog(catalogFor(fields).filter((f) => f.printable));
  return (
    <div className="relative">
      <textarea ref={ref} rows={rows} className={`${inputCls} resize-y font-[inherit] leading-snug`} value={value} onChange={(e) => onChange(e.target.value)} data-testid={testId} />
      <div className="mt-1 flex items-center justify-between">
        <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800" data-testid="insert-field">
          <CodeBracketIcon className="h-3 w-3" /> Insert field
        </button>
        <span className="text-[10px] text-slate-400" title="[[ … ]] hides a part when its fields are empty, e.g. [[ | {{school.website}}]]">**bold** · *italic* · [[optional]]</span>
      </div>
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-auto rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl">
          {groups.map(([group, items]) => (
            <div key={group} className="mb-1">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-400">{group}</div>
              {items.map((f) => (
                <button key={f.path} type="button" onClick={() => insert(f.path)} className="flex w-full items-center justify-between rounded px-2 py-1 text-left text-xs text-slate-700 hover:bg-indigo-50">
                  <span>{f.label}</span>
                  <code className="text-[10px] text-slate-400">{f.path}</code>
                </button>
              ))}
            </div>
          ))}
          <div className="border-t border-slate-100 px-2 pt-1.5 text-[10px] text-slate-400">Dates: add |long or |medium, e.g. {'{{meta.reportDate|long}}'}</div>
        </div>
      )}
    </div>
  );
}

function groupCatalog(list: CatalogField[]): Array<[string, CatalogField[]]> {
  const map = new Map<string, CatalogField[]>();
  list.forEach((f) => map.set(f.group, [...(map.get(f.group) ?? []), f]));
  return [...map.entries()];
}

// ───────────────────────────────────────── show/hide rule builder ──

type Clause = { field: string; op: ConditionOp; value?: string | number | boolean | Array<string | number> };

const OPS_BY_KIND: Record<string, Array<{ value: ConditionOp; label: string }>> = {
  grade: [
    { value: 'in', label: 'is one of' },
    { value: 'notIn', label: 'is not one of' },
  ],
  number: [
    { value: 'eq', label: 'is' },
    { value: 'neq', label: 'is not' },
    { value: 'gt', label: 'is more than' },
    { value: 'gte', label: 'is at least' },
    { value: 'lt', label: 'is less than' },
    { value: 'lte', label: 'is at most' },
  ],
  list: [
    { value: 'gt', label: 'is more than' },
    { value: 'eq', label: 'is' },
    { value: 'empty', label: 'is none' },
    { value: 'notEmpty', label: 'is at least one' },
  ],
  text: [
    { value: 'eq', label: 'is' },
    { value: 'neq', label: 'is not' },
    { value: 'empty', label: 'is empty' },
    { value: 'notEmpty', label: 'is filled in' },
  ],
  date: [
    { value: 'empty', label: 'is empty' },
    { value: 'notEmpty', label: 'is filled in' },
  ],
};

function toClauses(c: Condition | null | undefined): { mode: 'and' | 'or'; clauses: Clause[] } {
  if (!c) return { mode: 'and', clauses: [] };
  if ('conditions' in c && (c.op === 'and' || c.op === 'or')) return { mode: c.op, clauses: c.conditions.filter((x): x is Clause => 'field' in x) };
  if ('field' in c) return { mode: 'and', clauses: [c] };
  return { mode: 'and', clauses: [] };
}

export function ConditionEditor({ value, onChange, fields, verdict }: { value: Condition | null | undefined; onChange: (v: Condition | null) => void; fields: ExtraFieldDef[]; verdict?: boolean | null }) {
  const { mode, clauses } = toClauses(value);
  const testable = catalogFor(fields).filter((f) => f.testable);
  const emit = (m: 'and' | 'or', list: Clause[]) => onChange(list.length === 0 ? null : list.length === 1 ? list[0] : { op: m, conditions: list });
  const setClause = (i: number, patch: Partial<Clause>) => emit(mode, clauses.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const kindOf = (path: string) => testable.find((f) => f.path === path)?.kind ?? 'text';

  return (
    <div className="space-y-2" data-testid="condition-editor">
      {clauses.length === 0 ? (
        <p className="text-[11px] text-slate-500">Always shown.</p>
      ) : (
        <div className="flex items-center gap-1.5 text-[11px] text-slate-600">
          Show when
          <select className="rounded border border-slate-200 bg-white px-1 py-0.5 text-[11px]" value={mode} onChange={(e) => emit(e.target.value as 'and' | 'or', clauses)}>
            <option value="and">all</option>
            <option value="or">any</option>
          </select>
          of these are true:
        </div>
      )}
      {clauses.map((c, i) => {
        const kind = kindOf(c.field);
        const ops = OPS_BY_KIND[kind] ?? OPS_BY_KIND.text;
        const needsValue = c.op !== 'empty' && c.op !== 'notEmpty';
        return (
          <div key={i} className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2">
            <div className="flex gap-1">
              <select
                className={inputCls}
                value={c.field}
                onChange={(e) => {
                  const k = kindOf(e.target.value);
                  setClause(i, { field: e.target.value, op: (OPS_BY_KIND[k] ?? OPS_BY_KIND.text)[0].value, value: k === 'grade' ? [] : '' });
                }}
              >
                {testable.map((f) => (
                  <option key={f.path} value={f.path}>
                    {f.label}
                  </option>
                ))}
              </select>
              <IconBtn title="Remove rule" danger onClick={() => emit(mode, clauses.filter((_, j) => j !== i))}>
                <TrashIcon className="h-3.5 w-3.5" />
              </IconBtn>
            </div>
            <select className={inputCls} value={c.op} onChange={(e) => setClause(i, { op: e.target.value as ConditionOp })}>
              {ops.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {needsValue &&
              (kind === 'grade' ? (
                <div className="flex flex-wrap gap-1">
                  {GRADES.map((g) => {
                    const list = Array.isArray(c.value) ? c.value.map(String) : [];
                    const on = list.includes(g);
                    return (
                      <button key={g} type="button" onClick={() => setClause(i, { value: on ? list.filter((x) => x !== g) : [...list, g] })} className={`min-w-[30px] rounded-md border px-1.5 py-0.5 text-[11px] font-semibold ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-indigo-300'}`}>
                        {g}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input className={inputCls} value={String(c.value ?? '')} placeholder="Value" onChange={(e) => setClause(i, { value: kind === 'number' || kind === 'list' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value })} />
              ))}
          </div>
        );
      })}
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => emit(mode, [...clauses, { field: 'student.grade', op: 'in', value: [] }])} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800" data-testid="add-condition">
          <PlusIcon className="h-3 w-3" /> Add a rule
        </button>
        {clauses.length > 0 && verdict !== null && verdict !== undefined && (
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${verdict ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{verdict ? 'Shown for this preview' : 'Hidden for this preview'}</span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────── image source ──

const ASSET_OPTIONS = [
  { value: 'logo', label: 'School logo' },
  { value: 'principalSignature', label: "Principal's signature" },
  { value: 'teacherSignature', label: "Teacher's signature" },
  { value: 'stamp', label: 'School stamp' },
  { value: 'upload', label: 'Uploaded image…' },
];

export function ImageSourcePicker({ value, onChange, onError }: { value: ImageSource | null | undefined; onChange: (v: ImageSource) => void; onError: (msg: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const current = !value ? 'logo' : value.kind === 'asset' ? value.asset : 'upload';
  const upload = async (file: File) => {
    setBusy(true);
    try {
      const small = await downscaleImage(file, { maxEdge: 1400, quality: 0.86, keepPng: true, maxBytes: 550_000 });
      if (small.size > 600_000) throw new Error('That image is too large even after resizing (max 600 KB).');
      const url = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.onerror = () => reject(new Error('Could not read the image'));
        r.readAsDataURL(small);
      });
      if (!/^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/.test(url)) throw new Error('Use a PNG, JPG, GIF, WebP or SVG image.');
      onChange({ kind: 'url', url });
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-1.5">
      <select
        className={inputCls}
        value={current}
        onChange={(e) => {
          const v = e.target.value;
          if (v === 'upload') fileRef.current?.click();
          else onChange({ kind: 'asset', asset: v as 'logo' });
        }}
      >
        {ASSET_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {value?.kind === 'url' && value.url && <img src={value.url} alt="" className="max-h-20 rounded border border-slate-200 bg-white object-contain p-1" />}
      <button type="button" onClick={() => fileRef.current?.click()} className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800" disabled={busy}>
        {busy ? 'Uploading…' : value?.kind === 'url' ? 'Replace image' : 'Upload an image instead'}
      </button>
      <p className="text-[10px] leading-snug text-slate-400">Logo, signatures and stamp come from Admin Panel → School Assets.</p>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
    </div>
  );
}
