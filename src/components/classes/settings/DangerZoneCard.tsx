// src/components/classes/settings/DangerZoneCard.tsx
// Settings → Duplicate, archive, delete. Delete follows the header's
// permissions.canDelete (admins and the class's teachers in a current year);
// a class the viewer may not edit (a past school year, for teachers) shows no
// actions.
'use client'

interface DangerZoneCardProps {
  canEdit: boolean
  canDelete: boolean
  archived: boolean
  unarchiving: boolean
  onDuplicate: () => void
  onArchive: () => void
  onUnarchive: () => void
  onDelete: () => void
}

const button =
  'cursor-pointer rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60'

export default function DangerZoneCard({
  canEdit,
  canDelete,
  archived,
  unarchiving,
  onDuplicate,
  onArchive,
  onUnarchive,
  onDelete,
}: DangerZoneCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-rose-200 bg-white p-[22px]">
      <h3 className="font-display text-[19px] font-semibold text-slate-900">Duplicate, archive, delete</h3>
      {canEdit ? (
        <>
          <div className="flex flex-wrap gap-2.5">
            <button type="button" onClick={onDuplicate} className={button}>
              Duplicate for next term
            </button>
            {archived ? (
              <button type="button" onClick={onUnarchive} disabled={unarchiving} className={button}>
                {unarchiving ? 'Unarchiving…' : 'Unarchive class'}
              </button>
            ) : (
              <button type="button" onClick={onArchive} className={button}>
                Archive class
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="cursor-pointer rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100"
              >
                Delete class
              </button>
            )}
          </div>
          <span className="text-[13px] text-slate-500">
            Duplicating copies the banner, categories, topics and classwork as drafts. Grades and submissions stay with
            this term.
          </span>
        </>
      ) : (
        <span className="text-[13px] text-slate-500">
          This class is from a past school year, so only an admin can duplicate, archive or delete it.
        </span>
      )}
    </div>
  )
}
