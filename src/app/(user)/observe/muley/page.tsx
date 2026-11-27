// src/app/(user)/observe/muley/page.tsx
// Observe → Muley: the platform owner switches the assistant on per school,
// and per view inside it, and sees how much each school used it in the last
// 30 days. A school that is off never sees the button. Each switch saves on
// its own (PUT /api/assistant/platform/settings/:school).
'use client'
import { useCallback, useEffect, useState } from 'react'
import Panel from '@/components/observe/Panel'
import StateBlock from '@/components/observe/StateBlock'
import { SchoolPill } from '@/components/observe/pills'
import { timeAgo } from '@/components/observe/format'
import { listMuleySchools, saveMuleySchool, type MuleySchool, type MuleySchoolSwitches } from '@/services/muleyService'
import { useNotificationStore } from '@/store/useNotificationStore'

type BooleanSwitch = 'enabled' | 'roleTeacher' | 'roleAdmin' | 'roleParent' | 'allowWrites'

const SWITCHES: { key: BooleanSwitch; label: string; hint: string }[] = [
  { key: 'enabled', label: 'On', hint: 'Muley is on for this school' },
  { key: 'roleTeacher', label: 'Teachers', hint: 'Teachers see Muley' },
  { key: 'roleAdmin', label: 'Admins', hint: 'Administrators see Muley' },
  { key: 'roleParent', label: 'Parents', hint: 'Parents and guardians see Muley in the parent portal (read-only: their own children)' },
  { key: 'allowWrites', label: 'Changes', hint: 'Muley may prepare attendance, marks and class-average changes for a person to save' },
]
const RETENTION = [30, 60, 90, 180, 365]

function Switch({ on, label, hint, disabled, dim, onChange }: { on: boolean; label: string; hint: string; disabled: boolean; dim: boolean; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      title={hint}
      disabled={disabled}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 disabled:cursor-wait ${
        on ? 'bg-cyan-500' : 'bg-white/[0.12]'
      } ${dim ? 'opacity-40' : ''}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function ObserveMuleyPage() {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [schools, setSchools] = useState<MuleySchool[] | null>(null)
  const [killSwitch, setKillSwitch] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await listMuleySchools()
      setSchools(res.schools)
      setKillSwitch(res.killSwitch)
      setError(null)
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Muley's settings couldn't be loaded")
    }
  }, [])
  useEffect(() => {
    void load()
  }, [load])

  const change = async (school: MuleySchool, patch: Partial<MuleySchoolSwitches>) => {
    const before = school.settings
    const put = (settings: MuleySchoolSwitches) => setSchools((list) => (list || []).map((s) => (s.school === school.school ? { ...s, settings } : s)))
    put({ ...before, ...patch })
    setSaving(school.school)
    try {
      put(await saveMuleySchool(school.school, patch))
    } catch (err) {
      put(before)
      showNotification(err instanceof Error && err.message ? err.message : "That change couldn't be saved", 'error')
    } finally {
      setSaving(null)
    }
  }

  if (error && !schools) return <StateBlock kind="error" message={error} onRetry={load} />
  if (!schools) return <StateBlock kind="loading" />
  const live = schools.filter((s) => s.settings.enabled).length

  return (
    <div className="space-y-4">
      {killSwitch && (
        <div role="alert" className="rounded-2xl border border-amber-400/30 bg-amber-400/10 px-5 py-3 text-sm text-amber-200">
          The backend&apos;s kill switch is thrown (<code className="font-mono">ASSISTANT_ENABLED=false</code>): Muley is off everywhere, whatever is set here.
        </div>
      )}
      <Panel
        title="Muley by school"
        subtitle={`${live} of ${schools.length} ${schools.length === 1 ? 'school' : 'schools'} on · a school that is off never sees the button · use is the last 30 days`}
        padded={false}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[840px] text-sm">
            <thead>
              <tr className="border-y border-white/[0.06] text-left text-[11px] uppercase tracking-wide text-slate-500">
                <th scope="col" className="px-5 py-2 font-semibold">School</th>
                {SWITCHES.map((s) => (
                  <th key={s.key} scope="col" className="px-3 py-2 font-semibold" title={s.hint}>{s.label}</th>
                ))}
                <th scope="col" className="px-3 py-2 font-semibold">Keep chats</th>
                <th scope="col" className="px-5 py-2 text-right font-semibold">Use</th>
              </tr>
            </thead>
            <tbody>
              {schools.map((school) => {
                const busy = saving === school.school
                const { settings: st, lastThirtyDays: use } = school
                return (
                  <tr key={school.school} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-5 py-3">
                      <div className="font-medium text-slate-100">{school.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-500">
                        <SchoolPill school={school.school} />
                        {school.updatedAt && <span>changed {timeAgo(school.updatedAt)}</span>}
                      </div>
                    </td>
                    {SWITCHES.map((s) => (
                      <td key={s.key} className="px-3 py-3">
                        <Switch
                          on={st[s.key]}
                          label={`${s.label} for ${school.name}`}
                          hint={s.hint}
                          disabled={busy}
                          // The view switches only matter while the school is on.
                          dim={s.key !== 'enabled' && !st.enabled}
                          onChange={(on) => void change(school, { [s.key]: on })}
                        />
                      </td>
                    ))}
                    <td className="px-3 py-3">
                      <select
                        aria-label={`Keep ${school.name}'s conversations for`}
                        value={st.transcriptRetentionDays}
                        disabled={busy}
                        onChange={(e) => void change(school, { transcriptRetentionDays: Number(e.target.value) })}
                        className="cursor-pointer rounded-lg border border-white/[0.08] bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                      >
                        {[...new Set([...RETENTION, st.transcriptRetentionDays])].sort((a, b) => a - b).map((days) => (
                          <option key={days} value={days}>{days} days</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-5 py-3 text-right text-xs tabular-nums text-slate-400">
                      {use.people} {use.people === 1 ? 'person' : 'people'} · {use.conversations} {use.conversations === 1 ? 'chat' : 'chats'} · {use.changesSaved} saved
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Panel>
      <p className="px-1 text-xs text-slate-500">
        For parents Muley only reads: their own children&apos;s published grades, attendance, classwork, the calendar and meetings. Changes are for staff only. Students never get Muley.
      </p>
    </div>
  )
}
