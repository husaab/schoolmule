'use client';

/** The right-hand panel: settings for whatever is selected. */
import { DocumentDuplicateIcon, LockClosedIcon, LockOpenIcon, PlusIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { blockLabel, createElement } from '@/reportkit/factory';
import { evaluateCondition } from '@/reportkit/conditions';
import { PAGE_SIZES } from '@/reportkit/types';
import type {
  Block,
  CanvasElement,
  ColumnDef,
  CommentsTableBlock,
  ImageSource,
  LearningSkillsBlock,
  RatingKeyBlock,
  SignaturesBlock,
  SkillColumnKey,
  SkillsTableBlock,
  SubjectCardsBlock,
  SubjectFieldKey,
  TableBlock,
  TableCellDef,
  TableRowDef,
  TemplateDoc,
} from '@/reportkit/types';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useDesignerStore } from './store';
import {
  ZONE_LABELS,
  duplicateBlock,
  duplicateElement,
  findBlock,
  findElement,
  insertElement,
  removeBlock,
  removeElement,
  restackElement,
  setFirstPageZone,
  updateBlock,
  updateDoc,
  updateElement,
  updateZone,
  type ElementContainer,
  type ZoneKey,
} from './docOps';
import {
  BarStyleEditor,
  ColorInput,
  ColumnsEditor,
  ConditionEditor,
  FONT_OPTIONS,
  Grid,
  IconBtn,
  ImageSourcePicker,
  MergeTextArea,
  NumberInput,
  Row,
  Section,
  Segmented,
  Select,
  TableLookEditor,
  TextInput,
  TextStyleEditor,
  Toggle,
  inputCls,
} from './fields';

const SKILL_KEYS: Array<{ value: SkillColumnKey; label: string }> = [
  { value: 'name', label: 'Skill' },
  { value: 'description', label: 'Description' },
  { value: 'rating', label: 'Rating (this term)' },
  { value: 't1', label: 'Rating — Term 1' },
  { value: 't2', label: 'Rating — Term 2' },
];

const SUBJECT_KEYS: Array<{ value: SubjectFieldKey; label: string }> = [
  { value: 'mark', label: 'Mark' },
  { value: 'workHabits', label: 'Work habits' },
  { value: 'behaviour', label: 'Behaviour' },
  { value: 'overall', label: 'Overall (from the two)' },
  { value: 'coreStandards', label: 'Core standards' },
];

const DATA_BLOCKS = new Set(['skillsTable', 'subjectCards', 'commentsTable', 'learningSkills']);

export default function Inspector() {
  const doc = useDesignerStore((s) => s.doc);
  const selection = useDesignerStore((s) => s.selection);
  if (!doc) return null;
  return (
    <div className="h-full overflow-y-auto" data-testid="inspector">
      {selection?.kind === 'element' ? (
        <ElementPanel id={selection.id} />
      ) : selection?.kind === 'block' ? (
        <BlockPanel id={selection.id} />
      ) : selection?.kind === 'zone' ? (
        <ZonePanel zone={selection.zone} />
      ) : (
        <PagePanel />
      )}
    </div>
  );
}

function PanelTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex items-start justify-between gap-2 border-b border-slate-100 bg-white/95 px-4 py-3 backdrop-blur">
      <div className="min-w-0">
        <h3 className="truncate text-sm font-semibold text-slate-900">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] leading-snug text-slate-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-0.5">{actions}</div>}
    </div>
  );
}

function useEdit() {
  const doc = useDesignerStore((s) => s.doc)!;
  const commit = useDesignerStore((s) => s.commit);
  return { doc, commit };
}

// ─────────────────────────────────────────────────────────── page ──

