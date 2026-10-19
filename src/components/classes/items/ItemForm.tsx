// src/components/classes/items/ItemForm.tsx
// One form for every kind of classwork, new or edited (the
// Teacher-NewAssessment and Teacher-Assign boards). The header holds Close,
// the kind and class, and the actions; the body switches fields by kind.
//
// - An assessment saves with Save (a gradebook column, posted).
// - An assignment (and a quiz) autosaves as a draft: the first change with a
//   title creates it, later changes save after a second of quiet, and a
//   pending change is sent when a field loses focus, on Close, on leaving the
//   page and on pagehide. The saves go through a session saver (the
//   gradebook's pattern, src/lib/debouncedSaverRegistry.ts), keyed
//   "item-form:{user}:{item}" ("…:new:{class}:{kind}" until the first save
//   creates it): one save at a time, a change made meanwhile goes next, and a
//   save that fails after the teacher left is announced with a toast and
//   comes back, failed and offered for Retry, when the form opens again.
//   Assign posts it; the split menu schedules it, saves the draft or
//   discards it.
// - A quiz's details are this form (QuizFields); its questions are the quiz
//   builder. A new or draft quiz's main button is "Next: questions": it saves
//   (the first save creates the quiz) and opens the builder, which posts it.
//   A posted or scheduled quiz links to its questions from the form.
// - A material posts with Post, or is scheduled or saved as a draft.
// - Editing a posted item saves with Save; a scheduled one can also post now,
//   change its time or go back to drafts. Its unsaved edits are guarded
//   (src/lib/leaveGuard.ts): Close, Cancel and any in-app link ask first,
//   closing the tab asks, and browser Back keeps them for the session, so
//   opening the form again brings them back.
// Every save first runs the server's own checks (lib/itemForm), so problems
// show beside their fields. Attachments added before the item exists go up
// right after its first save.
'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import DeleteItemModal from '@/components/classes/classwork/DeleteItemModal'
import { KindTile } from '@/components/classes/classwork/ItemRow'
import TopicFormModal from '@/components/classes/classwork/TopicFormModal'
import { classTitle } from '@/lib/classesHome'
import { dayLabel } from '@/lib/classStream'
import { classHref, classItemHref } from '@/lib/classroomRoutes'
import { KIND_LABELS } from '@/lib/classworkRows'
import { GRADING_VIEW_CODES } from '@/lib/gradingView'
import {
  autosaveFailure,
  draftItemInput,
  emptyItemValues,
  hasErrors,
  isoToTorontoParts,
  itemToFormValues,
  toItemInput,
  validateItemForm,
  withSavedGradebook,
  type ItemFormContext,
  type ItemFormErrors,
  type ItemFormField,
  type ItemFormValues,
} from '@/lib/itemForm'
import { peekSessionSaver, rekeySessionSaver } from '@/lib/debouncedSaverRegistry'
import { guardedLinkTarget, keepEdits, takeEdits } from '@/lib/leaveGuard'
import { isJK, isSK } from '@/lib/schoolUtils'
import { useDebouncedSave } from '@/hooks/useDebouncedSave'
import { isApiError } from '@/services/apiClient'
import { createItem, updateItem } from '@/services/classworkService'
import type { ClassPageData } from '@/services/types/classroom'
import type { ClassworkData, ColumnOption, Item, ItemKind, ItemStatus, Topic } from '@/services/types/classwork'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import AssessmentFields from './AssessmentFields'
import AssignmentFields from './AssignmentFields'
import { useAttachmentRows } from './AttachmentsEditor'
import MaterialFields from './MaterialFields'
import QuizFields from './QuizFields'
import ScheduleMenu, { type ScheduleMenuItem } from './ScheduleMenu'
import { fieldId, type ItemFieldsProps } from './formParts'

