// Open, update and close the student profile modal from anywhere. The modal
// itself is mounted once in the (user) layout (StudentProfileHost) and reads
// ?profile= from the URL; see lib/studentProfileUrl for the param contract.
'use client'

import { useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  STUDENT_PROFILE_PARAMS,
  hrefWithQuery,
  withStudentProfile,
  withStudentView,
  withoutStudentProfile,
  type StudentProfileView,
} from '@/lib/studentProfileUrl'

// True when the open profile was pushed by open() in this tab, so the history
// entry beneath it is the page as it was and closing can simply step Back.
// A profile reached by a deep link or a refresh has nothing of ours beneath
// it, so closing replaces the URL instead.
let openedByPush = false

export function useStudentProfile() {
  const router = useRouter()
  const pathname = usePathname()

  const open = useCallback(
    (studentId: string, view?: StudentProfileView) => {
      const current = window.location.search
      const href = hrefWithQuery(pathname, withStudentProfile(current, studentId, view))
      // Swapping one open profile for another keeps a single Back step.
      if (new URLSearchParams(current).has(STUDENT_PROFILE_PARAMS.id)) {
        router.replace(href, { scroll: false })
      } else {
        openedByPush = true
        router.push(href, { scroll: false })
      }
    },
    [router, pathname]
  )

  /** Tab / term / open class inside the modal: replaced, never a Back step. */
  const setView = useCallback(
    (patch: StudentProfileView) =>
      router.replace(hrefWithQuery(pathname, withStudentView(window.location.search, patch)), { scroll: false }),
    [router, pathname]
  )

  const close = useCallback(() => {
    if (openedByPush) {
      openedByPush = false
      router.back()
    } else {
      router.replace(hrefWithQuery(pathname, withoutStudentProfile(window.location.search)), { scroll: false })
    }
  }, [router, pathname])

  /** A real href for the profile (cmd/ctrl-click opens it in a new tab). */
  const hrefFor = useCallback((studentId: string) => hrefWithQuery(pathname, withStudentProfile('', studentId)), [pathname])

  return { open, setView, close, hrefFor }
}
