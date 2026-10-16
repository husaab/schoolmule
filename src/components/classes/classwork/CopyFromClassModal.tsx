// src/components/classes/classwork/CopyFromClassModal.tsx
// "Copy from another class": pick one of your other classes this year, then
// the classwork to bring over (all of it by default) and whether its topics
// come too. Everything arrives as a draft with no dates; graded work joins
// the category of the same name in Grades, and anything that couldn't keep
// its grade is listed afterwards.
'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import Spinner from '@/components/Spinner'
import { KIND_LABELS } from '@/lib/classworkRows'
import { copyFromClass, getClasswork, getCopySources } from '@/services/classworkService'
import type { ClassworkData, CopyResult, CopySource } from '@/services/types/classwork'
import { useNotificationStore } from '@/store/useNotificationStore'
import { KindTile } from './ItemRow'

interface CopyFromClassModalProps {
  isOpen: boolean
  classId: string
  onClose: () => void
  /** After a copy: the list should reload. */
  onCopied: (result: CopyResult) => void
}

type Load<T> = { status: 'loading' } | { status: 'ready'; data: T } | { status: 'error'; message: string }

const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function CopyFlow({ classId, onClose, onCopied }: Omit<CopyFromClassModalProps, 'isOpen'>) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [sources, setSources] = useState<Load<CopySource[]>>({ status: 'loading' })
  const [sourceId, setSourceId] = useState<string | null>(null)
  const [source, setSource] = useState<Load<ClassworkData> & { classId?: string }>({ status: 'loading' })
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [includeTopics, setIncludeTopics] = useState(true)
  const [copying, setCopying] = useState(false)
  const [result, setResult] = useState<CopyResult | null>(null)

  useEffect(() => {
    let cancelled = false
    getCopySources(classId).then(
      (res) => !cancelled && setSources({ status: 'ready', data: res.data.classes }),
      (err: unknown) => !cancelled && setSources({ status: 'error', message: messageOf(err, "Your classes couldn't be loaded.") }),
    )
    return () => {
      cancelled = true
    }
  }, [classId])

  useEffect(() => {
    if (!sourceId) return
    let cancelled = false
    getClasswork(sourceId).then(
      (res) => {
        if (cancelled) return
        setSource({ status: 'ready', data: res.data, classId: sourceId })
        setPicked(new Set(res.data.items.map((i) => i.itemId)))
      },
      (err: unknown) =>
        !cancelled && setSource({ status: 'error', message: messageOf(err, "That class's classwork couldn't be loaded."), classId: sourceId }),
    )
    return () => {
      cancelled = true
    }
  }, [sourceId])

  const sourceItems = useMemo(
    () => (source.status === 'ready' && source.classId === sourceId ? source.data.items : []),
    [source, sourceId],
  )
  const topicNames = useMemo(
    () => new Map(source.status === 'ready' ? source.data.topics.map((t) => [t.topicId, t.name]) : []),
    [source],
  )
  const sourceLabel = sources.status === 'ready' ? sources.data.find((s) => s.classId === sourceId)?.label : undefined

  const toggle = (id: string) =>
    setPicked((set) => {
      const next = new Set(set)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const copy = async () => {
    if (!sourceId || picked.size === 0 || copying) return
    setCopying(true)
    try {
      const all = picked.size === sourceItems.length
      const res = await copyFromClass(classId, { sourceClassId: sourceId, itemIds: all ? undefined : [...picked], includeTopics })
      setResult(res.data)
      onCopied(res.data)
      showNotification(`${plural(res.data.copied, 'item', 'items')} copied as drafts`, 'success')
    } catch (err) {
      showNotification(messageOf(err, "The classwork couldn't be copied."), 'error')
    } finally {
      setCopying(false)
    }
  }

  // ── After the copy ──
  if (result) {
    return (
      <>
        <ModalHeader title="Copied" subtitle={sourceLabel ? `From ${sourceLabel}` : undefined} icon={ArrowPathIcon} tone="success" />
        <ModalBody>
          <p className="text-sm text-slate-700">
            {result.copied === 0
              ? 'Nothing was copied.'
              : `${plural(result.copied, 'item is', 'items are')} in Classwork as drafts. Add dates, then post them when you're ready.`}
          </p>
          {result.warnings.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="mb-1.5 flex items-center gap-2 text-sm font-medium text-amber-900">
                <ExclamationTriangleIcon className="h-4 w-4" aria-hidden="true" />
                Worth a look
              </p>
              <ul className="flex flex-col gap-1 text-sm text-amber-900">
                {result.warnings.map((w, i) => (
                  <li key={`${w.title}-${i}`}>
                    <span className="font-medium">{w.title}:</span> {w.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </ModalFooter>
      </>
    )
  }

  // ── Step 2: what to copy ──
  if (sourceId) {
    const ready = source.status === 'ready' && source.classId === sourceId
    return (
      <>
        <ModalHeader title="Copy from another class" subtitle={sourceLabel} icon={ArrowPathIcon} />
        <ModalBody>
          {!ready && source.status !== 'error' && (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          )}
          {source.status === 'error' && source.classId === sourceId && <p className="text-sm text-rose-700">{source.message}</p>}
          {ready && sourceItems.length === 0 && <p className="text-sm text-slate-600">That class has no classwork yet.</p>}
          {ready && sourceItems.length > 0 && (
            <>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-600">
                  {picked.size} of {sourceItems.length} chosen
                </span>
                <span className="flex gap-3">
                  <button type="button" onClick={() => setPicked(new Set(sourceItems.map((i) => i.itemId)))} className="cursor-pointer font-medium text-cyan-700">
                    Select all
                  </button>
                  <button type="button" onClick={() => setPicked(new Set())} className="cursor-pointer text-slate-500">
                    Clear
                  </button>
                </span>
              </div>
              <ul className="-mx-1 flex max-h-72 flex-col overflow-y-auto">
                {sourceItems.map((i) => (
                  <li key={i.itemId}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={picked.has(i.itemId)}
                        onChange={() => toggle(i.itemId)}
                        className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-cyan-600"
                      />
                      <KindTile kind={i.kind} size={30} />
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-sm text-slate-900">{i.title}</span>
                        <span className="text-xs text-slate-500">
                          {[KIND_LABELS[i.kind], i.topicId ? topicNames.get(i.topicId) : null, i.gradebook?.categoryName].filter(Boolean).join(' · ')}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-800">
                <input
                  type="checkbox"
                  checked={includeTopics}
                  onChange={(e) => setIncludeTopics(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-cyan-600"
                />
                Bring their topics too
              </label>
              <p className="text-xs leading-relaxed text-slate-500">
                Everything arrives as a draft with no dates. Graded work joins the category with the same name in Grades.
              </p>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={() => setSourceId(null)}>
            Back
          </Button>
          <Button type="button" onClick={() => void copy()} loading={copying} disabled={!ready || picked.size === 0}>
            {picked.size > 0 ? `Copy ${plural(picked.size, 'item', 'items')}` : 'Copy'}
          </Button>
        </ModalFooter>
      </>
    )
  }

  // ── Step 1: which class ──
  return (
    <>
      <ModalHeader title="Copy from another class" subtitle="Your other classes this school year" icon={ArrowPathIcon} />
      <ModalBody>
        {sources.status === 'loading' && (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        )}
        {sources.status === 'error' && <p className="text-sm text-rose-700">{sources.message}</p>}
        {sources.status === 'ready' && sources.data.length === 0 && (
          <p className="text-sm text-slate-600">There are no other classes this year to copy from.</p>
        )}
        {sources.status === 'ready' && sources.data.length > 0 && (
          <ul className="-mx-1 flex max-h-80 flex-col overflow-y-auto">
            {sources.data.map((s) => (
              <li key={s.classId}>
                <button
                  type="button"
                  onClick={() => {
                    setSource({ status: 'loading' })
                    setSourceId(s.classId)
                  }}
                  disabled={s.itemCount === 0}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-2.5 text-left text-sm text-slate-900 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="min-w-0 truncate font-medium">{s.label}</span>
                  <span className="shrink-0 text-xs text-slate-500">{s.itemCount === 0 ? 'No classwork' : plural(s.itemCount, 'item', 'items')}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </ModalFooter>
    </>
  )
}

export default function CopyFromClassModal({ isOpen, onClose, ...rest }: CopyFromClassModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      {isOpen && <CopyFlow onClose={onClose} {...rest} />}
    </Modal>
  )
}
