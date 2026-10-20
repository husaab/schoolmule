// src/lib/accessRoles.ts
// Pure helpers for the Roles page and the Users page's access-role picker
// (accessRoles.test.ts). The catalog comes from the server, so the UI never
// keeps its own copy of the keys' labels or the built-in sets.

import type { PermissionGroup, PermissionMeta } from '@/services/types/accessRole'

export type PermissionSection = { id: string; label: string; items: PermissionMeta[] }

/**
 * The catalog's permissions under their groups, in the server's order. A
 * permission naming a group the catalog doesn't list still shows, under its
 * group id, so a newer backend never hides a checkbox.
 */
export const groupPermissions = (groups: readonly PermissionGroup[], permissions: readonly PermissionMeta[]): PermissionSection[] => {
  const sections: PermissionSection[] = groups.map((g) => ({ id: g.id, label: g.label, items: [] }))
  for (const p of permissions) {
    let section = sections.find((s) => s.id === p.group)
    if (!section) {
      section = { id: p.group, label: p.group, items: [] }
      sections.push(section)
    }
    section.items.push(p)
  }
  return sections.filter((s) => s.items.length > 0)
}

/** The selected keys in catalog order, dropping any the catalog doesn't know. */
export const orderedSelection = (permissions: readonly PermissionMeta[], selected: ReadonlySet<string>): string[] =>
  permissions.filter((p) => selected.has(p.key)).map((p) => p.key)

/** Labels for keys, in catalog order; an unknown key shows as itself. */
export const permissionLabels = (permissions: readonly PermissionMeta[], keys: readonly string[]): string[] => {
  const known = permissions.filter((p) => keys.includes(p.key)).map((p) => p.label)
  const unknown = keys.filter((k) => !permissions.some((p) => p.key === k))
  return [...known, ...unknown]
}

/** "3 permissions", "1 permission", "No permissions". */
export const permissionCountLabel = (n: number): string =>
  n === 0 ? 'No permissions' : `${n} permission${n === 1 ? '' : 's'}`

/** "Nobody", "1 person", "4 people". */
export const holdersLabel = (n: number): string => (n === 0 ? 'Nobody' : `${n} ${n === 1 ? 'person' : 'people'}`)

/** Mirrors the server's checks so the form can say what's wrong before saving. */
const RESERVED_NAMES = new Set(['admin', 'administrator', 'teacher'])
export const roleNameProblem = (name: string, takenNames: readonly string[]): string | null => {
  const n = name.trim()
  if (!n) return 'Give the role a name'
  if (n.length > 60) return 'Keep the name under 60 characters'
  if (RESERVED_NAMES.has(n.toLowerCase())) return `"${n}" is a built-in role. Pick another name`
  if (takenNames.some((t) => t.trim().toLowerCase() === n.toLowerCase())) return 'Another role already has this name'
  return null
}
