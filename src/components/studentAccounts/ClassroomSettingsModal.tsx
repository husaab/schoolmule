// src/components/studentAccounts/ClassroomSettingsModal.tsx
// Every classroom setting of the school in one form: student sign-in on/off,
// which grades sign in and use QR cards, student email, parents' access to
// private comments, the weekly summary day, photos, and the consent notice.
'use client'

import React, { useEffect, useState } from 'react'
import Modal from '@/components/shared/modal'
import {
  Button,
  Field,
  FieldRow,
  FormSection,
  ModalBody,
  ModalFooter,
  ModalHeader,
  inputClass,
  selectClass,
} from '@/components/shared/modalKit'
import { saveClassroomSettings } from '@/services/classroomSettingsService'
import type { ClassroomSettings, ClassroomSettingsInput, GradeCode } from '@/services/types/studentAccount'
import { useNotificationStore } from '@/store/useNotificationStore'
import { DAY_NAMES, GRADE_OPTIONS, gradeRank } from '@/lib/studentAccounts'
import { Cog6ToothIcon } from '@heroicons/react/24/outline'

interface Props {
  isOpen: boolean
  onClose: () => void
  settings: ClassroomSettings
  onSaved: (settings: ClassroomSettings) => void
}

const toInput = (s: ClassroomSettings): ClassroomSettingsInput => ({
  enabled: s.enabled,
  loginFromGrade: s.loginFromGrade,
  qrUntilGrade: s.qrUntilGrade,
  studentEmailFromGrade: s.studentEmailFromGrade,
  parentsReadPrivateComments: s.parentsReadPrivateComments,
  summaryDow: s.summaryDow,
  studentPhotos: s.studentPhotos,
  consentNoticeVersion: s.consentNoticeVersion,
})

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

export default function ClassroomSettingsModal({ isOpen, onClose, settings, onSaved }: Props) {
  const notify = useNotificationStore((s) => s.showNotification)
  const [form, setForm] = useState<ClassroomSettingsInput>(() => toInput(settings))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) setForm(toInput(settings))
  }, [isOpen, settings])

  const set = <K extends keyof ClassroomSettingsInput>(key: K, value: ClassroomSettingsInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const qrBelowLogin = (gradeRank(form.qrUntilGrade) ?? 0) < (gradeRank(form.loginFromGrade) ?? 0)
  const version = form.consentNoticeVersion.trim()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (version.length < 1 || version.length > 40) {
      notify('The consent notice version must be 1 to 40 characters', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await saveClassroomSettings({ ...form, consentNoticeVersion: version })
      notify('Classroom settings saved', 'success')
      onSaved(res.data)
      onClose()
    } catch (err) {
      notify(err instanceof Error ? err.message : "The settings couldn't be saved", 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={saving ? () => {} : onClose} style="w-full max-w-lg">
      <ModalHeader title="Classroom settings" subtitle="Student sign-in and classroom options for your school" icon={Cog6ToothIcon} />

      <form onSubmit={handleSubmit}>
        <ModalBody className="space-y-6">
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
          </FormSection>

          <FormSection label="Email and parents">
            <FieldRow>
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
              <Field label="Weekly summary day" htmlFor="classroom-summary-day" hint="When parents get the week's summary.">
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
            </FieldRow>
            <Toggle
              id="classroom-private-comments"
              label="Parents can read private comments"
              hint="Private comments between a student and a teacher."
              checked={form.parentsReadPrivateComments}
              onChange={(v) => set('parentsReadPrivateComments', v)}
            />
          </FormSection>

          <FormSection label="Consent">
            <Field
              label="Consent notice version"
              htmlFor="classroom-consent-version"
              hint="The notice parents agreed to. Each invite records this version with the consent."
            >
              <input
                id="classroom-consent-version"
                value={form.consentNoticeVersion}
                onChange={(e) => set('consentNoticeVersion', e.target.value)}
                maxLength={40}
                required
                className={inputClass}
              />
            </Field>
          </FormSection>
        </ModalBody>

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" loading={saving}>
            Save
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}
