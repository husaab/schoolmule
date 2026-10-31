'use client';

/** Left rail: Add (palette), Layers (outline), Rules (scales, marks, extra fields). */
import { useMemo, useState } from 'react';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  EyeSlashIcon,
  PlusIcon,
  RectangleGroupIcon,
  Squares2X2Icon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';
import { BLOCK_CATALOG, blockLabel, createBlock } from '@/reportkit/factory';
import { evaluateCondition } from '@/reportkit/conditions';
import { formatMark, GRADES, ONTARIO_LETTER_BANDS } from '@/reportkit/format';
import { SCALES } from '@/reportkit/defaults/scales';
import type { Block, BlockType, ExtraFieldDef, ExtraFieldType, MarkFormatRule, RatingScale } from '@/reportkit/types';
import { newId } from '@/reportkit/util';
import { useDesignerStore } from './store';
import { ZONE_LABELS, findBlock, insertBlock, moveBlock, outline, renameFieldKey, updateDoc, type ZoneKey } from './docOps';
import { ColorInput, Grid, IconBtn, NumberInput, Row, Section, Select, TextInput, Toggle, inputCls } from './fields';

type Tab = 'add' | 'layers' | 'rules';

export default function LeftRail() {
  const [tab, setTab] = useState<Tab>('add');
  return (
    <div className="flex h-full flex-col">
      <div className="flex border-b border-slate-200 px-2 pt-2">
        {(
          [
            ['add', 'Add', PlusIcon],
            ['layers', 'Layers', Squares2X2Icon],
            ['rules', 'Rules', AdjustmentsHorizontalIcon],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            data-testid={`rail-tab-${key}`}
            className={`-mb-px flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2 text-xs font-semibold ${tab === key ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tab === 'add' && <AddPanel />}
        {tab === 'layers' && <LayersPanel />}
        {tab === 'rules' && <RulesPanel />}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────── add ──

const GROUP_LABELS = { data: 'Report data', content: 'Text & forms', layout: 'Layout' } as const;

function AddPanel() {
  const doc = useDesignerStore((s) => s.doc)!;
  const selection = useDesignerStore((s) => s.selection);
  const commit = useDesignerStore((s) => s.commit);
  const select = useDesignerStore((s) => s.select);

  const add = (type: BlockType) => {
    const block = createBlock(type, doc);
    // After the selected top-level block, else at the end.
    const after = selection?.kind === 'block' && doc.blocks.some((b) => b.id === selection.id) ? selection.id : null;
    commit(insertBlock(doc, block, after));
    select({ kind: 'block', id: block.id });
  };

  return (
    <div className="space-y-4 p-3">
      {(['data', 'content', 'layout'] as const).map((group) => (
        <div key={group}>
          <div className="mb-1.5 px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">{GROUP_LABELS[group]}</div>
          <div className="space-y-1">
            {BLOCK_CATALOG.filter((b) => b.group === group).map((b) => (
              <button
                key={b.type}
                type="button"
                onClick={() => add(b.type)}
                data-testid={`add-block-${b.type}`}
                className="group flex w-full items-start gap-2.5 rounded-lg border border-transparent px-2 py-2 text-left hover:border-indigo-100 hover:bg-indigo-50/60"
              >
                <BlockGlyph type={b.type} />
                <span className="min-w-0">
                  <span className="block text-xs font-semibold text-slate-800">{b.label}</span>
                  <span className="block text-[11px] leading-snug text-slate-500">{b.description}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
      <div className="rounded-lg border border-dashed border-slate-200 p-3 text-[11px] leading-relaxed text-slate-500">
        <strong className="text-slate-700">Header, footer & free areas:</strong> click one on the page, then add text, fields, the logo, images and shapes — and drag them anywhere.
      </div>
    </div>
  );
}

function BlockGlyph({ type }: { type: BlockType }) {
  const cls = 'mt-0.5 h-7 w-7 shrink-0 rounded-md border border-slate-200 bg-white p-1 text-indigo-500 group-hover:border-indigo-200';
  const bars = (n: number, head = true) => (
    <svg viewBox="0 0 20 20" className={cls}>
      {head && <rect x="2" y="2" width="16" height="3" rx="0.5" fill="currentColor" opacity="0.8" />}
      {Array.from({ length: n }).map((_, i) => (
        <g key={i}>
          <rect x="2" y={6 + i * 3.2} width="11" height="2" rx="0.5" fill="currentColor" opacity="0.35" />
          <rect x="14" y={6 + i * 3.2} width="4" height="2" rx="0.5" fill="currentColor" opacity="0.6" />
        </g>
      ))}
    </svg>
  );
  switch (type) {
    case 'skillsTable':
    case 'learningSkills':
      return bars(4);
    case 'commentsTable':
      return (
        <svg viewBox="0 0 20 20" className={cls}>
          <rect x="2" y="2" width="16" height="3" fill="currentColor" opacity="0.8" />
          <rect x="2" y="6.5" width="4" height="5" fill="currentColor" opacity="0.6" />
          <rect x="7" y="6.5" width="11" height="5" fill="currentColor" opacity="0.3" />
          <rect x="2" y="12.5" width="4" height="5" fill="currentColor" opacity="0.6" />
          <rect x="7" y="12.5" width="11" height="5" fill="currentColor" opacity="0.3" />
        </svg>
      );
    case 'subjectCards':
      return (
        <svg viewBox="0 0 20 20" className={cls}>
          <rect x="2" y="2" width="16" height="7" rx="1" fill="none" stroke="currentColor" />
          <rect x="2" y="2" width="16" height="2.5" fill="currentColor" opacity="0.8" />
          <rect x="2" y="11" width="16" height="7" rx="1" fill="none" stroke="currentColor" />
          <rect x="2" y="11" width="16" height="2.5" fill="currentColor" opacity="0.8" />
        </svg>
      );
    case 'ratingKey':
      return (
        <svg viewBox="0 0 20 20" className={cls}>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x="2" y={2 + i * 4.2} width="4" height="3" rx="0.5" fill="currentColor" opacity="0.8" />
              <rect x="7.5" y={2.5 + i * 4.2} width="10" height="2" rx="0.5" fill="currentColor" opacity="0.35" />
            </g>
          ))}
        </svg>
      );
    case 'table':
      return (
        <svg viewBox="0 0 20 20" className={cls}>
          <rect x="2" y="3" width="16" height="14" fill="none" stroke="currentColor" />
          <line x1="2" y1="8" x2="18" y2="8" stroke="currentColor" />
          <line x1="2" y1="12.5" x2="18" y2="12.5" stroke="currentColor" />
          <line x1="8" y1="8" x2="8" y2="17" stroke="currentColor" />
        </svg>
      );
    case 'text':
      return (
        <svg viewBox="0 0 20 20" className={cls}>
          {[3, 7, 11, 15].map((y, i) => (
            <rect key={y} x="2" y={y} width={i === 3 ? 9 : 16} height="2" rx="1" fill="currentColor" opacity="0.5" />
          ))}
        </svg>
      );
    case 'signatures':
      return (
        <svg viewBox="0 0 20 20" className={cls}>
          <path d="M3 11c2-4 3 2 5-1s2 2 3 0" fill="none" stroke="currentColor" strokeLinecap="round" />
          <line x1="2" y1="14" x2="9" y2="14" stroke="currentColor" />
          <line x1="11" y1="14" x2="18" y2="14" stroke="currentColor" />
        </svg>
      );
    case 'columns':
      return (
        <svg viewBox="0 0 20 20" className={cls}>
          <rect x="2" y="3" width="7" height="14" rx="1" fill="currentColor" opacity="0.35" />
          <rect x="11" y="3" width="7" height="14" rx="1" fill="currentColor" opacity="0.35" />
        </svg>
      );
    case 'canvas':
    case 'freePage':
      return (
        <svg viewBox="0 0 20 20" className={cls}>
          <rect x="2" y="2" width="16" height="16" rx="1" fill="none" stroke="currentColor" strokeDasharray="2 1.5" />
          <circle cx="7" cy="7" r="2.2" fill="currentColor" opacity="0.6" />
          <rect x="9" y="11" width="7" height="4" fill="currentColor" opacity="0.4" />
        </svg>
      );
    default:
      return <RectangleGroupIcon className={cls} />;
  }
}

// ─────────────────────────────────────────────────────── layers ──

function LayersPanel() {
  const doc = useDesignerStore((s) => s.doc)!;
  const selection = useDesignerStore((s) => s.selection);
  const select = useDesignerStore((s) => s.select);
  const commit = useDesignerStore((s) => s.commit);
  const previewData = useDesignerStore((s) => s.previewData);
  const items = outline(doc);

  const zones: ZoneKey[] = ['firstHeader', 'header', 'firstFooter', 'footer'];
  const rowCls = (on: boolean) =>
    `group flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-xs ${on ? 'bg-indigo-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`;

  return (
    <div className="space-y-3 p-3" data-testid="layers-panel">
      <div>
        <div className="mb-1 px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Page furniture</div>
        <button type="button" className={rowCls(selection?.kind === 'page' || selection === null)} onClick={() => select({ kind: 'page' })}>
          Page setup
        </button>
        {zones
          .filter((z) => !!doc[z])
          .map((z) => (
            <button key={z} type="button" className={rowCls(selection?.kind === 'zone' && selection.zone === z)} onClick={() => select({ kind: 'zone', zone: z })} data-testid={`layer-zone-${z}`}>
              {ZONE_LABELS[z]}
              <span className="ml-auto text-[10px] opacity-60">{doc[z]!.elements.length}</span>
            </button>
          ))}
      </div>
      <div>
        <div className="mb-1 px-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">Body</div>
        {items.length === 0 && <p className="px-2 text-[11px] text-slate-500">No blocks yet. Add one from the Add tab.</p>}
        {items.map(({ block, depth }) => {
          const on = selection?.kind === 'block' && selection.id === block.id;
          const hidden = previewData ? !evaluateCondition(block.showWhen, { ...previewData }) : false;
          const topLevel = depth === 0;
          return (
            <div key={block.id} className={rowCls(on)} style={{ paddingLeft: 8 + depth * 14 }} data-testid={`layer-${block.id}`}>
              <button type="button" className="min-w-0 flex-1 truncate text-left" onClick={() => select({ kind: 'block', id: block.id })}>
                {block.name || blockLabel(block.type)}
              </button>
              {hidden && (
                <span title="Hidden for this preview by a show/hide rule">
                  <EyeSlashIcon className={`h-3.5 w-3.5 ${on ? 'text-white' : 'text-amber-500'}`} />
                </span>
              )}
              {block.showWhen && !hidden && <span className={`text-[9px] font-bold uppercase ${on ? 'text-indigo-100' : 'text-indigo-500'}`}>rule</span>}
              {topLevel && (
                <span className="flex opacity-0 group-hover:opacity-100">
                  <button type="button" title="Move up" className="rounded p-0.5 hover:bg-black/10" onClick={() => commit(moveBlock(doc, block.id, -1))}>
                    <ArrowUpIcon className="h-3 w-3" />
                  </button>
                  <button type="button" title="Move down" className="rounded p-0.5 hover:bg-black/10" onClick={() => commit(moveBlock(doc, block.id, 1))}>
                    <ArrowDownIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              {block.type === 'columns' && <ColumnAdder block={block} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ColumnAdder({ block }: { block: Extract<Block, { type: 'columns' }> }) {
  const doc = useDesignerStore((s) => s.doc)!;
  const commit = useDesignerStore((s) => s.commit);
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button type="button" title="Add a block to a column" className="rounded p-0.5 opacity-0 hover:bg-black/10 group-hover:opacity-100" onClick={() => setOpen(true)}>
        <PlusIcon className="h-3 w-3" />
      </button>
    );
  return (
    <select
      autoFocus
      className="rounded border border-slate-300 bg-white px-1 text-[11px] text-slate-700"
      onBlur={() => setOpen(false)}
      onChange={(e) => {
        const [col, type] = e.target.value.split(':');
        if (!type) return;
        commit(
          updateDoc(doc, (d) => {
            const found = findBlock(d, block.id);
            if (found?.block.type === 'columns') found.block.columns[Number(col)].blocks.push(createBlock(type as BlockType, d));
          }),
        );
        setOpen(false);
      }}
      defaultValue=""
    >
      <option value="">Add to…</option>
      {block.columns.map((_, c) =>
        BLOCK_CATALOG.filter((b) => !['columns', 'freePage', 'pageBreak'].includes(b.type)).map((b) => (
          <option key={`${c}:${b.type}`} value={`${c}:${b.type}`}>
            Column {c + 1}: {b.label}
          </option>
        )),
      )}
    </select>
  );
}

// ─────────────────────────────────────────────────────── rules ──

function RulesPanel() {
  return (
    <div data-testid="rules-panel">
      <ScalesSection />
      <MarksSection />
      <FieldsSection />
    </div>
  );
}

function ScalesSection() {
  const doc = useDesignerStore((s) => s.doc)!;
  const commit = useDesignerStore((s) => s.commit);
  const [open, setOpen] = useState<string | null>(null);
  const setScales = (scales: RatingScale[], key?: string) => commit(updateDoc(doc, (d) => void (d.scales = scales)), key);
  const used = useMemo(() => new Set(JSON.stringify(doc.blocks).match(/"scaleId":"([^"]+)"/g)?.map((m) => m.slice(11, -1)) ?? []), [doc.blocks]);
  const presets = Object.values(SCALES).filter((p) => !doc.scales.some((s) => s.id === p.id));

  return (
    <Section title="Rating scales">
      {doc.scales.map((scale, si) => (
        <div key={scale.id} className="rounded-lg border border-slate-200 bg-white" data-testid={`scale-${scale.id}`}>
          <button type="button" onClick={() => setOpen(open === scale.id ? null : scale.id)} className="flex w-full items-center justify-between px-2.5 py-2 text-left">
            <span className="text-xs font-semibold text-slate-800">{scale.name}</span>
            <span className="flex gap-0.5">
              {scale.levels.map((l) => (
                <span key={l.code} className="rounded px-1 text-[10px] font-bold" style={{ background: l.color || '#f1f5f9', color: l.textColor || '#334155' }}>
                  {l.code}
                </span>
              ))}
            </span>
          </button>
          {open === scale.id && (
            <div className="space-y-2 border-t border-slate-100 p-2.5">
              <Row label="Name">
                <TextInput value={scale.name} onChange={(v) => setScales(doc.scales.map((s, j) => (j === si ? { ...s, name: v } : s)), `sn${si}`)} />
              </Row>
              {scale.levels.map((l, li) => {
                const setLevel = (patch: Partial<RatingScale['levels'][number]>, key?: string) =>
                  setScales(
                    doc.scales.map((s, j) => (j === si ? { ...s, levels: s.levels.map((x, k) => (k === li ? { ...x, ...patch } : x)) } : s)),
                    key ? `${key}${si}${li}` : undefined,
                  );
                return (
                  <div key={li} className="space-y-1.5 rounded-md bg-slate-50 p-2">
                    <div className="grid grid-cols-[52px_1fr_auto] gap-1.5">
                      <input className={inputCls} value={l.code} onChange={(e) => setLevel({ code: e.target.value }, 'lc')} />
                      <input className={inputCls} value={l.label} onChange={(e) => setLevel({ label: e.target.value }, 'll')} />
                      <IconBtn title="Remove level" danger disabled={scale.levels.length <= 1} onClick={() => setScales(doc.scales.map((s, j) => (j === si ? { ...s, levels: s.levels.filter((_, k) => k !== li) } : s)))}>
                        <TrashIcon className="h-3 w-3" />
                      </IconBtn>
                    </div>
                    <input className={inputCls} placeholder="Description (optional)" value={l.description ?? ''} onChange={(e) => setLevel({ description: e.target.value || undefined }, 'ld')} />
                    <Grid>
                      <Row label="Cell colour">
                        <ColorInput value={l.color} onChange={(v) => setLevel({ color: v })} />
                      </Row>
                      <Row label="Text colour">
                        <ColorInput value={l.textColor} onChange={(v) => setLevel({ textColor: v })} />
                      </Row>
                    </Grid>
                  </div>
                );
              })}
              <div className="flex items-center justify-between">
                <button type="button" className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600" onClick={() => setScales(doc.scales.map((s, j) => (j === si ? { ...s, levels: [...s.levels, { code: '?', label: 'New level' }] } : s)))}>
                  <PlusIcon className="h-3 w-3" /> Add level
                </button>
                <button
                  type="button"
                  disabled={used.has(scale.id)}
                  title={used.has(scale.id) ? 'A block uses this scale' : 'Delete scale'}
                  className="text-[11px] font-semibold text-rose-600 disabled:text-slate-300"
                  onClick={() => setScales(doc.scales.filter((_, j) => j !== si))}
                >
                  Delete scale
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-indigo-600 hover:bg-indigo-50" onClick={() => setScales([...doc.scales, { id: newId('scale'), name: 'New scale', levels: [{ code: 'A', label: 'First level' }] }])} data-testid="add-scale">
          <PlusIcon className="h-3 w-3" /> New scale
        </button>
        {presets.map((p) => (
          <button key={p.id} type="button" className="rounded-md border border-slate-200 px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-50" onClick={() => setScales([...doc.scales, JSON.parse(JSON.stringify(p))])}>
            + {p.name}
          </button>
        ))}
      </div>
    </Section>
  );
}

function MarksSection() {
  const doc = useDesignerStore((s) => s.doc)!;
  const commit = useDesignerStore((s) => s.commit);
  const marks = doc.marks;
  const set = (fn: (m: typeof marks) => void, key?: string) => commit(updateDoc(doc, (d) => fn(d.marks)), key);
  const [testGrade, setTestGrade] = useState('4');
  const [testScore, setTestScore] = useState<number | undefined>(87.25);

  const setRule = (i: number, patch: Partial<MarkFormatRule>, key?: string) => set((m) => void (m.rules[i] = { ...m.rules[i], ...patch }), key ? `${key}${i}` : undefined);

  return (
    <Section title="Marks">
      <p className="text-[11px] leading-snug text-slate-500">How percentages print on report cards. Marks themselves come from the gradebook.</p>
      {marks.rules.map((r, i) => (
        <div key={r.id} className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-2" data-testid={`mark-rule-${i}`}>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">Rule {i + 1}</span>
            <IconBtn title="Delete rule" danger onClick={() => set((m) => void m.rules.splice(i, 1))}>
              <TrashIcon className="h-3 w-3" />
            </IconBtn>
          </div>
          <div className="flex flex-wrap gap-1">
            {GRADES.filter((g) => g !== 'JK' && g !== 'SK').map((g) => {
              const on = (r.grades ?? []).includes(g);
              return (
                <button key={g} type="button" onClick={() => setRule(i, { grades: on ? (r.grades ?? []).filter((x) => x !== g) : [...(r.grades ?? []), g] })} className={`min-w-[26px] rounded border px-1 text-[11px] font-semibold ${on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 text-slate-600'}`}>
                  {g}
                </button>
              );
            })}
          </div>
          <Grid>
            <Select
              value={r.format}
              onChange={(v) => setRule(i, { format: v })}
              options={[
                { value: 'letter', label: 'Letter (A+ … D-)' },
                { value: 'percent', label: 'Percent (87.3%)' },
                { value: 'number', label: 'Number (87.3)' },
              ]}
            />
            {r.format !== 'letter' && <NumberInput value={r.decimals ?? 1} min={0} max={3} suffix="dp" onChange={(v) => setRule(i, { decimals: v ?? 0 }, 'dp')} />}
          </Grid>
        </div>
      ))}
      <button type="button" className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600" onClick={() => set((m) => void m.rules.push({ id: newId('rule'), grades: [], format: 'percent', decimals: 1 }))}>
        <PlusIcon className="h-3 w-3" /> Add a rule
      </button>
      <Toggle checked={marks.below.enabled} onChange={(v) => set((m) => void (m.below.enabled = v))} label="Print a code below a threshold" />
      {marks.below.enabled && (
        <Grid>
          <Row label="Below">
            <NumberInput value={marks.below.threshold} min={0} max={100} suffix="%" onChange={(v) => set((m) => void (m.below.threshold = v ?? 50), 'bt')} />
          </Row>
          <Row label="Print">
            <TextInput value={marks.below.text} onChange={(v) => set((m) => void (m.below.text = v), 'btx')} />
          </Row>
        </Grid>
      )}
      <Grid>
        <Row label="No evidence yet">
          <TextInput value={marks.noEvidence} onChange={(v) => set((m) => void (m.noEvidence = v), 'ne')} />
        </Row>
        <Row label="No mark that term">
          <TextInput value={marks.notApplicable} onChange={(v) => set((m) => void (m.notApplicable = v), 'na')} />
        </Row>
      </Grid>
      <details className="rounded-lg border border-slate-200 bg-white p-2">
        <summary className="cursor-pointer text-[11px] font-semibold text-slate-600">Letter bands</summary>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          {marks.letterBands.map((b, i) => (
            <div key={i} className="flex items-center gap-1">
              <input className={`${inputCls} w-10`} value={b.label} onChange={(e) => set((m) => void (m.letterBands[i].label = e.target.value), `lb${i}`)} />
              <NumberInput value={b.min} min={0} max={100} onChange={(v) => set((m) => void (m.letterBands[i].min = v ?? 0), `lm${i}`)} />
            </div>
          ))}
        </div>
        <button type="button" className="mt-2 text-[11px] font-semibold text-slate-500" onClick={() => set((m) => void (m.letterBands = JSON.parse(JSON.stringify(ONTARIO_LETTER_BANDS))))}>
          Reset to Ontario bands
        </button>
      </details>
      <div className="rounded-lg bg-indigo-50/70 p-2.5" data-testid="mark-tester">
        <div className="mb-1.5 text-[11px] font-semibold text-indigo-900">Try it</div>
        <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-1.5">
          <Select value={testGrade} onChange={setTestGrade} options={GRADES.filter((g) => g !== 'JK' && g !== 'SK').map((g) => ({ value: g, label: `Grade ${g}` }))} />
          <NumberInput value={testScore} min={0} max={100} step={0.01} suffix="%" onChange={setTestScore} testId="mark-tester-score" />
          <span className="min-w-[48px] rounded-md bg-white px-2 py-1 text-center text-sm font-bold text-indigo-700" data-testid="mark-tester-result">
            {testScore === undefined ? marks.noEvidence : formatMark(testScore, testGrade, marks)}
          </span>
        </div>
      </div>
    </Section>
  );
}

const FIELD_TYPES: Array<{ value: ExtraFieldType; label: string }> = [
  { value: 'text', label: 'Short text' },
  { value: 'longtext', label: 'Paragraph' },
  { value: 'select', label: 'Choice' },
  { value: 'date', label: 'Date' },
  { value: 'checkbox', label: 'Yes / no' },
];

function slug(label: string, taken: Set<string>): string {
  const base = (label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'field').replace(/^(\d)/, 'f_$1').slice(0, 30);
  let key = base;
  let n = 2;
  while (taken.has(key)) key = `${base}_${n++}`;
  return key;
}

function FieldsSection() {
  const doc = useDesignerStore((s) => s.doc)!;
  const commit = useDesignerStore((s) => s.commit);
  const setFields = (fields: ExtraFieldDef[], key?: string) => commit(updateDoc(doc, (d) => void (d.fields = fields)), key);
  const setField = (i: number, patch: Partial<ExtraFieldDef>, key?: string) => setFields(doc.fields.map((f, j) => (j === i ? { ...f, ...patch } : f)), key ? `${key}${i}` : undefined);
  /** A new label renames an auto-made key too, and every reference to it. */
  const setLabel = (i: number, label: string) => {
    const f = doc.fields[i];
    const others = new Set(doc.fields.filter((_, j) => j !== i).map((x) => x.key));
    const auto = f.key === slug(f.label, others) || /^field_\d+$/.test(f.key);
    const nextKey = auto ? slug(label || 'field', others) : f.key;
    const renamed = renameFieldKey(doc, f.key, nextKey);
    commit(updateDoc(renamed, (d) => void (d.fields[i] = { ...d.fields[i], label, key: nextKey })), `fl${i}`);
  };

  return (
    <Section title="Extra fields">
      <p className="text-[11px] leading-snug text-slate-500">
        Things you fill in per student before generating (e.g. a principal&apos;s note or next-year placement). Print one with <code>{'{{extra.key}}'}</code>. Enter values on Report templates → Report fields.
      </p>
      {doc.fields.map((f, i) => (
        <div key={i} className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-2" data-testid={`extra-field-${f.key}`}>
          <div className="grid grid-cols-[1fr_auto] gap-1.5">
            <input className={inputCls} value={f.label} placeholder="Label" onChange={(e) => setLabel(i, e.target.value)} />
            <IconBtn title="Delete field" danger onClick={() => setFields(doc.fields.filter((_, j) => j !== i))}>
              <TrashIcon className="h-3 w-3" />
            </IconBtn>
          </div>
          <Grid>
            <Select value={f.type} onChange={(v) => setField(i, { type: v, options: v === 'select' ? f.options ?? ['Option 1'] : undefined })} options={FIELD_TYPES} />
            <code className="truncate self-center rounded bg-slate-100 px-1.5 py-1 text-[10px] text-slate-600" title={`{{extra.${f.key}}}`}>
              extra.{f.key}
            </code>
          </Grid>
          {f.type === 'select' && (
            <Row label="Choices (comma-separated)">
              <input className={inputCls} defaultValue={(f.options ?? []).join(', ')} onBlur={(e) => setField(i, { options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            </Row>
          )}
          <Row label="Default">
            <TextInput value={f.defaultValue} onChange={(v) => setField(i, { defaultValue: v || undefined }, 'fd')} />
          </Row>
          <Toggle checked={f.required} onChange={(v) => setField(i, { required: v || undefined })} label="Required before generating" />
        </div>
      ))}
      <button
        type="button"
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600"
        onClick={() => {
          const taken = new Set(doc.fields.map((f) => f.key));
          setFields([...doc.fields, { key: slug(`Field ${doc.fields.length + 1}`, taken), label: `Field ${doc.fields.length + 1}`, type: 'text' }]);
        }}
        data-testid="add-extra-field"
      >
        <PlusIcon className="h-3 w-3" /> Add a field
      </button>
    </Section>
  );
}
