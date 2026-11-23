// src/components/tours/tourRoutes.ts
// The web's paths for the tour route names (lib/tours RouteName). Tours name
// pages, not URLs, so a page can move without editing every tour. The app
// keeps its own copy (its screens sit at the same paths today, but it has
// app-only screens such as Tours).
import type { RouteName } from '@/lib/tours'

const HOME: Record<string, string> = {
  TEACHER: '/dashboard',
  ADMIN: '/dashboard',
  PARENT: '/parent/dashboard',
  STUDENT: '/student',
}

export function tourPath(route: RouteName, role: string | null): string {
  switch (route) {
    case 'home':
      return HOME[role ?? ''] ?? '/dashboard'
    case 'meetings':
      return '/parent/meetings'
    case 'my-meetings':
      return '/my-meetings'
    case 'meetings-office':
      return '/admin-panel/parent-teacher-meetings'
  }
}

const NAMED: RouteName[] = ['home', 'meetings', 'my-meetings', 'meetings-office']

/** The route name of the page at `pathname`, if it has one. */
export function routeAt(pathname: string, role: string | null): RouteName | null {
  return NAMED.find((name) => samePath(pathname, tourPath(name, role))) ?? null
}

export const samePath = (a: string, b: string) => (a.replace(/\/+$/, '') || '/') === (b.replace(/\/+$/, '') || '/')