function PagePanel() {
  const { doc, commit } = useEdit();
  const set = (fn: (d: TemplateDoc) => void, key?: string) => commit(updateDoc(doc, fn), key);
  const m = doc.page.margin;
  return (
    <>
      <PanelTitle title="Page" subtitle="Size, margins and the template's look. Click anything on the page to edit it." />
      <Section title="Paper">
        <Segmented
          value={doc.page.size}
          onChange={(v) => set((d) => void (d.page.size = v))}
          options={[
            { value: 'letter', label: PAGE_SIZES.letter.label },
            { value: 'a4', label: PAGE_SIZES.a4.label },
          ]}
        />
        <Grid>
          <Row label="Left margin">
            <NumberInput value={m.left} min={0} max={300} suffix="px" onChange={(v) => set((d) => void (d.page.margin.left = v ?? 0), 'ml')} />
          </Row>
          <Row label="Right margin">
            <NumberInput value={m.right} min={0} max={300} suffix="px" onChange={(v) => set((d) => void (d.page.margin.right = v ?? 0), 'mr')} />
          </Row>
          <Row label="Gap under header">
            <NumberInput value={m.top} min={0} max={300} suffix="px" onChange={(v) => set((d) => void (d.page.margin.top = v ?? 0), 'mt')} />
          </Row>
          <Row label="Gap above footer">
            <NumberInput value={m.bottom} min={0} max={300} suffix="px" onChange={(v) => set((d) => void (d.page.margin.bottom = v ?? 0), 'mb')} />
          </Row>
        </Grid>
        <Row label="Page colour">
          <ColorInput value={doc.page.background} onChange={(v) => set((d) => void (d.page.background = v))} />
        </Row>
      </Section>
      <Section title="Look">
        <Row label="Font">
          <select className={inputCls} value={doc.theme.fontFamily} onChange={(e) => set((d) => void (d.theme.fontFamily = e.target.value || 'Mulish'))} data-testid="theme-font">
            {FONT_OPTIONS.filter((f) => f.value).map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </Row>
        <Grid>
          <Row label="Text size">
            <NumberInput value={doc.theme.fontSize} min={6} max={30} step={0.5} suffix="px" onChange={(v) => set((d) => void (d.theme.fontSize = v ?? 12), 'fs')} />
          </Row>
          <Row label="Text colour">
            <ColorInput value={doc.theme.color} allowEmpty={false} onChange={(v) => set((d) => void (d.theme.color = v ?? '#111111'))} />
          </Row>
          <Row label="Line colour">
            <ColorInput value={doc.theme.borderColor} allowEmpty={false} onChange={(v) => set((d) => void (d.theme.borderColor = v ?? '#000000'))} />
          </Row>
          <Row label="Accent">
            <ColorInput value={doc.theme.accent} allowEmpty={false} onChange={(v) => set((d) => void (d.theme.accent = v ?? '#2c5aa0'))} />
          </Row>
        </Grid>
      </Section>
      <Section title="Header & footer">
        <Toggle checked={!!doc.firstHeader} onChange={(on) => commit(setFirstPageZone(doc, 'firstHeader', on))} label="Page 1 has its own header" hint="e.g. the logo and title on page 1, the student's name on the rest" testId="toggle-first-header" />
        <Toggle checked={!!doc.firstFooter} onChange={(on) => commit(setFirstPageZone(doc, 'firstFooter', on))} label="Page 1 has its own footer" />
        <p className="text-[11px] text-slate-500">Click a header or footer on the page to add text, images and shapes, or drag its edge to resize it.</p>
      </Section>
    </>
  );
}

// ─────────────────────────────────────────────────────────── zone ──

const ADDABLE: Array<{ type: 'text' | 'image' | 'shape'; variant: string; label: string }> = [
  { type: 'text', variant: 'plain', label: 'Text' },
  { type: 'text', variant: 'field', label: 'Field' },
  { type: 'image', variant: 'logo', label: 'Logo' },
  { type: 'image', variant: 'upload', label: 'Image' },
  { type: 'shape', variant: 'rect', label: 'Box' },
  { type: 'shape', variant: 'line', label: 'Line' },
  { type: 'shape', variant: 'ellipse', label: 'Circle' },
  { type: 'text', variant: 'page', label: 'Page no.' },
];

export function AddElementButtons({ container, width }: { container: ElementContainer; width: number }) {
  const { doc, commit } = useEdit();
  const select = useDesignerStore((s) => s.select);
  return (
    <div className="grid grid-cols-4 gap-1.5" data-testid="add-element-buttons">
      {ADDABLE.map((a) => (
        <button
          key={a.label}
          type="button"
          onClick={() => {
            const el = createElement(a.type, a.variant, { x: Math.round(width / 2 - 100), y: 12 });
            commit(insertElement(doc, container, el));
            select({ kind: 'element', id: el.id });
          }}
          className="rounded-lg border border-slate-200 bg-white px-1 py-2 text-[11px] font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50"
          data-testid={`add-element-${a.label.replace(/\W/g, '').toLowerCase()}`}
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}

function ZonePanel({ zone }: { zone: ZoneKey }) {
  const { doc, commit } = useEdit();
  const z = doc[zone];
  const width = PAGE_SIZES[doc.page.size].width;
  if (!z) return <PanelTitle title={ZONE_LABELS[zone]} subtitle="Not used." />;
  const isFirst = zone === 'firstHeader' || zone === 'firstFooter';
  return (
    <>
      <PanelTitle
        title={ZONE_LABELS[zone]}
        subtitle={isFirst ? 'Printed on page 1 only.' : zone === 'header' && doc.firstHeader ? 'Printed on pages 2 and after.' : zone === 'footer' && doc.firstFooter ? 'Printed on pages 2 and after.' : 'Printed on every page.'}
      />
      <Section title="Size">
        <Row label="Height" hint="Or drag its edge on the page.">
          <NumberInput value={z.height} min={0} max={500} suffix="px" onChange={(v) => commit(updateZone(doc, zone, { height: v ?? 0 }), `zh-${zone}`)} testId="zone-height" />
        </Row>
      </Section>
      <Section title="Add to this area">
        <AddElementButtons container={{ kind: 'zone', zone }} width={width} />
      </Section>
      <Section title="Pages">
        {zone === 'header' || zone === 'firstHeader' ? (
          <Toggle checked={!!doc.firstHeader} onChange={(on) => commit(setFirstPageZone(doc, 'firstHeader', on))} label="Page 1 has its own header" />
        ) : (
          <Toggle checked={!!doc.firstFooter} onChange={(on) => commit(setFirstPageZone(doc, 'firstFooter', on))} label="Page 1 has its own footer" />
        )}
      </Section>
    </>
  );
}

// ─────────────────────────────────────────────────────── element ──

function ElementPanel({ id }: { id: string }) {
  const { doc, commit } = useEdit();
  const select = useDesignerStore((s) => s.select);
  const previewData = useDesignerStore((s) => s.previewData);
  const notify = useNotificationStore((s) => s.showNotification);
  const found = findElement(doc, id);
  if (!found) return <PanelTitle title="Nothing selected" />;
  const el = found.element;
  const set = (patch: Partial<CanvasElement>, key?: string) => commit(updateElement(doc, id, patch), key ? `${key}-${id}` : undefined);
  const where = found.container.kind === 'zone' ? ZONE_LABELS[found.container.zone] : 'Free area';
  const title = el.name || { text: 'Text', image: 'Image', shape: 'Shape', block: 'Block' }[el.type];

  return (
    <>
      <PanelTitle
        title={title}
        subtitle={where}
        actions={
          <>
            <IconBtn title={el.locked ? 'Unlock' : 'Lock in place'} onClick={() => set({ locked: !el.locked || undefined })} testId="element-lock">
              {el.locked ? <LockClosedIcon className="h-4 w-4" /> : <LockOpenIcon className="h-4 w-4" />}
            </IconBtn>
            <IconBtn
              title="Duplicate"
              onClick={() => {
                const r = duplicateElement(doc, id);
                commit(r.doc);
                if (r.newId) select({ kind: 'element', id: r.newId });
              }}
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </IconBtn>
            <IconBtn title="Delete" danger onClick={() => (commit(removeElement(doc, id)), select(null))} testId="element-delete">
              <TrashIcon className="h-4 w-4" />
            </IconBtn>
          </>
        }
      />
      {el.type === 'text' && (
        <Section title="Text">
          <MergeTextArea value={el.text} onChange={(v) => set({ text: v } as Partial<CanvasElement>, 'text')} fields={doc.fields} testId="element-text" />
          <p className="text-[10px] text-slate-400">Tip: double-click the text on the page to type in place.</p>
          <TextStyleEditor value={el.style} onChange={(v) => set({ style: v } as Partial<CanvasElement>, 'style')} showVertical />
          <Row label="If the text doesn't fit">
            <Select
              value={el.overflow ?? 'visible'}
              onChange={(v) => set({ overflow: v } as Partial<CanvasElement>)}
              options={[
                { value: 'visible', label: 'Let it spill over' },
                { value: 'shrink', label: 'Shrink the text to fit' },
                { value: 'clip', label: 'Cut it off' },
              ]}
            />
          </Row>
        </Section>
      )}
      {el.type === 'image' && (
        <Section title="Image">
          <ImageSourcePicker value={el.src} onChange={(src) => set({ src } as Partial<CanvasElement>)} onError={(m) => notify(m, 'error')} />
          <Row label="Fit">
            <Segmented
              value={el.fit ?? 'contain'}
              onChange={(v) => set({ fit: v } as Partial<CanvasElement>)}
              options={[
                { value: 'contain', label: 'Fit' },
                { value: 'cover', label: 'Fill' },
                { value: 'fill', label: 'Stretch' },
              ]}
            />
          </Row>
        </Section>
      )}
      {el.type === 'shape' && (
        <Section title="Shape">
          <Segmented
            value={el.shape}
            onChange={(v) => set({ shape: v } as Partial<CanvasElement>)}
            options={[
              { value: 'rect', label: 'Box' },
              { value: 'ellipse', label: 'Circle' },
              { value: 'line', label: 'Line' },
            ]}
          />
          <Grid>
            {el.shape !== 'line' && (
              <Row label="Fill">
                <ColorInput value={el.fill} onChange={(v) => set({ fill: v } as Partial<CanvasElement>)} />
              </Row>
            )}
            <Row label="Line">
              <ColorInput value={el.stroke} onChange={(v) => set({ stroke: v } as Partial<CanvasElement>)} />
            </Row>
            <Row label="Line width">
              <NumberInput value={el.strokeWidth} min={0} max={30} step={0.5} suffix="px" onChange={(v) => set({ strokeWidth: v } as Partial<CanvasElement>, 'sw')} />
            </Row>
          </Grid>
        </Section>
      )}
      <Section title="Position & size">
        <Grid cols={4}>
          {(['x', 'y', 'w', 'h'] as const).map((k) => (
            <Row key={k} label={k.toUpperCase()}>
              <NumberInput value={Math.round(el[k])} step={1} onChange={(v) => set({ [k]: v ?? 0 } as Partial<CanvasElement>, `pos${k}`)} testId={`element-${k}`} />
            </Row>
          ))}
        </Grid>
        <Grid>
          <Row label="Rotation">
            <NumberInput value={el.rotation ?? 0} min={-180} max={180} suffix="°" onChange={(v) => set({ rotation: v || undefined }, 'rot')} />
          </Row>
          <Row label="Layer">
            <div className="flex gap-1">
              <button type="button" className={`${inputCls} flex items-center justify-center gap-1`} onClick={() => commit(restackElement(doc, id, 1))}>
                <ArrowUpIcon className="h-3 w-3" /> Front
              </button>
              <button type="button" className={`${inputCls} flex items-center justify-center gap-1`} onClick={() => commit(restackElement(doc, id, -1))}>
                <ArrowDownIcon className="h-3 w-3" /> Back
              </button>
            </div>
          </Row>
        </Grid>
        <p className="text-[10px] text-slate-400">Arrow keys nudge 1px (Shift 10px). Hold ⌘ while dragging to stop snapping. Shift keeps proportions.</p>
      </Section>
      {el.type !== 'shape' && (
        <Section title="Box" defaultOpen={false}>
          <Grid>
            <Row label="Fill">
              <ColorInput value={el.box?.background} onChange={(v) => set({ box: { ...el.box, background: v } })} />
            </Row>
            <Row label="Border">
              <ColorInput value={el.box?.borderColor} onChange={(v) => set({ box: { ...el.box, borderColor: v, borderWidth: el.box?.borderWidth || 1 } })} />
            </Row>
            <Row label="Border width">
              <NumberInput value={el.box?.borderWidth} min={0} max={20} suffix="px" onChange={(v) => set({ box: { ...el.box, borderWidth: v } }, 'bw')} />
            </Row>
            <Row label="Rounded">
              <NumberInput value={el.box?.borderRadius} min={0} max={200} suffix="px" onChange={(v) => set({ box: { ...el.box, borderRadius: v } }, 'br')} />
            </Row>
            <Row label="Padding">
              <NumberInput value={el.box?.padding} min={0} max={100} suffix="px" onChange={(v) => set({ box: { ...el.box, padding: v } }, 'pad')} />
            </Row>
          </Grid>
        </Section>
      )}
      <Section title="Show or hide">
        <ConditionEditor value={el.showWhen} onChange={(c) => set({ showWhen: c })} fields={doc.fields} verdict={previewData ? evaluateCondition(el.showWhen, { ...previewData }) : null} />
      </Section>
      <Section title="Name" defaultOpen={false}>
        <TextInput value={el.name} placeholder={title} onChange={(v) => set({ name: v || undefined }, 'name')} />
      </Section>
    </>
  );
}

// ─────────────────────────────────────────────────────────── block ──

function BlockPanel({ id }: { id: string }) {
  const { doc, commit } = useEdit();
  const select = useDesignerStore((s) => s.select);
  const previewData = useDesignerStore((s) => s.previewData);
  const found = findBlock(doc, id);
  if (!found) return <PanelTitle title="Nothing selected" />;
  const block = found.block;
  const set = (patch: Partial<Block>, key?: string) => commit(updateBlock(doc, id, patch), key ? `${key}-${id}` : undefined);
  const verdict = previewData ? evaluateCondition(block.showWhen, { ...previewData }) : null;

  return (
    <>
      <PanelTitle
        title={block.name || blockLabel(block.type)}
        subtitle={blockSubtitle(block)}
        actions={
          <>
            <IconBtn
              title="Duplicate"
              onClick={() => {
                const r = duplicateBlock(doc, id);
                commit(r.doc);
                if (r.newId) select({ kind: 'block', id: r.newId });
              }}
            >
              <DocumentDuplicateIcon className="h-4 w-4" />
            </IconBtn>
            <IconBtn title="Delete" danger onClick={() => (commit(removeBlock(doc, id)), select(null))} testId="inspector-block-delete">
              <TrashIcon className="h-4 w-4" />
            </IconBtn>
          </>
        }
      />
      <BlockSpecific block={block} set={set} />
      {block.type !== 'pageBreak' && block.type !== 'freePage' && (
        <Section title="Layout" defaultOpen={false}>
          <Grid>
            <Row label="Width">
              <NumberInput value={block.width ?? 100} min={10} max={100} step={5} suffix="%" onChange={(v) => set({ width: v === 100 ? undefined : v }, 'width')} testId="block-width" />
            </Row>
            <Row label="Align">
              <Select
                value={block.align ?? 'left'}
                onChange={(v) => set({ align: v })}
                options={[
                  { value: 'left', label: 'Left' },
                  { value: 'center', label: 'Centre' },
                  { value: 'right', label: 'Right' },
                ]}
              />
            </Row>
            <Row label="Space above" hint="Negative joins it to the block above.">
              <NumberInput value={block.marginTop} min={-20} max={400} suffix="px" placeholder="0" onChange={(v) => set({ marginTop: v }, 'mt')} />
            </Row>
            <Row label="Space below">
              <NumberInput value={block.marginBottom} min={0} max={400} suffix="px" placeholder="0" onChange={(v) => set({ marginBottom: v }, 'mb')} />
            </Row>
          </Grid>
          <Toggle checked={block.breakBefore} onChange={(v) => set({ breakBefore: v || undefined })} label="Start on a new page" testId="toggle-break-before" />
          {(DATA_BLOCKS.has(block.type) || block.type === 'columns') && (
            <Toggle checked={block.keepTogether} onChange={(v) => set({ keepTogether: v || undefined })} label="Keep together on one page" hint="Tables otherwise split between rows." />
          )}
          {DATA_BLOCKS.has(block.type) && <Toggle checked={block.hideWhenEmpty} onChange={(v) => set({ hideWhenEmpty: v || undefined })} label="Hide when this student has nothing to show" />}
        </Section>
      )}
      <Section title="Show or hide">
        <ConditionEditor value={block.showWhen} onChange={(c) => set({ showWhen: c })} fields={doc.fields} verdict={verdict} />
      </Section>
      <Section title="Name" defaultOpen={false}>
        <TextInput value={block.name} placeholder={blockLabel(block.type)} onChange={(v) => set({ name: v || undefined }, 'name')} testId="block-name" />
      </Section>
    </>
  );
}

function blockSubtitle(block: Block): string {
  switch (block.type) {
    case 'skillsTable':
      return 'Lists each JK domain / SK subject with its skills and ratings, from the class setup.';
    case 'subjectCards':
      return "One card per subject from the student's classes.";
    case 'commentsTable':
      return 'Subjects with the teacher comments.';
    case 'learningSkills':
      return 'Learning skills and their ratings.';
    case 'table':
      return 'A grid of text and fields. Edit the cells below.';
    case 'canvas':
      return 'A free area: click it, then add and drag text, images and shapes.';
    case 'freePage':
      return 'A whole page laid out freely.';
    case 'pageBreak':
      return 'The next block starts on a new page.';
    default:
      return '';
  }
}

type SetBlock = (patch: Partial<Block>, key?: string) => void;

function ScalePicker({ value, onChange, allowNone = true }: { value: string | undefined; onChange: (v: string | undefined) => void; allowNone?: boolean }) {
  const doc = useDesignerStore((s) => s.doc)!;
  return (
    <select className={inputCls} value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)}>
      {allowNone && <option value="">No scale</option>}
      {doc.scales.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name} ({s.levels.map((l) => l.code).join(' ')})
        </option>
      ))}
    </select>
  );
}

