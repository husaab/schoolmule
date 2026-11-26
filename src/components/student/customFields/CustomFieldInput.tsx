'use client'

import React from 'react'
import { inputClass, selectClass, textareaClass } from '@/components/shared/modalKit'
import { customFieldError, isRetiredOption } from '@/lib/studentCustomFields'
import type { CustomFieldDefinition } from '@/services/types/studentCustomField'
import { onRadioKeyDown } from './radioKeys'

interface CustomFieldInputProps {
  field: CustomFieldDefinition
  /** The input's text: '' is "not set"; a yes/no field holds 'yes' or 'no'. */
  value: string
  onChange: (value: string) => void
  id: string
  /** The id of the element that names this field (a group of buttons can't be a label's target). */
  labelledBy: string
  /** Says what is wrong once the person has changed the value. */
  showError: boolean
  inputRef?: React.Ref<HTMLElement>
}

const YES_NO: { value: string; label: string }[] = [
  { value: '', label: 'Not set' },
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

/**
 * One custom field's input, by its kind. It looks and behaves like the
 * built-in fields around it: once a school adds a field, nothing on the form
 * marks it as second class.
 */
const CustomFieldInput: React.FC<CustomFieldInputProps> = ({ field, value, onChange, id, labelledBy, showError, inputRef }) => {
  const error = showError ? customFieldError(field, value) : null
  const invalid = error ? 'border-rose-300 focus:ring-rose-400' : ''
  const described = error ? `${id}-error` : undefined

  let control: React.ReactNode
  switch (field.type) {
    case 'textarea':
      control = (
        <textarea
          id={id}
          ref={inputRef as React.Ref<HTMLTextAreaElement>}
          rows={2}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value)}
          className={`${textareaClass} ${invalid}`}
        />
      )
      break

    case 'number':
      // Text with a number keypad, not type="number": that one hands back ''
      // for anything it dislikes, so the form could not say what was wrong.
      control = (
        <input
          id={id}
          ref={inputRef as React.Ref<HTMLInputElement>}
          inputMode="decimal"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} ${invalid}`}
        />
      )
      break

    case 'date':
      control = (
        <input
          id={id}
          ref={inputRef as React.Ref<HTMLInputElement>}
          type="date"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value)}
          className={`${selectClass} ${invalid}`}
        />
      )
      break

    case 'select':
      control = (
        <select
          id={id}
          ref={inputRef as React.Ref<HTMLSelectElement>}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value)}
          className={`${selectClass} ${invalid}`}
        >
          <option value="">Not set</option>
          {/* A choice removed from the field after this student's answer was saved: still shown, never offered. */}
          {isRetiredOption(field, value) && <option value={value}>{value} (no longer a choice)</option>}
          {(field.options ?? []).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      )
      break

    case 'boolean':
      control = (
        <div
          id={id}
          ref={inputRef as React.Ref<HTMLDivElement>}
          role="radiogroup"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          className="inline-flex w-full rounded-xl border border-slate-200 bg-slate-50 p-1 focus:outline-none"
        >
          {YES_NO.map((choice, index) => {
            const selected = value === choice.value
            const tone = !selected
              ? 'text-slate-500 hover:text-slate-800'
              : choice.value === ''
                ? 'bg-white text-slate-700 shadow-sm'
                : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white shadow-sm'
            return (
              <button
                key={choice.label}
                type="button"
                role="radio"
                aria-checked={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => onChange(choice.value)}
                onKeyDown={(e) => onRadioKeyDown(e, index, YES_NO.length, (i) => onChange(YES_NO[i].value))}
                className={`flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${tone}`}
              >
                {choice.label}
              </button>
            )
          })}
        </div>
      )
      break

    default:
      control = (
        <input
          id={id}
          ref={inputRef as React.Ref<HTMLInputElement>}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={described}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} ${invalid}`}
        />
      )
  }

  return (
    <>
      {control}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-rose-600">
          {error}
        </p>
      )}
    </>
  )
}

export default CustomFieldInput
