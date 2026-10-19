// src/components/classes/items/AssignmentFields.tsx
// The assignment form (the Teacher-Assign board): title, instructions,
// attachments and how students turn it in; then who it is for, when it is
// due (Toronto), its topic, how it counts in the gradebook and the emails. A
// quiz has its own form (QuizFields), its questions the quiz builder.
'use client'

import type { ItemKind } from '@/services/types/classwork'
import { TITLE_MAX } from '@/lib/itemForm'
import AttachmentsEditor from './AttachmentsEditor'
import AudienceField from './AudienceField'
import EmailOptionsField from './EmailOptionsField'
import GradebookLinkField from './GradebookLinkField'
import TurnInModeField from './TurnInModeField'
import { FIELD_INPUT, FormCard, LabeledField, TopicField, fieldId, type ItemFieldsProps } from './formParts'

/** A due date picked with no time yet is due at the end of that day. */
const END_OF_DAY = '23:59'

export default function AssignmentFields(props: ItemFieldsProps & { kind: Extract<ItemKind, 'assignment' | 'quiz'> }) {
  const { kind, classId, studentCount, values, set, errors, topics, categories, columns, standalone, kindergarten } = props

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
              placeholder={kind === 'quiz' ? 'e.g. Cells quiz' : 'e.g. Plant cell diagram'}
              className={`${FIELD_INPUT} !py-3 !text-[17px]`}
            />
          </LabeledField>
          <LabeledField label="Instructions" name="instructions" optional error={errors.instructions}>
            <textarea
              id={fieldId('instructions')}
              rows={6}
              value={values.instructions}
              onChange={(e) => set({ instructions: e.target.value })}
              className={`${FIELD_INPUT} resize-y leading-relaxed`}
            />
          </LabeledField>
          <AttachmentsEditor state={props.attachments} />
        </FormCard>

        {kind === 'assignment' && (
          <TurnInModeField value={values.submissionMode} onChange={(submissionMode) => set({ submissionMode })} />
        )}
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
        />

        <EmailOptionsField variant="turnin" values={values} set={set} studentCount={studentCount} />
      </aside>
    </>
  )
}
