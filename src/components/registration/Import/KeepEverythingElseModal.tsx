'use client';

import { useState } from 'react';
import { ArchiveBoxArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Modal from '@/components/shared/modal';
import { Button, ModalBody, ModalFooter, ModalHeader, inputClass } from '@/components/shared/modalKit';
import { FieldTypeTag } from '@/components/student/customFields/FieldTypeTag';
import { CUSTOM_FIELD_LIMITS, fieldDraftError } from '@/lib/studentCustomFields';
import type { KeepPlanRow } from '@/lib/importMapping';

interface Props {
  isOpen: boolean;
  /** Every question that isn't imported yet, as the custom field it would be saved into. */
  plan: KeepPlanRow[];
  /** Names that are already taken: the school's fields and the new ones already in the mapping. */
  takenNames: string[];
  onClose: () => void;
  onConfirm: (plan: KeepPlanRow[]) => void;
}

/**
 * "Keep everything else": what each remaining question would be saved as,
 * shown before anything changes. The admin renames a field or drops a question
 * they don't want on student records (a consent tick box, "how did you hear
 * about us"), then confirms. Nothing is saved here: the choices go into the
 * mapping, which is still saved with its own button.
 */
export default function KeepEverythingElseModal({ isOpen, ...rest }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={rest.onClose} style="w-full max-w-2xl">
      {/* Mounted with each opening, so it always starts from the current plan. */}
      {isOpen && <KeepReview {...rest} />}
    </Modal>
  );
}

function KeepReview({ plan, takenNames, onClose, onConfirm }: Omit<Props, 'isOpen'>) {
  const [rows, setRows] = useState<KeepPlanRow[]>(plan);

  const rename = (questionId: string, label: string) =>
    setRows((prev) => prev.map((row) => (row.question.fieldId === questionId ? { ...row, draft: { ...row.draft, label } } : row)));

  // A new field's name must be its own: not one the school has, and not another row's.
  const problemFor = (row: KeepPlanRow): string | null => {
    if (row.existing) return null;
    const others = rows
      .filter((r) => r !== row)
      .map((r) => (r.existing ? r.existing.label : r.draft.label));
    return fieldDraftError(row.draft, [...takenNames, ...others]);
  };

  const blocked = rows.some((row) => problemFor(row) !== null);
  const newCount = rows.filter((row) => !row.existing).length;

  return (
    <>
      <ModalHeader
        title="Keep the other answers"
        subtitle="Each question below is saved on the student as a custom field."
        icon={ArchiveBoxArrowDownIcon}
      />
      <ModalBody className="space-y-4">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Nothing left to keep. Close this and save the mapping as it is.
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              Rename a field if the question is a mouthful, and remove any question you don&apos;t want on student records.
              {newCount > 0 && (
                <>
                  {' '}
                  New fields show on every student in the school.
                </>
              )}
            </p>

            <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
              {rows.map((row) => {
                const problem = problemFor(row);
                const id = `keep-${row.question.fieldId}`;
                return (
                  <li key={row.question.fieldId} className="flex items-start gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <label htmlFor={id} className="block break-words text-xs text-slate-500">
                        {row.question.label}
                      </label>
                      {row.existing ? (
                        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm font-medium text-slate-900">
                          {row.existing.label}
                          <FieldTypeTag type={row.existing.type} />
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                            Existing field
                          </span>
                        </p>
                      ) : (
                        <>
                          <div className="mt-1.5 flex flex-wrap items-center gap-2">
                            <input
                              id={id}
                              value={row.draft.label}
                              maxLength={CUSTOM_FIELD_LIMITS.label}
                              aria-invalid={Boolean(problem)}
                              onChange={(e) => rename(row.question.fieldId, e.target.value)}
                              className={`${inputClass} min-w-[12rem] flex-1 py-2 ${problem ? 'border-rose-300 focus:ring-rose-400' : ''}`}
                            />
                            <FieldTypeTag type={row.draft.type} />
                            <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-semibold text-cyan-700">New field</span>
                          </div>
                          {row.draft.type === 'select' && (
                            <p className="mt-1 truncate text-xs text-slate-400">Choices: {row.draft.options.join(', ')}</p>
                          )}
                          {problem && <p className="mt-1 text-xs text-rose-600">{problem}</p>}
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`Don't keep "${row.question.label}"`}
                      title="Don't keep this question"
                      onClick={() => setRows((prev) => prev.filter((r) => r !== row))}
                      className="mt-4 flex-shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={rows.length === 0 || blocked}
          onClick={() => {
            onConfirm(rows);
            onClose();
          }}
        >
          {rows.length === 0 ? 'Keep questions' : `Keep ${rows.length} ${rows.length === 1 ? 'question' : 'questions'}`}
        </Button>
      </ModalFooter>
    </>
  );
}
