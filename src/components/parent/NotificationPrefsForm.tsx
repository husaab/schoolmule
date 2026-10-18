// src/components/parent/NotificationPrefsForm.tsx
// "Email preferences" for a parent: the weekly (or daily) summary, how often,
// which day, and the missing-work alert. Announcements are not a choice: they
// always arrive right away, and the page says so. Save sends only what changed
// (the server accepts a partial change and stores the school's own day as "the
// school's day"). The links at the bottom of the weekly email land here with
// `?set=daily` or `?set=off`: that change is saved as soon as the choices have
// loaded, and a toast confirms it. If that save fails the change stays in the
// form, unsaved, so Save can try again.
'use client'

import { useEffect, useRef, useState } from 'react'
import LoadError from '@/components/classroom/LoadError'
import { useLoad } from '@/hooks/useLoad'
import {
  ALERT_BLURB,
  ANNOUNCEMENTS_NOTE,
  FREQUENCIES,
  SUMMARY_BLURB,
  changeFor,
  dayOptions,
  draftOf,
  isDirty,
  setChange,
  setConfirmation,
  type PrefsDraft,
  type SetParam,
} from '@/lib/notificationPrefs'
import { getNotificationPrefs, saveNotificationPrefs } from '@/services/parentClassroomService'
import type { NotificationPrefs, NotificationPrefsChange, SummaryDay } from '@/services/types/parentClassroom'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'

interface NotificationPrefsFormProps {
  /** From the email's link: saved as soon as the choices have loaded. */
  autoSet?: SetParam | null
  /** Called once `autoSet` has been handled (saved, or failed), so the page can drop it from the address. */
  onAutoSetDone?: () => void
}

const messageOf = (err: unknown, fallback: string): string => (err instanceof Error && err.message ? err.message : fallback)

/** A change as the draft it makes, over the saved choices. */
const applyChange = (saved: NotificationPrefs, change: NotificationPrefsChange): Partial<PrefsDraft> => {
  const edits: Partial<PrefsDraft> = {}
  if (change.weeklySummary !== undefined) edits.weeklySummary = change.weeklySummary
  if (change.summaryFrequency !== undefined) edits.summaryFrequency = change.summaryFrequency
  if (change.missingAlerts !== undefined) edits.missingAlerts = change.missingAlerts
  if (change.summaryDow !== undefined) edits.summaryDow = change.summaryDow ?? saved.schoolDefaultDow
  return edits
}