function BlockSpecific({ block, set }: { block: Block; set: SetBlock }) {
  const doc = useDesignerStore((s) => s.doc)!;
  const notify = useNotificationStore((s) => s.showNotification);
  const width = PAGE_SIZES[doc.page.size].width;

  switch (block.type) {
    case 'text':
      return (
        <Section title="Text">
          <MergeTextArea value={block.text} rows={5} onChange={(v) => set({ text: v } as Partial<Block>, 'text')} fields={doc.fields} testId="block-text" />
          <TextStyleEditor value={block.style} onChange={(v) => set({ style: v } as Partial<Block>, 'style')} />
          <Grid>
            <Row label="Fill">
              <ColorInput value={block.box?.background} onChange={(v) => set({ box: { ...block.box, background: v } } as Partial<Block>)} />
            </Row>
            <Row label="Border">
              <NumberInput value={block.box?.borderWidth} min={0} max={10} suffix="px" onChange={(v) => set({ box: { ...block.box, borderWidth: v } } as Partial<Block>, 'bw')} />
            </Row>
            <Row label="Padding">
              <NumberInput value={block.box?.padding} min={0} max={100} suffix="px" onChange={(v) => set({ box: { ...block.box, padding: v } } as Partial<Block>, 'pad')} />
            </Row>
          </Grid>
        </Section>
      );
    case 'table':
      return <TableEditor block={block} set={set} />;
    case 'ratingKey':
      return <RatingKeyEditor block={block} set={set} />;
    case 'skillsTable':
      return <SkillsTableEditor block={block} set={set} />;
    case 'subjectCards':
      return <SubjectCardsEditor block={block} set={set} />;
    case 'commentsTable':
      return <CommentsTableEditor block={block} set={set} />;
    case 'learningSkills':
      return <LearningSkillsEditor block={block} set={set} />;
    case 'signatures':
      return <SignaturesEditor block={block} set={set} onError={(m) => notify(m, 'error')} />;
    case 'columns':
      return (
        <Section title="Columns">
          {block.columns.map((c, i) => (
            <div key={i} className="flex items-end gap-2">
              <Row label={`Column ${i + 1} width`}>
                <NumberInput value={c.width} min={5} max={95} suffix="%" onChange={(v) => set({ columns: block.columns.map((x, j) => (j === i ? { ...x, width: v ?? 50 } : x)) } as Partial<Block>, `cw${i}`)} />
              </Row>
              <span className="pb-1.5 text-[11px] text-slate-400">{c.blocks.length} block{c.blocks.length === 1 ? '' : 's'}</span>
            </div>
          ))}
          <Row label="Gap">
            <NumberInput value={block.gap} min={0} max={100} suffix="px" onChange={(v) => set({ gap: v ?? 0 } as Partial<Block>, 'gap')} />
          </Row>
          <p className="text-[11px] text-slate-500">Click a block inside a column to edit it. Add blocks to a column from the Layers panel.</p>
        </Section>
      );
    case 'canvas':
      return (
        <>
          <Section title="Free area">
            <Row label="Height" hint="Or drag the handle at its bottom edge.">
              <NumberInput value={block.height} min={20} max={1000} suffix="px" onChange={(v) => set({ height: v ?? 100 } as Partial<Block>, 'h')} />
            </Row>
          </Section>
          <Section title="Add to this area">
            <AddElementButtons container={{ kind: 'block', blockId: block.id }} width={width - doc.page.margin.left - doc.page.margin.right} />
          </Section>
        </>
      );
    case 'freePage':
      return (
        <>
          <Section title="Free page">
            <Toggle checked={block.useZones} onChange={(v) => set({ useZones: v || undefined } as Partial<Block>)} label="Show the header and footer on this page" />
          </Section>
          <Section title="Add to this page">
            <AddElementButtons container={{ kind: 'block', blockId: block.id }} width={width} />
          </Section>
        </>
      );
    case 'spacer':
      return (
        <Section title="Spacer">
          <Row label="Height">
            <NumberInput value={block.height} min={0} max={1000} suffix="px" onChange={(v) => set({ height: v ?? 0 } as Partial<Block>, 'h')} />
          </Row>
        </Section>
      );
    default:
      return null;
  }
}

