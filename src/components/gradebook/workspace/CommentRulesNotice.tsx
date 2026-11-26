// src/components/gradebook/workspace/CommentRulesNotice.tsx
// What the comment pages say about the school's comment rules
// (lib/commentRules.ts): the lock notice and the word limit above the
// comments, and the word count under each comment box.
'use client'

import Link from 'next/link'
import { LockClosedIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import {
  hasLimits,
  limitConsequences,
  limitRange,
  lockNotice,
  wordCountLine,
  type CommentKind,
  type CommentLimits,
  type CommentRule,
  type WordState,
} from '@/lib/commentRules'

/** Where a reviewer sets the limits and locks or reopens comments. */
export const COMMENT_RULES_HREF = '/admin-panel/report-templates?tab=comments'

interface CommentRulesNoticeProps {
  kind: CommentKind
  rule: CommentRule
  canEditLocked: boolean
  className?: string
  /** A JK or SK page: its ratings are not part of the lock, so say they still save. */
  ratingsStayOpen?: boolean
  /** Changes made before the lock arrived that could not be saved (they stay on screen). */
  unsavedCount?: number
}

/** The lock (when locked) and the word limit (when set), above the comments. Nothing when neither applies. */
export function CommentRulesNotice({ kind, rule, canEditLocked, className = 'mb-6', ratingsStayOpen = false, unsavedCount = 0 }: CommentRulesNoticeProps) {
  const lock = lockNotice(kind, rule, canEditLocked)
  const range = limitRange(rule)
  if (!lock && !range) return null

  return (
    <div className={`space-y-3 ${className}`}>
      {lock && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm text-amber-900"
        >
          <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-200/70">
            <LockClosedIcon className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">{lock.title}</p>
            <p className="mt-0.5 text-amber-900/80">
              {lock.body}
              {ratingsStayOpen && !canEditLocked && ' Ratings can still be changed.'}
              {canEditLocked && (
                <>
                  {' '}
                  <Link href={COMMENT_RULES_HREF} className="font-medium underline underline-offset-2 hover:text-amber-950">
                    Open Comments
                  </Link>
                </>
              )}
            </p>
            {unsavedCount > 0 && !canEditLocked && (
              <p className="mt-1.5 font-medium text-rose-800">
                {unsavedCount === 1 ? '1 change' : `${unsavedCount} changes`} you made before the lock{' '}
                {unsavedCount === 1 ? "wasn't" : "weren't"} saved. {unsavedCount === 1 ? 'It stays' : 'They stay'} on this page so you
                can copy {unsavedCount === 1 ? 'it' : 'them'}; Discard, beside Retry above, clears {unsavedCount === 1 ? 'it' : 'them'}.
              </p>
            )}
          </div>
        </div>
      )}
      {range && (
        <div className="flex items-start gap-3 rounded-2xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-sm text-cyan-950">
          <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-100">
            <PencilSquareIcon className="h-4 w-4 text-cyan-700" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="font-semibold">Word limit: each comment must be {range}</p>
            <p className="mt-0.5 text-cyan-950/75">
              {limitConsequences(rule).join(' ')} The count is under each comment.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

const COUNT_TONE: Record<WordState, string> = {
  empty: 'text-slate-400',
  short: 'text-amber-700',
  ok: 'text-slate-500',
  over: 'font-medium text-rose-700',
}

/**
 * The word count under a comment box. Shown only where the school has set
 * limits. `saved` is the comment as saved: one over the limit that is still
 * the saved text is asked to be shortened, not reported as unsaved.
 */
export function CommentWordCount({
  text,
  limits,
  saved,
  className = '',
}: {
  text: string
  limits: CommentLimits
  saved?: string | null
  className?: string
}) {
  if (!hasLimits(limits)) return null
  const line = wordCountLine(text, limits, saved)
  return (
    <p className={`mt-1 text-xs tabular-nums ${COUNT_TONE[line.state]} ${className}`} aria-live="polite">
      {line.text}
    </p>
  )
}

/** Border and fill of a comment box that is over the limit, else nothing. */
export const overLimitBox = (state: WordState): string => (state === 'over' ? 'border-rose-400 bg-rose-50/50 focus:ring-rose-400' : '')
