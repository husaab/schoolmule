'use client'

// Finance → Tuition (admin only). Every family's tuition by month, read from
// QuickBooks Online: who has paid, who is partial or overdue, and what the
// subsidy grant still owes. Families are managed here too: add / edit /
// delete them, link them to QuickBooks customers (the linking wizard, or the
// drawer), and work through the "Needs attention" list. After any change the
// page bumps `version`, which refetches the grid and the attention list and
// makes the open drawer and wizard reload.
//
// Filters live in the URL so Back/refresh/share restore them. On a desktop the
// header, summary and toolbar stay put and the grid scrolls inside its card;
// on a phone the whole page scrolls and the grid becomes a card list.

import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownTrayIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  LinkIcon,
  PlusIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import EmptyState from '@/components/ui/EmptyState'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore, useYearStoreHydrated } from '@/store/useSchoolYearStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useFilterParams } from '@/hooks/useFilterParams'
import { useOAuthOutcome, type OAuthOutcomeMessages } from '@/hooks/useOAuthOutcome'
import { disconnectQbo, downloadTuitionCsv, getQboConnectUrl, getTuitionAnomalies, getTuitionGrid } from '@/services/financeService'
import type { TuitionAnomalies, TuitionGrid as TuitionGridData } from '@/services/types/finance'
import QboSyncStatus from '@/components/finance/QboSyncStatus'
import QboConnectionCard from '@/components/finance/QboConnectionCard'
import DisconnectQboModal from '@/components/finance/DisconnectQboModal'
import TuitionSummary from '@/components/finance/TuitionSummary'
import TuitionFilters from '@/components/finance/TuitionFilters'
import TuitionGrid from '@/components/finance/TuitionGrid'
import FamilyDrawer from '@/components/finance/FamilyDrawer'
import { FirstSyncBanner, FullRefreshBanner } from '@/components/finance/TuitionNotices'
import AnomaliesPanel from '@/components/finance/AnomaliesPanel'
import LinkingWizard, { type WizardTab } from '@/components/finance/LinkingWizard'
import FamilyFormModal, { type FamilyFormPrefill } from '@/components/finance/FamilyFormModal'
import { useQboSyncStatus } from '@/components/finance/useQboSyncStatus'
import { errorMessage, grantNameFrom, monthLong } from '@/components/finance/format'
import {
  filterWithoutStatus,
  gradeOptions,
  matchesStatus,
  parseFilters,
  sortFamilies,
  statusCounts,
  totalsFor,
} from '@/components/finance/gridFilters'

const RETURN_TO = '/finance/tuition'

const QBO_MESSAGES: OAuthOutcomeMessages = {
  connected: ['QuickBooks connected — first sync is running', 'success'],
  denied: ['QuickBooks access was declined', 'error'],
  invalid_state: ['That sign-in link expired — please try again', 'error'],
  missing_code: ['QuickBooks sign-in did not complete', 'error'],
  realm_conflict: ['This school is already linked to a different QuickBooks company — disconnect and purge first', 'error'],
  error: ['Could not connect QuickBooks — please try again', 'error'],
}

const secondaryButton =
  'inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'

