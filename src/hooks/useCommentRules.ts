// src/hooks/useCommentRules.ts
// The rules a class's comment pages work under: the school's word limits and
// whether report card or progress report comments are locked for review
// (lib/commentRules.ts). Until they load, and if they can't be loaded, the
// pages behave as open with no limits; the server still refuses what the
// rules don't allow. `refresh` reads them again (a save was refused as
// locked: the office locked the comments while the page was open).
'use client'

import { useCallback, useEffect, useState } from 'react'
import { OPEN_RULES, type ClassCommentRules } from '@/lib/commentRules'
import { getClassCommentRules } from '@/services/reportCommentsService'

export interface CommentRulesState {
  rules: ClassCommentRules
  /** The rules shown are the class's own (not the open stand-in). */
  loaded: boolean
  refresh: () => void
}

export function useCommentRules(classId: string | null | undefined): CommentRulesState {
  const [loaded, setLoaded] = useState<{ classId: string; rules: ClassCommentRules } | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!classId) return
    let cancelled = false
    getClassCommentRules(classId)
      .then((res) => {
        if (!cancelled && res.status === 'success' && res.data) setLoaded({ classId, rules: res.data })
      })
      .catch(() => {
        // Left as it was: open until known, and the server has the last word.
      })
    return () => {
      cancelled = true
    }
  }, [classId, attempt])

  const refresh = useCallback(() => setAttempt((n) => n + 1), [])
  const mine = loaded && loaded.classId === classId ? loaded.rules : null
  return { rules: mine ?? OPEN_RULES, loaded: mine !== null, refresh }
}
