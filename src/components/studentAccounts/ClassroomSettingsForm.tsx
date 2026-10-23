// src/components/studentAccounts/ClassroomSettingsForm.tsx
// The school's classroom settings as one form, shown in two places: the
// Classroom settings window on Student accounts, and Admin Panel → School
// Settings. Student sign-in (the student portal) and who signs in or uses a
// QR card, student email, the parents' weekly summary (its own switch) and
// its day, and parents' access to private comments. The consent notice
// version is no longer shown; the saved one goes back unchanged.
'use client'

import React, { useEffect, useState } from 'react'
import { Field, FieldRow, FormSection, inputClass, selectClass } from '@/components/shared/modalKit'
import { saveClassroomSettings } from '@/services/classroomSettingsService'
import type { ClassroomSettings, ClassroomSettingsInput, GradeCode } from '@/services/types/studentAccount'
import { useNotificationStore } from '@/store/useNotificationStore'
import { DAY_NAMES, GRADE_OPTIONS, classroomSettingsInput, gradeRank, parseDomainList } from '@/lib/studentAccounts'

function Toggle({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string
  label: string
  hint?: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-sm font-medium text-slate-700">
          {label}
        </label>
        {hint && <p className="mt-0.5 text-xs text-slate-400">{hint}</p>}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 ${
          checked ? 'bg-cyan-500' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  )
}

/** The form's state and save, for either place it is shown. `resetKey` reloads it from `settings` when it changes. */
export function useClassroomSettingsForm(settings: ClassroomSettings, onSaved: (settings: ClassroomSettings) => void, resetKey?: unknown) {
  const notify = useNotificationStore((s) => s.showNotification)
  const [form, setForm] = useState<ClassroomSettingsInput>(() => classroomSettingsInput(settings))
  // The domains as the admin types them ("students.example.org, staff.example.org").
  const [domainsText, setDomainsText] = useState(() => (settings.studentEmailDomains ?? []).join(', '))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setForm(classroomSettingsInput(settings))
    setDomainsText((settings.studentEmailDomains ?? []).join(', '))
  }, [settings, resetKey])

  const set = <K extends keyof ClassroomSettingsInput>(key: K, value: ClassroomSettingsInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  /** Saves; true when it did. */
  const save = async (): Promise<boolean> => {
    const domains = parseDomainList(domainsText)
    if ('error' in domains) {
      notify(domains.error, 'error')
      return false
    }
    setSaving(true)
    try {
      const res = await saveClassroomSettings({ ...form, studentEmailDomains: domains.domains })
      notify('Classroom settings saved', 'success')
      onSaved(res.data)
      return true
    } catch (err) {
      notify(err instanceof Error ? err.message : "The settings couldn't be saved", 'error')
      return false
    } finally {
      setSaving(false)
    }
  }

  return { form, set, domainsText, setDomainsText, saving, save }
}

type FormState = ReturnType<typeof useClassroomSettingsForm>

