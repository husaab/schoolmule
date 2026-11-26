// src/components/classes/items/GradebookLinkField.tsx
// How an assignment or quiz counts in the gradebook (the Teacher-Assign
// board, D2): a new column under a category, a new column that counts on its
// own, an existing column, or not graded, with "Marked out of". A category
// can be made right here ("New category…"). A column that already counts on
// its own keeps its place: it is never offered a category (the server would
// refuse the move). Also exports the "Counts toward" picker and the "Marked
// out of" and "Worth" inputs the assessment form uses.
'use client'

import type { ReactNode } from 'react'
import { NEW_CATEGORY, ON_ITS_OWN, countsSummary, weightNote } from '@/lib/countsToward'
import { categoryOptionLabel, columnOptionLabel, STANDALONE_MESSAGE, type ItemFormErrors, type ItemFormValues } from '@/lib/itemForm'
import type { CategoryOption, ColumnOption } from '@/services/types/classwork'
import { CardTitle, FIELD_INPUT, FIELD_SELECT, FormCard, fieldId } from './formParts'

interface CountsTowardSelectProps {
  categories: CategoryOption[]
  /** A category's id, ON_ITS_OWN, or '' while nothing is chosen. */
  value: string
  onChange: (categoryId: string) => void
  /** Offers "On its own" in the list (the assessment form; an assignment or quiz has a radio for it). */
  onOwn?: () => void
  /** "New category…": opens the window that makes one. */
  onNewCategory: () => void
  error?: string
  disabled?: boolean
  compact?: boolean
  ariaLabel?: string
}

/** "Counts toward": the class's categories with their share of the final grade, then "On its own" and "New category…". */
export function CountsTowardSelect({ categories, value, onChange, onOwn, onNewCategory, error, disabled, compact, ariaLabel }: CountsTowardSelectProps) {
  const chosen = (value === ON_ITS_OWN && Boolean(onOwn)) || categories.some((c) => c.assessmentId === value)
  return (
    <select
      id={fieldId('categoryId')}
      aria-label={ariaLabel}
      value={chosen ? value : ''}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      onChange={(e) => {
        // "New category…" is an action: the list stays on what it showed until one is made.
        if (e.target.value === NEW_CATEGORY) onNewCategory()
        else if (e.target.value === ON_ITS_OWN) onOwn?.()
        else onChange(e.target.value)
      }}
      className={`${FIELD_SELECT} ${compact ? '!py-2 !text-sm' : ''}`}
    >
      {!chosen && <option value="">Choose a category</option>}
      {categories.map((c) => (
        <option key={c.assessmentId} value={c.assessmentId}>
          {categoryOptionLabel(c)}
        </option>
      ))}
      {onOwn && <option value={ON_ITS_OWN}>On its own</option>}
      <option value={NEW_CATEGORY}>New category…</option>
    </select>
  )
}

interface OutOfInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  className?: string
}

export function OutOfInput({ value, onChange, error, disabled, className = '' }: OutOfInputProps) {
  return (
    <input
      id={fieldId('maxScore')}
      type="number"
      inputMode="decimal"
      min={0}
      step="any"
      value={value}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      onChange={(e) => onChange(e.target.value)}
      placeholder="e.g. 30"
      className={`${FIELD_INPUT} ${className}`}
    />
  )
}

