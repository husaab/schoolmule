// src/components/classes/items/QuizFields.tsx
// The quiz form (its details; the questions are the quiz builder's): title,
// instructions and attachments, then who it is for, when it is due
// (Toronto), its topic, how it counts in the gradebook (out of the quiz's
// points, so there is no "Out of" to type) and the emails. The card under the
// instructions says where the questions are: for a new quiz they come next
// (the form's "Next: questions"), for a saved one there is a link.
'use client'

import Link from 'next/link'
import { ArrowRightIcon, ListBulletIcon } from '@heroicons/react/24/outline'
import { TITLE_MAX } from '@/lib/itemForm'
import { classItemHref } from '@/lib/classroomRoutes'
import AttachmentsEditor from './AttachmentsEditor'
import AudienceField from './AudienceField'
import EmailOptionsField from './EmailOptionsField'
import GradebookLinkField from './GradebookLinkField'
import { CardTitle, FIELD_INPUT, FormCard, LabeledField, TopicField, fieldId, type ItemFieldsProps } from './formParts'

/** A due date picked with no time yet is due at the end of that day. */
const END_OF_DAY = '23:59'

export default function QuizFields(props: ItemFieldsProps & { itemId: string | null; onOpenQuestions?: () => void }) {
  const { classId, itemId, studentCount, values, set, errors, topics, categories, columns, standalone, kindergarten } = props

  return (
    <>
      <section className="flex min-w-0 flex-[999_1_560px] flex-col gap-5">
        <FormCard className="!gap-[18px]">
          <LabeledField label="Title" name="title" error={errors.title}>
            <input
              id={fieldId('title')}
              value={values.title}
              maxLength={TITLE_MAX}
              aria-invalid={errors.title ? true : undefined}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="e.g. Cells quiz"
              className={`${FIELD_INPUT} !py-3 !text-[17px]`}
            />
          </LabeledField>
          <LabeledField label="Instructions" name="instructions" optional error={errors.instructions}>
            <textarea
              id={fieldId('instructions')}
              rows={4}
              value={values.instructions}
              onChange={(e) => set({ instructions: e.target.value })}
              className={`${FIELD_INPUT} resize-y leading-relaxed`}
            />
          </LabeledField>
          <AttachmentsEditor state={props.attachments} />
        </FormCard>

        <FormCard>
          <CardTitle>Questions</CardTitle>
          {itemId ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-600">Questions, answers and points are in the quiz builder.</p>
              <Link
                href={classItemHref(classId, itemId, 'quiz')}
                onClick={(e) => {
                  if (!props.onOpenQuestions || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
                  e.preventDefault()
                  props.onOpenQuestions()
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-cyan-700 hover:bg-cyan-50"
              >
                <ListBulletIcon className="h-4 w-4" aria-hidden="true" />
                Open the questions
              </Link>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
              Give it a title, then press Next: questions to write the questions and answers.
            </p>
          )}
        </FormCard>
      </section>

      <aside className="flex flex-[1_1_340px] flex-col gap-4">
        <FormCard className="sm:!p-5">
          <AudienceField
            classId={classId}
            studentCount={studentCount}
            audience={values.audience}
            studentIds={values.studentIds}
            onChange={(patch) => set(patch)}
            error={errors.studentIds}
          />
          <div className="grid grid-cols-2 gap-3">
            <LabeledField label="Due" name="dueDate" error={errors.dueDate}>
              <input
                id={fieldId('dueDate')}
                type="date"
                value={values.dueDate}
                aria-invalid={errors.dueDate ? true : undefined}
                onChange={(e) => {
                  const dueDate = e.target.value
                  set(dueDate && !values.dueTime ? { dueDate, dueTime: END_OF_DAY } : { dueDate })
                }}
                className={FIELD_INPUT}
              />
            </LabeledField>
            <LabeledField label="Time" name="dueTime" error={errors.dueTime}>
              <input
                id={fieldId('dueTime')}
                type="time"
                value={values.dueTime}
                aria-invalid={errors.dueTime ? true : undefined}
                onChange={(e) => set({ dueTime: e.target.value })}
                className={FIELD_INPUT}
              />
            </LabeledField>
          </div>
          {values.dueDate || values.dueTime ? (
            <p className="-mt-2 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
              Toronto time
              <button
                type="button"
                onClick={() => set({ dueDate: '', dueTime: '' })}
                className="cursor-pointer font-medium text-cyan-700 hover:text-cyan-800"
              >
                No due date
              </button>
            </p>
          ) : (
            <p className="-mt-2 text-xs text-slate-500">No due date</p>
          )}
          <TopicField
            topics={topics}
            value={values.topicId}
            onChange={(topicId) => set({ topicId })}
            onNewTopic={props.onNewTopic}
            error={errors.topicId}
          />
        </FormCard>

        <GradebookLinkField
          classId={classId}
          values={values}
          set={set}
          errors={errors}
          categories={categories}
          columns={columns}
          standalone={standalone}
          currentCategoryId={props.currentCategoryId}
          kindergarten={kindergarten}
          outOfNote="Out of: the quiz's points. It follows the questions as you write them."
        />

        <EmailOptionsField variant="turnin" values={values} set={set} studentCount={studentCount} />
      </aside>
    </>
  )
}
