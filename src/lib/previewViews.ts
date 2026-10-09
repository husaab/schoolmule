// src/lib/previewViews.ts
// Which portals an admin can open a "view as" preview in. A teacher who is
// also a parent (linked to a current-year student) can be previewed in
// either; everyone else only in their own. The view switcher is hidden inside
// a preview, so the choice has to be made before it starts.

export type PreviewView = 'TEACHER' | 'PARENT'

/**
 * @param role        the target's database role
 * @param hasChildren whether the target is linked to a student this year;
 *                    null while that is still loading
 */
export const previewViewsFor = (role: string, hasChildren: boolean | null): PreviewView[] => {
  if (role === 'PARENT') return ['PARENT']
  return hasChildren ? ['TEACHER', 'PARENT'] : ['TEACHER']
}
