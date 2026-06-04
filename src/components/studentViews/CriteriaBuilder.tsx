'use client'

import React from 'react'
import type {
  StudentViewCriteria,
  TermScope,
  AggregationMode,
  CrossTermAggregation,
} from '@/services/types/studentView'
import type { TermPayload } from '@/services/types/term'

const NUMERIC_GRADES = ['1', '2', '3', '4', '5', '6', '7', '8']

interface Props {
  name: string
  description: string
  isShared: boolean
  criteria: StudentViewCriteria
  terms: TermPayload[]
  subjects: string[]
  onNameChange: (v: string) => void
  onDescriptionChange: (v: string) => void
  onIsSharedChange: (v: boolean) => void
  onCriteriaChange: (c: StudentViewCriteria) => void
}

export default function CriteriaBuilder({
  name,
  description,
  isShared,
  criteria,
  terms,
  subjects,
  onNameChange,
  onDescriptionChange,
  onIsSharedChange,
  onCriteriaChange,
}: Props) {
  const setCriteria = (patch: Partial<StudentViewCriteria>) =>
    onCriteriaChange({ ...criteria, ...patch })

  const needsTermPicker = ['specific', 'every_listed', 'any_listed'].includes(criteria.termScope)
  const isMultiTerm = ['every_listed', 'any_listed', 'all'].includes(criteria.termScope)
  const crossTermMode: CrossTermAggregation =
    criteria.crossTermAggregation || 'each_term_separately'

  const toggleArrayValue = (key: 'gradeLevels' | 'subjects' | 'termIds', value: string) => {
    const current = (criteria[key] as string[] | undefined) || []
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setCriteria({ [key]: next } as Partial<StudentViewCriteria>)
  }

  return (
    <div className="space-y-6">
      {/* Name + description */}
      <Field label="View name">
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="e.g., Academic Excellence"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
        />
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="What does this view recognize?"
          rows={2}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
        />
      </Field>

      {/* Sharing */}
      <Field label="Sharing">
        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={isShared}
            onChange={(e) => onIsSharedChange(e.target.checked)}
            className="rounded text-cyan-600"
          />
          Share with everyone in my school
        </label>
      </Field>

      {/* Term scope */}
      <Field label="Term scope">
        <Radio
          name="termScope"
          value={criteria.termScope}
          onChange={(v) => setCriteria({ termScope: v as TermScope, termIds: [] })}
          options={[
            { value: 'active', label: 'Active term only' },
            { value: 'specific', label: 'A specific term' },
            { value: 'every_listed', label: 'Every listed term (e.g., both semesters)' },
            { value: 'any_listed', label: 'At least one listed term' },
            { value: 'all', label: 'All terms' },
          ]}
        />
      </Field>

      {/* Cross-term combine logic — only meaningful when termScope crosses
          multiple terms. For single-term scopes, this option is irrelevant. */}
      {isMultiTerm && (
        <Field label="When combining terms">
          <Radio
            name="crossTermAggregation"
            value={crossTermMode}
            onChange={(v) =>
              setCriteria({ crossTermAggregation: v as CrossTermAggregation })
            }
            options={[
              {
                value: 'each_term_separately',
                label:
                  'Each term separately — student must clear the threshold in every selected term',
              },
              {
                value: 'cumulative_avg',
                label:
                  'Cumulative across terms — average all terms together, check that one number',
              },
            ]}
          />
        </Field>
      )}

      {/* Term picker (conditional) */}
      {needsTermPicker && (
        <Field label="Terms">
          <div className="flex flex-wrap gap-2">
            {terms.map((t) => {
              const checked = (criteria.termIds || []).includes(t.termId)
              return (
                <button
                  key={t.termId}
                  type="button"
                  onClick={() => toggleArrayValue('termIds', t.termId)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    checked
                      ? 'bg-cyan-50 text-cyan-700 border-cyan-300'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {t.name}
                </button>
              )
            })}
          </div>
        </Field>
      )}

      {/* Threshold */}
      <Field label="Percentage threshold">
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={criteria.thresholdPercent}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '')
              const n = digits === '' ? 0 : Math.min(100, parseInt(digits, 10))
              setCriteria({ thresholdPercent: n })
            }}
            className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          />
          <span className="text-sm text-slate-500">%</span>
        </div>
      </Field>

      {/* Aggregation mode */}
      <Field label="How to apply the threshold">
        <Radio
          name="aggregationMode"
          value={criteria.aggregationMode}
          onChange={(v) => setCriteria({ aggregationMode: v as AggregationMode })}
          options={[
            { value: 'overall_avg', label: 'Overall average across all classes ≥ threshold' },
            { value: 'every_class', label: 'Every class ≥ threshold (strictest)' },
            { value: 'any_class', label: 'At least one class ≥ threshold (loosest)' },
          ]}
        />
      </Field>

      {/* Grade levels */}
      <Field label="Grade levels (leave blank = all)">
        <div className="flex flex-wrap gap-2">
          {NUMERIC_GRADES.map((g) => {
            const checked = (criteria.gradeLevels || []).includes(g)
            return (
              <button
                key={g}
                type="button"
                onClick={() => toggleArrayValue('gradeLevels', g)}
                className={`px-3 py-1.5 rounded-full text-sm border ${
                  checked
                    ? 'bg-cyan-50 text-cyan-700 border-cyan-300'
                    : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {g}
              </button>
            )
          })}
          <span className="text-xs text-slate-400 self-center ml-2" title="JK/SK use competency scales, not percentages">
            JK/SK not supported
          </span>
        </div>
      </Field>

      {/* Subjects */}
      {subjects.length > 0 && (
        <Field label="Subjects (leave blank = all)">
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => {
              const checked = (criteria.subjects || []).includes(s)
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleArrayValue('subjects', s)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    checked
                      ? 'bg-cyan-50 text-cyan-700 border-cyan-300'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        </Field>
      )}

      {/* Attendance */}
      <Field label="Minimum attendance % (optional)">
        <div className="flex items-center gap-2">
          <input
            type="text"
            inputMode="numeric"
            value={criteria.attendanceMinPercent ?? ''}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '')
              if (digits === '') {
                setCriteria({ attendanceMinPercent: null })
              } else {
                setCriteria({ attendanceMinPercent: Math.min(100, parseInt(digits, 10)) })
              }
            }}
            placeholder="—"
            className="w-24 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
          />
          <span className="text-sm text-slate-500">%</span>
        </div>
      </Field>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
      {children}
    </div>
  )
}

function Radio({
  name,
  value,
  options,
  onChange,
}: {
  name: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      {options.map((o) => (
        <label key={o.value} className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="radio"
            name={name}
            value={o.value}
            checked={value === o.value}
            onChange={() => onChange(o.value)}
            className="text-cyan-600"
          />
          {o.label}
        </label>
      ))}
    </div>
  )
}
