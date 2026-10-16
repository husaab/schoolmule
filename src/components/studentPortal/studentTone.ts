// src/components/studentPortal/studentTone.ts
// The student portal's look: slate surfaces with an indigo accent (#4f46e5),
// so a shared screen tells at a glance that a student is signed in. Staff
// pages keep cyan/teal and parent pages amber. Literal class strings, so
// Tailwind sees every one of them.

export const studentTone = {
  /** Primary buttons. */
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  /** The current nav item (sidebar). */
  navActive: 'bg-indigo-50 text-indigo-700 border-indigo-100',
  /** Page background. */
  page: 'bg-slate-50',
  /** Links and highlighted text. */
  accentText: 'text-indigo-700',
} as const
