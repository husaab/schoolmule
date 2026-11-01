import { DEFAULT_MARK_RULES } from './format';
import { SCALES } from './defaults/scales';
import type { Block, BlockType, CanvasElement, DocType, TemplateDoc } from './types';
import { cloneJson, newId } from './util';

/** What the designer's "Add" palette offers, with friendly names. */
export const BLOCK_CATALOG: Array<{ type: BlockType; label: string; description: string; group: 'data' | 'layout' | 'content' }> = [
  { type: 'table', label: 'Info grid', description: 'A bordered grid for names, dates, titles — any text and fields.', group: 'content' },
  { type: 'text', label: 'Text', description: 'A paragraph with fields like {{student.firstName}}.', group: 'content' },
  { type: 'ratingKey', label: 'Rating key', description: 'The legend for a rating scale (E, G, S…).', group: 'data' },
  { type: 'skillsTable', label: 'Skills table', description: 'JK domains / SK subjects with each skill and its rating.', group: 'data' },
  { type: 'subjectCards', label: 'Subject cards', description: 'One card per subject: marks, work habits, behaviour, comments.', group: 'data' },
  { type: 'commentsTable', label: 'Comments table', description: 'Subjects with strengths and next steps.', group: 'data' },
  { type: 'learningSkills', label: 'Learning skills', description: 'Responsibility, Organization… with ratings.', group: 'data' },
  { type: 'signatures', label: 'Signatures', description: 'Teacher and principal signature lines.', group: 'content' },
  { type: 'columns', label: 'Two columns', description: 'Put blocks side by side.', group: 'layout' },
  { type: 'canvas', label: 'Free area', description: 'A free-form area: drag text, images and shapes anywhere.', group: 'layout' },
  { type: 'spacer', label: 'Spacer', description: 'Empty space between blocks.', group: 'layout' },
  { type: 'pageBreak', label: 'Page break', description: 'Start the next block on a new page.', group: 'layout' },
  { type: 'freePage', label: 'Free page', description: 'A whole page laid out freely, like Canva.', group: 'layout' },
];

export const ELEMENT_CATALOG: Array<{ type: 'text' | 'image' | 'shape'; variant?: string; label: string }> = [
  { type: 'text', label: 'Text' },
  { type: 'text', variant: 'field', label: 'Field' },
  { type: 'image', variant: 'logo', label: 'Logo' },
  { type: 'image', variant: 'upload', label: 'Image' },
  { type: 'shape', variant: 'rect', label: 'Box' },
  { type: 'shape', variant: 'line', label: 'Line' },
  { type: 'shape', variant: 'ellipse', label: 'Circle' },
  { type: 'text', variant: 'page', label: 'Page number' },
];

export function blockLabel(type: BlockType): string {
  return BLOCK_CATALOG.find((b) => b.type === type)?.label ?? type;
}

/** A new block of `type` with sensible defaults for `doc`. */
export function createBlock(type: BlockType, doc?: TemplateDoc): Block {
  const id = newId('b');
  const scaleId = doc?.scales?.[0]?.id;
  switch (type) {
    case 'table':
      return {
        id,
        type,
        name: 'Info grid',
        columns: [25, 75],
        borderWidth: 1,
        cellPadding: 4,
        rows: [
          { cells: [{ text: 'Student:', style: { fontWeight: 700 } }, { text: '{{student.name}}' }] },
          { cells: [{ text: 'Teacher:', style: { fontWeight: 700 } }, { text: '{{student.homeroomTeacher}}' }] },
        ],
        marginBottom: 12,
      };
    case 'text':
      return { id, type, text: 'Write something here. Use fields like {{student.firstName}}.', style: { fontSize: 12 }, marginBottom: 10 };
    case 'ratingKey':
      return { id, type, scaleId: scaleId ?? '', layout: 'row', title: 'Rating key', borderWidth: 1, marginBottom: 12 };
    case 'skillsTable':
      return {
        id,
        type,
        title: 'LEARNING SKILLS',
        titleBar: { background: '#9bc2e6', align: 'center', fontSize: 15 },
        groupBar: { background: '#d0cece', align: 'center', uppercase: true },
        subgroupBar: { background: '#bdd7ee', uppercase: true },
        columns: [
          { key: 'name', label: 'Skill', width: 80 },
          { key: 'rating', label: 'Rating', width: 20, align: 'center' },
        ],
        scaleId,
        splitGroupNames: true,
        borderWidth: 1,
        cellPadding: 4,
        hideWhenEmpty: true,
        marginBottom: 12,
      };
    case 'subjectCards':
      return {
        id,
        type,
        fields: [
          { key: 'mark', label: 'Grade', width: 34, align: 'center' },
          { key: 'workHabits', label: 'Work Habits', width: 33, align: 'center' },
          { key: 'behaviour', label: 'Behaviour', width: 33, align: 'center' },
        ],
        rows: 'current',
        showComment: true,
        commentLabel: 'Teacher Comments',
        emptyCommentText: 'No comments provided',
        headerBar: { background: '#2c5aa0', color: '#ffffff' },
        borderWidth: 1,
        hideWhenEmpty: true,
        marginBottom: 12,
      };
    case 'commentsTable':
      return {
        id,
        type,
        source: 'comments',
        subjectLabel: 'Subjects',
        commentLabel: 'Strengths/Next Steps for Improvement',
        subjectWidth: 22,
        headerBar: { background: '#d0cece', align: 'center' },
        borderWidth: 1,
        cellPadding: 5,
        hideWhenEmpty: true,
        marginBottom: 12,
      };
    case 'learningSkills':
      return {
        id,
        type,
        title: 'LEARNING SKILLS',
        titleBar: { background: '#d9d9d9', align: 'center' },
        scaleId: 'egsn',
        showDescriptors: true,
        termColumns: ['t1', 't2'],
        legend: 'E – Excellent   G – Good   S – Satisfactory   N – Needs Improvement',
        borderWidth: 1,
        hideWhenEmpty: true,
        marginBottom: 12,
      };
    case 'signatures':
      return {
        id,
        type,
        slots: [
          { label: "Teacher's Signature", image: { kind: 'asset', asset: 'teacherSignature' } },
          { label: "Principal's Signature", image: { kind: 'asset', asset: 'principalSignature' } },
        ],
        imageHeight: 44,
        marginTop: 16,
      };
    case 'columns':
      return {
        id,
        type,
        gap: 16,
        columns: [
          { width: 50, blocks: [createBlock('text', doc)] },
          { width: 50, blocks: [createBlock('text', doc)] },
        ],
        marginBottom: 12,
      };
    case 'canvas':
      return {
        id,
        type,
        height: 140,
        elements: [createElement('text', 'plain', { x: 16, y: 16 })],
        marginBottom: 12,
      };
    case 'spacer':
      return { id, type, height: 24 };
    case 'pageBreak':
      return { id, type };
    case 'freePage':
      return {
        id,
        type,
        useZones: false,
        elements: [
          createElement('text', 'plain', { x: 96, y: 120, w: 620, h: 60, text: 'A free page', style: { fontSize: 32, fontWeight: 700, align: 'center' } } as Partial<CanvasElement>),
        ],
      };
    default:
      return { id, type: 'spacer', height: 24 };
  }
}