// ── table (info grid) ──

function TableEditor({ block, set }: { block: TableBlock; set: SetBlock }) {
  const doc = useDesignerStore((s) => s.doc)!;
  const notify = useNotificationStore((s) => s.showNotification);
  const rows = block.rows;
  const setRows = (next: TableRowDef[], key?: string) => set({ rows: next } as Partial<Block>, key);
  const setCell = (r: number, c: number, patch: Partial<TableCellDef>, key?: string) =>
    setRows(
      rows.map((row, i) => (i === r ? { ...row, cells: row.cells.map((cell, j) => (j === c ? { ...cell, ...patch } : cell)) } : row)),
      key ? `${key}-${r}-${c}` : undefined,
    );
  return (
    <>
      <Section title="Columns">
        <div className="flex flex-wrap items-end gap-1.5">
          {block.columns.map((w, i) => (
            <div key={i} className="w-16">
              <NumberInput value={w} min={1} max={100} suffix="%" onChange={(v) => set({ columns: block.columns.map((x, j) => (j === i ? v ?? 10 : x)) } as Partial<Block>, `col${i}`)} />
            </div>
          ))}
          <IconBtn title="Add column" onClick={() => set({ columns: [...block.columns, 20] } as Partial<Block>)}>
            <PlusIcon className="h-4 w-4" />
          </IconBtn>
          <IconBtn title="Remove last column" danger disabled={block.columns.length <= 1} onClick={() => set({ columns: block.columns.slice(0, -1) } as Partial<Block>)}>
            <TrashIcon className="h-4 w-4" />
          </IconBtn>
        </div>
        <p className="text-[10px] text-slate-400">Widths in % of the table. A cell can span several columns.</p>
      </Section>
      <Section title={`Rows (${rows.length})`}>
        {rows.map((row, r) => (
          <div key={r} className="rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-2 py-1">
              <span className="text-[11px] font-semibold text-slate-600">Row {r + 1}</span>
              <div className="flex">
                <IconBtn title="Move up" disabled={r === 0} onClick={() => setRows(swap(rows, r, r - 1))}>
                  <ArrowUpIcon className="h-3 w-3" />
                </IconBtn>
                <IconBtn title="Move down" disabled={r === rows.length - 1} onClick={() => setRows(swap(rows, r, r + 1))}>
                  <ArrowDownIcon className="h-3 w-3" />
                </IconBtn>
                <IconBtn title="Add a cell" onClick={() => setRows(rows.map((x, i) => (i === r ? { ...x, cells: [...x.cells, { text: '' }] } : x)))}>
                  <PlusIcon className="h-3 w-3" />
                </IconBtn>
                <IconBtn title="Duplicate row" onClick={() => setRows([...rows.slice(0, r + 1), JSON.parse(JSON.stringify(row)), ...rows.slice(r + 1)])}>
                  <DocumentDuplicateIcon className="h-3 w-3" />
                </IconBtn>
                <IconBtn title="Delete row" danger onClick={() => setRows(rows.filter((_, i) => i !== r))}>
                  <TrashIcon className="h-3 w-3" />
                </IconBtn>
              </div>
            </div>
            <div className="space-y-2 p-2">
              {row.cells.map((cell, c) => (
                <CellEditor
                  key={c}
                  cell={cell}
                  index={c}
                  fields={doc.fields}
                  onChange={(patch, key) => setCell(r, c, patch, key)}
                  onRemove={() => setRows(rows.map((x, i) => (i === r ? { ...x, cells: x.cells.filter((_, j) => j !== c) } : x)))}
                  onError={(m) => notify(m, 'error')}
                />
              ))}
              <Grid>
                <Row label="Row height">
                  <NumberInput value={row.height} min={0} max={400} suffix="px" placeholder="auto" onChange={(v) => setRows(rows.map((x, i) => (i === r ? { ...x, height: v } : x)), `rh${r}`)} />
                </Row>
              </Grid>
            </div>
          </div>
        ))}
        <button type="button" onClick={() => setRows([...rows, { cells: block.columns.map(() => ({ text: '' })) }])} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800" data-testid="table-add-row">
          <PlusIcon className="h-3 w-3" /> Add row
        </button>
      </Section>
      <Section title="Lines & text" defaultOpen={false}>
        <TableLookEditor value={block} onChange={(p) => set(p as Partial<Block>, 'look')} />
      </Section>
    </>
  );
}

