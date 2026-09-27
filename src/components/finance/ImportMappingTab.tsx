'use client'

// Linking wizard → Import mapping file. The admin pastes (or uploads) the
// roster JSON and the customer-map CSV, previews what would change (dry run),
// resolves near-matches student by student, then applies.

import React, { useId, useState } from 'react'
import {
  ArrowUpTrayIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentMagnifyingGlassIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { Button, selectClass, textareaClass } from '@/components/shared/modalKit'
import { useNotificationStore } from '@/store/useNotificationStore'
import { importFamilies } from '@/services/financeService'
import { isApiError } from '@/services/apiClient'
import type { ImportInput, ImportResult } from '@/services/types/finance'
import { errorMessage, formatMoney, gradeShort } from './format'

interface ImportMappingTabProps {
  /** After an apply that changed data. */
  onApplied: () => void
}

const sectionLabel = 'text-[11px] font-semibold uppercase tracking-wider text-slate-400'
const nearKey = (familyNo: number | string, child: string) => `${familyNo}:${child}`

/** The `data` of a 422 import response, when it has the plan in it. */
function importResultFrom(data: unknown): ImportResult | null {
  if (!data || typeof data !== 'object') return null
  const plan = (data as { plan?: unknown }).plan
  if (!plan || typeof plan !== 'object') return null
  const p = plan as Partial<ImportResult['plan']>
  if (!Array.isArray(p.errors) || !p.counts) return null
  return {
    applied: false,
    summary: null,
    plan: {
      counts: p.counts,
      errors: p.errors,
      near: Array.isArray(p.near) ? p.near : [],
      unmatched: Array.isArray(p.unmatched) ? p.unmatched : [],
      conflicts: Array.isArray(p.conflicts) ? p.conflicts : [],
      families: Array.isArray(p.families) ? p.families : [],
    },
  }
}

function parseRoster(text: string): ImportInput['roster'] {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (err) {
    throw new Error(`The roster isn’t valid JSON: ${errorMessage(err, 'parse error')}`)
  }
  if (parsed === null || typeof parsed !== 'object') throw new Error('The roster JSON must be an object or a list.')
  return parsed as ImportInput['roster']
}

function FileLoad({ accept, label, onText }: { accept: string; label: string; onText: (text: string) => void }) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50"
    >
      <ArrowUpTrayIcon className="h-3.5 w-3.5" />
      {label}
      <input
        id={id}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={async (e) => {
          const file = e.target.files?.[0]
          if (file) onText(await file.text())
          e.target.value = ''
        }}
      />
    </label>
  )
}

const Count = ({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'neutral' | 'warn' | 'bad' | 'good' }) => {
  const cls =
    tone === 'bad' ? 'text-rose-700' : tone === 'warn' ? 'text-amber-700' : tone === 'good' ? 'text-emerald-700' : 'text-slate-900'
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2">
      <p className={`text-lg font-semibold tabular-nums ${cls}`}>{value}</p>
      <p className="text-[11px] text-slate-500">{label}</p>
    </div>
  )
}