function TuitionContent() {
  const user = useUserStore((s) => s.user)
  const yearHydrated = useYearStoreHydrated()
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const { get, setParams } = useFilterParams()

  // Admin only: AuthGuard redirects everyone else, but not before the first
  // render, so gate every finance request on the role too.
  const ready = yearHydrated && !!user.id && user.role === 'ADMIN'
  const { status, error: statusError, refresh: refreshStatus } = useQboSyncStatus(ready)

  // "Connect QuickBooks" round-trips through Intuit back to this page.
  useOAuthOutcome('qbo', QBO_MESSAGES, 'Could not connect QuickBooks', () => {
    refreshStatus()
  })

  const [grid, setGrid] = useState<TuitionGridData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openFamilyId, setOpenFamilyId] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [version, setVersion] = useState(0)
  const [anomalies, setAnomalies] = useState<TuitionAnomalies | null>(null)
  const [anomaliesError, setAnomaliesError] = useState<string | null>(null)
  const [anomaliesOpen, setAnomaliesOpen] = useState(false)
  const anomaliesRef = useRef<HTMLDivElement | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardTab, setWizardTab] = useState<WizardTab>('families')
  const [formOpen, setFormOpen] = useState(false)
  const [formPrefill, setFormPrefill] = useState<FamilyFormPrefill | null>(null)
  const [exporting, setExporting] = useState(false)

  // Only the newest request may write state: a year switch, a silent
  // post-sync reload and a Try again can overlap.
  const reqId = useRef(0)
  const loadGrid = useCallback(async (silent = false) => {
    const id = ++reqId.current
    if (!silent) {
      setLoading(true)
      setError(null)
    }
    try {
      const res = await getTuitionGrid()
      if (id !== reqId.current) return
      setGrid(res.data)
      setError(null)
    } catch (err) {
      if (id !== reqId.current) return
      if (!silent) {
        setGrid(null)
        setError(errorMessage(err, 'Could not load tuition'))
      }
    } finally {
      if (!silent && id === reqId.current) setLoading(false)
    }
  }, [])

  const anomaliesReq = useRef(0)
  const loadAnomalies = useCallback(async () => {
    const id = ++anomaliesReq.current
    try {
      const res = await getTuitionAnomalies()
      if (id !== anomaliesReq.current) return
      setAnomalies(res.data)
      setAnomaliesError(null)
    } catch (err) {
      if (id !== anomaliesReq.current) return
      setAnomalies(null)
      setAnomaliesError(errorMessage(err, 'Could not load the attention list'))
    }
  }, [])

  /** After any family / link / invoice change: refetch everything that shows it. */
  const refreshAfterChange = useCallback(() => {
    setVersion((v) => v + 1)
    loadGrid(true)
    loadAnomalies()
  }, [loadGrid, loadAnomalies])

  // A drawer (or wizard) for last year's families makes no sense after
  // switching years.
  const [drawerYearId, setDrawerYearId] = useState(selectedYearId)
  if (drawerYearId !== selectedYearId) {
    setDrawerYearId(selectedYearId)
    setOpenFamilyId(null)
    setWizardOpen(false)
    setFormOpen(false)
    setAnomalies(null)
  }

  // Back from Intuit can restore this page from the bfcache with the
  // Connect buttons still disabled; re-enable them.
  useEffect(() => {
    const onPageShow = () => setConnecting(false)
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])

  // Load once the year store has hydrated (so the X-School-Year header is the
  // persisted one), and again whenever the header year changes.
  useEffect(() => {
    if (!ready) return
    loadGrid()
    loadAnomalies()
  }, [ready, selectedYearId, loadGrid, loadAnomalies])

  // When a sync finishes (lastSuccessAt moves past what the grid was built
  // from), refresh the grid quietly — once per sync.
  const lastSuccessAt = status?.connection.lastSuccessAt ?? null
  const pendingSync = status?.pendingSync ?? false
  const reloadedFor = useRef<string | null>(null)
  useEffect(() => {
    if (!grid || !lastSuccessAt || pendingSync) return
    if (grid.sync.lastSuccessAt === lastSuccessAt || reloadedFor.current === lastSuccessAt) return
    reloadedFor.current = lastSuccessAt
    loadGrid(true)
    loadAnomalies()
    setVersion((v) => v + 1)
  }, [grid, lastSuccessAt, pendingSync, loadGrid, loadAnomalies])

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleConnect = async () => {
    setConnecting(true)
    try {
      const res = await getQboConnectUrl(RETURN_TO)
      window.location.href = res.data.url
    } catch (err) {
      showNotification(errorMessage(err, 'Could not start the QuickBooks sign-in'), 'error')
      setConnecting(false)
    }
  }

  const handleDisconnect = async (purge: boolean) => {
    try {
      const res = await disconnectQbo(purge)
      showNotification(res.data.purged ? 'QuickBooks disconnected and cached data cleared' : 'QuickBooks disconnected', 'success')
      setDisconnectOpen(false)
      await Promise.all([refreshStatus(), loadGrid(true)])
    } catch (err) {
      showNotification(errorMessage(err, 'Could not disconnect QuickBooks'), 'error')
      throw err
    }
  }

  const closeDrawer = useCallback(() => setOpenFamilyId(null), [])

  const handleExport = async () => {
    setExporting(true)
    try {
      await downloadTuitionCsv(grid?.year.label)
    } catch (err) {
      showNotification(errorMessage(err, 'Could not export the tuition CSV'), 'error')
    } finally {
      setExporting(false)
    }
  }

  const openWizard = useCallback((tab: WizardTab) => {
    setWizardTab(tab)
    setWizardOpen(true)
  }, [])

  const openAddFamily = useCallback((prefill: FamilyFormPrefill | null = null) => {
    setFormPrefill(prefill)
    setFormOpen(true)
  }, [])

  const showAnomalies = () => {
    setAnomaliesOpen(true)
    requestAnimationFrame(() => anomaliesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  const handleFamilyDeleted = useCallback(() => {
    setOpenFamilyId(null)
    refreshAfterChange()
  }, [refreshAfterChange])

  const handleFamilySaved = useCallback(
    (familyId: string, created: boolean) => {
      refreshAfterChange()
      // A family made from the page opens straight away; one made from the
      // wizard stays behind it so the admin can keep working through the list.
      if (created && !wizardOpen) setOpenFamilyId(familyId)
    },
    [refreshAfterChange, wizardOpen]
  )

  // ── Derived ─────────────────────────────────────────────────────────────
  const filters = useMemo(() => (grid ? parseFilters(get, grid.months, grid.asOfMonth) : null), [grid, get])

  const view = useMemo(() => {
    if (!grid || !filters) return null
    const base = filterWithoutStatus(grid.families, filters)
    const visible = sortFamilies(
      base.filter((f) => matchesStatus(f, filters.month, filters.status)),
      filters.sort
    )
    return {
      counts: statusCounts(base, filters.month),
      visible,
      totals: totalsFor(visible, grid.months),
      grades: gradeOptions(grid.families),
    }
  }, [grid, filters])

  const connection = status?.connection ?? null
  // Only an 'active' connection syncs; 'needs_reconnect' still reports
  // connected=true but is effectively offline.
  const active = (connection ?? grid?.sync)?.status === 'active'
  const needsReconnect = connection?.status === 'needs_reconnect' || grid?.sync.status === 'needs_reconnect'
  const knowConnection = !!connection || !!grid
  const firstSyncRunning = connection?.status === 'active' && !connection.backfillCompletedAt

  const settingGrant = connection?.settings?.grantLabel
  const grantName = typeof settingGrant === 'string' && settingGrant.trim() ? settingGrant.trim() : grantNameFrom(grid?.grant.label)
  const drawerPreview = openFamilyId ? grid?.families.find((f) => f.familyId === openFamilyId) ?? null : null

  const subtitle = grid
    ? `${grid.year.label} · as of ${monthLong(grid.asOfMonth)}`
    : 'Invoices and payments by family, from QuickBooks'

  const showGridCard = loading || !!error || !grid || grid.families.length > 0 || active

  // ── Render ──────────────────────────────────────────────────────────────
  const gridBody = () => {
    if (loading && !grid) {
      return (
        <div className="flex justify-center py-16">
          <Spinner size="lg" />
        </div>
      )
    }
    if (error || !grid || !filters || !view) {
      return (
        <EmptyState
          icon={ExclamationTriangleIcon}
          iconClassName="text-rose-300"
          title="Could not load tuition"
          description={error ?? undefined}
          action={
            <button type="button" onClick={() => loadGrid()} className={secondaryButton}>
              Try again
            </button>
          }
        />
      )
    }
    if (grid.families.length === 0) {
      return (
        <EmptyState
          icon={UserGroupIcon}
          title={firstSyncRunning ? 'Waiting for the first sync' : `No families for ${grid.year.label} yet`}
          description="Add families one at a time, or import the roster and customer map to create them all at once. Each family's QuickBooks invoices and payments then show here by month."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => openAddFamily()} className={secondaryButton}>
                <PlusIcon className="h-4 w-4" />
                Add family
              </button>
              <button type="button" onClick={() => openWizard('import')} className={secondaryButton}>
                <LinkIcon className="h-4 w-4" />
                Import mapping file
              </button>
            </div>
          }
        />
      )
    }
    if (view.visible.length === 0) {
      return (
        <EmptyState
          icon={FunnelIcon}
          title="No families match these filters"
          description="Try another month or status, or clear the filters."
          action={
            <button
              type="button"
              onClick={() => setParams({ month: null, status: null, flags: null, grade: null, q: null, over: null, sort: null })}
              className={secondaryButton}
            >
              Clear filters
            </button>
          }
        />
      )
    }
    return (
      <TuitionGrid
        months={grid.months}
        selectedMonth={filters.month}
        families={view.visible}
        grant={grid.grant}
        schoolSubsidy={grid.schoolSubsidy}
        totals={view.totals}
        grantName={grantName}
        onOpenFamily={setOpenFamilyId}
      />
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen lg:h-screen flex flex-col bg-slate-50">
        <div className="flex flex-col flex-1 lg:min-h-0 p-4 lg:p-8 max-w-[1600px] mx-auto w-full gap-5">
          {/* Header */}
          <div className="flex-shrink-0 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <CurrencyDollarIcon className="w-7 h-7 text-cyan-500" />
                Tuition
              </h1>
              <p className="text-slate-500 mt-1">{subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {grid && (
                <>
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={exporting || grid.families.length === 0}
                    className={secondaryButton}
                    title="Download the grid as a spreadsheet"
                  >
                    <ArrowDownTrayIcon className={`h-4 w-4 ${exporting ? 'animate-pulse' : ''}`} />
                    Export CSV
                  </button>
                  <button type="button" onClick={() => openWizard('families')} className={secondaryButton}>
                    <LinkIcon className="h-4 w-4" />
                    Link families
                  </button>
                  <button
                    type="button"
                    onClick={() => openAddFamily()}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:from-cyan-600 hover:to-teal-600 cursor-pointer active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Add family
                  </button>
                </>
              )}
              <QboSyncStatus
                status={status}
                onRefresh={refreshStatus}
                onConnect={handleConnect}
                onDisconnect={() => setDisconnectOpen(true)}
                connecting={connecting}
                error={statusError}
              />
            </div>
          </div>

          {/* Connection + notices */}
          {knowConnection && !active && (
            <div className="flex-shrink-0">
              <QboConnectionCard needsReconnect={needsReconnect} connecting={connecting} onConnect={handleConnect} />
            </div>
          )}
          {firstSyncRunning && (
            <div className="flex-shrink-0">
              <FirstSyncBanner companyName={connection?.companyName ?? null} />
            </div>
          )}
          {active && grid?.sync.needsFullRefresh && (
            <div className="flex-shrink-0">
              <FullRefreshBanner />
            </div>
          )}

          {/* Summary */}
          {(loading || grid) && (
            <div className="flex-shrink-0">
              <TuitionSummary
                summary={grid?.summary ?? null}
                asOfMonth={grid?.asOfMonth ?? null}
                grantLabel={grid?.grant.label ?? null}
                loading={loading && !grid}
                onAttentionClick={showAnomalies}
              />
            </div>
          )}
          {grid && (anomalies || anomaliesError) && (
            <div className="flex-shrink-0">
              <AnomaliesPanel
                ref={anomaliesRef}
                anomalies={anomalies}
                error={anomaliesError}
                open={anomaliesOpen}
                onToggle={() => setAnomaliesOpen((v) => !v)}
                onRetry={loadAnomalies}
                onOpenWizard={openWizard}
                onOpenFamily={setOpenFamilyId}
              />
            </div>
          )}

          {/* Toolbar (fixed) + grid (scrolls on desktop) */}
          {showGridCard && (
            <div className="flex flex-col flex-1 lg:min-h-[320px] bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              {grid && filters && view && grid.families.length > 0 && (
                <div className="flex-shrink-0 border-b border-slate-100 px-4 py-3 sm:px-5">
                  <TuitionFilters
                    filters={filters}
                    months={grid.months}
                    asOfMonth={grid.asOfMonth}
                    grades={view.grades}
                    counts={view.counts}
                    onChange={setParams}
                  />
                </div>
              )}
              <div className="flex flex-col lg:flex-1 lg:min-h-0">{gridBody()}</div>
            </div>
          )}
        </div>
      </main>

      <FamilyDrawer
        familyId={openFamilyId}
        preview={drawerPreview}
        grantName={grantName}
        version={version}
        onClose={closeDrawer}
        onChanged={refreshAfterChange}
        onDeleted={handleFamilyDeleted}
      />

      <LinkingWizard
        isOpen={wizardOpen}
        tab={wizardTab}
        onTabChange={setWizardTab}
        version={version}
        onClose={() => setWizardOpen(false)}
        onChanged={refreshAfterChange}
        onCreateFamily={openAddFamily}
        onOpenFamily={(familyId) => {
          setWizardOpen(false)
          setOpenFamilyId(familyId)
        }}
      />

      <FamilyFormModal isOpen={formOpen} prefill={formPrefill} onClose={() => setFormOpen(false)} onSaved={handleFamilySaved} />

      <DisconnectQboModal
        isOpen={disconnectOpen}
        companyName={connection?.companyName ?? null}
        onClose={() => setDisconnectOpen(false)}
        onConfirm={handleDisconnect}
      />
    </>
  )
}

export default function TuitionPage() {
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
      <TuitionContent />
    </Suspense>
  )
}