/** "Worth": the share of the final grade of a column that counts on its own, as a percent. */
export function WorthInput({ value, onChange, error, disabled, className = '', ariaLabel }: OutOfInputProps & { ariaLabel?: string }) {
  return (
    <div className={`relative ${className}`}>
      <input
        id={fieldId('weightPoints')}
        aria-label={ariaLabel}
        type="number"
        inputMode="decimal"
        min={0}
        max={100}
        step="any"
        value={value}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${fieldId('weightPoints')}-note`}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. 10"
        className={`${FIELD_INPUT} !pr-9`}
      />
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-slate-500">
        %
      </span>
    </div>
  )
}

/** Under a "Worth" box: its problem, or where the class's 100% stands with it. */
export function WorthNote({ pointsUsed, value, error }: { pointsUsed: number; value: string; error?: string }) {
  const note = weightNote(pointsUsed, value)
  return (
    <p id={`${fieldId('weightPoints')}-note`} className={`text-xs ${error ? 'text-rose-700' : note.over ? 'text-amber-700' : 'text-slate-500'}`}>
      {error ?? note.text}
    </p>
  )
}

/** What the gradebook choices come to, in plain sentences (countsSummary). */
export function CountsSummary({ lines }: { lines: string[] }) {
  if (lines.length === 0) return null
  return (
    <div aria-live="polite" className="flex flex-col gap-1 rounded-xl border border-cyan-100 bg-cyan-50/60 px-3.5 py-2.5 text-[13px] leading-relaxed text-slate-700">
      {lines.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  )
}

interface GradebookLinkFieldProps {
  values: ItemFormValues
  set: (patch: Partial<ItemFormValues>) => void
  errors: ItemFormErrors
  categories: CategoryOption[]
  /** The columns the item may fill (on an edit, its own column too). */
  columns: ColumnOption[]
  /** The item fills a column that counts on its own. */
  standalone?: boolean
  /** The category the item's column is under now (an edit), and that column's own share. */
  currentCategoryId?: string | null
  currentWeightPoints?: number | null
  /** What the rest of the class adds up to, of its 100%. */
  pointsUsed: number
  onNewCategory: () => void
  /** JK and SK are graded on skills: nothing here is graded. */
  kindergarten?: boolean
  disabled?: boolean
  /** Said in place of the "Out of" box when the item sets it itself (a quiz is out of its points). */
  outOfNote?: string | null
}

const RADIO = 'h-[18px] w-[18px] shrink-0 cursor-pointer accent-cyan-600 disabled:cursor-not-allowed'

export default function GradebookLinkField({
  values,
  set,
  errors,
  categories,
  columns,
  standalone = false,
  currentCategoryId = null,
  currentWeightPoints = null,
  pointsUsed,
  onNewCategory,
  kindergarten = false,
  disabled = false,
  outOfNote = null,
}: GradebookLinkFieldProps) {
  const mode = values.gradebookMode
  const category = categories.find((c) => c.assessmentId === values.categoryId)
  const column = columns.find((c) => c.assessmentId === values.columnId)
  const noCategories = categories.length === 0
  const categoryOff = disabled || kindergarten || standalone
  const ownOff = disabled || kindergarten
  const columnOff = disabled || kindergarten || columns.length === 0

  const pick = (next: ItemFormValues['gradebookMode']) => {
    const patch: Partial<ItemFormValues> = { gradebookMode: next }
    if (next === 'category' && !category && categories[0]) patch.categoryId = categories[0].assessmentId
    if (next === 'existing' && !column && columns[0]) patch.columnId = columns[0].assessmentId
    set(patch)
  }

  // Its own column and how much of the final grade rides on it, in plain sentences.
  const summary =
    kindergarten || (mode === 'category' && categoryOff)
      ? []
      : countsSummary({
          mode,
          category: category ?? null,
          maxScore: values.maxScore,
          weightPoints: values.weightPoints,
          current: currentCategoryId ? { categoryId: currentCategoryId, weightPoints: currentWeightPoints } : null,
          ownMax: Boolean(outOfNote),
        })
  const showsMax = (mode === 'category' && !categoryOff) || (mode === 'standalone' && !ownOff)

  let helper: ReactNode = null
  if (kindergarten) helper = "JK and SK are graded on skills, so classwork here isn't graded."
  else if (mode === 'existing' && column) helper = `Scores go in the column "${column.name}" in Grades.`
  else if (mode === 'none') helper = 'Nothing is added to Grades.'

  return (
    <FormCard>
      <CardTitle>Gradebook</CardTitle>
      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Gradebook">
        <label className={`flex items-start gap-2.5 text-sm ${categoryOff ? 'text-slate-400' : 'cursor-pointer text-slate-800'}`}>
          <input
            type="radio"
            name="gradebook-mode"
            checked={mode === 'category'}
            disabled={categoryOff || noCategories}
            onChange={() => pick('category')}
            className={`${RADIO} mt-px`}
          />
          <span className="flex flex-1 flex-col gap-1.5">
            Counts toward a category
            {mode === 'category' && !categoryOff && !noCategories && (
              <CountsTowardSelect
                categories={categories}
                value={values.categoryId}
                onChange={(categoryId) => set({ categoryId })}
                onNewCategory={onNewCategory}
                error={errors.categoryId}
                compact
                ariaLabel="Category"
              />
            )}
            {standalone && <span className="text-xs text-slate-500">{STANDALONE_MESSAGE}</span>}
            {noCategories && !categoryOff && (
              <span className="text-xs text-slate-500">
                No categories yet.{' '}
                <button type="button" onClick={onNewCategory} className="cursor-pointer font-medium text-cyan-700 underline hover:text-cyan-800">
                  Add a category
                </button>
              </span>
            )}
          </span>
        </label>

        <label className={`flex items-start gap-2.5 text-sm ${ownOff ? 'text-slate-400' : 'cursor-pointer text-slate-800'}`}>
          <input
            type="radio"
            name="gradebook-mode"
            checked={mode === 'standalone'}
            disabled={ownOff}
            onChange={() => pick('standalone')}
            className={`${RADIO} mt-px`}
          />
          <span className="flex flex-1 flex-col gap-1.5">
            Counts on its own
            {mode === 'standalone' && !ownOff && (
              <>
                <span className="flex flex-wrap items-center gap-2 text-[13px] text-slate-600">
                  Worth
                  <WorthInput
                    value={values.weightPoints}
                    onChange={(weightPoints) => set({ weightPoints })}
                    error={errors.weightPoints}
                    className="w-[110px]"
                    ariaLabel="Worth, percent of the final grade"
                  />
                  of the final grade
                </span>
                <WorthNote pointsUsed={pointsUsed} value={values.weightPoints} error={errors.weightPoints} />
              </>
            )}
          </span>
        </label>

        <label className={`flex items-start gap-2.5 text-sm ${columnOff ? 'text-slate-400' : 'cursor-pointer text-slate-800'}`}>
          <input
            type="radio"
            name="gradebook-mode"
            checked={mode === 'existing'}
            disabled={columnOff}
            onChange={() => pick('existing')}
            className={`${RADIO} mt-px`}
          />
          <span className="flex flex-1 flex-col gap-1.5">
            Fill an existing column
            {mode === 'existing' && !columnOff && (
              <select
                id={fieldId('columnId')}
                aria-label="Column"
                value={values.columnId}
                aria-invalid={errors.columnId ? true : undefined}
                onChange={(e) => set({ columnId: e.target.value })}
                className={`${FIELD_SELECT} !py-2 !text-sm`}
              >
                {!column && <option value="">Choose a column</option>}
                {columns.map((c) => (
                  <option key={c.assessmentId} value={c.assessmentId}>
                    {columnOptionLabel(c)}
                  </option>
                ))}
              </select>
            )}
          </span>
        </label>

        <label className={`flex items-center gap-2.5 text-sm ${disabled ? 'text-slate-400' : 'cursor-pointer text-slate-800'}`}>
          <input
            type="radio"
            name="gradebook-mode"
            checked={mode === 'none'}
            disabled={disabled}
            onChange={() => pick('none')}
            className={RADIO}
          />
          Not graded
        </label>
      </div>

      {showsMax && outOfNote && <p className="text-[13px] text-slate-600">{outOfNote}</p>}
      {showsMax && !outOfNote && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={fieldId('maxScore')} className="text-[13px] font-medium text-slate-600">
            Marked out of
          </label>
          <OutOfInput value={values.maxScore} onChange={(maxScore) => set({ maxScore })} error={errors.maxScore} className="!w-[110px]" />
          {errors.maxScore && <p className="text-xs text-rose-700">{errors.maxScore}</p>}
        </div>
      )}

      {(errors.categoryId || errors.columnId || errors.gradebook) && (
        <p className="text-xs text-rose-700">{errors.categoryId ?? errors.columnId ?? errors.gradebook}</p>
      )}
      {helper && <p className="text-[13px] leading-relaxed text-slate-600">{helper}</p>}
      <CountsSummary lines={summary} />
    </FormCard>
  )
}