function swap<T>(list: T[], a: number, b: number): T[] {
  const next = [...list];
  [next[a], next[b]] = [next[b], next[a]];
  return next;
}

function CellEditor({ cell, index, fields, onChange, onRemove, onError }: { cell: TableCellDef; index: number; fields: TemplateDoc['fields']; onChange: (p: Partial<TableCellDef>, key?: string) => void; onRemove: () => void; onError: (m: string) => void }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/70 p-2">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Cell {index + 1}</span>
        <IconBtn title="Remove cell" danger onClick={onRemove}>
          <TrashIcon className="h-3 w-3" />
        </IconBtn>
      </div>
      <MergeTextArea value={cell.text ?? ''} rows={1} onChange={(v) => onChange({ text: v }, 'text')} fields={fields} />
      <div className="mt-1.5 grid grid-cols-3 gap-1.5">
        <Row label="Span">
          <NumberInput value={cell.colSpan ?? 1} min={1} max={20} onChange={(v) => onChange({ colSpan: v && v > 1 ? v : undefined })} />
        </Row>
        <Row label="Rows">
          <NumberInput value={cell.rowSpan ?? 1} min={1} max={50} onChange={(v) => onChange({ rowSpan: v && v > 1 ? v : undefined })} />
        </Row>
        <Row label="Fill">
          <ColorInput value={cell.background} onChange={(v) => onChange({ background: v })} />
        </Row>
      </div>
      <div className="mt-1.5 grid grid-cols-[1fr_auto] items-center gap-2">
        <Segmented
          value={cell.style?.align ?? 'left'}
          onChange={(v) => onChange({ style: { ...cell.style, align: v } })}
          options={[
            { value: 'left', label: 'L' },
            { value: 'center', label: 'C' },
            { value: 'right', label: 'R' },
          ]}
        />
        <div className="w-16">
          <NumberInput value={cell.style?.fontSize} min={5} max={60} step={0.5} placeholder="size" onChange={(v) => onChange({ style: { ...cell.style, fontSize: v } }, 'fs')} />
        </div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
        <Toggle checked={(cell.style?.fontWeight ?? 400) >= 700} onChange={(v) => onChange({ style: { ...cell.style, fontWeight: v ? 700 : undefined } })} label="Bold" />
        <Toggle checked={cell.vertical} onChange={(v) => onChange({ vertical: v || undefined })} label="Sideways" />
        <Toggle checked={!!cell.image} onChange={(v) => onChange({ image: v ? { kind: 'asset', asset: 'logo' } : undefined })} label="Image" />
      </div>
      {cell.image && (
        <div className="mt-1.5 space-y-1.5">
          <ImageSourcePicker value={cell.image} onChange={(src: ImageSource) => onChange({ image: src })} onError={onError} />
          <Row label="Image height">
            <NumberInput value={cell.imageHeight ?? 36} min={8} max={400} suffix="px" onChange={(v) => onChange({ imageHeight: v }, 'ih')} />
          </Row>
        </div>
      )}
    </div>
  );
}

