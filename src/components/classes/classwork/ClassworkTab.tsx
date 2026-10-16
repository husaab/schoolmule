// src/components/classes/classwork/ClassworkTab.tsx
// The class's classwork (the Teacher-Classwork board): Create (assessment,
// assignment, material, announcement, topic, copy from another class), the
// topic and type filters (?topic=, ?kind=), then one section per topic with
// its items. Topics are renamed, moved and deleted from their ⋮; items are
// edited, opened and deleted from theirs. The list reloads when the tab comes
// back into view, so turned-in counts stay current. A past year's class is
// read-only.
'use client'

import { useEffect, useMemo, useState, type FC } from 'react'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import TabEmptyState from '@/components/classes/page/TabEmptyState'
import type { ClassTabProps } from '@/components/classes/page/tabs'
import { useFilterParams } from '@/hooks/useFilterParams'
import { useLoad } from '@/hooks/useLoad'
import { groupClasswork, moveTopicOrder, parseKindFilter, parseTopicFilter } from '@/lib/classworkRows'
import { getClasswork, reorderTopics } from '@/services/classworkService'
import type { ClassworkData, ItemSummary, Topic } from '@/services/types/classwork'
import { useNotificationStore } from '@/store/useNotificationStore'
import ClassworkFilters from './ClassworkFilters'
import CopyFromClassModal from './CopyFromClassModal'
import CreateMenu from './CreateMenu'
import DeleteItemModal from './DeleteItemModal'
import DeleteTopicModal from './DeleteTopicModal'
import TopicFormModal from './TopicFormModal'
import TopicSection from './TopicSection'

