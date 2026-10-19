// src/lib/itemForm.ts
// The classwork item form's rules (the Teacher-NewAssessment and
// Teacher-Assign boards): what the form holds, the checks it runs before a
// save (the same rules the server's validateItemInput applies, so a teacher
// reads them beside the field instead of as a failed save), and how the form
// becomes the ItemInput the API takes. Dates and times are read on the
// Toronto clock, the school's. Pure, so it is unit-tested (itemForm.test.ts).

import { formatInTimeZone, fromZonedTime } from 'date-fns-tz'
import type {
  CategoryOption,
  ColumnOption,
  GradebookInput,
  Item,
  ItemInput,
  ItemKind,
  ItemStatus,
  SubmissionMode,
  Topic,
} from '@/services/types/classwork'

export const TORONTO = 'America/Toronto'
export const TITLE_MAX = 200
export const INSTRUCTIONS_MAX = 20_000
export const MAX_SCORE_LIMIT = 10_000
export const MAX_AUDIENCE = 500
/**
 * A quiz's column is out of the quiz's points: the server sets it each time
 * the questions save. A new quiz has none yet, so its column starts out of 1
 * until its first questions are saved; the form never asks for an "Out of".
 */
export const QUIZ_START_MAX = 1

/** The server's D2 refusal when a class has no category to put graded work under. */
export const D2_MESSAGE = 'Add a category in Grades → Assessments & categories first, or fill an existing column.'
/** The server's 409 for a column that counts on its own being moved into a category. */
export const STANDALONE_MESSAGE = 'This column counts on its own in Grades. Move it in Grades → Assessments & categories.'

export type GradebookMode = 'category' | 'existing' | 'none'

/** Everything the form holds, as the inputs hold it (strings until saved). */
export interface ItemFormValues {
  title: string
  instructions: string
  /** '' = no topic. */
  topicId: string
  /** Assessment: 'YYYY-MM-DD' or ''. */
  date: string
  /** Assignment and quiz: 'YYYY-MM-DD' or ''. */
  dueDate: string
  /** 'HH:mm' (24 h, Toronto) or ''. */
  dueTime: string
  submissionMode: SubmissionMode
  gradebookMode: GradebookMode
  categoryId: string
  /** The existing column an assignment or quiz fills. */
  columnId: string
  /** "Out of", as typed. */
  maxScore: string
  audience: 'all' | 'some'
  studentIds: string[]
  emailStudents: boolean
  remindStudents: boolean
  showEarly: boolean
}

export interface ItemFormContext {
  categories: Pick<CategoryOption, 'assessmentId'>[]
  /** The columns an assignment or quiz may fill (on an edit, the item's own column too). */
  linkableColumns: Pick<ColumnOption, 'assessmentId'>[]
  topics: Pick<Topic, 'topicId'>[]
  now?: Date
  /** The status this save asks for, and when a scheduled item posts. */
  status?: ItemStatus
  publishAt?: string | null
  /** The item fills a column that counts on its own (no category): it keeps its place in Grades. */
  standaloneColumn?: boolean
  /** The column the item fills now (an edit), to tell an unchanged column from a new choice. */
  currentColumn?: CurrentColumn | null
}

/** The gradebook column an item fills as saved: its category (null = counts on its own) and "Out of". */
export interface CurrentColumn {
  categoryId: string | null
  maxScore: number | null
}

/**
 * A column whose "Out of" was never set (main allows it; the grade engine
 * reads it as 100), left blank and in the same category: it stays exactly as
 * it is, so the form neither asks for an "Out of" nor sends one.
 */
export function keepsUnsetMax(kind: ItemKind, values: ItemFormValues, current: CurrentColumn | null | undefined): boolean {
  if (!current || current.maxScore != null || values.maxScore.trim() !== '') return false
  if (kind !== 'assessment' && values.gradebookMode !== 'category') return false
  return values.categoryId === (current.categoryId ?? '')
}