// ── data blocks ──

function RatingKeyEditor({ block, set }: { block: RatingKeyBlock; set: SetBlock }) {
  return (
    <>
      <Section title="Rating key">
        <Row label="Scale">
          <ScalePicker value={block.scaleId} onChange={(v) => set({ scaleId: v ?? '' } as Partial<Block>)} allowNone={false} />
        </Row>
        <Row label="Layout">
          <Segmented
            value={block.layout}
            onChange={(v) => set({ layout: v } as Partial<Block>)}
            options={[
              { value: 'vertical', label: 'List' },
              { value: 'grid', label: 'Grid' },
              { value: 'row', label: 'One line' },
            ]}
          />
        </Row>
        <Row label="Title">
          <TextInput value={block.title} placeholder="(none)" onChange={(v) => set({ title: v || undefined } as Partial<Block>, 'title')} />
        </Row>
        {block.layout === 'vertical' && (
          <>
            <Row label="Side label" hint="Printed sideways down the left, e.g. EVALUATION KEY.">
              <TextInput value={block.sideLabel} onChange={(v) => set({ sideLabel: v || undefined } as Partial<Block>, 'side')} />
            </Row>
            <Grid>
              <Row label="Side width">
                <NumberInput value={block.sideWidth} min={2} max={40} suffix="%" placeholder="10" onChange={(v) => set({ sideWidth: v } as Partial<Block>, 'sw')} />
              </Row>
              <Row label="Code width">
                <NumberInput value={block.codeWidth} min={2} max={40} suffix="%" placeholder="10" onChange={(v) => set({ codeWidth: v } as Partial<Block>, 'cw')} />
              </Row>
            </Grid>
          </>
        )}
        {block.layout === 'grid' && (
          <Row label="Per row">
            <NumberInput value={block.columns} min={1} max={8} onChange={(v) => set({ columns: v } as Partial<Block>)} />
          </Row>
        )}
        <Grid>
          <Row label="Title fill">
            <ColorInput value={block.titleBackground} onChange={(v) => set({ titleBackground: v } as Partial<Block>)} />
          </Row>
          <Row label="Title text">
            <ColorInput value={block.titleColor} onChange={(v) => set({ titleColor: v } as Partial<Block>)} />
          </Row>
        </Grid>
        <Toggle checked={block.showDescriptions} onChange={(v) => set({ showDescriptions: v || undefined } as Partial<Block>)} label="Show each level's description" />
      </Section>
      <Section title="Lines & text" defaultOpen={false}>
        <TableLookEditor value={block} onChange={(p) => set(p as Partial<Block>, 'look')} />
      </Section>
    </>
  );
}

function ListInput({ value, onChange, placeholder }: { value: string[] | undefined; onChange: (v: string[]) => void; placeholder: string }) {
  return (
    <input
      className={inputCls}
      defaultValue={(value ?? []).join(', ')}
      placeholder={placeholder}
      onBlur={(e) =>
        onChange(
          e.target.value
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        )
      }
    />
  );
}

