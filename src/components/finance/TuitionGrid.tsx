'use client'

// The family × month ledger. Desktop: a table with the Family and Balance
// columns pinned left, a sticky header and a sticky totals footer, scrolling
// both ways inside its card. Below md: a stacked card per family showing the
// selected month. The pinned grant / school-applied rows follow the filters:
// they cover only the visible families (see restrictPseudoRow).

import React, { memo, useMemo, useState } from 'react'
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import type { GridFamily, PseudoRow, PseudoRowFamily } from '@/services/types/finance'
import { FamilyBadges } from './badges'
import MonthCell, { MonthChip } from './MonthCell'
import { cellFor, formatMoney, gradeShort, monthMedium, monthShort } from './format'
import { hasAnyCell, restrictPseudoRow, type VisibleTotals } from './gridFilters'

interface TuitionGridProps {
  months: string[]
  selectedMonth: string
  families: GridFamily[]
  grant: PseudoRow
  schoolSubsidy: PseudoRow
  totals: VisibleTotals
  grantName: string
  /** How many families the unfiltered grid has; fewer visible = filtered. */
  allFamilyCount: number
  onOpenFamily: (familyId: string) => void
}

// Sticky offsets are fixed widths so the second pinned column knows where the
// first one ends. Whole class strings so Tailwind can see them.
const FAMILY_COL = 'sticky left-0 w-[264px] min-w-[264px] max-w-[264px]'
const BALANCE_COL = 'sticky left-[264px] w-[112px] min-w-[112px] shadow-[6px_0_6px_-6px_rgba(15,23,42,0.18)]'
const MONTH_COL = 'min-w-[100px] px-2'
const YTD_COL = 'min-w-[112px] px-3 text-right'
const CELL_Y = 'py-2 border-b border-slate-100'
const HEAD_BASE = 'sticky top-0 py-2.5 border-b border-slate-200 text-[11px] font-semibold uppercase tracking-wider'
const HEAD = `${HEAD_BASE} bg-slate-50 text-slate-500`
const FOOT = 'sticky bottom-0 bg-slate-50 py-2.5 border-t border-slate-200 text-xs font-semibold text-slate-700 tabular-nums'

const balanceTone = (n: number) => (n > 0 ? 'text-rose-600' : 'text-slate-700')

// ── Rows ─────────────────────────────────────────────────────────────────

const FamilyRow = memo(function FamilyRow({
  family,
  months,
  selectedMonth,
  grantName,
  onOpen,
}: {
  family: GridFamily
  months: string[]
  selectedMonth: string
  grantName: string
  onOpen: (id: string) => void
}) {
  const t = family.parent.totals
  return (
    <tr className="group cursor-pointer" onClick={() => onOpen(family.familyId)}>
      <td className={`${FAMILY_COL} ${CELL_Y} z-10 bg-white px-4 group-hover:bg-slate-50`}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpen(family.familyId)
          }}
          className="block max-w-full cursor-pointer truncate text-left text-sm font-semibold text-slate-900 hover:text-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
        >
          {family.name}
        </button>
        {family.students.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {family.students.map((s) => (
              <span
                key={s.studentId}
                className={`rounded-md px-1.5 py-0.5 text-[11px] ${s.isArchived ? 'bg-slate-50 text-slate-400 line-through' : 'bg-slate-100 text-slate-600'}`}
              >
                {s.name} · {gradeShort(s.grade)}
              </span>
            ))}
          </div>
        )}
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <FamilyBadges isSubsidy={family.isSubsidy} isTeacher={family.isTeacher} warnings={family.warnings} />
          {family.customer ? (
            <span className="truncate text-[11px] text-slate-400" title={family.customer.displayName}>
              {family.customer.displayName}
            </span>
          ) : (
            <span className="text-[11px] font-medium text-rose-500">Unlinked</span>
          )}
        </div>
      </td>
      <td className={`${BALANCE_COL} ${CELL_Y} z-10 bg-white px-3 text-right text-sm font-semibold tabular-nums group-hover:bg-slate-50 ${balanceTone(t.balance)}`}>
        {formatMoney(t.balance)}
      </td>
      {months.map((m) => (
        <td key={m} className={`${MONTH_COL} ${CELL_Y} ${m === selectedMonth ? 'bg-cyan-50/40' : ''} group-hover:bg-slate-50`}>
          <MonthCell cell={cellFor(family.parent.cells, m)} month={m} grantName={grantName} />
        </td>
      ))}
      <td className={`${YTD_COL} ${CELL_Y} text-sm tabular-nums text-slate-700 group-hover:bg-slate-50`}>{formatMoney(t.invoiced)}</td>
      <td className={`${YTD_COL} ${CELL_Y} text-sm tabular-nums text-emerald-700 group-hover:bg-slate-50`}>{formatMoney(t.paid)}</td>
    </tr>
  )
})