/** Every field, in sections; the host adds its own buttons. */
export function ClassroomSettingsFields({ form, set, domainsText, setDomainsText }: Pick<FormState, 'form' | 'set' | 'domainsText' | 'setDomainsText'>) {
  const qrBelowLogin = (gradeRank(form.qrUntilGrade) ?? 0) < (gradeRank(form.loginFromGrade) ?? 0)

  return (
    <div className="space-y-6">
      <FormSection label="Sign-in">
        <Toggle
          id="classroom-enabled"
          label="Student sign-in"
          hint="Students can sign in only while this is on. Invites can go out before."
          checked={form.enabled}
          onChange={(v) => set('enabled', v)}
        />
        <FieldRow>
          <Field label="Students can sign in from" htmlFor="classroom-login-from">
            <select
              id="classroom-login-from"
              value={form.loginFromGrade}
              onChange={(e) => set('loginFromGrade', e.target.value as GradeCode)}
              className={selectClass}
            >
              {GRADE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="QR cards up to" htmlFor="classroom-qr-until">
            <select
              id="classroom-qr-until"
              value={form.qrUntilGrade}
              onChange={(e) => set('qrUntilGrade', e.target.value as GradeCode)}
              className={selectClass}
            >
              {GRADE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </FieldRow>
        {qrBelowLogin && (
          <p className="text-xs text-amber-700">
            QR cards stop below the first grade that signs in, so no grade will use a QR card.
          </p>
        )}
        <Toggle
          id="classroom-photos"
          label="Students can use a photo instead of an avatar"
          checked={form.studentPhotos}
          onChange={(v) => set('studentPhotos', v)}
        />
        <fieldset>
          <legend className="text-sm font-medium text-slate-700">Students sign in with</legend>
          <div className="mt-2 space-y-2">
            {(
              [
                ['google_or_password', 'Google or a password', 'Students choose when they set up their account.'],
                ['google_only', 'Google only', 'Turn this on after one student has signed in with Google successfully.'],
              ] as const
            ).map(([value, label, hint]) => (
              <label key={value} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 px-3 py-2.5 hover:bg-slate-50">
                <input
                  type="radio"
                  name="classroom-sign-in"
                  value={value}
                  checked={form.studentSignIn === value}
                  onChange={() => set('studentSignIn', value)}
                  className="mt-0.5 h-4 w-4 cursor-pointer border-slate-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span>
                  <span className="block text-sm font-medium text-slate-800">{label}</span>
                  <span className="block text-xs text-slate-500">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <Field
          label="Student email domain"
          htmlFor="classroom-email-domains"
          hint="e.g. students.example.org. Addresses elsewhere are flagged. Separate several with commas; leave empty for none."
        >
          <input
            id="classroom-email-domains"
            value={domainsText}
            onChange={(e) => setDomainsText(e.target.value)}
            placeholder="students.example.org"
            autoComplete="off"
            className={inputClass}
          />
        </Field>
      </FormSection>

      <FormSection label="Email and parents">
        <Toggle
          id="classroom-parent-summary"
          label="Weekly summary for parents"
          hint="One email a week to every family, with or without a SchoolMule account: new grades, missing work, what's due next week and class posts. Works with student sign-in off."
          checked={form.parentSummary ?? false}
          onChange={(v) => set('parentSummary', v)}
        />
        <FieldRow>
          <Field label="Weekly summary day" htmlFor="classroom-summary-day" hint="It goes out at 4 pm.">
            <select
              id="classroom-summary-day"
              value={form.summaryDow}
              onChange={(e) => set('summaryDow', Number(e.target.value) as ClassroomSettingsInput['summaryDow'])}
              className={selectClass}
            >
              {DAY_NAMES.map((day, i) => (
                <option key={day} value={i}>
                  {day}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Email students from" htmlFor="classroom-email-from" hint="Class emails go to students from this grade up.">
            <select
              id="classroom-email-from"
              value={form.studentEmailFromGrade ?? ''}
              onChange={(e) => set('studentEmailFromGrade', e.target.value === '' ? null : (e.target.value as GradeCode))}
              className={selectClass}
            >
              <option value="">Off</option>
              {GRADE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </FieldRow>
        <Toggle
          id="classroom-private-comments"
          label="Parents can read private comments"
          hint="Private comments between a student and a teacher."
          checked={form.parentsReadPrivateComments}
          onChange={(v) => set('parentsReadPrivateComments', v)}
        />
      </FormSection>

      <FormSection label="Message reminders">
        <Toggle
          id="classroom-reply-reminders"
          label="Remind teachers about unanswered parent messages"
          hint="When a parent writes and nobody at school has replied, the teacher gets a reminder on school days 2 and 4. If there's still no reply, everyone with All messages access is told on day 5. Each email includes the full message and goes out at 7 am."
          checked={form.replyReminders ?? false}
          onChange={(v) => set('replyReminders', v)}
        />
        <Toggle
          id="classroom-parent-nudge"
          label="Nudge parents once about unanswered teacher messages"
          hint="When a teacher writes and nobody in the family has replied after 2 school days, each parent with a SchoolMule account gets one email with the message, at 7 am. Covers teacher messages from the last 14 days."
          checked={form.parentNudge ?? false}
          onChange={(v) => set('parentNudge', v)}
        />
      </FormSection>
    </div>
  )
}
