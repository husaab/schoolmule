// src/components/studentAccounts/ClassroomSettingsCard.tsx
// Admin Panel → School Settings: the school's classroom settings (student
// sign-in, class emails, the parents' weekly summary), the same form as the
// Classroom settings window on Student accounts.
'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { AcademicCapIcon } from '@heroicons/react/24/outline'
import { Button } from '@/components/shared/modalKit'
import { getClassroomSettings } from '@/services/classroomSettingsService'
import type { ClassroomSettings } from '@/services/types/studentAccount'
import { ClassroomSettingsFields, useClassroomSettingsForm } from './ClassroomSettingsForm'

function SettingsForm({ settings, onSaved }: { settings: ClassroomSettings; onSaved: (s: ClassroomSettings) => void }) {
  const formState = useClassroomSettingsForm(settings, onSaved)
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        void formState.save()
      }}
      className="space-y-6"
    >
      <ClassroomSettingsFields {...formState} />
      <div className="flex justify-end">
        <Button type="submit" loading={formState.saving}>
          Save classroom settings
        </Button>
      </div>
    </form>
  )
}

export default function ClassroomSettingsCard() {
  const [settings, setSettings] = useState<ClassroomSettings | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    () =>
      getClassroomSettings().then(
        (res) => {
          setError(null)
          setSettings(res.data)
        },
        (err: unknown) => setError(err instanceof Error && err.message ? err.message : "The classroom settings couldn't be loaded."),
      ),
    [],
  )
  useEffect(() => {
    void load()
  }, [load])

  return (
    <section className="mb-6 rounded-lg border border-gray-200 bg-white shadow-sm" aria-labelledby="classroom-settings-heading">
      <div className="border-b border-gray-200 px-6 py-4">
        <h2 id="classroom-settings-heading" className="flex items-center gap-2 text-xl font-semibold">
          <AcademicCapIcon className="h-6 w-6" />
          Classroom &amp; parent emails
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Student sign-in, class emails and the parents&apos; weekly summary. Also under Student accounts.
        </p>
      </div>
      <div className="p-6">
        {error ? (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <span>{error}</span>
            <Button type="button" variant="secondary" onClick={() => void load()}>
              Try again
            </Button>
          </div>
        ) : settings ? (
          <SettingsForm settings={settings} onSaved={setSettings} />
        ) : (
          <p className="text-sm text-gray-500">Loading…</p>
        )}
      </div>
    </section>
  )
}
