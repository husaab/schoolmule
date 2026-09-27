'use client'

// Searches the cached QuickBooks customers (GET /finance/qbo/customers) and
// collapses into a chip once one is chosen. A customer already linked to
// another family is shown but can't be picked — one customer, one family.

import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import { BuildingLibraryIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { searchQboCustomers } from '@/services/financeService'
import type { PickedCustomer, QboCustomerOption } from '@/services/types/finance'
import { errorMessage, formatMoney } from './format'

interface CustomerPickerProps {
  value: PickedCustomer | null
  onChange: (customer: PickedCustomer | null) => void
  /** The family being edited: its own customer stays selectable. */
  familyId?: string | null
  placeholder?: string
  autoFocus?: boolean
  disabled?: boolean
  /** Starting state of the "Unlinked only" toggle (default on). */
  defaultUnlinkedOnly?: boolean
}

const DEBOUNCE_MS = 250

export const toPicked = (c: QboCustomerOption): PickedCustomer => ({
  qboId: c.qboId,
  displayName: c.displayName,
  isSubCustomer: c.isSubCustomer,
  active: c.active,
  emails: c.emails,
  earliestInvoiceDate: c.earliestInvoiceDate,
})

const invoiceMeta = (c: Pick<QboCustomerOption, 'invoiceCount' | 'openBalance'>) =>
  `${c.invoiceCount} ${c.invoiceCount === 1 ? 'invoice' : 'invoices'} this year · ${formatMoney(c.openBalance)} open`

const CustomerPicker: React.FC<CustomerPickerProps> = ({
  value,
  onChange,
  familyId = null,
  placeholder = 'Search QuickBooks customers…',
  autoFocus = false,
  disabled = false,
  defaultUnlinkedOnly = true,
}) => {
  const listId = useId()
  const [query, setQuery] = useState('')
  const [unlinkedOnly, setUnlinkedOnly] = useState(defaultUnlinkedOnly)
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const [results, setResults] = useState<{ key: string; customers: QboCustomerOption[] } | null>(null)
  const [failure, setFailure] = useState<{ key: string; message: string } | null>(null)
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  const q = query.trim()
  const key = `${q}|${unlinkedOnly ? 1 : 0}`

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const t = setTimeout(async () => {
      try {
        const res = await searchQboCustomers(q, { unlinkedOnly })
        if (cancelled) return
        setResults({ key, customers: res.data.customers })
        setFailure(null)
      } catch (err) {
        if (!cancelled) setFailure({ key, message: errorMessage(err, 'Could not search customers') })
      }
    }, DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [open, key, q, unlinkedOnly])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open) dropdownRef.current?.scrollIntoView({ block: 'nearest' })
  }, [open])

  const customers = useMemo(() => results?.customers ?? [], [results])
  const loading = open && results?.key !== key && failure?.key !== key
  const isTaken = (c: QboCustomerOption) => !!c.linkedFamilyId && c.linkedFamilyId !== familyId

  const pick = (c: QboCustomerOption) => {
    if (isTaken(c)) return
    onChange(toPicked(c))
    setQuery('')
    setOpen(false)
  }

  const move = (dir: 1 | -1) => {
    if (customers.length === 0) return
    let i = highlighted
    for (let step = 0; step < customers.length; step++) {
      i = Math.min(Math.max(i + dir, 0), customers.length - 1)
      if (!isTaken(customers[i])) break
    }
    setHighlighted(i)
  }

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-cyan-200 bg-cyan-50 p-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-100 to-teal-100">
            <BuildingLibraryIcon className="h-4 w-4 text-cyan-700" />
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="truncate text-sm font-medium text-slate-900">{value.displayName}</span>
              {value.isSubCustomer && <span className="shrink-0 text-[11px] text-slate-500">sub-customer</span>}
              {!value.active && <span className="shrink-0 text-[11px] text-amber-700">inactive</span>}
            </span>
            {value.emails && value.emails.length > 0 && (
              <span className="block truncate text-xs text-slate-500">{value.emails.join(', ')}</span>
            )}
          </span>
        </div>
        {!disabled && (
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Clear customer"
            className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-cyan-100 hover:text-slate-600 cursor-pointer"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-label={placeholder}
            value={query}
            disabled={disabled}
            autoFocus={autoFocus}
            onChange={(e) => {
              setQuery(e.target.value)
              setOpen(true)
              setHighlighted(0)
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                if (open) {
                  e.preventDefault()
                  e.stopPropagation()
                }
                setOpen(false)
                return
              }
              if (!open) return
              if (e.key === 'ArrowDown') {
                e.preventDefault()
                move(1)
              } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                move(-1)
              } else if (e.key === 'Enter') {
                e.preventDefault()
                const c = customers[highlighted]
                if (c) pick(c)
              }
            }}
            placeholder={placeholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
          />
        </div>
        <label className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={unlinkedOnly}
            disabled={disabled}
            onChange={(e) => {
              setUnlinkedOnly(e.target.checked)
              setHighlighted(0)
            }}
            className="h-3.5 w-3.5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
          />
          Unlinked only
        </label>
      </div>

      {open && (
        <div
          ref={dropdownRef}
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg"
        >
          {failure?.key === key ? (
            <p className="px-3.5 py-3 text-sm text-rose-600">{failure.message}</p>
          ) : loading && customers.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-slate-400">Searching…</p>
          ) : customers.length === 0 ? (
            <p className="px-3.5 py-3 text-sm text-slate-400">
              {q ? `No customers match “${q}”` : unlinkedOnly ? 'Every customer is linked to a family' : 'No customers synced yet'}
            </p>
          ) : (
            <>
              {loading && <p className="px-3.5 pb-1 text-[11px] text-slate-400">Searching…</p>}
              {customers.map((c, i) => {
                const taken = isTaken(c)
                return (
                  <button
                    key={c.qboId}
                    type="button"
                    role="option"
                    aria-selected={i === highlighted}
                    aria-disabled={taken}
                    disabled={taken}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      pick(c)
                    }}
                    onMouseEnter={() => !taken && setHighlighted(i)}
                    className={`flex w-full flex-col gap-0.5 px-3.5 py-2 text-left transition-colors ${
                      taken ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                    } ${i === highlighted && !taken ? 'bg-cyan-50' : ''}`}
                  >
                    <span className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-medium text-slate-900">{c.displayName}</span>
                      {c.isSubCustomer && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">sub-customer</span>
                      )}
                      {!c.active && (
                        <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">inactive</span>
                      )}
                      {taken && (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                          linked to {c.linkedFamilyName ?? 'another family'}
                        </span>
                      )}
                    </span>
                    {c.emails.length > 0 && <span className="truncate text-xs text-slate-500">{c.emails.join(', ')}</span>}
                    <span className="text-[11px] tabular-nums text-slate-400">{invoiceMeta(c)}</span>
                  </button>
                )
              })}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default CustomerPicker