export type ItemFormField =
  | 'title'
  | 'instructions'
  | 'topicId'
  | 'date'
  | 'dueDate'
  | 'dueTime'
  | 'submissionMode'
  | 'gradebook'
  | 'categoryId'
  | 'columnId'
  | 'maxScore'
  | 'studentIds'
  | 'publishAt'

export type ItemFormErrors = Partial<Record<ItemFormField, string>>

export const hasErrors = (errors: ItemFormErrors): boolean => Object.keys(errors).length > 0

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const SUBMISSION_MODES: SubmissionMode[] = ['file', 'text', 'done', 'none']

const isTurnIn = (kind: ItemKind) => kind === 'assignment' || kind === 'quiz'

/** A real calendar day in YYYY-MM-DD. */
export function isCalendarDate(value: string): boolean {
  if (!DATE_RE.test(value)) return false
  const d = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value
}

/** "Out of" as a number, or NaN when it isn't one. */
const parseMax = (value: string): number => (value.trim() === '' ? NaN : Number(value))

function maxScoreError(value: string): string | null {
  const n = parseMax(value)
  if (!Number.isFinite(n) || n <= 0) return 'Out of must be more than 0'
  if (n > MAX_SCORE_LIMIT) return 'Out of must be 10,000 or less'
  return null
}

/**
 * The form's problems, one message per field; {} when it can be saved.
 * Mirrors the server's validateItemInput.
 */
export function validateItemForm(kind: ItemKind, values: ItemFormValues, ctx: ItemFormContext): ItemFormErrors {
  const errors: ItemFormErrors = {}
  const now = ctx.now ?? new Date()

  const title = values.title.trim()
  if (!title) errors.title = 'Give it a title'
  else if (title.length > TITLE_MAX) errors.title = `Keep the title to ${TITLE_MAX} characters`

  if (values.instructions.trim().length > INSTRUCTIONS_MAX) errors.instructions = 'Keep the instructions to 20,000 characters'

  if (values.topicId && !ctx.topics.some((t) => t.topicId === values.topicId)) {
    errors.topicId = "Choose one of this class's topics"
  }

  const inCategories = (id: string) => ctx.categories.some((c) => c.assessmentId === id)

  const unsetMaxKept = keepsUnsetMax(kind, values, ctx.currentColumn)

  if (kind === 'assessment') {
    if (!ctx.standaloneColumn) {
      if (ctx.categories.length === 0) errors.categoryId = D2_MESSAGE
      else if (!values.categoryId || !inCategories(values.categoryId)) errors.categoryId = 'Choose a category'
      const max = unsetMaxKept ? null : maxScoreError(values.maxScore)
      if (max) errors.maxScore = max
    }
    if (values.date && !isCalendarDate(values.date)) errors.date = 'Pick a real date'
  }

  if (isTurnIn(kind)) {
    if (values.gradebookMode === 'category') {
      if (ctx.standaloneColumn) errors.gradebook = STANDALONE_MESSAGE
      else if (ctx.categories.length === 0) errors.categoryId = D2_MESSAGE
      else if (!values.categoryId || !inCategories(values.categoryId)) errors.categoryId = 'Choose a category'
      // A quiz is out of its points (QUIZ_START_MAX): nothing to check.
      if (!ctx.standaloneColumn && kind !== 'quiz') {
        const max = unsetMaxKept ? null : maxScoreError(values.maxScore)
        if (max) errors.maxScore = max
      }
    } else if (values.gradebookMode === 'existing') {
      if (!values.columnId || !ctx.linkableColumns.some((c) => c.assessmentId === values.columnId)) {
        errors.columnId = 'Choose a column'
      }
    }

    if (values.dueDate && !isCalendarDate(values.dueDate)) errors.dueDate = 'Pick a real date'
    else if (values.dueDate && !values.dueTime) errors.dueTime = 'Add a time'
    else if (!values.dueDate && values.dueTime) errors.dueDate = 'Add a date'
    else if (values.dueTime && !TIME_RE.test(values.dueTime)) errors.dueTime = 'Pick a time'

    if (kind === 'assignment' && !SUBMISSION_MODES.includes(values.submissionMode)) {
      errors.submissionMode = 'Choose how students turn it in'
    }
  }

  if (values.audience === 'some') {
    if (values.studentIds.length === 0) errors.studentIds = 'Choose at least one student'
    else if (new Set(values.studentIds).size > MAX_AUDIENCE) errors.studentIds = `Choose at most ${MAX_AUDIENCE} students`
  }

  if (ctx.status === 'scheduled') {
    const at = ctx.publishAt ? Date.parse(ctx.publishAt) : NaN
    if (!Number.isFinite(at) || at <= now.getTime()) errors.publishAt = 'Pick a date and time in the future'
  }

  return errors
}

