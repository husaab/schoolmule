'use client';

import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import type { FormSubmission } from '@/services/types/registration';

/**
 * Import state for one submission in the table. Clicking an imported badge
 * opens the undo dialog; not-yet-imported rows render as a quiet dash so the
 * column stays scannable.
 */
export default function ImportedBadge({
  submission,
  onUndo,
}: {
  submission: FormSubmission;
  onUndo: (submission: FormSubmission) => void;
}) {
  if (!submission.importedStudentId) {
    return <span className="text-xs text-slate-300">—</span>;
  }

  const name = submission.importedStudentName;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onUndo(submission); }}
      title={name ? `Imported as ${name} — click to undo` : 'Imported — click to undo'}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors max-w-[11rem] cursor-pointer"
    >
      <CheckBadgeIcon className="w-3.5 h-3.5 shrink-0" />
      <span className="truncate">{name || 'Imported'}</span>
    </button>
  );
}