function SkillsTableEditor({ block, set }: { block: SkillsTableBlock; set: SetBlock }) {
  const pairs = block.sideBySide ?? [];
  return (
    <>
      <Section title="Skills table">
        <Row label="Title bar" hint="Printed once above the first group. Leave empty for none.">
          <TextInput value={block.title} onChange={(v) => set({ title: v || undefined } as Partial<Block>, 'title')} testId="skills-title" />
        </Row>
        <Row label="Rating scale" hint="Unknown ratings print as written and show a warning.">
          <ScalePicker value={block.scaleId} onChange={(v) => set({ scaleId: v } as Partial<Block>)} />
        </Row>
        <Toggle checked={block.colorRatings} onChange={(v) => set({ colorRatings: v || undefined } as Partial<Block>)} label="Colour ratings with the scale's colours" />
        <Toggle checked={block.splitGroupNames} onChange={(v) => set({ splitGroupNames: v || undefined } as Partial<Block>)} label='Split "Literacy - Reading" into a group and sub-group' />
        <Toggle checked={block.groupAsColumnHeader} onChange={(v) => set({ groupAsColumnHeader: v || undefined } as Partial<Block>)} label="Give each group its own heading row" hint="Use {{group}} in a column heading for the group's name." />
        <Toggle checked={block.showColumnHeader} onChange={(v) => set({ showColumnHeader: v || undefined } as Partial<Block>)} label="Column headings (repeat on every page)" />
        <Toggle checked={block.showGroupComments} onChange={(v) => set({ showGroupComments: v || undefined } as Partial<Block>)} label="Print each group's comment under it" />
        {block.showGroupComments && (
          <Row label="Comment label">
            <TextInput value={block.groupCommentLabel} placeholder="Strengths / Next Steps:" onChange={(v) => set({ groupCommentLabel: v || undefined } as Partial<Block>, 'gcl')} />
          </Row>
        )}
        <Toggle checked={block.stripeRows} onChange={(v) => set({ stripeRows: v || undefined } as Partial<Block>)} label="Striped rows" />
      </Section>
      <Section title="Columns">
        <ColumnsEditor<SkillColumnKey> value={block.columns} keys={SKILL_KEYS} onChange={(v) => set({ columns: v } as Partial<Block>, 'cols')} />
      </Section>
      <Section title="Groups" defaultOpen={false}>
        <Row label="Only these groups" hint="Comma-separated names; empty = all.">
          <ListInput value={block.includeGroups} placeholder="All groups" onChange={(v) => set({ includeGroups: v.length ? v : undefined } as Partial<Block>)} />
        </Row>
        <Row label="Leave out">
          <ListInput value={block.excludeGroups} placeholder="None" onChange={(v) => set({ excludeGroups: v.length ? v : undefined } as Partial<Block>)} />
        </Row>
        <div className="text-[11px] font-medium text-slate-500">Side by side</div>
        {pairs.map((p, i) => (
          <div key={i} className="flex items-center gap-1">
            <input className={inputCls} defaultValue={p[0]} onBlur={(e) => set({ sideBySide: pairs.map((x, j) => (j === i ? [e.target.value, x[1]] : x)) } as Partial<Block>)} />
            <span className="text-[11px] text-slate-400">+</span>
            <input className={inputCls} defaultValue={p[1]} onBlur={(e) => set({ sideBySide: pairs.map((x, j) => (j === i ? [x[0], e.target.value] : x)) } as Partial<Block>)} />
            <IconBtn title="Remove" danger onClick={() => set({ sideBySide: pairs.filter((_, j) => j !== i) } as Partial<Block>)}>
              <TrashIcon className="h-3 w-3" />
            </IconBtn>
          </div>
        ))}
        <button type="button" onClick={() => set({ sideBySide: [...pairs, ['Arabic and Quran', 'French']] } as Partial<Block>)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800">
          <PlusIcon className="h-3 w-3" /> Print two groups side by side
        </button>
      </Section>
      <Section title="Bars" defaultOpen={false}>
        <BarStyleEditor label="Title bar" value={block.titleBar} onChange={(v) => set({ titleBar: v } as Partial<Block>, 'tb')} />
        <BarStyleEditor label="Group bar" value={block.groupBar} onChange={(v) => set({ groupBar: v } as Partial<Block>, 'gb')} />
        <BarStyleEditor label="Sub-group bar" value={block.subgroupBar} onChange={(v) => set({ subgroupBar: v } as Partial<Block>, 'sb')} />
        <BarStyleEditor label="Column headings" value={block.headerBar} onChange={(v) => set({ headerBar: v } as Partial<Block>, 'hb')} />
      </Section>
      <Section title="Lines & text" defaultOpen={false}>
        <TableLookEditor value={block} onChange={(p) => set(p as Partial<Block>, 'look')} />
      </Section>
    </>
  );
}

function SubjectCardsEditor({ block, set }: { block: SubjectCardsBlock; set: SetBlock }) {
  const labels = { t1: 'First Term', t2: 'Second Term', final: 'Final Term', ...(block.termRowLabels ?? {}) };
  return (
    <>
      <Section title="Subject cards">
        <Row label="Rows">
          <Segmented
            value={block.rows}
            onChange={(v) => set({ rows: v } as Partial<Block>)}
            options={[
              { value: 'current', label: 'This term' },
              { value: 'terms', label: 'Term 1 / Term 2 / Final' },
            ]}
          />
        </Row>
        {block.rows === 'terms' && (
          <Grid cols={3}>
            {(['t1', 't2', 'final'] as const).map((t) => (
              <Row key={t} label={t === 'final' ? 'Final row' : `${t.toUpperCase()} row`}>
                <TextInput value={labels[t]} onChange={(v) => set({ termRowLabels: { ...labels, [t]: v } } as Partial<Block>, `tl${t}`)} />
              </Row>
            ))}
          </Grid>
        )}
        <Toggle checked={block.showTeacher} onChange={(v) => set({ showTeacher: v || undefined } as Partial<Block>)} label="Show the teacher's name" />
        <Toggle checked={block.showCoreStandards} onChange={(v) => set({ showCoreStandards: v || undefined } as Partial<Block>)} label="Show core standards progress" />
        <Toggle checked={block.showComment} onChange={(v) => set({ showComment: v || undefined } as Partial<Block>)} label="Show teacher comments" />
        {block.showComment && (
          <Grid>
            <Row label="Comment heading">
              <TextInput value={block.commentLabel} onChange={(v) => set({ commentLabel: v } as Partial<Block>, 'cl')} />
            </Row>
            <Row label="When empty">
              <TextInput value={block.emptyCommentText} onChange={(v) => set({ emptyCommentText: v } as Partial<Block>, 'ec')} />
            </Row>
          </Grid>
        )}
        <Grid>
          <Row label="Cards per page" hint="0 = as many as fit.">
            <NumberInput value={block.perPage ?? 0} min={0} max={20} onChange={(v) => set({ perPage: v || undefined } as Partial<Block>)} />
          </Row>
          <Row label="Gap between cards">
            <NumberInput value={block.cardGap ?? 14} min={0} max={200} suffix="px" onChange={(v) => set({ cardGap: v } as Partial<Block>, 'gap')} />
          </Row>
        </Grid>
        <Row label="Work habits / behaviour scale">
          <ScalePicker value={block.scaleId} onChange={(v) => set({ scaleId: v } as Partial<Block>)} />
        </Row>
        <Toggle checked={block.colorRatings} onChange={(v) => set({ colorRatings: v || undefined } as Partial<Block>)} label="Colour the ratings" />
      </Section>
      <Section title="Columns">
        <ColumnsEditor<SubjectFieldKey> value={block.fields} keys={SUBJECT_KEYS} onChange={(v) => set({ fields: v as ColumnDef<SubjectFieldKey>[] } as Partial<Block>, 'cols')} />
        <p className="text-[10px] text-slate-400">Marks print by the template's mark rules (Settings → Marks).</p>
      </Section>
      <Section title="Look" defaultOpen={false}>
        <BarStyleEditor label="Subject bar" value={block.headerBar} onChange={(v) => set({ headerBar: v } as Partial<Block>, 'hb')} />
        <TableLookEditor value={block} onChange={(p) => set(p as Partial<Block>, 'look')} />
      </Section>
    </>
  );
}

function CommentsTableEditor({ block, set }: { block: CommentsTableBlock; set: SetBlock }) {
  const doc = useDesignerStore((s) => s.doc)!;
  const notify = useNotificationStore((s) => s.showNotification);
  return (
    <>
      <Section title="Comments table">
        <Row label="Comments from">
          <Select
            value={block.source}
            onChange={(v) => set({ source: v } as Partial<Block>)}
            options={[
              { value: 'comments', label: 'Report comments (kindergarten rows)' },
              { value: 'subjects', label: "Each subject's teacher comment" },
              { value: 'skillGroups', label: "Each domain/subject group's comment" },
            ]}
          />
        </Row>
        <Grid>
          <Row label="Left heading">
            <TextInput value={block.subjectLabel} onChange={(v) => set({ subjectLabel: v } as Partial<Block>, 'sl')} />
          </Row>
          <Row label="Right heading">
            <TextInput value={block.commentLabel} onChange={(v) => set({ commentLabel: v } as Partial<Block>, 'cl')} />
          </Row>
        </Grid>
        <Row label="Left column width">
          <NumberInput value={block.subjectWidth} min={5} max={80} suffix="%" onChange={(v) => set({ subjectWidth: v ?? 22, grid: undefined } as Partial<Block>, 'sw')} />
        </Row>
        <Toggle checked={block.showEmptyRows} onChange={(v) => set({ showEmptyRows: v || undefined } as Partial<Block>)} label="Print subjects with no comment" />
        <Toggle
          checked={!!block.footerRow}
          onChange={(v) =>
            set({
              footerRow: v
                ? {
                    cells: [
                      { text: "Teacher's Signature:", style: { fontWeight: 700 } },
                      { image: { kind: 'asset', asset: 'teacherSignature' }, imageHeight: 30 },
                    ],
                  }
                : null,
            } as Partial<Block>)
          }
          label="Add a last row (e.g. signatures)"
        />
        {block.footerRow && (
          <div className="space-y-2">
            {block.footerRow.cells.map((cell, c) => (
              <CellEditor
                key={c}
                cell={cell}
                index={c}
                fields={doc.fields}
                onChange={(patch, key) => set({ footerRow: { ...block.footerRow!, cells: block.footerRow!.cells.map((x, j) => (j === c ? { ...x, ...patch } : x)) } } as Partial<Block>, key ? `fr${key}${c}` : undefined)}
                onRemove={() => set({ footerRow: { ...block.footerRow!, cells: block.footerRow!.cells.filter((_, j) => j !== c) } } as Partial<Block>)}
                onError={(m) => notify(m, 'error')}
              />
            ))}
            <button type="button" onClick={() => set({ footerRow: { ...block.footerRow!, cells: [...block.footerRow!.cells, { text: '' }] } } as Partial<Block>)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
              <PlusIcon className="h-3 w-3" /> Add a cell
            </button>
            <Row label="Grid for the last row (%)" hint="e.g. 20, 18, 39, 23 — the comment spans the columns after the first.">
              <ListInput value={(block.grid ?? []).map(String)} placeholder={`${block.subjectWidth}, ${100 - block.subjectWidth}`} onChange={(v) => set({ grid: v.length >= 2 ? v.map(Number).filter((n) => n > 0) : undefined } as Partial<Block>)} />
            </Row>
          </div>
        )}
      </Section>
      <Section title="Look" defaultOpen={false}>
        <BarStyleEditor label="Heading row" value={block.headerBar} onChange={(v) => set({ headerBar: v } as Partial<Block>, 'hb')} />
        <TextStyleEditor value={block.subjectStyle} onChange={(v) => set({ subjectStyle: v } as Partial<Block>, 'ss')} showAlign={false} />
        <TableLookEditor value={block} onChange={(p) => set(p as Partial<Block>, 'look')} />
      </Section>
    </>
  );
}

function LearningSkillsEditor({ block, set }: { block: LearningSkillsBlock; set: SetBlock }) {
  const all = ['rating', 't1', 't2'] as const;
  const labels = { rating: 'This term', t1: 'Term 1', t2: 'Term 2', ...(block.termLabels ?? {}) };
  return (
    <>
      <Section title="Learning skills">
        <Row label="Title bar">
          <TextInput value={block.title} onChange={(v) => set({ title: v || undefined } as Partial<Block>, 'title')} />
        </Row>
        <Row label="Heading / legend">
          <TextInput value={block.legend} onChange={(v) => set({ legend: v || undefined } as Partial<Block>, 'legend')} />
        </Row>
        <Row label="Scale">
          <ScalePicker value={block.scaleId} onChange={(v) => set({ scaleId: v } as Partial<Block>)} />
        </Row>
        <Toggle checked={block.showDescriptors} onChange={(v) => set({ showDescriptors: v || undefined } as Partial<Block>)} label="List what each skill means" />
        <div className="text-[11px] font-medium text-slate-500">Rating columns</div>
        {all.map((t) => (
          <div key={t} className="flex items-center gap-2">
            <Toggle checked={block.termColumns.includes(t)} onChange={(v) => set({ termColumns: v ? all.filter((x) => x === t || block.termColumns.includes(x)) : block.termColumns.filter((x) => x !== t) } as Partial<Block>)} label="" />
            <input className={inputCls} value={labels[t]} onChange={(e) => set({ termLabels: { ...labels, [t]: e.target.value } } as Partial<Block>, `tl${t}`)} />
          </div>
        ))}
      </Section>
      <Section title="Look" defaultOpen={false}>
        <BarStyleEditor label="Bars" value={block.titleBar} onChange={(v) => set({ titleBar: v } as Partial<Block>, 'tb')} />
        <TableLookEditor value={block} onChange={(p) => set(p as Partial<Block>, 'look')} />
      </Section>
    </>
  );
}

function SignaturesEditor({ block, set, onError }: { block: SignaturesBlock; set: SetBlock; onError: (m: string) => void }) {
  const doc = useDesignerStore((s) => s.doc)!;
  return (
    <Section title="Signatures">
      {block.slots.map((slot, i) => (
        <div key={i} className="space-y-1.5 rounded-lg border border-slate-100 bg-slate-50/60 p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">Signature {i + 1}</span>
            <IconBtn title="Remove" danger onClick={() => set({ slots: block.slots.filter((_, j) => j !== i) } as Partial<Block>)}>
              <TrashIcon className="h-3 w-3" />
            </IconBtn>
          </div>
          <MergeTextArea value={slot.label} rows={1} fields={doc.fields} onChange={(v) => set({ slots: block.slots.map((s, j) => (j === i ? { ...s, label: v } : s)) } as Partial<Block>, `sl${i}`)} />
          <Toggle checked={!!slot.image} onChange={(v) => set({ slots: block.slots.map((s, j) => (j === i ? { ...s, image: v ? { kind: 'asset', asset: 'principalSignature' } : null } : s)) } as Partial<Block>)} label="Print a signature image" />
          {slot.image && <ImageSourcePicker value={slot.image} onError={onError} onChange={(src) => set({ slots: block.slots.map((s, j) => (j === i ? { ...s, image: src } : s)) } as Partial<Block>)} />}
          <Toggle checked={slot.showLine !== false} onChange={(v) => set({ slots: block.slots.map((s, j) => (j === i ? { ...s, showLine: v ? undefined : false } : s)) } as Partial<Block>)} label="Signature line" />
        </div>
      ))}
      <button type="button" onClick={() => set({ slots: [...block.slots, { label: 'Signature', image: null }] } as Partial<Block>)} className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600">
        <PlusIcon className="h-3 w-3" /> Add a signature
      </button>
      <Row label="Image height">
        <NumberInput value={block.imageHeight} min={10} max={300} suffix="px" onChange={(v) => set({ imageHeight: v } as Partial<Block>, 'ih')} />
      </Row>
      <Row label="Line under the row">
        <MergeTextArea value={block.caption ?? ''} rows={1} fields={doc.fields} onChange={(v) => set({ caption: v || undefined } as Partial<Block>, 'cap')} />
      </Row>
      <Toggle checked={block.topRule} onChange={(v) => set({ topRule: v || undefined } as Partial<Block>)} label="Rule above" />
    </Section>
  );
}
