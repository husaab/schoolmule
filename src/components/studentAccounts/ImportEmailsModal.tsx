// src/components/studentAccounts/ImportEmailsModal.tsx
// Student accounts → Import emails, in four steps: upload a spreadsheet or
// paste a list; say which column is which; match each row to a student of
// this school year (by name and grade, never by email) and confirm; then
// save, download the rows that weren't saved, or go straight to inviting the
// students just saved. It only adds addresses to students already in
// SchoolMule; it never creates one.
'use client'

import React, { useMemo, useState } from 'react'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader, selectClass, textareaClass } from '@/components/shared/modalKit'
import { parseEmailFile, previewEmailImport, saveEmailImport } from '@/services/studentAccountService'
import type { EmailImportPreviewLine, EmailProblem } from '@/services/types/studentAccount'
import { gradeLabel } from '@/lib/studentAccounts'
import {
  COLUMN_ROLES,
  COLUMN_ROLE_LABELS,
  applyMapping,
  guessRoles,
  looksLikeHeader,
  mappingProblems,
  parsePasted,
  unsavedCsv,
  type ColumnRole,
  type ImportLine,
} from '@/lib/studentEmailImport'
import { ArrowDownTrayIcon, ArrowUpTrayIcon, CheckCircleIcon, InboxArrowDownIcon } from '@heroicons/react/24/outline'

interface Props {
  isOpen: boolean
  onClose: () => void
  /** The selected school year's label, for the copy ("a student in 2026–2027"). */
  yearLabel: string | null
  /** Called after a save, with the students whose address was saved. */
  onSaved: () => void
  /** "Invite these N students": the page opens the invite review for exactly them. */
  onInvite: (studentIds: string[]) => void
}

type Step = 'source' | 'columns' | 'match' | 'saved'

interface Source {
  rows: string[][]
  /** Set for an uploaded file. */
  file: File | null
  sheets: string[]
  sheet: string
}

/** The admin's choice on one matched line. */
interface Choice {
  studentId: string
  ticked: boolean
}

const MAX_ROWS = 1000
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const blocking = (problems: EmailProblem[]) => problems.some((p) => p.blocking)

/** Default roles when the first row is data, not headers: the address column, and a name. */
const rolesFromContent = (row: string[]): ColumnRole[] => {
  let named = false
  return row.map((cell) => {
    if (cell.includes('@')) return 'email'
    if (!named && cell) { named = true; return 'full_name' }
    return 'ignore'
  })
}