// ---------------------------------------------------------------------------
// Dates and times (Toronto)

/** A Toronto date and time ('YYYY-MM-DD', 'HH:mm') as an ISO instant; null without both. */
export function torontoToIso(date: string, time: string): string | null {
  if (!date || !time || !isCalendarDate(date) || !TIME_RE.test(time)) return null
  return fromZonedTime(`${date}T${time}:00`, TORONTO).toISOString()
}

/** An instant's Toronto date and time, for the date and time inputs. */
export function isoToTorontoParts(iso: string | null | undefined): { date: string; time: string } {
  if (!iso || Number.isNaN(Date.parse(iso))) return { date: '', time: '' }
  return { date: formatInTimeZone(iso, TORONTO, 'yyyy-MM-dd'), time: formatInTimeZone(iso, TORONTO, 'HH:mm') }
}

// ---------------------------------------------------------------------------
// The form → ItemInput

export interface ToInputOptions {
  status?: ItemStatus
  publishAt?: string | null
  /** The column counts on its own: send no gradebook, so it keeps its place. */
  standaloneColumn?: boolean
  /** The column the item fills now (see keepsUnsetMax). */
  currentColumn?: CurrentColumn | null
}

function gradebookOf(kind: ItemKind, values: ItemFormValues): GradebookInput {
  if (kind === 'assessment' || values.gradebookMode === 'category') {
    const max = parseMax(values.maxScore)
    // A quiz keeps the "Out of" its questions gave it, or starts out of 1 (QUIZ_START_MAX).
    const maxScore = kind === 'quiz' && !(Number.isFinite(max) && max > 0) ? QUIZ_START_MAX : max
    return { mode: 'category', categoryId: values.categoryId, maxScore }
  }
  if (values.gradebookMode === 'existing') return { mode: 'existing', assessmentId: values.columnId }
  return { mode: 'none' }
}

/**
 * The ItemInput a save sends. Each kind sends only its own fields: an
 * assessment its date (never dueAt), an assignment or quiz its due time, a
 * material neither, and no gradebook.
 */
export function toItemInput(kind: ItemKind, values: ItemFormValues, opts: ToInputOptions = {}): ItemInput {
  const input: ItemInput = {
    kind,
    title: values.title.trim(),
    instructions: values.instructions.trim() ? values.instructions.trim() : null,
    topicId: values.topicId || null,
    audience: values.audience,
    emailStudents: values.emailStudents,
  }
  if (values.audience === 'some') input.studentIds = [...new Set(values.studentIds)]

  // Leaving `gradebook` out keeps the column as it is.
  const keepColumn = keepsUnsetMax(kind, values, opts.currentColumn)
  if (kind === 'assessment') {
    input.date = values.date || null
    input.showEarly = values.showEarly
    if (!opts.standaloneColumn && !keepColumn) input.gradebook = gradebookOf(kind, values)
  } else if (isTurnIn(kind)) {
    input.dueAt = torontoToIso(values.dueDate, values.dueTime)
    input.remindStudents = values.remindStudents
    if (kind === 'assignment') input.submissionMode = values.submissionMode
    // An item that fills a column counting on its own keeps it unless the teacher picks another.
    const keepsStandalone = opts.standaloneColumn && values.gradebookMode === 'category'
    if (!keepsStandalone && !keepColumn) input.gradebook = gradebookOf(kind, values)
  }

  if (opts.status) input.status = opts.status
  if (opts.status === 'scheduled') input.publishAt = opts.publishAt ?? null
  return input
}

