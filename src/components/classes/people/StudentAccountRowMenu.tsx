// src/components/classes/people/StudentAccountRowMenu.tsx
// The ⋮ on a student's People row. It lists only what the student's account
// allows (lib/classPeople#studentMenuActions): view and message parents for
// everyone, resend an open invite, reset an active password, print a QR card,
// and pick the avatar of a child who has not signed in yet.
'use client'

import type { ComponentType, SVGProps } from 'react'
import {
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  FaceSmileIcon,
  KeyIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline'
import KebabMenu, { type KebabItem } from '@/components/classes/shared/KebabMenu'
import { STUDENT_MENU_LABELS, studentMenuActions, type StudentMenuAction } from '@/lib/classPeople'
import type { PeopleStudent } from '@/services/types/classroom'

const ICONS: Record<StudentMenuAction, ComponentType<SVGProps<SVGSVGElement>>> = {
  view: EyeIcon,
  message: ChatBubbleLeftRightIcon,
  resend_invite: ArrowPathIcon,
  reset_password: KeyIcon,
  print_qr: PrinterIcon,
  change_avatar: FaceSmileIcon,
}

interface StudentAccountRowMenuProps {
  student: PeopleStudent
  onSelect: (action: StudentMenuAction, student: PeopleStudent) => void
  /** A request for this student is in flight. */
  busy?: boolean
}

export default function StudentAccountRowMenu({ student, onSelect, busy = false }: StudentAccountRowMenuProps) {
  const items: KebabItem[] = studentMenuActions(student).map((action, index) => ({
    key: action,
    label: STUDENT_MENU_LABELS[action],
    icon: ICONS[action],
    // The account actions sit below the two everyday ones (view, message).
    separatorBefore: index === 2,
    onSelect: () => onSelect(action, student),
  }))
  return <KebabMenu label={`Options for ${student.name}`} items={items} busy={busy} />
}