export default function ImportEmailsModal({ isOpen, onClose, yearLabel, onSaved, onInvite }: Props) {
  const [step, setStep] = useState<Step>('source')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pasted, setPasted] = useState('')
  const [source, setSource] = useState<Source | null>(null)
  const [hasHeader, setHasHeader] = useState(true)
  const [roles, setRoles] = useState<ColumnRole[]>([])
  const [lines, setLines] = useState<ImportLine[]>([])
  const [preview, setPreview] = useState<EmailImportPreviewLine[]>([])
  const [choices, setChoices] = useState<Map<number, Choice>>(new Map())
  const [saved, setSaved] = useState<{ ids: string[]; unsaved: { name: string; email: string; why: string }[] } | null>(null)

  const year = yearLabel ?? 'this school year'
  const width = Math.max(0, ...(source?.rows ?? []).map((r) => r.length))
  const problems = useMemo(() => mappingProblems(roles), [roles])

  const startColumns = (rows: string[][], file: File | null, sheets: string[], sheet: string) => {
    if (rows.length === 0) return setError('There is nothing to import.')
    const header = looksLikeHeader(rows[0])
    const cols = Math.max(...rows.map((r) => r.length))
    const base = header ? guessRoles(rows[0]) : rolesFromContent(rows[0])
    setSource({ rows, file, sheets, sheet })
    setHasHeader(header)
    setRoles(Array.from({ length: cols }, (_, i) => base[i] ?? 'ignore'))
    setError(null)
    setStep('columns')
  }

  const upload = async (file: File, sheet?: string) => {
    setBusy(true)
    setError(null)
    try {
      const res = await parseEmailFile(file, sheet)
      startColumns(res.data.rows, file, res.data.sheets, res.data.sheet)
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't read this file.")
    } finally {
      setBusy(false)
    }
  }

  const fromPaste = () => {
    const rows = parsePasted(pasted)
    // A plain "name, email" list needs no column step.
    const twoColumns = rows.length > 0 && rows.every((r) => r.length === 2)
    const dataStart = rows.length > 0 && looksLikeHeader(rows[0]) ? 1 : 0
    if (twoColumns && rows.slice(dataStart).every((r) => r[1].includes('@'))) {
      setSource({ rows, file: null, sheets: [], sheet: '' })
      setHasHeader(dataStart === 1)
      setRoles(['full_name', 'email'])
      void match(rows, ['full_name', 'email'], dataStart === 1)
      return
    }
    startColumns(rows, null, [], '')
  }

  const match = async (rows = source?.rows ?? [], useRoles = roles, header = hasHeader) => {
    const next = applyMapping(rows, useRoles, header)
    if (next.length === 0) return setError('No rows with a name or an address.')
    if (next.length > MAX_ROWS) return setError('This list has more than 1,000 rows. Split it and import each part.')
    setBusy(true)
    setError(null)
    try {
      const res = await previewEmailImport(next.map((l) => ({ name: l.name, email: l.email, grade: l.grade })))
      const initial = new Map<number, Choice>()
      for (const line of res.data.lines) {
        const only = line.match.kind === 'matched' ? line.match.candidates[0] : null
        if (only) {
          const ticked = !blocking(only.problems) && !only.problems.some((p) => p.defaultUnticked)
          initial.set(line.index, { studentId: only.studentId, ticked })
        }
      }
      setLines(next)
      setPreview(res.data.lines)
      setChoices(initial)
      setStep('match')
    } catch (err) {
      setError(err instanceof Error ? err.message : "The rows couldn't be matched.")
    } finally {
      setBusy(false)
    }
  }

  const candidateOf = (line: EmailImportPreviewLine) => {
    const choice = choices.get(line.index)
    return choice ? line.match.candidates.find((c) => c.studentId === choice.studentId) ?? null : null
  }

  const setChoice = (index: number, choice: Choice | null) =>
    setChoices((prev) => {
      const next = new Map(prev)
      if (choice) next.set(index, choice)
      else next.delete(index)
      return next
    })

  const picked = preview.filter((l) => {
    const c = candidateOf(l)
    return c && choices.get(l.index)?.ticked && !blocking(c.problems)
  })
  const counts = useMemo(() => ({
    matched: preview.filter((l) => l.match.kind === 'matched').length,
    check: preview.filter((l) => l.match.kind === 'check').length,
    notFound: preview.filter((l) => l.match.kind === 'not_found').length,
    problem: preview.filter((l) => l.match.kind === 'matched' && blocking(l.match.candidates[0].problems)).length,
  }), [preview])

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      const items = picked.map((l) => ({ studentId: choices.get(l.index)!.studentId, email: l.email }))
      const res = await saveEmailImport(items)
      const savedIds = res.data.results.filter((r) => r.outcome === 'saved').map((r) => r.studentId)
      const refused = new Map(res.data.results.filter((r) => r.outcome === 'refused').map((r) => [r.studentId, r.problems[0]?.message ?? 'Not saved']))
      const unsaved = preview.flatMap((l) => {
        const line = lines[l.index]
        const choice = choices.get(l.index)
        if (choice && refused.has(choice.studentId)) return [{ name: line.name, email: line.email, why: refused.get(choice.studentId)! }]
        if (picked.includes(l)) return []
        const c = candidateOf(l)
        const why =
          l.match.kind === 'not_found' ? `Not found in ${year}`
            : c && blocking(c.problems) ? c.problems.find((p) => p.blocking)!.message
              : !choice ? 'No student picked'
                : 'Left out'
        return [{ name: line.name, email: line.email, why }]
      })
      setSaved({ ids: savedIds, unsaved })
      setStep('saved')
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : "The addresses couldn't be saved.")
    } finally {
      setBusy(false)
    }
  }

  const download = () => {
    if (!saved) return
    const url = URL.createObjectURL(new Blob([unsavedCsv(saved.unsaved)], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'student-emails-not-saved.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const close = () => { if (!busy) onClose() }

  const stepLabel = { source: 1, columns: 2, match: 3, saved: 4 }[step]
  const titles: Record<Step, string> = {
    source: 'Import student emails',
    columns: 'Which column is which?',
    match: 'Match emails to students',
    saved: saved ? `${plural(saved.ids.length, 'address', 'addresses')} saved` : 'Saved',
  }
  const subtitles: Record<Step, string> = {
    source: `Upload a spreadsheet or paste a list. We'll match each row to a student in ${year}.`,
    columns: source?.file ? `${source.file.name} · ${plural(Math.max(0, source.rows.length - (hasHeader ? 1 : 0)), 'row', 'rows')}` : 'Your pasted list',
    match: `Each row of your file, and the student in SchoolMule it belongs to. ${preview.length} rows · ${counts.matched} matched · ${counts.check} to check · ${counts.notFound} not found${counts.problem ? ` · ${plural(counts.problem, 'problem', 'problems')}` : ''}. Nothing is saved until you press Save.`,
    saved: saved && saved.unsaved.length > 0 ? `${plural(saved.unsaved.length, "row wasn't", "rows weren't")} saved.` : 'Every row was saved.',
  }

  const problemLines = (list: EmailProblem[]) =>
    list.map((p) => (
      <span key={p.code} className={`block text-xs ${p.blocking ? 'text-rose-600' : 'text-amber-700'}`}>
        {p.message}
      </span>
    ))

  return (
    <Modal isOpen={isOpen} onClose={close} style="w-full max-w-3xl">
      <ModalHeader title={titles[step]} subtitle={subtitles[step]} icon={step === 'saved' ? CheckCircleIcon : InboxArrowDownIcon} tone={step === 'saved' ? 'success' : 'brand'} />
      <ModalBody>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Step {stepLabel} of 4</p>
        {error && <p role="alert" className="rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm text-rose-800">{error}</p>}

        {step === 'source' && (
          <div className="space-y-4">
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 px-6 py-8 text-center hover:border-cyan-300 hover:bg-cyan-50/40">
              <ArrowUpTrayIcon className="h-6 w-6 text-slate-400" aria-hidden="true" />
              <span className="text-sm font-medium text-slate-800">{busy ? 'Reading…' : 'Upload CSV or Excel file'}</span>
              <span className="text-xs text-slate-500">.csv, .xlsx · up to 1,000 rows · 2 MB</span>
              <input
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                disabled={busy}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) void upload(file)
                }}
              />
            </label>
            <div>
              <label htmlFor="import-paste" className="text-sm font-medium text-slate-700">Or paste a list</label>
              <textarea
                id="import-paste"
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                rows={6}
                placeholder={'Amal Haddad, amal.haddad@students.example.org\nYusuf Omar, yusuf.omar@students.example.org'}
                className={`${textareaClass} mt-1 font-mono text-xs`}
              />
              <p className="mt-1 text-xs text-slate-500">One student per line: name and email. A header row is fine (First Name, Last Name, Email Address, Grade).</p>
            </div>
          </div>
        )}

        {step === 'columns' && source && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
              {source.sheets.length > 1 && source.file && (
                <label className="flex items-center gap-2">
                  Sheet
                  <select
                    value={source.sheet}
                    onChange={(e) => void upload(source.file!, e.target.value)}
                    className={`${selectClass} w-auto py-1.5`}
                  >
                    {source.sheets.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </label>
              )}
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={hasHeader}
                  onChange={(e) => setHasHeader(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                First row is headers
              </label>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                  <tr>
                    <th className="px-3 py-2">Column in your file</th>
                    <th className="px-3 py-2">Sample</th>
                    <th className="px-3 py-2">Use it as</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.from({ length: width }, (_, i) => {
                    const samples = source.rows.slice(hasHeader ? 1 : 0, (hasHeader ? 1 : 0) + 3).map((r) => r[i]).filter(Boolean)
                    return (
                      <tr key={i}>
                        <td className="px-3 py-2 font-medium text-slate-800">{hasHeader ? source.rows[0][i] || `Column ${i + 1}` : `Column ${i + 1}`}</td>
                        <td className="max-w-[16rem] truncate px-3 py-2 text-slate-600">{samples.length ? samples.join(' · ') : '(empty)'}</td>
                        <td className="px-3 py-2">
                          <select
                            aria-label={`Use column ${i + 1} as`}
                            value={roles[i] ?? 'ignore'}
                            onChange={(e) => setRoles((prev) => prev.map((r, j) => (j === i ? (e.target.value as ColumnRole) : r)))}
                            className={`${selectClass} py-1.5`}
                          >
                            {COLUMN_ROLES.map((r) => <option key={r} value={r}>{COLUMN_ROLE_LABELS[r]}</option>)}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {problems.length > 0 ? (
              <ul className="space-y-1 text-sm text-rose-700">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
            ) : (
              <p className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Needed: Student email, and either Full name or First + Last name. Grade is optional but makes matching safer. We guessed each column from its header; change any guess.
              </p>
            )}
          </div>
        )}

        {step === 'match' && (
          <ul className="max-h-[26rem] divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-100">
            {preview.map((l) => {
              const line = lines[l.index]
              const choice = choices.get(l.index)
              const candidate = candidateOf(l)
              const blocked = candidate ? blocking(candidate.problems) : false
              const tone =
                l.match.kind === 'not_found' ? '' : blocked ? 'bg-rose-50/60' : l.match.kind === 'check' || (candidate?.problems.length ?? 0) > 0 ? 'bg-amber-50/50' : ''
              return (
                <li key={l.index} className={`grid grid-cols-[28px_minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,1.3fr)] items-start gap-3 px-3 py-2.5 text-sm ${tone}`}>
                  <input
                    type="checkbox"
                    aria-label={`Save the address for ${line.name || `row ${l.index + 1}`}`}
                    checked={Boolean(choice?.ticked) && !blocked}
                    disabled={!candidate || blocked}
                    onChange={(e) => choice && setChoice(l.index, { ...choice, ticked: e.target.checked })}
                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 disabled:opacity-40"
                  />
                  <span className="min-w-0">
                    {l.match.kind === 'matched' && candidate ? (
                      <>
                        <span className="block truncate font-medium text-slate-900">{candidate.name}</span>
                        <span className="block text-xs text-slate-500">{gradeLabel(candidate.grade)}</span>
                      </>
                    ) : (
                      <>
                        <span className="block truncate font-medium text-slate-900">Row {l.index + 1} · &ldquo;{line.name}&rdquo;</span>
                        {l.match.kind === 'check' && <span className="block text-xs text-amber-700">To check: close name</span>}
                      </>
                    )}
                    {line.gradeUnread && <span className="block text-xs text-slate-500">Grade not read; matched by name</span>}
                  </span>
                  <span className="min-w-0 truncate text-slate-700" title={l.email}>{l.email || '(no email)'}</span>
                  <span className="min-w-0">
                    {l.match.kind === 'matched' && <span className="block font-medium text-emerald-700">{candidate && candidate.problems.length === 0 ? 'Matched' : ''}</span>}
                    {l.match.kind === 'check' && (
                      <label className="block text-xs text-slate-600">
                        Which student?
                        <select
                          value={choice?.studentId ?? ''}
                          onChange={(e) => {
                            const picked = l.match.candidates.find((c) => c.studentId === e.target.value)
                            setChoice(l.index, picked ? { studentId: picked.studentId, ticked: !blocking(picked.problems) } : null)
                          }}
                          className={`${selectClass} mt-1 py-1.5`}
                        >
                          <option value="">Pick a student…</option>
                          {l.match.candidates.map((c) => (
                            <option key={c.studentId} value={c.studentId}>{c.name} · {gradeLabel(c.grade)}</option>
                          ))}
                        </select>
                      </label>
                    )}
                    {l.match.kind === 'not_found' && <span className="text-slate-500">Not found in {year}</span>}
                    {candidate && problemLines(candidate.problems)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}

        {step === 'saved' && saved && (
          <div className="space-y-3 text-sm text-slate-700">
            <p>
              {saved.ids.length > 0
                ? `The ${plural(saved.ids.length, 'address is', 'addresses are')} on the students' records now. Nobody has been invited yet.`
                : 'No address was saved.'}
            </p>
            {saved.unsaved.length > 0 && (
              <Button variant="secondary" onClick={download}>
                <ArrowDownTrayIcon className="h-4 w-4" />
                Download them with reasons
              </Button>
            )}
          </div>
        )}
      </ModalBody>

      <ModalFooter>
        {step === 'source' && (
          <>
            <Button variant="secondary" onClick={close}>Cancel</Button>
            <Button onClick={fromPaste} disabled={busy || pasted.trim() === ''}>Next</Button>
          </>
        )}
        {step === 'columns' && (
          <>
            <Button variant="secondary" onClick={() => setStep('source')} disabled={busy}>Back</Button>
            <Button onClick={() => void match()} disabled={problems.length > 0} loading={busy}>Match students</Button>
          </>
        )}
        {step === 'match' && (
          <>
            <Button variant="secondary" onClick={() => setStep(source?.file || roles.length > 2 ? 'columns' : 'source')} disabled={busy}>Back</Button>
            <Button onClick={() => void save()} disabled={picked.length === 0} loading={busy}>
              Save {plural(picked.length, 'address', 'addresses')}
            </Button>
          </>
        )}
        {step === 'saved' && saved && (
          <>
            <Button variant="secondary" onClick={close}>Done</Button>
            {saved.ids.length > 0 && (
              <Button onClick={() => onInvite(saved.ids)}>
                {saved.ids.length === 1 ? 'Invite this student →' : `Invite these ${saved.ids.length} students →`}
              </Button>
            )}
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}