const GRADEBOOK_FIELDS: ItemFormField[] = ['gradebook', 'categoryId', 'columnId', 'maxScore']

/**
 * What an autosave of a draft sends: the form as a draft, minus anything
 * not ready yet (half a due date, an empty "Out of", no students picked), so
 * a half-typed field never fails the save of everything else. Leaving a key
 * out of a PATCH keeps what the server has. Null until there is a title.
 */
export function draftItemInput(kind: ItemKind, values: ItemFormValues, ctx: ItemFormContext): ItemInput | null {
  const errors = validateItemForm(kind, values, { ...ctx, status: 'draft' })
  if (errors.title) return null
  const input = toItemInput(kind, values, { status: 'draft', standaloneColumn: ctx.standaloneColumn, currentColumn: ctx.currentColumn })
  if (errors.instructions) delete input.instructions
  if (errors.topicId) delete input.topicId
  if (errors.date) delete input.date
  if (errors.dueDate || errors.dueTime) delete input.dueAt
  if (errors.submissionMode) delete input.submissionMode
  if (GRADEBOOK_FIELDS.some((f) => errors[f])) delete input.gradebook
  if (errors.studentIds) {
    delete input.audience
    delete input.studentIds
  }
  return input
}

// ---------------------------------------------------------------------------
// Starting values

export function emptyItemValues(
  kind: ItemKind,
  opts: { categories?: Pick<CategoryOption, 'assessmentId'>[]; topicId?: string | null } = {},
): ItemFormValues {
  const firstCategory = opts.categories?.[0]?.assessmentId ?? ''
  const graded = kind === 'assessment' || (isTurnIn(kind) && firstCategory !== '')
  return {
    title: '',
    instructions: '',
    topicId: opts.topicId ?? '',
    date: '',
    dueDate: '',
    dueTime: '',
    submissionMode: kind === 'assignment' ? 'file' : 'none',
    gradebookMode: graded ? 'category' : 'none',
    categoryId: firstCategory,
    columnId: '',
    maxScore: '',
    audience: 'all',
    studentIds: [],
    emailStudents: kind !== 'assessment',
    remindStudents: true,
    showEarly: kind === 'assessment',
  }
}

/** A saved item back in the form. A column with no category is the existing column it fills. */
export function itemToFormValues(item: Item): ItemFormValues {
  const due = isoToTorontoParts(item.dueAt)
  const gb = item.gradebook
  let gradebookMode: GradebookMode = 'none'
  if (gb) gradebookMode = gb.categoryId || item.kind === 'assessment' ? 'category' : 'existing'
  return {
    title: item.title ?? '',
    instructions: item.instructions ?? '',
    topicId: item.topicId ?? '',
    date: item.kind === 'assessment' ? item.date ?? '' : '',
    dueDate: due.date,
    dueTime: due.time,
    submissionMode: item.submissionMode,
    gradebookMode,
    categoryId: gb?.categoryId ?? '',
    columnId: gb && !gb.categoryId ? gb.assessmentId : '',
    maxScore: gb?.maxScore != null ? String(gb.maxScore) : '',
    audience: item.audience,
    studentIds: item.audience === 'some' ? item.studentIds : [],
    emailStudents: item.emailStudents,
    remindStudents: item.remindStudents,
    showEarly: item.showEarly,
  }
}

/** The form with its gradebook choice put back to the column as saved (none when nothing is saved). */
export function withSavedGradebook(values: ItemFormValues, saved: Item | null): ItemFormValues {
  const from = saved
    ? itemToFormValues(saved)
    : { gradebookMode: 'none' as GradebookMode, categoryId: values.categoryId, columnId: '', maxScore: values.maxScore }
  return { ...values, gradebookMode: from.gradebookMode, categoryId: from.categoryId, columnId: from.columnId, maxScore: from.maxScore }
}