const ImportMappingTab: React.FC<ImportMappingTabProps> = ({ onApplied }) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [rosterText, setRosterText] = useState('')
  const [csvText, setCsvText] = useState('')
  const [acceptNear, setAcceptNear] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<{ result: ImportResult; roster: string; csv: string; near: string } | null>(null)
  const [applied, setApplied] = useState<ImportResult | null>(null)
  const [running, setRunning] = useState<'preview' | 'apply' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showFamilies, setShowFamilies] = useState(false)

  const nearSig = JSON.stringify(acceptNear)
  const stale = !!preview && (preview.roster !== rosterText || preview.csv !== csvText)
  const nearChanged = !!preview && !stale && preview.near !== nearSig
  const hasErrors = (preview?.result.plan.errors.length ?? 0) > 0

  const run = async (dryRun: boolean) => {
    setError(null)
    let roster: ImportInput['roster']
    try {
      roster = parseRoster(rosterText)
    } catch (err) {
      setError(errorMessage(err, 'Invalid roster'))
      return
    }
    if (!csvText.trim()) {
      setError('Paste or upload the customer-map CSV.')
      return
    }
    setRunning(dryRun ? 'preview' : 'apply')
    try {
      const res = await importFamilies({ roster, customerMap: csvText, dryRun, acceptNear })
      if (dryRun) {
        setPreview({ result: res.data, roster: rosterText, csv: csvText, near: nearSig })
        setApplied(null)
      } else {
        setApplied(res.data)
        setPreview(null)
        const s = res.data.summary
        showNotification(
          s ? `Import applied — ${s.familiesCreated} created, ${s.familiesUpdated} updated` : 'Import applied',
          'success'
        )
        onApplied()
      }
    } catch (err) {
      setError(errorMessage(err, dryRun ? 'Could not preview the import' : 'Could not apply the import'))
      // A mapping with errors comes back as 422 carrying the plan, so show
      // what's wrong; any other failure clears the old preview so a stale plan
      // can't be applied.
      const result = isApiError(err) && err.status === 422 ? importResultFrom(err.data) : null
      setPreview(result ? { result, roster: rosterText, csv: csvText, near: nearSig } : null)
    } finally {
      setRunning(null)
    }
  }

  const reset = () => {
    setRosterText('')
    setCsvText('')
    setAcceptNear({})
    setPreview(null)
    setApplied(null)
    setError(null)
  }

  // ── Applied ─────────────────────────────────────────────────────────────
  if (applied) {
    const s = applied.summary
    return (
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 px-5 py-4">
          <CheckCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Import applied</p>
            <p className="text-xs text-emerald-800/80">The grid has been refreshed with the new families and links.</p>
          </div>
        </div>
        {s && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Count label="Families created" value={s.familiesCreated} tone="good" />
              <Count label="Families updated" value={s.familiesUpdated} />
              <Count label="Students linked" value={s.studentsLinked} />
              <Count label="Contacts written" value={s.contactsWritten} />
              <Count label="Customer links opened" value={s.linksOpened} />
              <Count label="Customer links closed" value={s.linksClosed} />
            </div>
            {(s.conflicts.length > 0 || s.skipped.length > 0) && (
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                <p className="text-sm font-medium text-amber-900">Not applied</p>
                <ul className="mt-1.5 space-y-1 text-xs text-amber-900">
                  {s.conflicts.map((c) => (
                    <li key={`c-${c.familyNo}-${c.studentId}`}>
                      Family #{c.familyNo}: student {c.studentId} already belongs to another family
                    </li>
                  ))}
                  {s.skipped.map((c) => (
                    <li key={`s-${c.familyNo}-${c.studentId}`}>
                      Family #{c.familyNo}: student {c.studentId} skipped — {c.reason}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
        <Button variant="secondary" onClick={reset}>
          Import another file
        </Button>
      </div>
    )
  }

  const plan = preview?.result.plan

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Load the roster (JSON) and the family → QuickBooks customer map (CSV). Nothing is written until you apply — the preview shows
        exactly what would change.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="import-roster" className="text-sm font-medium text-slate-700">
              Roster JSON
            </label>
            <FileLoad accept=".json,application/json" label="Upload .json" onText={setRosterText} />
          </div>
          <textarea
            id="import-roster"
            className={`${textareaClass} font-mono text-xs`}
            rows={8}
            spellCheck={false}
            value={rosterText}
            onChange={(e) => setRosterText(e.target.value)}
            placeholder='{ "families": [ … ] }'
          />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="import-csv" className="text-sm font-medium text-slate-700">
              Customer map CSV
            </label>
            <FileLoad accept=".csv,text/csv" label="Upload .csv" onText={setCsvText} />
          </div>
          <textarea
            id="import-csv"
            className={`${textareaClass} font-mono text-xs`}
            rows={8}
            spellCheck={false}
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="familyNo,customerId&#10;1,58&#10;2,61"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-2.5 text-sm text-rose-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" onClick={() => run(true)} loading={running === 'preview'} disabled={running !== null || !rosterText.trim()}>
          <DocumentMagnifyingGlassIcon className="h-4 w-4" />
          {preview ? 'Preview again' : 'Preview'}
        </Button>
        {preview && (
          <Button onClick={() => run(false)} loading={running === 'apply'} disabled={running !== null || stale || hasErrors}>
            Apply import
          </Button>
        )}
        {hasErrors && !stale && <span className="text-xs text-rose-700">Fix the problems in the files, then preview again.</span>}
        {stale && <span className="text-xs text-amber-700">The files changed since the preview — preview again before applying.</span>}
        {nearChanged && <span className="text-xs text-slate-500">Near-match choices are applied as selected; preview again to see the updated counts.</span>}
      </div>

      {plan && (
        <div className="space-y-5 border-t border-slate-100 pt-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            <Count label="Families" value={plan.counts.families} />
            <Count label="Exact matches" value={plan.counts.exact} tone="good" />
            <Count label="Near accepted" value={plan.counts.nearAccepted} />
            <Count label="Near (to review)" value={plan.counts.near} tone={plan.counts.near > 0 ? 'warn' : 'neutral'} />
            <Count label="Unmatched" value={plan.counts.unmatched} tone={plan.counts.unmatched > 0 ? 'warn' : 'neutral'} />
            <Count label="Conflicts" value={plan.counts.conflicts} tone={plan.counts.conflicts > 0 ? 'bad' : 'neutral'} />
            <Count label="Contacts" value={plan.counts.contacts} />
          </div>

          {plan.errors.length > 0 && (
            <div className="rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-3">
              <p className="flex items-center gap-1.5 text-sm font-medium text-rose-800">
                <ExclamationTriangleIcon className="h-4 w-4" />
                Problems in the files
              </p>
              <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs text-rose-800">
                {plan.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {plan.near.length > 0 && (
            <section>
              <h3 className={`${sectionLabel} mb-2`}>Near matches — choose the student, or skip</h3>
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2 text-left">Family</th>
                      <th className="px-3 py-2 text-left">Child in roster</th>
                      <th className="px-3 py-2 text-left">Grade</th>
                      <th className="px-3 py-2 text-left">SchoolMule student</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {plan.near.map((n) => {
                      const k = nearKey(n.familyNo, n.child)
                      return (
                        <tr key={k}>
                          <td className="px-3 py-2 tabular-nums text-slate-600">#{n.familyNo}</td>
                          <td className="px-3 py-2 text-slate-900">{n.child}</td>
                          <td className="px-3 py-2 text-slate-600">{gradeShort(n.grade)}</td>
                          <td className="px-3 py-2">
                            <select
                              className={`${selectClass} py-1.5`}
                              aria-label={`Student for ${n.child}`}
                              value={acceptNear[k] ?? ''}
                              onChange={(e) =>
                                setAcceptNear((prev) => {
                                  const next = { ...prev }
                                  if (e.target.value) next[k] = e.target.value
                                  else delete next[k]
                                  return next
                                })
                              }
                            >
                              <option value="">Skip</option>
                              {n.candidates.map((c) => (
                                <option key={c.studentId} value={c.studentId}>
                                  {c.name} · {gradeShort(c.grade)}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {plan.unmatched.length > 0 && (
            <section>
              <h3 className={`${sectionLabel} mb-2`}>Unmatched children ({plan.unmatched.length})</h3>
              <p className="mb-2 text-xs text-slate-500">No SchoolMule student looks like these. They are left out; add them to a family by hand later.</p>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white text-sm">
                {plan.unmatched.map((u) => (
                  <li key={nearKey(u.familyNo, u.child)} className="flex justify-between gap-3 px-3 py-2">
                    <span className="text-slate-800">
                      <span className="tabular-nums text-slate-400">#{u.familyNo}</span> {u.child}
                    </span>
                    <span className="text-slate-500">{gradeShort(u.grade)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {plan.conflicts.length > 0 && (
            <section>
              <h3 className={`${sectionLabel} mb-2`}>Conflicts ({plan.conflicts.length})</h3>
              <p className="mb-2 text-xs text-slate-500">These students already belong to another family and won’t be moved.</p>
              <ul className="divide-y divide-slate-100 rounded-xl border border-rose-100 bg-white text-sm">
                {plan.conflicts.map((c) => (
                  <li key={`${c.familyNo}-${c.studentId}`} className="px-3 py-2 text-slate-800">
                    <span className="tabular-nums text-slate-400">#{c.familyNo}</span> {c.child}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {plan.families.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowFamilies((v) => !v)}
                aria-expanded={showFamilies}
                className={`${sectionLabel} flex items-center gap-1 cursor-pointer hover:text-slate-600`}
              >
                {showFamilies ? <ChevronDownIcon className="h-3.5 w-3.5" /> : <ChevronRightIcon className="h-3.5 w-3.5" />}
                What would be written ({plan.families.length} families)
              </button>
              {showFamilies && (
                <div className="mt-2 overflow-x-auto rounded-xl border border-slate-100">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-3 py-2 text-left">#</th>
                        <th className="px-3 py-2 text-left">Family</th>
                        <th className="px-3 py-2 text-left">Action</th>
                        <th className="px-3 py-2 text-left">Customer</th>
                        <th className="px-3 py-2 text-left">Students</th>
                        <th className="px-3 py-2 text-right">Contacts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {plan.families.map((f) => (
                        <tr key={String(f.familyNo)} className="align-top">
                          <td className="px-3 py-2 tabular-nums text-slate-400">{f.familyNo}</td>
                          <td className="px-3 py-2">
                            <p className="text-slate-900">{f.row.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {[
                                f.row.is_subsidy ? 'Subsidy' : null,
                                f.row.is_teacher ? 'Teacher' : null,
                                f.row.expected_monthly_parent != null ? `${formatMoney(f.row.expected_monthly_parent)}/mo parent` : null,
                                f.row.expected_monthly_subsidy != null ? `${formatMoney(f.row.expected_monthly_subsidy)}/mo subsidy` : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          </td>
                          <td className="px-3 py-2">
                            <span
                              className={`rounded-md px-1.5 py-0.5 text-[11px] font-medium ${
                                f.action === 'create' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {f.action === 'create' ? 'Create' : 'Update'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-600">
                            {f.customerId ?? '—'}
                            {f.previousCustomerId && f.previousCustomerId !== f.customerId && (
                              <span className="block text-[11px] text-amber-700">was {f.previousCustomerId}</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-xs text-slate-700">
                            {f.students.length === 0
                              ? '—'
                              : f.students.map((s) => (
                                  <span key={s.studentId} className="block">
                                    {s.name}
                                    {s.tier === 'near-accepted' && <span className="ml-1 text-[10px] text-amber-700">near</span>}
                                  </span>
                                ))}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-600">{f.contacts.length}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  )
}

export default ImportMappingTab
