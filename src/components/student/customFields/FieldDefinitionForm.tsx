'use client'

import React, { useRef } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { Field, inputClass } from '@/components/shared/modalKit'
import { CUSTOM_FIELD_LIMITS, CUSTOM_FIELD_TYPES, addOption, type FieldDraft } from '@/lib/studentCustomFields'
import { FIELD_TYPE_ICONS, FieldTypeTag } from './FieldTypeTag'
import { onRadioKeyDown } from './radioKeys'

interface FieldDefinitionFormProps {
  draft: FieldDraft
  onChange: (draft: FieldDraft) => void
  idPrefix: string
  /** An existing field keeps its type: the values already saved were read as it. */
  lockType?: boolean
  autoFocus?: boolean
  /** Enter in the name runs this (the form around it may belong to something else). */
  onEnter?: () => void
  /** On a tinted panel the inputs are white; on a white modal they keep the usual soft fill. */
  onTint?: boolean
}

/**
 * What defines a custom field: its name, what kind of answer it takes, and a
 * dropdown's choices. Shared by the student form's "Add a field" and School
 * settings, so a field is described the same way wherever it is made.
 */
const FieldDefinitionForm: React.FC<FieldDefinitionFormProps> = ({ draft, onChange, idPrefix, lockType = false, autoFocus = false, onEnter, onTint = false }) => {
  const optionInput = useRef<HTMLInputElement>(null)
  // The choice being typed lives in the draft, not here: whoever saves the
  // draft counts it even if Enter was never pressed.
  const optionText = draft.pendingOption ?? ''
  const setOptionText = (pendingOption: string) => onChange({ ...draft, pendingOption })

  const commitOption = (text: string) => {
    // A pasted list arrives as lines (or commas): each becomes a choice.
    const options = text.split(/[\n,]/).reduce(addOption, draft.options).slice(0, CUSTOM_FIELD_LIMITS.options)
    onChange({ ...draft, options, pendingOption: '' })
  }

  return (
    <div className="space-y-4">
      <Field label="Field name" htmlFor={`${idPrefix}-label`}>
        <input
          id={`${idPrefix}-label`}
          value={draft.label}
          maxLength={CUSTOM_FIELD_LIMITS.label}
          autoFocus={autoFocus}
          onChange={(e) => onChange({ ...draft, label: e.target.value })}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            e.preventDefault()
            onEnter?.()
          }}
          placeholder="e.g. Bus route"
          className={onTint ? `${inputClass} bg-white` : inputClass}
        />
      </Field>

      {lockType ? (
        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Kind of answer</p>
          <div className="flex flex-wrap items-center gap-2">
            <FieldTypeTag type={draft.type} />
            <span className="text-xs text-slate-400">Can&apos;t be changed once students have answers.</span>
          </div>
        </div>
      ) : (
        <div>
          <p id={`${idPrefix}-type-label`} className="mb-1.5 text-sm font-medium text-slate-700">
            Kind of answer
          </p>
          <div role="radiogroup" aria-labelledby={`${idPrefix}-type-label`} className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CUSTOM_FIELD_TYPES.map(({ type, label, example }, index) => {
              const Icon = FIELD_TYPE_ICONS[type]
              const selected = draft.type === type
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => onChange({ ...draft, type })}
                  onKeyDown={(e) =>
                    onRadioKeyDown(e, index, CUSTOM_FIELD_TYPES.length, (i) => onChange({ ...draft, type: CUSTOM_FIELD_TYPES[i].type }))
                  }
                  className={`flex cursor-pointer items-start gap-2 rounded-xl border px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    selected
                      ? 'border-cyan-400 bg-white shadow-sm ring-1 ring-cyan-400'
                      : 'border-slate-200 bg-white/60 hover:border-slate-300 hover:bg-white'
                  }`}
                >
                  <Icon className={`mt-0.5 h-4 w-4 flex-shrink-0 ${selected ? 'text-cyan-600' : 'text-slate-400'}`} />
                  <span className="min-w-0">
                    <span className={`block text-sm font-medium ${selected ? 'text-slate-900' : 'text-slate-700'}`}>{label}</span>
                    <span className="block truncate text-xs text-slate-400">{example}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {draft.type === 'select' && (
        <div>
          <label htmlFor={`${idPrefix}-option`} className="mb-1.5 block text-sm font-medium text-slate-700">
            Choices
          </label>
          {/* Looks like one input: the choices so far, then where the next is typed. */}
          <div
            onClick={() => optionInput.current?.focus()}
            className={`flex min-h-[42px] cursor-text flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 px-2 py-1.5 transition-colors focus-within:border-transparent focus-within:bg-white focus-within:ring-2 focus-within:ring-cyan-500 ${onTint ? 'bg-white' : 'bg-slate-50'}`}
          >
            {draft.options.map((option) => (
              <span key={option} className="inline-flex max-w-full items-center gap-1 rounded-lg bg-cyan-100/70 py-1 pl-2.5 pr-1 text-sm text-cyan-900">
                <span className="truncate">{option}</span>
                <button
                  type="button"
                  aria-label={`Remove ${option}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onChange({ ...draft, options: draft.options.filter((o) => o !== option) })
                  }}
                  className="cursor-pointer rounded p-0.5 text-cyan-600 hover:bg-cyan-100 hover:text-cyan-800"
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </span>
            ))}
            <input
              id={`${idPrefix}-option`}
              ref={optionInput}
              value={optionText}
              maxLength={CUSTOM_FIELD_LIMITS.option}
              onChange={(e) => setOptionText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  commitOption(optionText)
                } else if (e.key === 'Backspace' && optionText === '' && draft.options.length > 0) {
                  onChange({ ...draft, options: draft.options.slice(0, -1) })
                }
              }}
              onPaste={(e) => {
                const pasted = e.clipboardData.getData('text')
                if (!/[\n,]/.test(pasted)) return
                e.preventDefault()
                commitOption(pasted)
              }}
              onBlur={() => {
                if (optionText.trim()) commitOption(optionText)
              }}
              placeholder={draft.options.length === 0 ? 'Type a choice and press Enter' : 'Add another'}
              className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">Press Enter after each choice, or paste a list.</p>
        </div>
      )}
    </div>
  )
}

export default FieldDefinitionForm
