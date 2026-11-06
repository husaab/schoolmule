/**
 * reportkit — the report template engine.
 *
 * Two contracts live here:
 *   - TemplateDoc: what an admin designs (pages, free-canvas zones, smart
 *     blocks, rules). Pure data; never code.
 *   - ReportData: everything one student's report can print, assembled by
 *     the backend (services/reportEngine/data). Marks arrive already computed
 *     by the one grade engine; reportkit only formats them.
 *
 * The same engine runs in the designer (web) and inside the PDF printer
 * (backend Puppeteer, via the bundle in schoolmule-backend/vendor/reportkit),
 * so what an admin sees is what prints. Units are CSS px at 96 dpi.
 */

export type DocType = 'report_card' | 'progress_report';
export type PageSize = 'letter' | 'a4';

/** Page sizes in CSS px (96 dpi). */
export const PAGE_SIZES: Record<PageSize, { width: number; height: number; label: string }> = {
  letter: { width: 816, height: 1056, label: 'Letter (8.5 × 11 in)' },
  a4: { width: 794, height: 1123, label: 'A4 (210 × 297 mm)' },
};

export interface Box4 {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// ─────────────────────────────────────────────────────────────── text ──

export type FontId = string; // a family from FONT_FAMILIES (fonts.ts)

export interface TextStyle {
  fontFamily?: FontId;
  fontSize?: number; // px
  fontWeight?: 400 | 600 | 700 | 800;
  italic?: boolean;
  underline?: boolean;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  lineHeight?: number; // unitless multiple
  letterSpacing?: number; // px
  uppercase?: boolean;
}

export interface BoxStyle {
  background?: string;
  borderColor?: string;
  borderWidth?: number; // px, 0 = none
  borderRadius?: number;
  padding?: number;
}

/**
 * Text with merge fields: "Dear {{student.firstName}}". Line breaks are
 * kept; **bold** and *italic* markers are honoured. Rendered escaped.
 */
export type RichText = string;

// ───────────────────────────────────────────────────────────── rules ──

export type ConditionOp =
  | 'eq'
  | 'neq'
  | 'in'
  | 'notIn'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'empty'
  | 'notEmpty';

/** Show/hide rule. Paths resolve against ReportData (see catalog.ts). */
export type Condition =
  | { op: 'and' | 'or'; conditions: Condition[] }
  | { op: 'not'; condition: Condition }
  | { field: string; op: ConditionOp; value?: string | number | boolean | Array<string | number> };

export interface RatingLevel {
  code: string;
  label: string;
  description?: string;
  color?: string; // cell background when coloured
  textColor?: string;
}

export interface RatingScale {
  id: string;
  name: string;
  levels: RatingLevel[];
}

export interface LetterBand {
  min: number; // inclusive, after rounding to a whole percent
  label: string;
}

export interface MarkFormatRule {
  id: string;
  /** Grades this rule covers ('JK','SK','1'..'8'); empty/absent = all. */
  grades?: string[];
  format: 'letter' | 'percent' | 'number';
  decimals?: number; // percent/number
}

export interface MarkRules {
  /** First matching rule wins. */
  rules: MarkFormatRule[];
  letterBands: LetterBand[];
  /** A mark below `threshold` prints `text` instead (Ontario "R"). */
  below: { enabled: boolean; threshold: number; text: string };
  /** Enrolled, nothing graded yet. */
  noEvidence: string;
  /** No mark for this term at all (e.g. a T1-only subject in Term 2). */
  notApplicable: string;
}

export type ExtraFieldType = 'text' | 'longtext' | 'select' | 'date' | 'checkbox';

export interface ExtraFieldDef {
  key: string; // slug; merge field {{extra.<key>}}
  label: string;
  type: ExtraFieldType;
  options?: string[]; // select
  required?: boolean;
  defaultValue?: string;
  help?: string;
}

// ──────────────────────────────────────────────────── canvas elements ──

export type ImageSource =
  | { kind: 'asset'; asset: 'logo' | 'principalSignature' | 'stamp' | 'teacherSignature' }
  | { kind: 'url'; url: string } // an uploaded template image
  /** An image shipped with the engine (BUILTIN_IMAGES in images.ts), by file name. */
  | { kind: 'builtin'; name: string };

interface ElementBase {
  id: string;
  name?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z?: number;
  rotation?: number; // degrees
  locked?: boolean;
  showWhen?: Condition | null;
  box?: BoxStyle;
}

export interface TextElement extends ElementBase {
  type: 'text';
  text: RichText; // may use {{page.number}} / {{page.count}}
  style?: TextStyle;
  /** What happens when the text doesn't fit its box. */
  overflow?: 'visible' | 'shrink' | 'clip';
}

export interface ImageElement extends ElementBase {
  type: 'image';
  src: ImageSource;
  fit?: 'contain' | 'cover' | 'fill';
  /** Where a contained image sits in its box when it doesn't fill it (default centre). */
  align?: 'left' | 'center' | 'right';
}

export interface ShapeElement extends ElementBase {
  type: 'shape';
  shape: 'rect' | 'ellipse' | 'line';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

/** A smart block placed in a fixed box on a free-canvas page. */
export interface BlockElement extends ElementBase {
  type: 'block';
  block: Block;
  overflow?: 'shrink' | 'clip';
}

export type CanvasElement = TextElement | ImageElement | ShapeElement | BlockElement;

export interface Zone {
  height: number;
  elements: CanvasElement[];
}

// ─────────────────────────────────────────────────────────── blocks ──

interface BlockBase {
  id: string;
  name?: string;
  showWhen?: Condition | null;
  /** Start this block on a new page. */
  breakBefore?: boolean;
  /** Never split this block across pages (tables split by default). */
  keepTogether?: boolean;
  /** px; a small negative top margin joins a table to the one above (shared border). */
  marginTop?: number;
  marginBottom?: number;
  /** Percent of the content width; default 100. */
  width?: number;
  align?: 'left' | 'center' | 'right';
  /** Hide data blocks that have nothing to show for this student. */
  hideWhenEmpty?: boolean;
}

/** A line along one edge of a bar. */
export interface LineStyle {
  color?: string;
  width?: number; // px
}

export interface TableCellDef {
  /** A small label printed above the cell's text, inside the cell. */
  label?: RichText;
  labelStyle?: TextStyle;
  text?: RichText;
  image?: ImageSource;
  imageHeight?: number;
  colSpan?: number;
  rowSpan?: number;
  style?: TextStyle;
  background?: string;
  /** Rotate the text 90° (vertical label like "EVALUATION KEY"). */
  vertical?: boolean;
  /** This cell's own inner spacing (px), instead of the table's cell padding. */
  padding?: Partial<Box4>;
}

export interface TableRowDef {
  cells: TableCellDef[];
  height?: number;
  showWhen?: Condition | null;
}

export interface TableLook {
  borderColor?: string;
  borderWidth?: number;
  outerBorderWidth?: number;
  /** Cell padding (px): top/bottom, and left/right unless cellPaddingX is set (then cellPadding + 2). */
  cellPadding?: number;
  cellPaddingX?: number;
  fontSize?: number;
  fontFamily?: FontId;
  color?: string;
  /** Vertical alignment of body cells (default middle). */
  verticalAlign?: 'top' | 'middle' | 'bottom';
  /** Line height of the block's text, a unitless multiple (default the page's). */
  lineHeight?: number;
  /** Which lines the table draws: every line (default), or the lines between rows only. */
  rules?: 'grid' | 'rows';
}

/** A free-form grid: title bars, the student info grid, forms. */
export interface TableBlock extends BlockBase, TableLook {
  type: 'table';
  columns: number[]; // percent widths
  rows: TableRowDef[];
  /** The table is at least this tall (px); the last row takes the extra space. */
  minHeight?: number;
}

export interface TextBlock extends BlockBase {
  type: 'text';
  text: RichText;
  style?: TextStyle;
  box?: BoxStyle;
}

export interface RatingKeyBlock extends BlockBase, TableLook {
  type: 'ratingKey';
  scaleId: string;
  layout: 'vertical' | 'row' | 'grid';
  title?: string;
  /** vertical layout: rotated label cell at the left. */
  sideLabel?: string;
  sideWidth?: number; // percent
  codeWidth?: number; // percent
  titleBackground?: string;
  titleColor?: string;
  /** vertical layout: the side label's text (size, weight, letter spacing); a line break in the label starts a new line. */
  sideStyle?: TextStyle;
  /** The code cells' text (e.g. a regular weight instead of bold). */
  codeStyle?: TextStyle;
  showDescriptions?: boolean;
  columns?: number; // grid layout
}

export interface BarStyle {
  background?: string;
  color?: string;
  fontSize?: number;
  fontWeight?: 400 | 600 | 700 | 800;
  align?: 'left' | 'center' | 'right';
  uppercase?: boolean;
  /** Inner spacing in px: top/bottom, and left/right (defaults to `padding`). */
  padding?: number;
  paddingX?: number;
  /** Bar height in px (at least: a long text still wraps). */
  height?: number;
  fontFamily?: FontId;
  letterSpacing?: number; // px
  /** Lines along the bar's top and bottom edges. */
  ruleTop?: LineStyle;
  ruleBottom?: LineStyle;
}

/**
 * A group's own bar look, e.g. each JK domain in its colour with its icon.
 * `match` is the group's name (case-insensitive; a trailing ':' ignored);
 * for split "Group - Part" names it matches the Group.
 */
export interface SkillGroupStyle {
  match: string;
  background?: string;
  color?: string;
  /** Printed after the name. */
  icon?: ImageSource | null;
  /** px (default 29). */
  iconHeight?: number;
}

export type SkillColumnKey = 'name' | 'description' | 'rating' | 't1' | 't2';

export interface ColumnDef<K extends string = string> {
  key: K;
  label: string;
  width: number; // percent
  align?: 'left' | 'center' | 'right';
  /** Alignment of this column's label cell (default: the header bar's). */
  headerAlign?: 'left' | 'center' | 'right';
  /** Text style of this column's body cells (e.g. bold skill names, a large blue mark). */
  style?: TextStyle;
}

/** JK domains → skills / SK subjects → standards, with their ratings. */
export interface SkillsTableBlock extends BlockBase, TableLook {
  type: 'skillsTable';
  title?: string; // a bar above the first group, e.g. "LEARNING SKILLS"
  titleBar?: BarStyle;
  groupBar?: BarStyle; // domain / subject bar (or "Group" of "Group - Part")
  subgroupBar?: BarStyle; // "Part" of "Group - Part"
  columns: ColumnDef<SkillColumnKey>[];
  /** Print a column-label row; it repeats on every page the table reaches. */
  showColumnHeader?: boolean;
  headerBar?: BarStyle;
  scaleId?: string;
  colorRatings?: boolean;
  /** Split "Literacy - Reading" into a Literacy bar and a Reading sub-bar. */
  splitGroupNames?: boolean;
  /** Group names printed side by side, e.g. [["Arabic and Quran","French"]]. */
  sideBySide?: string[][];
  /**
   * Column widths (percent) once groups print side by side: left text, left
   * rating, right text, right rating. Default: the rating column's width on
   * the right, the rest split 40/10/50.
   */
  pairColumns?: number[];
  /** Minimum height (px) of each skill row. */
  rowHeight?: number;
  /** Minimum height (px) of each side-by-side row (default rowHeight). */
  pairRowHeight?: number;
  /** Text of the side-by-side rows' skill cells, e.g. a slightly larger size. */
  pairStyle?: TextStyle;
  /** Only these groups (by name, case-insensitive); empty = all. */
  includeGroups?: string[];
  excludeGroups?: string[];
  /** Print each group's comment under it. */
  showGroupComments?: boolean;
  groupCommentLabel?: string;
  /** Put the group name in the first column header instead of a bar. */
  groupAsColumnHeader?: boolean;
  stripeRows?: boolean;
  /** Blank space between groups (px), so each group reads as its own table. Never printed at the top or bottom of a page. */
  groupGap?: number;
  /** Keep each group (bar, rows, comment) on one page when it fits. */
  keepGroupsTogether?: boolean;
  /** The group comment row's look (background, size, colour…). */
  groupCommentBar?: BarStyle;
  /** When set, the comment label prints on its own line in this style. */
  groupCommentLabelStyle?: TextStyle;
  /** Per-group bar colours and icons; the first matching entry wins. */
  groupStyles?: SkillGroupStyle[];
  /** Bar colours for groups no `groupStyles` entry matches, by the group's position (cycling). */
  fallbackGroupColors?: string[];
  /** Draw each group bar on the table's columns (the name over the text, the rating cell blank) instead of one merged cell. */
  groupBarColumns?: boolean;
}

export type SubjectFieldKey = 'mark' | 'workHabits' | 'behaviour' | 'overall' | 'coreStandards';

/** One card per subject: bar, a small marks table, comments. */
export interface SubjectCardsBlock extends BlockBase, TableLook {
  type: 'subjectCards';
  /** Columns of the marks table. */
  fields: ColumnDef<SubjectFieldKey>[];
  /** current = this term only; terms = First/Second/Final rows. */
  rows: 'current' | 'terms';
  termRowLabels?: { t1: string; t2: string; final: string };
  showTeacher?: boolean;
  showComment?: boolean;
  commentLabel?: string;
  emptyCommentText?: string;
  showCoreStandards?: boolean;
  /** Start a new page after every N cards (0 = never). */
  perPage?: number;
  scaleId?: string; // work habits / behaviour colours
  colorRatings?: boolean;
  headerBar?: BarStyle;
  cardGap?: number;
  /** Printed for an empty work habits / behaviour / overall rating, e.g. "-" or "Not Assessed". */
  emptyRatingText?: string;
  /** Leave the comment section out when there's no comment (instead of printing emptyCommentText). */
  hideEmptyComment?: boolean;
  /** Label of the core standards section (default "Core Standards Progress"). */
  coreStandardsLabel?: string;
  /** Space (px) above each group of `perPage` cards; cards in a group sit `cardGap` apart. */
  groupPadding?: number;
  /** Finer styling of each card; everything optional. */
  cardStyle?: SubjectCardStyle;
}

/** A text box inside a card: background, border, a coloured bar down the left edge. */
export interface PanelStyle extends BoxStyle {
  accentColor?: string;
  accentWidth?: number; // px
  minHeight?: number; // px
}

/** One tile of a card's marks row (markLayout 'tiles'). */
export interface TileStyle {
  /** Inner spacing in px: top/bottom, and left/right unless paddingX is set. */
  padding?: number;
  paddingX?: number;
  /** Rounded corners (px; default square once a tile style is set). */
  borderRadius?: number;
}

export interface SubjectCardStyle {
  /** Rounded card corners (px). */
  radius?: number;
  /** The tiles' spacing and corners, instead of the small rounded default. */
  tile?: TileStyle;
  /** table: a bordered marks table (default); tiles: each label over its value, no grid. */
  markLayout?: 'table' | 'tiles';
  /** The marks table's column labels (or the tile labels). */
  markHead?: BarStyle;
  /** Rows "terms": the First / Second / Final label cells. */
  termCell?: BarStyle;
  /** Rows "terms": background of the Final row's label and mark cells (instead of a stripe across the row). */
  finalRowBackground?: string;
  /** Space (px) around the core standards and comment sections; with tiles, around the whole card body. */
  bodyPadding?: number;
  /** Colour of a hairline above the core standards and comment sections. */
  sectionRule?: string;
  /** Section labels ("Core Standards Progress", the comment label). */
  label?: TextStyle;
  /** Print the comment label as a full-width strip instead. */
  labelBar?: BarStyle;
  /** The box around the core standards and comment text. */
  panel?: PanelStyle;
  /** The comment's box when it differs from `panel`. */
  commentPanel?: PanelStyle;
  /** Colours of an empty work habits / behaviour / overall value. */
  emptyRating?: { background?: string; color?: string };
  /** Comment text. */
  commentText?: TextStyle;
}

/** "Subjects | Strengths/Next Steps" rows. */
export interface CommentsTableBlock extends BlockBase, TableLook {
  type: 'commentsTable';
  source: 'comments' | 'subjects' | 'skillGroups';
  subjectLabel: string;
  commentLabel: string;
  subjectWidth: number; // percent
  /** Optional column grid (percent); the subject cell spans `subjectSpan` columns, the comment the rest. Lets a footer row use finer columns. */
  grid?: number[];
  subjectSpan?: number;
  headerBar?: BarStyle;
  subjectStyle?: TextStyle;
  /** Background of the subject cells. */
  subjectBackground?: string;
  /** The small caption under a subject (e.g. "Reading, Writing, …"). */
  captionStyle?: TextStyle;
  /** The comment cells' text (size, line height, vertical alignment…). */
  commentStyle?: TextStyle;
  /** Minimum height (px) of each row. */
  rowHeight?: number;
  showEmptyRows?: boolean;
  /** A last row inside the same grid, e.g. signatures. */
  footerRow?: TableRowDef | null;
}

export interface LearningSkillsBlock extends BlockBase, TableLook {
  type: 'learningSkills';
  title?: string;
  titleBar?: BarStyle;
  scaleId?: string;
  showDescriptors?: boolean;
  termColumns: Array<'rating' | 't1' | 't2'>;
  termLabels?: Partial<Record<'rating' | 't1' | 't2', string>>;
  legend?: string;
  /** A label cell before the legend in the header row, e.g. "Learning Skills". */
  headerLabel?: string;
  /** Width of that label cell, percent of the table (default 16). */
  headerLabelWidth?: number;
  /** Print each skill's name as a shaded strip across the top of its cell. */
  nameBar?: BarStyle;
  /** Rating cells' text style. */
  ratingStyle?: TextStyle;
}

export interface SignatureSlot {
  label: RichText;
  image?: ImageSource | null;
  showLine?: boolean;
}

export interface SignaturesBlock extends BlockBase {
  type: 'signatures';
  slots: SignatureSlot[];
  imageHeight?: number;
  style?: TextStyle;
  caption?: RichText; // centred line under the row, e.g. "Created on {{meta.generatedDate|long}}"
  topRule?: boolean;
  /** Width of each signature line in px (default the slot's width). */
  lineWidth?: number;
}

export interface ColumnsBlock extends BlockBase {
  type: 'columns';
  gap: number;
  columns: Array<{ width: number; blocks: Block[] }>;
}

export interface CanvasBlock extends BlockBase {
  type: 'canvas';
  height: number;
  elements: CanvasElement[];
}

export interface SpacerBlock extends BlockBase {
  type: 'spacer';
  height: number;
}

export interface PageBreakBlock extends BlockBase {
  type: 'pageBreak';
}

/** A whole page laid out freely (pure Canva page). Always its own page. */
export interface FreePageBlock extends BlockBase {
  type: 'freePage';
  elements: CanvasElement[];
  /** Print the template's header and footer zones on this page too. */
  useZones?: boolean;
}

export type Block =
  | TableBlock
  | TextBlock
  | RatingKeyBlock
  | SkillsTableBlock
  | SubjectCardsBlock
  | CommentsTableBlock
  | LearningSkillsBlock
  | SignaturesBlock
  | ColumnsBlock
  | CanvasBlock
  | SpacerBlock
  | PageBreakBlock
  | FreePageBlock;

export type BlockType = Block['type'];

// ─────────────────────────────────────────────────────────── template ──

export interface Theme {
  fontFamily: FontId;
  fontSize: number;
  color: string;
  borderColor: string;
  accent: string;
}

export interface TemplateDoc {
  schemaVersion: 1;
  docType: DocType;
  page: { size: PageSize; margin: Box4; background?: string };
  theme: Theme;
  scales: RatingScale[];
  marks: MarkRules;
  fields: ExtraFieldDef[];
  /** Header on every page (pages 2+ when firstHeader is set). */
  header: Zone;
  footer: Zone;
  /** Page 1's own header/footer ("different first page"). */
  firstHeader?: Zone | null;
  firstFooter?: Zone | null;
  blocks: Block[];
}

// ───────────────────────────────────────────────────────── report data ──

/** A mark from the grade engine: percent, 'I' (no evidence) or null (none). */
export type MarkValue = number | 'I' | null;

export interface TermResult {
  mark: MarkValue;
  workHabits: string;
  behaviour: string;
  comment: string;
}

export interface SubjectRow {
  id: string;
  name: string;
  teacher: string;
  /** This term. */
  mark: MarkValue;
  workHabits: string;
  behaviour: string;
  coreStandards: string;
  comment: string;
  /** For multi-term layouts (First / Second / Final). */
  terms: { t1?: TermResult; t2?: TermResult; final?: TermResult };
}

export interface SkillItem {
  id: string;
  name: string;
  description: string;
  /** Rating for this report's term. */
  rating: string;
  t1: string;
  t2: string;
}

export interface SkillGroup {
  id: string;
  name: string;
  comment: string;
  items: SkillItem[];
}

export interface CommentRow {
  key: string;
  label: string;
  caption: string;
  text: string;
}

export interface LearningSkillRow {
  name: string;
  descriptors: string[];
  rating: string;
  t1: string;
  t2: string;
}

export interface ReportData {
  dataVersion: 1;
  meta: {
    docType: DocType;
    term: string; // "Term 1"
    termNumber: number | null;
    termLabel: string; // "FIRST TERM"
    schoolYear: string; // "2026 - 2027"; '' on a JK/SK progress report when the school has no school year
    reportDate: string; // YYYY-MM-DD, printed as the report's date
    generatedDate: string; // YYYY-MM-DD
  };
  school: {
    code: string;
    name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    principal: string;
    board: string;
  };
  /** Image URLs or data URIs (the backend inlines them before printing). */
  assets: {
    logo: string | null;
    principalSignature: string | null;
    stamp: string | null;
    teacherSignature: string | null;
  };
  student: {
    id: string;
    name: string;
    firstName: string;
    lastName: string;
    oen: string;
    grade: string; // 'JK' | 'SK' | '1'..'8'
    gradeLabel: string; // "Senior Kindergarten", "Grade 4"
    gradeNumber: number; // JK = -1, SK = 0
    /** JK/SK progress reports: the homeroom teacher, else the grade's Kindergarten class teacher ('' if none). */
    homeroomTeacher: string;
    teacherAssistant: string;
    /** JK/SK progress reports: absences in the report date's school year up to that date; otherwise all-time. */
    daysAbsent: number;
  };
  subjects: SubjectRow[];
  skills: SkillGroup[];
  /** Progress reports' comment rows, every row in print order (JK 2, SK 9); [] otherwise. */
  comments: CommentRow[];
  learningSkills: LearningSkillRow[];
  extra: Record<string, string>;
}

/** Something an admin should know about a render (overflow, clipping…). */
export interface RenderWarning {
  code: 'oversize-block' | 'zone-overflow' | 'text-shrunk' | 'text-clipped' | 'block-clipped' | 'unknown-rating';
  message: string;
  blockId?: string;
  elementId?: string;
  page?: number;
}