function Switch({ id, label, hint, checked, onChange }: { id: string; label: string; hint: string; checked: boolean; onChange: (next: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <label htmlFor={id} className="block cursor-pointer text-base font-semibold text-slate-900">
          {label}
        </label>
        <p className="mt-1 text-sm leading-relaxed text-stone-600">{hint}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 ${
          checked ? 'bg-amber-700' : 'bg-stone-300'
        }`}
      >
        <span className={`inline-block h-6 w-6 rounded-full bg-white shadow-sm transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

export default function NotificationPrefsForm({ autoSet = null, onAutoSetDone }: NotificationPrefsFormProps) {
  const userId = useUserStore((s) => s.user.id)
  const notify = useNotificationStore((s) => s.showNotification)
  const prefs = useLoad(userId ? `notification-prefs:${userId}` : null, () => getNotificationPrefs().then((r) => r.data))
  const { patch } = prefs
  const saved = prefs.data

  // What the parent has changed and not saved yet, over the saved choices.
  const [edits, setEdits] = useState<Partial<PrefsDraft>>({})
  const [saving, setSaving] = useState(false)
  const handled = useRef(false)
  const doneRef = useRef(onAutoSetDone)
  useEffect(() => {
    doneRef.current = onAutoSetDone
  })

  const draft: PrefsDraft | null = saved ? { ...draftOf(saved), ...edits } : null
  const dirty = saved && draft ? isDirty(draft, saved) : false

  const save = async (change: NotificationPrefsChange): Promise<boolean> => {
    setSaving(true)
    try {
      const res = await saveNotificationPrefs(change)
      patch(() => res.data)
      setEdits({})
      return true
    } catch (err) {
      notify(messageOf(err, "Your choices didn't save. Try again."), 'error')
      return false
    } finally {
      setSaving(false)
    }
  }

  // The email's "Get it daily" / "Turn it off": saved once, as soon as the choices are here.
  useEffect(() => {
    if (!autoSet || !saved || handled.current) return
    handled.current = true
    const change = setChange(autoSet)
    void (async () => {
      if (await save(change)) notify(setConfirmation(autoSet), 'success')
      else setEdits(applyChange(saved, change)) // keep it in the form so Save can try again
      doneRef.current?.()
    })()
    // `save` and `notify` are stable enough for a one-time action; it runs once per page visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSet, saved])

  const onSave = async () => {
    if (!saved || !draft) return
    if (await save(changeFor(draft, saved))) notify('Your email preferences are saved.', 'success')
  }

  if (prefs.error && !saved) {
    return <LoadError tone="parent" title="We couldn't load your email preferences" message={prefs.error.message} onRetry={prefs.reload} />
  }
  if (!saved || !draft) {
    return (
      <div className="flex max-w-2xl flex-col gap-4" aria-label="Loading">
        <div className="h-56 animate-pulse rounded-[18px] bg-stone-100" />
        <div className="h-24 animate-pulse rounded-[18px] bg-stone-100" />
      </div>
    )
  }

  const set = (patchDraft: Partial<PrefsDraft>) => setEdits((prev) => ({ ...prev, ...patchDraft }))
  const summaryOn = draft.weeklySummary

  return (
    <form
      className="flex max-w-2xl flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault()
        void onSave()
      }}
    >
      <section className="flex flex-col gap-5 rounded-[18px] border border-stone-200 bg-white p-5 sm:p-6">
        <Switch id="pref-summary" label="Weekly summary" hint={SUMMARY_BLURB} checked={summaryOn} onChange={(weeklySummary) => set({ weeklySummary })} />

        <fieldset disabled={!summaryOn} className="flex flex-col gap-4 border-t border-stone-100 pt-5 disabled:opacity-50">
          <div className="flex flex-col gap-2">
            <span id="pref-how-often" className="text-sm font-semibold text-slate-800">
              How often
            </span>
            <div role="radiogroup" aria-labelledby="pref-how-often" className="inline-flex w-fit rounded-xl border border-stone-200 bg-stone-50 p-1">
              {FREQUENCIES.map((f) => {
                const on = draft.summaryFrequency === f.value
                return (
                  <button
                    key={f.value}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => set({ summaryFrequency: f.value })}
                    className={`min-h-10 cursor-pointer rounded-lg px-5 text-sm transition-colors disabled:cursor-not-allowed ${
                      on ? 'bg-white font-semibold text-amber-800 shadow-sm' : 'text-stone-600 hover:text-slate-900'
                    }`}
                  >
                    {f.label}
                  </button>
                )
              })}
            </div>
          </div>

          {draft.summaryFrequency === 'weekly' && (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-semibold text-slate-800">Day</span>
              <select
                value={draft.summaryDow}
                onChange={(e) => set({ summaryDow: Number(e.target.value) as SummaryDay })}
                className="min-h-11 w-full max-w-xs cursor-pointer rounded-xl border border-stone-200 bg-white px-3.5 text-[15px] text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100 disabled:cursor-not-allowed"
              >
                {dayOptions(saved.schoolDefaultDow).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </fieldset>
        {!summaryOn && <p className="-mt-2 text-sm text-stone-500">Turn the weekly summary on to choose how often it comes.</p>}
      </section>

      <section className="rounded-[18px] border border-stone-200 bg-white p-5 sm:p-6">
        <Switch id="pref-missing" label="Missing-work alerts" hint={ALERT_BLURB} checked={draft.missingAlerts} onChange={(missingAlerts) => set({ missingAlerts })} />
      </section>

      <p className="text-sm text-stone-600">{ANNOUNCEMENTS_NOTE}</p>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!dirty || saving}
          className="min-h-11 cursor-pointer rounded-xl bg-amber-700 px-6 text-sm font-semibold text-white transition-colors hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
        {dirty && !saving && <span className="text-sm text-stone-500">You have changes that aren&apos;t saved yet.</span>}
      </div>
    </form>
  )
}