interface ItemFormProps {
  classId: string
  kind: ItemKind
  page: ClassPageData
  classwork: ClassworkData
  /** The item being edited; null for a new one. */
  item: Item | null
  /** A new item's starting topic (Create from a topic filter). */
  defaultTopicId?: string | null
  /** Opened from Grades: Close and Save go back there. */
  from?: 'grades' | null
}

const AUTOSAVE_DELAY = 1000

/** The order a failed save looks for the first field to focus. */
const FIELD_ORDER: ItemFormField[] = [
  'title',
  'categoryId',
  'maxScore',
  'gradebook',
  'columnId',
  'date',
  'dueDate',
  'dueTime',
  'instructions',
  'studentIds',
  'topicId',
]

const messageOf = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

const timeText = (iso: string) => {
  const { time } = isoToTorontoParts(iso)
  const [h, m] = time.split(':').map(Number)
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

export default function ItemForm({ classId, kind, page, classwork, item, defaultTopicId = null, from = null }: ItemFormProps) {
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const userId = useUserStore((s) => s.user.id) ?? ''
  const cls = page.class
  const classLabel = classTitle(cls.grade, cls.subject)
  const kindergarten = isJK(cls.grade) || isSK(cls.grade)
  const kindWord = KIND_LABELS[kind].toLowerCase()

  // Whose and which form this is, for the session: the draft saver and the kept edits are found again by it.
  const [keys] = useState(() => {
    const id = item?.itemId ?? `new:${classId}:${kind}`
    return { saver: `item-form:${userId}:${id}`, edits: `item-edits:${userId}:${id}` }
  })
  // A draft (or a new item) autosaves; a posted or scheduled one saves with a button.
  const startsAutosaving =
    (kind === 'assignment' || kind === 'quiz') && (!item || (item.status === 'draft' && item.effectiveStatus !== 'posted'))
  // What comes back when the form opens again: a draft's change that failed (or was still saving) after the
  // teacher left, or a button-saved form's edits left by browser Back.
  const [restored] = useState(() =>
    startsAutosaving
      ? { draft: peekSessionSaver<ItemFormValues>(keys.saver), edits: null }
      : { draft: null, edits: takeEdits<ItemFormValues>(keys.edits) },
  )

  const [values, setValues] = useState<ItemFormValues>(
    () =>
      restored.draft ??
      restored.edits ??
      (item ? itemToFormValues(item) : emptyItemValues(kind, { categories: classwork.categories, topicId: defaultTopicId })),
  )
  const [topics, setTopics] = useState<Topic[]>(classwork.topics)
  const [itemId, setItemId] = useState<string | null>(item?.itemId ?? null)
  const [saved, setSaved] = useState<Item | null>(item)
  const [showErrors, setShowErrors] = useState(false)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState<string | null>(
    restored.edits ? "Your unsaved changes from before are back. Save them, or Cancel to drop them." : null,
  )
  // A refusal the grading view resolves (grades already on students' work): the banner links there
  // (or, for work not posted yet, which has no grading view, to its column in Grades).
  const [bannerLink, setBannerLink] = useState<{ href: string; label: string } | null>(null)
  const [topicModalOpen, setTopicModalOpen] = useState(false)
  const [discardOpen, setDiscardOpen] = useState(false)
  // Edits not saved yet on a form that saves with a button (Cancel, links and the tab ask first).
  const [edited, setEdited] = useState(restored.edits !== null)
  const [confirmLeave, setConfirmLeave] = useState(false)
  // Where "Discard changes" goes: back, or (a quiz) its questions, or the link that was clicked.
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null)

  const attachments = useAttachmentRows(item?.attachments ?? [], itemId)
  // A scheduled item whose time has come is live, even before the scheduler's next run.
  const status: ItemStatus | null = saved ? (saved.effectiveStatus === 'posted' ? 'posted' : saved.status) : null
  const autosaves = (kind === 'assignment' || kind === 'quiz') && (status === null || status === 'draft')

  // The column the item fills keeps its place when it counts on its own.
  const standalone = Boolean(item?.gradebook && item.gradebook.categoryId === null)
  const columns = useMemo<ColumnOption[]>(() => {
    const own: ColumnOption[] =
      item?.gradebook && item.kind !== 'assessment'
        ? [{ assessmentId: item.gradebook.assessmentId, name: item.title, categoryName: item.gradebook.categoryName, maxScore: item.gradebook.maxScore }]
        : []
    return [...own, ...classwork.linkableColumns.filter((c) => !own.some((o) => o.assessmentId === c.assessmentId))]
  }, [item, classwork.linkableColumns])

  const savedGradebook = saved?.gradebook ?? null
  const currentColumn = useMemo(
    () => (savedGradebook ? { categoryId: savedGradebook.categoryId, maxScore: savedGradebook.maxScore } : null),
    [savedGradebook],
  )
  const ctx = useMemo<ItemFormContext>(
    () => ({ categories: classwork.categories, linkableColumns: columns, topics, standaloneColumn: standalone, currentColumn }),
    [classwork.categories, columns, topics, standalone, currentColumn],
  )
  const errors = useMemo(() => validateItemForm(kind, values, ctx), [kind, values, ctx])
  const shownErrors: ItemFormErrors = showErrors ? errors : {}

  const backHref = from === 'grades' ? classHref(classId, 'grades') : classHref(classId, 'classwork')
  const doneHref = (result: Item) =>
    from === 'grades' && result.gradebook ? classHref(classId, 'grades', { focus: result.gradebook.assessmentId }) : backHref

  // ── Autosave (assignment and quiz drafts) ─────────────────────────────────
  // Refs, so a save that finishes after the form has gone still knows the item (the session saver outlives it).
  const valuesRef = useRef(values)
  const ctxRef = useRef(ctx)
  const autosavesRef = useRef(autosaves)
  const attachmentsRef = useRef(attachments)
  const itemIdRef = useRef(itemId)
  const savedRef = useRef(saved)
  const savingRef = useRef(false)
  // A change typed while Assign, Post or Save was running (sent if that save fails).
  const heldRef = useRef(false)
  const editedRef = useRef(edited)
  // Set when the teacher leaves on purpose (a save went through, or they chose to discard).
  const leavingRef = useRef(false)
  const mountedRef = useRef(false)
  useEffect(() => {
    valuesRef.current = values
    ctxRef.current = ctx
    autosavesRef.current = autosaves
    attachmentsRef.current = attachments
    editedRef.current = edited
  })
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  /** The edit page's URL, once a new item exists, so a refresh reopens it instead of starting again. */
  const adoptUrl = useCallback(
    (id: string) => {
      const url = `${classItemHref(classId, id, 'edit')}${from ? `?from=${from}` : ''}`
      window.history.replaceState(window.history.state, '', url)
    },
    [classId, from],
  )

  /** A save came back. A first save made the item: its saver moves to the item's key, and the address follows. */
  const created = (result: Item, wasNew: boolean) => {
    itemIdRef.current = result.itemId
    savedRef.current = result
    if (wasNew) rekeySessionSaver(keys.saver, `item-form:${userId}:${result.itemId}`)
    // The form may be gone (the save finished after the teacher left): never touch another page's address.
    if (!mountedRef.current) return
    setItemId(result.itemId)
    setSaved(result)
    if (wasNew) adoptUrl(result.itemId)
  }

  /** One draft save: creates the item the first time, then PATCHes it. Never changes the status. */
  const saveDraft = async (value: ItemFormValues, opts: { keepalive?: boolean }, retried = false): Promise<void> => {
    const input = draftItemInput(kind, value, ctxRef.current)
    if (!input) return // nothing to save without a title
    const id = itemIdRef.current
    // An autosave never changes the status: only Assign, Schedule and Save draft do.
    if (id) delete input.status
    try {
      const res = id ? await updateItem(id, input, opts) : await createItem(classId, input)
      created(res.data, !id)
      if (!id && mountedRef.current) {
        const failed = await attachmentsRef.current.flush(res.data.itemId)
        if (failed > 0) setBanner(`${failed === 1 ? 'An attachment' : `${failed} attachments`} didn't upload. Retry below.`)
      }
    } catch (err) {
      // A browser refusing a keepalive request: the saver sends it again as a plain one.
      if (opts.keepalive && err instanceof TypeError) throw err
      const failure = autosaveFailure(isApiError(err) ? err : { message: messageOf(err, '') }, value, savedRef.current)
      if (failure.values && !retried) {
        // The server refused the gradebook change: it goes back to the column as saved, the teacher is told
        // why, and everything else saves again.
        const reverted = withSavedGradebook(valuesRef.current, savedRef.current)
        valuesRef.current = reverted
        if (mountedRef.current) {
          setValues(reverted)
          setBanner(`${failure.message} The gradebook setting is back to what was saved; your other changes keep saving.`)
        }
        return saveDraft(withSavedGradebook(value, savedRef.current), opts, true)
      }
      throw new Error(failure.message)
    }
  }

  const draft = useDebouncedSave<ItemFormValues>({
    key: keys.saver,
    delayMs: AUTOSAVE_DELAY,
    save: (value, opts) => saveDraft(value, opts),
    failedAway: (failed) => {
      const title = failed?.title.trim() || savedRef.current?.title || `Untitled ${kindWord}`
      return itemIdRef.current
        ? `Your last changes to "${title}" didn't save. Open it again to retry.`
        : `Your new ${kindWord} "${title}" didn't save. Start a new ${kindWord} in this class to get it back.`
    },
  })
  const { schedule: scheduleDraft, flush: flushDraft, discard: discardDraftFailure, cancel: cancelDraft, hasFailures } = draft

  // A form that no longer autosaves (the item was posted meanwhile) has nothing to retry.
  useEffect(() => {
    if (!startsAutosaving) discardDraftFailure()
  }, [startsAutosaving, discardDraftFailure])

  const set = useCallback(
    (patch: Partial<ItemFormValues>) => {
      const next = { ...valuesRef.current, ...patch }
      valuesRef.current = next
      setValues(next)
      if (!autosavesRef.current) {
        editedRef.current = true
        setEdited(true)
        return
      }
      // While Assign or Post is saving, a change waits; it is sent if that save fails.
      if (savingRef.current) {
        heldRef.current = true
        return
      }
      scheduleDraft(next)
    },
    [scheduleDraft],
  )

  /** Leaving a field saves what was typed in it straight away. */
  const onFieldBlur = () => {
    if (autosavesRef.current && !savingRef.current) void flushDraft()
  }

  // ── Leaving a form that saves with a button ───────────────────────────────
  const guardLeave = !autosaves && (edited || attachments.pendingCount > 0)
  useEffect(() => {
    if (!guardLeave) return
    // Any in-app link (the form's own Close and Cancel ask already): ask first.
    const onClick = (e: globalThis.MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest('a[href]') : null
      if (!(a instanceof HTMLAnchorElement)) return
      const to = guardedLinkTarget(
        {
          href: a.href,
          target: a.getAttribute('target'),
          download: a.hasAttribute('download'),
          button: e.button,
          metaKey: e.metaKey,
          ctrlKey: e.ctrlKey,
          shiftKey: e.shiftKey,
          altKey: e.altKey,
          handled: a.dataset.leaveHandled === 'true',
        },
        window.location,
      )
      if (!to) return
      e.preventDefault()
      e.stopPropagation()
      setLeaveTarget(to)
      setConfirmLeave(true)
    }
    // Closing or reloading the tab: the browser asks.
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    // On window, in the capture phase: before Next's own link handling sees the click.
    window.addEventListener('click', onClick, true)
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => {
      window.removeEventListener('click', onClick, true)
      window.removeEventListener('beforeunload', onBeforeUnload)
    }
  }, [guardLeave])

  // A way out nothing could stop (browser Back): the edits are kept for the session, and said so.
  useEffect(
    () => () => {
      if (autosavesRef.current || leavingRef.current || !editedRef.current) return
      keepEdits(keys.edits, valuesRef.current)
      const title = valuesRef.current.title.trim() || `this ${kindWord}`
      showNotification(`Your changes to "${title}" aren't saved yet. Open it again to save them.`, 'error', 8000)
    },
    // Runs once, on the way out; everything it reads is a ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  /** Leaves on purpose (after a save, or a confirmed discard): nothing is kept or asked. */
  const leaveTo = (href: string) => {
    leavingRef.current = true
    editedRef.current = false
    router.push(href)
  }

  // ── Explicit actions ──────────────────────────────────────────────────────
  const focusFirst = (errs: ItemFormErrors) => {
    const first = FIELD_ORDER.find((f) => errs[f]) ?? (Object.keys(errs)[0] as ItemFormField | undefined)
    if (!first) return
    const el = document.getElementById(fieldId(first))
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    el?.focus({ preventScroll: true })
  }

  /** Files still being resized aren't rows yet: a save waits for them. */
  const stillPreparing = () => {
    if (attachments.preparing === 0) return false
    showNotification('A file is still getting ready (pictures are resized first). Try again in a moment.', 'info')
    return true
  }

  const commit = async (intent: { status?: ItemStatus; publishAt?: string | null; message: (result: Item) => string }) => {
    if (saving || stillPreparing()) return
    const current = valuesRef.current
    const errs = validateItemForm(kind, current, { ...ctx, status: intent.status, publishAt: intent.publishAt })
    if (hasErrors(errs)) {
      setShowErrors(true)
      if (errs.publishAt) showNotification(errs.publishAt, 'error')
      focusFirst(errs)
      return
    }
    setSaving(true)
    setBanner(null)
    setBannerLink(null)
    // An autosave in flight may be creating the item: let it land (with anything waiting) first, and hold any
    // new one until this save is done, so two saves never race.
    await flushDraft()
    savingRef.current = true
    heldRef.current = false
    const input = toItemInput(kind, valuesRef.current, {
      status: intent.status,
      publishAt: intent.publishAt,
      standaloneColumn: standalone,
      currentColumn,
    })
    const finishFailed = () => {
      savingRef.current = false
      setSaving(false)
      // A change typed while this save was running is sent now.
      if (autosavesRef.current && heldRef.current) scheduleDraft(valuesRef.current)
      heldRef.current = false
    }
    try {
      const id = itemIdRef.current
      const res = id ? await updateItem(id, input) : await createItem(classId, input)
      created(res.data, !id)
      // This save carried everything: an older draft save that failed has nothing left to send.
      discardDraftFailure()
      // Posted or scheduled: nothing autosaves any more (not even on the way out).
      if (res.data.status !== 'draft') autosavesRef.current = false
      const failed = await attachments.flush(res.data.itemId)
      if (failed > 0) {
        setBanner(
          `The ${kindWord} saved, but ${failed === 1 ? 'an attachment' : `${failed} attachments`} didn't upload. Retry below, or close and add them later.`,
        )
        editedRef.current = false
        setEdited(false)
        finishFailed()
        return
      }
      editedRef.current = false
      setEdited(false)
      showNotification(intent.message(res.data), 'success')
      leaveTo(doneHref(res.data))
    } catch (err) {
      const message = messageOf(err, `The ${kindWord} couldn't be saved.`)
      setBanner(message)
      const id = itemIdRef.current
      const gradable = kind === 'assignment' || kind === 'quiz'
      const column = savedRef.current?.gradebook?.assessmentId ?? null
      const resolvable = isApiError(err) && Boolean(err.code) && GRADING_VIEW_CODES.includes(err.code as string) && Boolean(id) && gradable
      setBannerLink(
        !resolvable
          ? null
          : savedRef.current?.effectiveStatus === 'posted'
            ? { href: classItemHref(classId, id as string), label: 'Open the grading view' }
            : column
              ? { href: classHref(classId, 'grades', { focus: column }), label: 'Open its column in Grades' }
              : null,
      )
      showNotification(message, 'error')
      finishFailed()
    }
  }

  const post = () =>
    commit({ status: 'posted', message: () => (kind === 'assessment' ? 'Assessment saved' : `${KIND_LABELS[kind]} posted`) })
  const schedule = (publishAt: string) =>
    commit({ status: 'scheduled', publishAt, message: () => `Scheduled for ${dayLabel(publishAt)} at ${timeText(publishAt)}` })
  const saveChanges = () => commit({ message: () => 'Changes saved' })
  const saveAsDraft = () => commit({ status: 'draft', message: () => 'Draft saved' })

  /** Close, Save draft: an autosaving draft sends what is waiting first. */
  const leave = async () => {
    if (autosaves) {
      if (stillPreparing()) return
      await flushDraft()
      if (hasFailures()) {
        showNotification("Your last changes didn't save. Retry, or discard the draft.", 'error')
        return
      }
      // A file picked while the draft was first being created is still waiting.
      const id = itemIdRef.current
      if (id && attachmentsRef.current.pendingCount > 0 && (await attachmentsRef.current.flush(id)) > 0) {
        setBanner("An attachment didn't upload. Retry below, or remove it and close again.")
        return
      }
      if (id) showNotification('Draft saved', 'success')
    }
    leaveTo(backHref)
  }

  /** A quiz's "Next: questions": save it (creating it the first time), then open its builder. */
  const goToQuestions = async () => {
    if (!autosaves) {
      const id = itemIdRef.current
      if (!id) return
      const target = classItemHref(classId, id, 'quiz')
      if (edited || attachments.pendingCount > 0) {
        setLeaveTarget(target)
        setConfirmLeave(true)
        return
      }
      leaveTo(target)
      return
    }
    if (stillPreparing()) return
    const errs = validateItemForm(kind, valuesRef.current, ctx)
    if (errs.title) {
      setShowErrors(true)
      focusFirst({ title: errs.title })
      return
    }
    // The quiz is created by its first save, even if nothing changed since the title was typed.
    if (!itemIdRef.current) scheduleDraft(valuesRef.current)
    await flushDraft()
    if (hasFailures()) {
      showNotification("The quiz didn't save. Retry, then open the questions.", 'error')
      return
    }
    const id = itemIdRef.current
    if (!id) return
    if (attachmentsRef.current.pendingCount > 0 && (await attachmentsRef.current.flush(id)) > 0) {
      setBanner("An attachment didn't upload. Retry below, or remove it, then open the questions.")
      return
    }
    leaveTo(classItemHref(classId, id, 'quiz'))
  }

  const discard = async () => {
    // What waits is dropped; a first save already on its way may still create the draft, so wait for it.
    cancelDraft()
    await flushDraft()
    if (itemIdRef.current) setDiscardOpen(true)
    else leaveTo(backHref)
  }

  // ── Header actions by state ───────────────────────────────────────────────
  let actions: ReactNode
  /** Close and Cancel: a draft sends what is waiting; a form with unsaved edits asks first. */
  const onLeaveClick = (e: MouseEvent) => {
    if (autosaves) {
      e.preventDefault()
      void leave()
    } else if (edited || attachments.pendingCount > 0) {
      e.preventDefault()
      setConfirmLeave(true)
    }
  }
  const cancel = (
    <Link
      href={backHref}
      onClick={onLeaveClick}
      data-leave-handled="true"
      className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
    >
      Cancel
    </Link>
  )
  if (status === null && kind === 'assessment') {
    actions = (
      <>
        {cancel}
        <ScheduleMenu primaryLabel="Save" onPrimary={() => void post()} busy={saving} />
      </>
    )
  } else if (kind === 'quiz' && (status === null || status === 'draft')) {
    // The builder posts a quiz (it needs its questions first): here it is saved and the questions come next.
    const canDiscard = autosaves || status === 'draft'
    actions = (
      <>
        {!autosaves && cancel}
        <ScheduleMenu
          primaryLabel="Next: questions"
          onPrimary={() => void goToQuestions()}
          items={[
            { key: 'draft', label: 'Save draft', onSelect: () => void (autosaves ? leave() : saveAsDraft()) },
            ...(canDiscard ? [{ key: 'discard', label: 'Discard draft', tone: 'danger' as const, onSelect: () => void discard() }] : []),
          ]}
          busy={saving}
        />
      </>
    )
  } else if (status === null || status === 'draft') {
    const canDiscard = autosaves || status === 'draft'
    const items: ScheduleMenuItem[] = [
      { key: 'draft', label: 'Save draft', onSelect: () => void (autosaves ? leave() : saveAsDraft()) },
      ...(canDiscard ? [{ key: 'discard', label: 'Discard draft', tone: 'danger' as const, onSelect: () => void discard() }] : []),
    ]
    actions = (
      <>
        {!autosaves && cancel}
        <ScheduleMenu
          primaryLabel={kind === 'assignment' || kind === 'quiz' ? 'Assign' : 'Post'}
          onPrimary={() => void post()}
          onSchedule={(at) => void schedule(at)}
          items={items}
          busy={saving}
        />
      </>
    )
  } else if (status === 'scheduled') {
    actions = (
      <>
        {cancel}
        <ScheduleMenu
          primaryLabel="Save"
          onPrimary={() => void saveChanges()}
          scheduleLabel="Change schedule…"
          initialSchedule={saved?.publishAt}
          onSchedule={(at) => void schedule(at)}
          items={[
            { key: 'post', label: 'Post now', onSelect: () => void post() },
            { key: 'draft', label: 'Save as draft', onSelect: () => void saveAsDraft() },
          ]}
          busy={saving}
        />
      </>
    )
  } else {
    actions = (
      <>
        {cancel}
        <ScheduleMenu primaryLabel="Save" onPrimary={() => void saveChanges()} busy={saving} />
      </>
    )
  }

  const autosaveText = !autosaves ? null : draft.status === 'saving' ? (
    <span className="text-[13px] text-slate-500">Saving…</span>
  ) : draft.status === 'error' ? (
    <span className="flex items-center gap-1.5 text-[13px] text-rose-700">
      Couldn&apos;t save
      <button type="button" onClick={() => void draft.retry()} className="cursor-pointer font-medium underline">
        Retry
      </button>
    </span>
  ) : itemId ? (
    <span className="text-[13px] text-slate-500">Draft saved</span>
  ) : null

  const heading = `${item ? 'Edit' : 'New'} ${kindWord}`
  const subline = kind === 'assessment' ? `${classLabel} · graded by you, nothing to turn in online` : classLabel
  const scheduledLine =
    status === 'scheduled' && saved?.publishAt ? `Posts ${dayLabel(saved.publishAt)} at ${timeText(saved.publishAt)}` : null

  const fieldsProps: ItemFieldsProps = {
    classId,
    subject: cls.subject,
    studentCount: cls.studentCount,
    values,
    set,
    errors: shownErrors,
    topics,
    categories: classwork.categories,
    columns,
    standalone,
    standaloneMax: item?.gradebook?.maxScore ?? null,
    currentCategoryId: saved?.gradebook?.categoryId ?? null,
    kindergarten,
    attachments,
    onNewTopic: () => setTopicModalOpen(true),
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-20 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-3.5">
          <Link
            href={backHref}
            aria-label="Close"
            onClick={onLeaveClick}
            data-leave-handled="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
          >
            <XMarkIcon className="h-5 w-5" strokeWidth={2} />
          </Link>
          <KindTile kind={kind} shape="square" size={36} />
          <div className="flex min-w-0 flex-col">
            <h1 className="truncate text-lg font-semibold text-slate-900">{heading}</h1>
            <span className="truncate text-[13px] text-slate-500">{scheduledLine ? `${subline} · ${scheduledLine}` : subline}</span>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {autosaveText}
          {actions}
        </div>
      </header>

      <main onBlur={onFieldBlur} className="mx-auto flex w-full max-w-[1320px] flex-1 flex-wrap items-start gap-6 px-4 pb-12 pt-7 sm:px-8">
        {banner && (
          <div role="alert" className="flex basis-full items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-500" aria-hidden="true" />
            <p className="flex-1">
              {banner}
              {bannerLink && (
                <>
                  {' '}
                  {/* A new tab, so this form (and what is typed in it) stays open. */}
                  <Link
                    href={bannerLink.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-rose-900 underline underline-offset-2"
                  >
                    {bannerLink.label}
                  </Link>
                </>
              )}
            </p>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => {
                setBanner(null)
                setBannerLink(null)
              }}
              className="cursor-pointer text-rose-700 hover:text-rose-900"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
        {autosaves && draft.status === 'error' && draft.error && (
          <div role="alert" className="flex basis-full flex-wrap items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            <ExclamationTriangleIcon className="h-5 w-5 shrink-0 text-rose-500" aria-hidden="true" />
            <p className="flex-1">Your last changes didn&apos;t save: {draft.error}</p>
            <button
              type="button"
              onClick={() => void draft.retry()}
              className="cursor-pointer rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[13px] font-medium text-rose-800 hover:bg-rose-100"
            >
              Retry
            </button>
          </div>
        )}
        {kind === 'assessment' ? (
          <AssessmentFields {...fieldsProps} />
        ) : kind === 'material' ? (
          <MaterialFields {...fieldsProps} />
        ) : kind === 'quiz' ? (
          <QuizFields {...fieldsProps} itemId={itemId} onOpenQuestions={() => void goToQuestions()} />
        ) : (
          <AssignmentFields {...fieldsProps} kind={kind} />
        )}
      </main>

      <TopicFormModal
        isOpen={topicModalOpen}
        classId={classId}
        topic={null}
        onClose={() => setTopicModalOpen(false)}
        onSaved={(topic) => {
          setTopicModalOpen(false)
          setTopics((list) => [...list, topic])
          set({ topicId: topic.topicId })
        }}
      />
      <Modal
        isOpen={confirmLeave}
        onClose={() => {
          setConfirmLeave(false)
          setLeaveTarget(null)
        }}
        size="md"
      >
        <ModalHeader title="Discard changes?" subtitle={values.title.trim() || undefined} icon={ExclamationTriangleIcon} tone="warning" />
        <ModalBody>
          <ConfirmBody tone="warning">
            {itemId
              ? `Your changes to this ${kindWord} haven't been saved. Attachments you added, renamed, replaced or removed are already saved and stay that way.`
              : `This ${kindWord} hasn't been saved yet, so nothing in it will be kept.`}
          </ConfirmBody>
        </ModalBody>
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              setConfirmLeave(false)
              setLeaveTarget(null)
            }}
          >
            Keep editing
          </Button>
          <Button
            type="button"
            variant="warning"
            onClick={() => {
              setConfirmLeave(false)
              leaveTo(leaveTarget ?? backHref)
            }}
          >
            Discard changes
          </Button>
        </ModalFooter>
      </Modal>
      <DeleteItemModal
        item={discardOpen ? saved : null}
        draft={status === 'draft'}
        onClose={() => setDiscardOpen(false)}
        onDeleted={() => {
          setDiscardOpen(false)
          // The draft is gone: nothing of it is kept or retried.
          cancelDraft()
          leaveTo(backHref)
        }}
      />
    </div>
  )
}