function PseudoRows({
  row,
  months,
  selectedMonth,
  grantName,
  tint,
  onOpenFamily,
  totalFamilies,
}: {
  row: PseudoRow
  /** The unfiltered row's family count, when the row is filtered. */
  totalFamilies?: number
  months: string[]
  selectedMonth: string
  grantName: string
  tint: 'cyan' | 'muted'
  onOpenFamily: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const bg = tint === 'cyan' ? 'bg-cyan-50' : 'bg-slate-50'
  const expandable = row.byFamily.length > 0
  return (
    <>
      <tr className={bg}>
        <td className={`${FAMILY_COL} ${CELL_Y} z-10 ${bg} px-4`}>
          <button
            type="button"
            disabled={!expandable}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={expandable ? open : undefined}
            className="flex max-w-full items-center gap-1.5 text-left text-sm font-semibold text-slate-800 enabled:cursor-pointer enabled:hover:text-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 rounded"
          >
            {expandable &&
              (open ? <ChevronDownIcon className="h-3.5 w-3.5 shrink-0" /> : <ChevronRightIcon className="h-3.5 w-3.5 shrink-0" />)}
            <span className="truncate">{row.label}</span>
          </button>
          <p className="mt-0.5 pl-5 text-[11px] text-slate-500">
            {expandable ? `${row.byFamily.length} ${row.byFamily.length === 1 ? 'family' : 'families'}` : 'No families yet'}
          </p>
          {totalFamilies !== undefined && totalFamilies > row.byFamily.length && (
            <p className="pl-5 text-[10px] text-slate-400">
              {row.byFamily.length} of {totalFamilies} families shown
            </p>
          )}
        </td>
        <td className={`${BALANCE_COL} ${CELL_Y} z-10 ${bg} px-3 text-right text-sm font-semibold tabular-nums ${balanceTone(row.totals.balance)}`}>
          {formatMoney(row.totals.balance)}
        </td>
        {months.map((m) => (
          <td key={m} className={`${MONTH_COL} ${CELL_Y}`}>
            <MonthCell cell={cellFor(row.cells, m)} month={m} grantName={grantName} />
          </td>
        ))}
        <td className={`${YTD_COL} ${CELL_Y} text-sm tabular-nums text-slate-700`}>{formatMoney(row.totals.invoiced)}</td>
        <td className={`${YTD_COL} ${CELL_Y} text-sm tabular-nums text-emerald-700`}>{formatMoney(row.totals.paid)}</td>
      </tr>
      {open &&
        row.byFamily.map((f: PseudoRowFamily) => (
          <tr key={f.familyId} className="group cursor-pointer" onClick={() => onOpenFamily(f.familyId)}>
            <td className={`${FAMILY_COL} ${CELL_Y} z-10 bg-white py-1.5 pl-9 pr-4 group-hover:bg-slate-50`}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenFamily(f.familyId)
                }}
                className="block max-w-full cursor-pointer truncate rounded text-left text-xs text-slate-600 hover:text-cyan-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
              >
                {f.name}
              </button>
            </td>
            <td className={`${BALANCE_COL} ${CELL_Y} z-10 bg-white px-3 text-right text-xs tabular-nums group-hover:bg-slate-50 ${balanceTone(f.totals.balance)}`}>
              {formatMoney(f.totals.balance)}
            </td>
            {months.map((m) => (
              <td key={m} className={`${MONTH_COL} ${CELL_Y} ${m === selectedMonth ? 'bg-cyan-50/40' : ''} group-hover:bg-slate-50`}>
                <MonthCell cell={cellFor(f.cells, m)} month={m} grantName={grantName} />
              </td>
            ))}
            <td className={`${YTD_COL} ${CELL_Y} text-xs tabular-nums text-slate-600 group-hover:bg-slate-50`}>{formatMoney(f.totals.invoiced)}</td>
            <td className={`${YTD_COL} ${CELL_Y} text-xs tabular-nums text-emerald-700 group-hover:bg-slate-50`}>{formatMoney(f.totals.paid)}</td>
          </tr>
        ))}
    </>
  )
}

// ── Mobile ───────────────────────────────────────────────────────────────