const ClassworkTab: FC<ClassTabProps> = ({ classId, data }) => {
  const filters = useFilterParams({ remember: false })
  const { setParams } = filters
  const showNotification = useNotificationStore((s) => s.showNotification)
  const canEdit = data.permissions.canEdit

  const { data: classwork, error, loading, reload, patch } = useLoad<ClassworkData>(classId, () =>
    getClasswork(classId).then((res) => res.data),
  )

  const [topicForm, setTopicForm] = useState<{ topic: Topic | null } | null>(null)
  const [deletingTopic, setDeletingTopic] = useState<Topic | null>(null)
  const [deletingItem, setDeletingItem] = useState<ItemSummary | null>(null)
  const [copyOpen, setCopyOpen] = useState(false)
  const [movingTopicId, setMovingTopicId] = useState<string | null>(null)

  // Students turn work in while the teacher is elsewhere: refresh on coming back.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload])

  const topics = useMemo(() => classwork?.topics ?? [], [classwork])
  const topicFilter = parseTopicFilter(filters.get('topic'), topics)
  const kindFilter = parseKindFilter(filters.get('kind'))
  const sections = useMemo(
    () => (classwork ? groupClasswork(classwork.topics, classwork.items, { topic: topicFilter, kind: kindFilter }) : []),
    [classwork, topicFilter, kindFilter],
  )
  const topicOrder = useMemo(() => [...topics].sort((a, b) => a.sortOrder - b.sortOrder).map((t) => t.topicId), [topics])

  const moveTopic = async (topic: Topic, direction: -1 | 1) => {
    const order = moveTopicOrder(topics, topic.topicId, direction)
    if (!order) return
    setMovingTopicId(topic.topicId)
    try {
      const res = await reorderTopics(classId, order)
      patch((d) => ({ ...d, topics: res.data }))
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "The topic couldn't be moved.", 'error')
    } finally {
      setMovingTopicId(null)
    }
  }

  if (loading && !classwork) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-11 w-32 animate-pulse rounded-xl bg-slate-100" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-[68px] animate-pulse rounded-[14px] bg-slate-100" />
        ))}
      </div>
    )
  }

  if (!classwork) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-sm">
        <p className="mb-4 text-slate-600">{error?.message || "The classwork couldn't be loaded."}</p>
        <button
          type="button"
          onClick={reload}
          className="cursor-pointer rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-200"
        >
          Try again
        </button>
      </div>
    )
  }

  const nothingYet = classwork.items.length === 0 && classwork.topics.length === 0
  const hasQuizzes = classwork.items.some((i) => i.kind === 'quiz')

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {canEdit ? (
          <CreateMenu
            classId={classId}
            topicId={topicFilter && topicFilter !== 'none' ? topicFilter : null}
            onNewTopic={() => setTopicForm({ topic: null })}
            onCopy={() => setCopyOpen(true)}
          />
        ) : (
          <p className="rounded-2xl border border-slate-200/70 bg-white px-5 py-3 text-sm text-slate-500">
            This class is from a past school year, so it is read-only.
          </p>
        )}
        {!nothingYet && (
          <ClassworkFilters
            topics={topics}
            topic={topicFilter}
            kind={kindFilter}
            hasQuizzes={hasQuizzes}
            onChange={(change) => setParams(change)}
          />
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          The classwork couldn&apos;t be refreshed, so this may be out of date.{' '}
          <button type="button" onClick={reload} className="cursor-pointer font-medium underline">
            Try again
          </button>
        </p>
      )}

      {nothingYet ? (
        <TabEmptyState icon={ClipboardDocumentListIcon}>
          No classwork yet. {canEdit ? 'Use Create to add an assessment, an assignment or something to read.' : ''}
        </TabEmptyState>
      ) : sections.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200/70 bg-white px-6 py-10 text-center">
          <p className="text-[15px] text-slate-600">Nothing matches these filters.</p>
          <button
            type="button"
            onClick={() => setParams({ topic: null, kind: null })}
            className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Clear filters
          </button>
        </div>
      ) : (
        sections.map((section) => (
          <TopicSection
            key={section.key}
            section={section}
            showHeading={classwork.topics.length > 0}
            studentCount={data.class.studentCount}
            canEdit={canEdit}
            isFirst={topicOrder[0] === section.topic?.topicId}
            isLast={topicOrder[topicOrder.length - 1] === section.topic?.topicId}
            busy={movingTopicId === section.topic?.topicId}
            onRename={(topic) => setTopicForm({ topic })}
            onMove={(topic, direction) => void moveTopic(topic, direction)}
            onDelete={setDeletingTopic}
            onDeleteItem={setDeletingItem}
          />
        ))
      )}

      <TopicFormModal
        isOpen={topicForm !== null}
        classId={classId}
        topic={topicForm?.topic ?? null}
        onClose={() => setTopicForm(null)}
        onSaved={(topic) => {
          setTopicForm(null)
          patch((d) => ({
            ...d,
            topics: d.topics.some((t) => t.topicId === topic.topicId)
              ? d.topics.map((t) => (t.topicId === topic.topicId ? topic : t))
              : [...d.topics, topic],
          }))
        }}
      />
      <DeleteTopicModal
        topic={deletingTopic}
        onClose={() => setDeletingTopic(null)}
        onDeleted={(topicId) => {
          setDeletingTopic(null)
          if (topicFilter === topicId) setParams({ topic: null })
          patch((d) => ({
            ...d,
            topics: d.topics.filter((t) => t.topicId !== topicId),
            items: d.items.map((i) => (i.topicId === topicId ? { ...i, topicId: null } : i)),
          }))
        }}
      />
      <DeleteItemModal
        item={deletingItem}
        draft={deletingItem?.status === 'draft'}
        onClose={() => setDeletingItem(null)}
        onDeleted={(itemId) => {
          setDeletingItem(null)
          patch((d) => ({ ...d, items: d.items.filter((i) => i.itemId !== itemId) }))
          reload()
        }}
      />
      <CopyFromClassModal isOpen={copyOpen} classId={classId} onClose={() => setCopyOpen(false)} onCopied={() => reload()} />
    </div>
  )
}

export default ClassworkTab