/** Whether two form states hold the same values (an edit typed back to what was sent is no change). */
export function sameFormValues(a: ItemFormValues, b: ItemFormValues): boolean {
  if (a === b) return true
  return (Object.keys(a) as (keyof ItemFormValues)[]).every((key) => {
    const x = a[key]
    const y = b[key]
    if (Array.isArray(x) && Array.isArray(y)) return x.length === y.length && x.every((v, i) => v === y[i])
    return x === y
  })
}

/** What became of the edits typed while a button save (Assign, Post, Save, Schedule) was in flight. */
export type NewerEditsOutcome<R> =
  /** Nothing was typed meanwhile. */
  | { kind: 'none' }
  /** The newest values saved too; `result` is the server's last answer. */
  | { kind: 'saved'; result: R }
  /** The newest values have a problem the form shows; nothing was sent for them. */
  | { kind: 'invalid'; values: ItemFormValues; errors: ItemFormErrors }
  /** Sending the newest values failed. */
  | { kind: 'failed'; error: unknown }
  /** Still changing after `maxRounds` sends (typing without a pause). */
  | { kind: 'unsettled' }

/**
 * FE re-review N1 ("never lose an edit"): the fields stay editable while a
 * button save is in flight, so a change typed meanwhile was not in what it
 * sent. Once that save succeeds, this sends the newest values as well, as a
 * plain edit, and again while they keep changing (latest edit wins), before
 * the form may leave. A value the form would refuse is not sent: the caller
 * keeps the form open on it, as it does on a failure or when the values never
 * settle.
 */
export async function saveNewerEdits<R>({
  sent,
  latest,
  check,
  send,
  maxRounds = 5,
}: {
  /** What the button save sent. */
  sent: ItemFormValues
  /** The form's values now. */
  latest: () => ItemFormValues
  /** The form's own checks for these values (validateItemForm). */
  check: (values: ItemFormValues) => ItemFormErrors
  /** Saves these values (a PATCH that changes no status). */
  send: (values: ItemFormValues) => Promise<R>
  maxRounds?: number
}): Promise<NewerEditsOutcome<R>> {
  let last = sent
  let saved: { result: R } | null = null
  for (let round = 0; round < maxRounds; round++) {
    const next = latest()
    if (sameFormValues(next, last)) return saved ? { kind: 'saved', result: saved.result } : { kind: 'none' }
    const errors = check(next)
    if (hasErrors(errors)) return { kind: 'invalid', values: next, errors }
    try {
      saved = { result: await send(next) }
    } catch (error) {
      return { kind: 'failed', error }
    }
    last = next
  }
  return saved && sameFormValues(latest(), last) ? { kind: 'saved', result: saved.result } : { kind: 'unsettled' }
}

export interface AutosaveFailure {
  /** What the teacher reads: the server's own reason. */
  message: string
  /**
   * The form to continue from. A refused gradebook change (409: graded work,
   * an "Out of" below a grade, published grades, a column that counts on its
   * own, a column already taken) goes back to the column as saved, so the
   * rest of the draft keeps saving. Null: keep the form and retry as it is.
   */
  values: ItemFormValues | null
}

/** How an autosave failure is handled (see AutosaveFailure). */
export function autosaveFailure(
  error: { status?: number | null; message?: string | null } | null | undefined,
  values: ItemFormValues,
  saved: Item | null,
): AutosaveFailure {
  const message = error?.message?.trim() || "The draft didn't save."
  if (error?.status === 409) return { message, values: withSavedGradebook(values, saved) }
  return { message, values: null }
}

// ---------------------------------------------------------------------------
// Labels

const points = (n: number) => String(Math.round(n * 100) / 100)

/** "Tests (30 of 100)" */
export const categoryOptionLabel = (c: CategoryOption): string => `${c.name} (${points(c.weightPoints)} of 100)`

/** "Unit 1 test · Tests" for a column an assignment or quiz can fill. */
export const columnOptionLabel = (c: ColumnOption): string =>
  [c.name, c.categoryName, c.maxScore != null ? `out of ${points(c.maxScore)}` : null].filter(Boolean).join(' · ')