function MobileList({
  families,
  grant,
  selectedMonth,
  onOpenFamily,
  grantTotal,
}: Pick<TuitionGridProps, 'families' | 'selectedMonth' | 'onOpenFamily'> & { grant: PseudoRow | null; grantTotal: number }) {
  return (
    <ul className="divide-y divide-slate-100 md:hidden">
      {grant && hasAnyCell(grant) && (
        <li className="flex items-center justify-between gap-3 bg-cyan-50 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{grant.label}</p>
            <p className={`text-xs tabular-nums ${balanceTone(grant.totals.balance)}`}>Balance {formatMoney(grant.totals.balance)}</p>
            {grant.byFamily.length < grantTotal && (
              <p className="text-[10px] text-slate-400">
                {grant.byFamily.length} of {grantTotal} families shown
              </p>
            )}
          </div>
          <div className="w-24 shrink-0">
            <MonthChip cell={cellFor(grant.cells, selectedMonth)} />
          </div>
        </li>
      )}
      {families.map((f) => (
        <li key={f.familyId}>
          <button
            type="button"
            onClick={() => onOpenFamily(f.familyId)}
            className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{f.name}</p>
              <p className="truncate text-xs text-slate-500">
                {f.students.map((s) => `${s.name} · ${gradeShort(s.grade)}`).join(', ') || 'No students'}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <FamilyBadges isSubsidy={f.isSubsidy} isTeacher={f.isTeacher} warnings={f.warnings} />
                {!f.customer && <span className="text-[11px] font-medium text-rose-500">Unlinked</span>}
                <span className={`text-xs font-semibold tabular-nums ${balanceTone(f.parent.totals.balance)}`}>
                  Balance {formatMoney(f.parent.totals.balance)}
                </span>
              </div>
            </div>
            <div className="w-24 shrink-0">
              <p className="mb-1 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">{monthMedium(selectedMonth)}</p>
              <MonthChip cell={cellFor(f.parent.cells, selectedMonth)} />
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}

// ── Grid ─────────────────────────────────────────────────────────────────

const TuitionGrid: React.FC<TuitionGridProps> = ({
  months,
  selectedMonth,
  families,
  grant,
  schoolSubsidy,
  totals,
  grantName,
  allFamilyCount,
  onOpenFamily,
}) => {
  // Under filters the pinned rows cover only the visible families (and
  // disappear when none of theirs is visible); unfiltered they are shown as
  // the server built them.
  const filtered = families.length < allFamilyCount
  const { grantRow, schoolRow } = useMemo(() => {
    if (!filtered) return { grantRow: grant, schoolRow: schoolSubsidy }
    const ids = new Set(families.map((f) => f.familyId))
    return { grantRow: restrictPseudoRow(grant, ids, months), schoolRow: restrictPseudoRow(schoolSubsidy, ids, months) }
  }, [filtered, families, grant, schoolSubsidy, months])
  const showSchool = !!schoolRow && hasAnyCell(schoolRow)
  return (
    <>
      <MobileList
        families={families}
        grant={grantRow}
        grantTotal={grant.byFamily.length}
        selectedMonth={selectedMonth}
        onOpenFamily={onOpenFamily}
      />

      <div className="hidden max-h-[75vh] overflow-auto md:block lg:max-h-none lg:min-h-0 lg:flex-1">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th scope="col" className={`${FAMILY_COL} ${HEAD} z-30 px-4 text-left`}>
                Family
              </th>
              <th scope="col" className={`${BALANCE_COL} ${HEAD} z-30 px-3 text-right`}>
                Balance
              </th>
              {months.map((m) => (
                <th
                  key={m}
                  scope="col"
                  className={`${MONTH_COL} ${HEAD_BASE} z-20 text-center ${m === selectedMonth ? 'bg-cyan-50 text-cyan-800' : 'bg-slate-50 text-slate-500'}`}
                >
                  {monthShort(m)}
                </th>
              ))}
              <th scope="col" className={`${YTD_COL} ${HEAD} z-20`}>
                Invoiced YTD
              </th>
              <th scope="col" className={`${YTD_COL} ${HEAD} z-20`}>
                Paid YTD
              </th>
            </tr>
          </thead>
          <tbody>
            {grantRow && (
              <PseudoRows
                row={grantRow}
                totalFamilies={filtered ? grant.byFamily.length : undefined}
                months={months}
                selectedMonth={selectedMonth}
                grantName={grantName}
                tint="cyan"
                onOpenFamily={onOpenFamily}
              />
            )}
            {showSchool && schoolRow && (
              <PseudoRows
                row={schoolRow}
                totalFamilies={filtered ? schoolSubsidy.byFamily.length : undefined}
                months={months}
                selectedMonth={selectedMonth}
                grantName={grantName}
                tint="muted"
                onOpenFamily={onOpenFamily}
              />
            )}
            {families.map((f) => (
              <FamilyRow key={f.familyId} family={f} months={months} selectedMonth={selectedMonth} grantName={grantName} onOpen={onOpenFamily} />
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td className={`${FAMILY_COL} ${FOOT} z-30 px-4`}>
                {families.length} {families.length === 1 ? 'family' : 'families'}
              </td>
              <td className={`${BALANCE_COL} ${FOOT} z-30 px-3 text-right ${balanceTone(totals.balance)}`}>{formatMoney(totals.balance)}</td>
              {months.map((m) => (
                <td key={m} className={`${MONTH_COL} ${FOOT} z-20 text-center`}>
                  <span className="block">{formatMoney(totals.byMonth[m]?.invoiced ?? 0)}</span>
                  <span className="block text-[10px] font-medium text-emerald-700">paid {formatMoney(totals.byMonth[m]?.paid ?? 0)}</span>
                </td>
              ))}
              <td className={`${YTD_COL} ${FOOT} z-20`}>{formatMoney(totals.invoiced)}</td>
              <td className={`${YTD_COL} ${FOOT} z-20 text-emerald-700`}>{formatMoney(totals.paid)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </>
  )
}

export default TuitionGrid
