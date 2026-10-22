'use client'

// The class's publishes, newest first: what was published or unpublished,
// by whom, and where its emails to parents are. Opening a publish lists each
// family's email, with Retry for the ones that didn't send, so a failure
// stays visible after the publish window is closed.

import React, { useEffect, useState } from 'react'
import { ChevronDownIcon, ChevronRightIcon, ClockIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { ModalBody, ModalHeader } from '@/components/shared/modalKit'
import Spinner from '@/components/Spinner'
import DeliveryList from '@/components/gradebook/publish/DeliveryList'
import { getPublicationHistory } from '@/services/assessmentPublicationService'
import type { PublicationHistoryEntry } from '@/services/types/assessmentPublication'
import { deliveryLine } from '@/lib/emailDelivery'

const PAGE = 20

const whenLabel = (iso: string) =>
  new Date(iso).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

/** The email line of one history row. */
function emailLine(entry: PublicationHistoryEntry): string | null {
  if (entry.action !== 'publish') return null
  const s = entry.emailSummary
  if (s.queued) return deliveryLine({ pending: s.pending ?? 0, sent: s.sent, failed: s.failed, skipped: s.skipped })
  if (s.sent + s.failed === 0) return 'No families emailed'
  return s.failed > 0 ? `Emailed ${s.sent} · ${s.failed} didn't send` : `Emailed ${s.sent}`
}

interface PublishHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
}

export default function PublishHistoryModal({ isOpen, onClose, classId }: PublishHistoryModalProps) {
  const [entries, setEntries] = useState<PublicationHistoryEntry[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [more, setMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return undefined
    let cancelled = false
    getPublicationHistory(classId, { limit: PAGE })
      .then((res) => {
        if (cancelled) return
        if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Could not load the history')
        setEntries(res.data)
        setMore(res.data.length === PAGE)
        setError(null)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load the history')
      })
    return () => {
      cancelled = true
    }
  }, [isOpen, classId])

  const loadMore = async () => {
    if (!entries) return
    setLoadingMore(true)
    try {
      const res = await getPublicationHistory(classId, { limit: PAGE, offset: entries.length })
      if (res.status !== 'success' || !res.data) throw new Error(res.message || 'Could not load the history')
      setEntries([...entries, ...res.data])
      setMore(res.data.length === PAGE)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the history')
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnEscape size="2xl" ariaLabel="Publish history">
      <ModalHeader title="Publish history" subtitle="What was published, and each family's email" icon={ClockIcon} />
      <ModalBody>
        {error && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{error}</p>}
        {!entries && !error && (
          <div className="flex justify-center py-10">
            <Spinner size="lg" />
          </div>
        )}
        {entries && entries.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Nothing published yet.</p>}
        {entries && entries.length > 0 && (
          <ul className="divide-y divide-slate-100">
            {entries.map((entry) => {
              const line = emailLine(entry)
              const expandable = entry.action === 'publish' && Boolean(entry.emailSummary.queued)
              const expanded = open === entry.batchId
              const names = entry.assessments.map((a) => a.name).join(', ') || 'Assessments'
              const failed = entry.emailSummary.failed > 0
              return (
                <li key={entry.batchId} className="py-3">
                  <button
                    type="button"
                    onClick={() => expandable && setOpen(expanded ? null : entry.batchId)}
                    disabled={!expandable}
                    aria-expanded={expandable ? expanded : undefined}
                    className="flex w-full items-start gap-3 text-left enabled:cursor-pointer"
                  >
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-slate-400">
                      {entry.action === 'unpublish' ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : expandable ? (
                        expanded ? <ChevronDownIcon className="h-4 w-4" /> : <ChevronRightIcon className="h-4 w-4" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {entry.action === 'unpublish' ? `Unpublished ${names}` : names}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {whenLabel(entry.createdAt)}
                        {entry.triggeredBy?.name ? ` · ${entry.triggeredBy.name}` : ''}
                      </span>
                    </span>
                    {line && (
                      <span className={`flex-shrink-0 text-xs ${failed ? 'text-rose-700' : 'text-slate-500'}`}>{line}</span>
                    )}
                  </button>
                  {expanded && (
                    <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                      <DeliveryList classId={classId} batchId={entry.batchId} compact />
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
        {more && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-60"
            >
              {loadingMore ? 'Loading…' : 'Show older'}
            </button>
          </div>
        )}
      </ModalBody>
    </Modal>
  )
}
