// src/components/observe/alerts/RuleRow.tsx
'use client'
// One built-in rule: what it watches, what it reads right now, and the
// owner's settings for it (thresholds, mute, watch-only, off, back to the
// defaults). Critical rules can be tuned and muted for a day, never switched
// off; the server enforces the same.
import { useCallback, useRef, useState } from 'react'
import type { AlertRule, AlertRulePatch } from '@/services/types/observe'
import { resetAlertRule, updateAlertRule } from '@/services/observeService'
import { checkParam, mutePresetsFor, muteUntil, ruleStateOf, thresholdText } from '@/lib/observeAlerts'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useObserveStore } from '@/store/useObserveStore'
import { refreshAlertStatus } from '@/hooks/useAlertStatus'
import { useDismiss } from './useDismiss'
import { RuleStatePill, TierPill } from '../pills'
import { fmtDateTime, timeAgo } from '../format'

const button = 'rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300 hover:text-white hover:bg-white/[0.06] disabled:opacity-50'

export default function RuleRow({ rule }: { rule: AlertRule }) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const bumpAlerts = useObserveStore((s) => s.bumpAlerts)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [muteOpen, setMuteOpen] = useState(false)
  const muteRef = useRef<HTMLDivElement>(null)
  const closeMute = useCallback(() => setMuteOpen(false), [])
  useDismiss(muteRef, muteOpen, closeMute)
  const state = ruleStateOf(rule)

  const save = async (patch: AlertRulePatch | 'reset', done?: string) => {
    setSaving(true)
    try {
      await (patch === 'reset' ? resetAlertRule(rule.id) : updateAlertRule(rule.id, patch))
      // The rules list and the status refetch with the saved settings.
      bumpAlerts()
      refreshAlertStatus()
      if (done) showNotification(done, 'success')
      return true
    } catch (e) {
      showNotification(e instanceof Error ? e.message : 'Could not save the rule', 'error')
      return false
    } finally {
      setSaving(false)
    }
  }

  const startEdit = () => {
    setDraft(Object.fromEntries(rule.params.map((p) => [p.key, String(p.value)])))
    setEditing(true)
  }

  const checks = rule.params.map((p) => [p, checkParam(p, draft[p.key] ?? '')] as const)
  const firstError = checks.map(([, c]) => ('error' in c ? c.error : null)).find(Boolean)

  const saveParams = async () => {
    if (firstError) return
    const params = Object.fromEntries(checks.map(([p, c]) => [p.key, 'value' in c ? c.value : p.value]))
    if (await save({ params }, 'Thresholds saved')) setEditing(false)
  }

  const muted = state === 'muted'

  return (
    <li className="py-4">
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
        <div className="min-w-0 flex-1 basis-64">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-slate-100">{rule.name}</p>
            <TierPill tier={rule.tier} />
            <RuleStatePill state={state} />
          </div>
          <p className="mt-1 text-xs text-slate-400">{rule.description}</p>
          <p className="mt-1 text-[11px] text-slate-500">
            {rule.source} · {rule.window}
            {muted && rule.mutedUntil ? ` · muted until ${fmtDateTime(rule.mutedUntil)}` : ''}
          </p>
          {rule.current && !rule.external && <p className="mt-1 text-[11px] text-slate-400">Now: {rule.current.summary}</p>}
          {!rule.external && (
            <p className="mt-0.5 text-[11px] text-slate-500">
              {rule.lastTrip ? `Last tripped ${timeAgo(rule.lastTrip.at)}${rule.lastTrip.mode !== 'live' ? ` (${rule.lastTrip.mode})` : ''}` : 'Never tripped'}
              {rule.trips7d.live + rule.trips7d.watch + rule.trips7d.muted > 0
                ? ` · 7 days: ${rule.trips7d.live} live, ${rule.trips7d.watch} watch-only, ${rule.trips7d.muted} muted`
                : ''}
            </p>
          )}
        </div>

        {!rule.external && (
          <div className="flex flex-wrap items-center gap-1.5">
            {rule.params.length > 0 && !editing && (
              <button type="button" className={button} onClick={startEdit} disabled={saving}>
                {thresholdText(rule)}
              </button>
            )}
            {muted ? (
              <button type="button" className={button} disabled={saving} onClick={() => save({ mutedUntil: null }, `${rule.name} unmuted`)}>Unmute</button>
            ) : (
              <div className="relative" ref={muteRef}>
                <button type="button" className={button} disabled={saving} onClick={() => setMuteOpen((v) => !v)} aria-expanded={muteOpen}>Mute…</button>
                {muteOpen && (
                  <div className="absolute right-0 z-10 mt-1 w-36 rounded-xl border border-white/[0.08] bg-slate-900 p-1 shadow-xl">
                    {mutePresetsFor(rule).map((p) => (
                      <button
                        key={p.key}
                        type="button"
                        className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white"
                        onClick={async () => {
                          setMuteOpen(false)
                          await save({ mutedUntil: muteUntil(p.hours) }, `${rule.name} muted for ${p.label}`)
                        }}
                      >
                        For {p.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {!rule.locked && (
              <>
                <button
                  type="button"
                  className={button}
                  disabled={saving || !rule.enabled}
                  onClick={() => save({ mode: rule.mode === 'watch' ? 'live' : 'watch' }, rule.mode === 'watch' ? `${rule.name} now sends alerts` : `${rule.name} is watch-only`)}
                  title={rule.mode === 'watch' ? 'Records trips without emailing' : 'Emails when it trips'}
                >
                  {rule.mode === 'watch' ? 'Make live' : 'Watch only'}
                </button>
                <button
                  type="button"
                  className={button}
                  disabled={saving}
                  onClick={() => save({ enabled: !rule.enabled }, rule.enabled ? `${rule.name} switched off` : `${rule.name} switched on`)}
                >
                  {rule.enabled ? 'Turn off' : 'Turn on'}
                </button>
              </>
            )}
            {rule.customized && (
              <button type="button" className={`${button} text-slate-400`} disabled={saving} onClick={() => save('reset', `${rule.name} back to its defaults`)}>
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {editing && (
        <form
          className="mt-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"
          onSubmit={(e) => {
            e.preventDefault()
            saveParams()
          }}
        >
          <div className="flex flex-wrap gap-3">
            {rule.params.map((p) => (
              <label key={p.key} className="flex flex-col gap-1 text-[11px] text-slate-400">
                {p.label}
                <span className="flex items-center gap-1.5">
                  <input
                    id={`rule-${rule.id}-${p.key}`}
                    inputMode="decimal"
                    value={draft[p.key] ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, [p.key]: e.target.value }))}
                    className="w-24 rounded-lg border border-white/[0.1] bg-slate-950 px-2 py-1 text-sm text-white tabular-nums focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                  />
                  <span className="text-slate-500">{p.unit}</span>
                </span>
                <span className="text-slate-600">default {p.default} · {p.min}–{p.max}</span>
              </label>
            ))}
          </div>
          {firstError && <p className="mt-2 text-xs text-amber-300">{firstError}</p>}
          <div className="mt-3 flex items-center gap-2">
            <button type="submit" disabled={saving || Boolean(firstError)} className="rounded-lg bg-cyan-400/15 px-3 py-1 text-xs font-semibold text-cyan-300 hover:bg-cyan-400/25 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-xs text-slate-400 hover:text-white">Cancel</button>
          </div>
        </form>
      )}
    </li>
  )
}