/** A new canvas element at `at` (zone/page coordinates). */
export function createElement(type: 'text' | 'image' | 'shape', variant = '', at: Partial<CanvasElement> = {}): CanvasElement {
  const base = { id: newId('e'), x: 40, y: 20, w: 220, h: 36, ...at };
  if (type === 'image') {
    return {
      ...base,
      type: 'image',
      name: variant === 'logo' ? 'Logo' : 'Image',
      w: at.w ?? 180,
      h: at.h ?? 70,
      src: variant === 'logo' ? { kind: 'asset', asset: 'logo' } : { kind: 'url', url: '' },
      fit: 'contain',
    } as CanvasElement;
  }
  if (type === 'shape') {
    const shape = variant === 'line' ? 'line' : variant === 'ellipse' ? 'ellipse' : 'rect';
    return {
      ...base,
      type: 'shape',
      name: shape === 'line' ? 'Line' : shape === 'ellipse' ? 'Circle' : 'Box',
      shape,
      h: shape === 'line' ? (at.h ?? 12) : (at.h ?? 80),
      w: at.w ?? (shape === 'line' ? 300 : 120),
      fill: shape === 'line' ? undefined : '#eaf0f9',
      stroke: '#2c5aa0',
      strokeWidth: shape === 'line' ? 2 : 1,
    } as CanvasElement;
  }
  const text =
    variant === 'field' ? '{{student.name}}' : variant === 'page' ? 'Page {{page.number}} of {{page.count}}' : 'New text';
  return {
    ...base,
    type: 'text',
    name: variant === 'page' ? 'Page number' : variant === 'field' ? 'Field' : 'Text',
    text,
    style: { fontSize: 14, ...(variant === 'page' ? { align: 'right' as const, fontWeight: 700 as const } : {}) },
    ...(at as object),
  } as CanvasElement;
}

/** A blank template: an empty header/footer with a page number, no body. */
export function blankTemplate(docType: DocType): TemplateDoc {
  return {
    schemaVersion: 1,
    docType,
    page: { size: 'letter', margin: { top: 0, right: 56, bottom: 0, left: 56 } },
    theme: { fontFamily: 'Mulish', fontSize: 12, color: '#111111', borderColor: '#000000', accent: '#2c5aa0' },
    scales: cloneJson([SCALES.skProgress, SCALES.jkProgress, SCALES.egsn]),
    marks: cloneJson(DEFAULT_MARK_RULES),
    fields: [],
    header: { height: 96, elements: [createElement('image', 'logo', { x: 56, y: 20, w: 180, h: 60 })] },
    footer: { height: 56, elements: [createElement('text', 'page', { x: 560, y: 18, w: 200, h: 20 })] },
    firstHeader: null,
    firstFooter: null,
    blocks: [],
  };
}

/** Give a block (and everything inside it) fresh ids, for duplicating. */
export function reId<T extends Block | CanvasElement>(item: T): T {
  const copy = cloneJson(item) as T & { id: string };
  const visit = (node: unknown) => {
    if (!node || typeof node !== 'object') return;
    const n = node as Record<string, unknown>;
    if (typeof n.id === 'string' && ('type' in n || 'shape' in n)) n.id = newId(String(n.type ?? 'x').slice(0, 1));
    for (const v of Object.values(n)) {
      if (Array.isArray(v)) v.forEach(visit);
      else if (v && typeof v === 'object') visit(v);
    }
  };
  visit(copy);
  return copy;
}
