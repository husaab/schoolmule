// src/components/classes/items/GradebookLinkField.tsx
// How an assignment or quiz counts in the gradebook (the Teacher-Assign
// board, D2): a new column under a category, an existing column, or not
// graded, with "Out of". A column that counts on its own (no category) keeps
// its place: it is never offered a category (the server would refuse the
// move). Also exports the category picker and "Out of" input the assessment
// form uses.
'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { classHref } from '@/lib/classroomRoutes'
import { categoryOptionLabel, columnOptionLabel, STANDALONE_MESSAGE, type ItemFormErrors, type ItemFormValues } from '@/lib/itemForm'
import type { CategoryOption, ColumnOption } from '@/services/types/classwork'
import { CardTitle, FIELD_INPUT, FIELD_SELECT, FormCard, fieldId } from './formParts'

interface CategorySelectProps {
  categories: CategoryOption[]
  value: string
  onChange: (categoryId: string) => void
  error?: string
  disabled?: boolean
  compact?: boolean
  ariaLabel?: string
}

export function CategorySelect({ categories, value, onChange, error, disabled, compact, ariaLabel }: CategorySelectProps) {
  return (
    <select
      id={fieldId('categoryId')}
      aria-label={ariaLabel}
      value={value}
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      onChange={(e) => onChange(e.target.value)}
      className={`${FIELD_SELECT} ${compact ? '!py-2 !text-sm' : ''}`}
    >
      {!categories.some((c) => c.assessmentId === value) && <option value="">Choose a category</option>}
      {categories.map((c) => (
        <option key={c.assessmentId} value={c.assessmentId}>
          {categoryOptionLabel(c)}
        </option>
      ))}
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
      className={`${FIELD_INPUT} ${className}`}
    />
  )
}

/** "Add one in Grades → Assessments & categories" as a link to that sub-tab. */
export function CategoriesLink({ classId }: { classId: string }) {
  return (
    <Link href={classHref(classId, 'grades', { sub: 'setup' })} className="font-medium text-cyan-700 underline hover:text-cyan-800">
      Grades → Assessments &amp; categories
    </Link>
  )
}

interface GradebookLinkFieldProps {
  classId: string
  values: ItemFormValues
  set: (patch: Partial<ItemFormValues>) => void
  errors: ItemFormErrors
  categories: CategoryOption[]
  /** The columns the item may fill (on an edit, its own column too). */
  columns: ColumnOption[]
  /** The item fills a column that counts on its own. */
  standalone?: boolean
  /** The category the item's column is under now (an edit). */
  currentCategoryId?: string | null
  /** JK and SK are graded on skills: nothing here is graded. */
  kindergarten?: boolean
  disabled?: boolean
  /** Said in place of the "Out of" box when the item sets it itself (a quiz is out of its points). */
  outOfNote?: string | null
}

const RADIO = 'h-[18px] w-[18px] shrink-0 cursor-pointer accent-cyan-600 disabled:cursor-not-allowed'

export default function GradebookLinkField({
  classId,
  values,
  set,
  errors,
  categories,
  columns,
  standalone = false,
  currentCategoryId = null,
  kindergarten = false,
  disabled = false,
  outOfNote = null,
}: GradebookLinkFieldProps) {
  const mode = values.gradebookMode
  const category = categories.find((c) => c.assessmentId === values.categoryId)
  const column = columns.find((c) => c.assessmentId === values.columnId)
  const noCategories = categories.length === 0
  const categoryOff = disabled || kindergarten || standalone
  const columnOff = disabled || kindergarten || columns.length === 0

  const pick = (next: ItemFormValues['gradebookMode']) => {
    const patch: Partial<ItemFormValues> = { gradebookMode: next }
    if (next === 'category' && !category && categories[0]) patch.categoryId = categories[0].assessmentId
    if (next === 'existing' && !column && columns[0]) patch.columnId = columns[0].assessmentId
    set(patch)
  }

  let helper: ReactNode = null
  if (kindergarten) helper = "JK and SK are graded on skills, so classwork here isn't graded."
  else if (mode === 'category' && category && currentCategoryId === category.assessmentId) {
    helper = `Its column is under ${category.name}. The class total stays at 100 points.`
  } else if (mode === 'category' && category && currentCategoryId) {
    helper = `Moves its column to ${category.name}. Both categories keep their points, so the class total stays at 100.`
  } else if (mode === 'category' && category) helper = `Adds a column under ${category.name}. The class total stays at 100 points.`
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
              <CategorySelect
                categories={categories}
                value={values.categoryId}
                onChange={(categoryId) => set({ categoryId })}
                error={errors.categoryId}
                compact
                ariaLabel="Category"
              />
            )}
            {standalone && <span className="text-xs text-slate-500">{STANDALONE_MESSAGE}</span>}
            {noCategories && !standalone && !kindergarten && (
              <span className="text-xs text-slate-500">
                No categories yet. Add one in <CategoriesLink classId={classId} />.
              </span>
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

      {mode === 'category' && !categoryOff && outOfNote && <p className="text-[13px] text-slate-600">{outOfNote}</p>}
      {mode === 'category' && !categoryOff && !outOfNote && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={fieldId('maxScore')} className="text-[13px] font-medium text-slate-600">
            Out of
          </label>
          <OutOfInput value={values.maxScore} onChange={(maxScore) => set({ maxScore })} error={errors.maxScore} className="!w-[110px]" />
          {errors.maxScore && <p className="text-xs text-rose-700">{errors.maxScore}</p>}
        </div>
      )}

      {(errors.categoryId || errors.columnId || errors.gradebook) && (
        <p className="text-xs text-rose-700">{errors.categoryId ?? errors.columnId ?? errors.gradebook}</p>
      )}
      {helper && <p className="text-[13px] leading-relaxed text-slate-600">{helper}</p>}
    </FormCard>
  )
}
