// src/components/tours/tourTone.ts
// Each portal's colour for its tours: staff cyan, parent amber, student indigo.
export interface TourTone {
  ring: string
  primary: string
  soft: string
  softText: string
  dot: string
}

const STAFF: TourTone = {
  ring: '#0891b2',
  primary: 'bg-cyan-600 hover:bg-cyan-700 text-white',
  soft: 'bg-cyan-50',
  softText: 'text-cyan-800',
  dot: 'bg-cyan-500',
}
const PARENT: TourTone = {
  ring: '#b45309',
  primary: 'bg-amber-700 hover:bg-amber-800 text-white',
  soft: 'bg-amber-50',
  softText: 'text-amber-900',
  dot: 'bg-amber-600',
}
const STUDENT: TourTone = {
  ring: '#4f46e5',
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  soft: 'bg-indigo-50',
  softText: 'text-indigo-800',
  dot: 'bg-indigo-500',
}

export const tourTone = (role: string | null | undefined): TourTone =>
  role === 'PARENT' ? PARENT : role === 'STUDENT' ? STUDENT : STAFF
