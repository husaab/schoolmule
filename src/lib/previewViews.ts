// src/lib/previewViews.ts
// Which portals an admin can open a "view as" preview in. A staff member who
// is also a parent (linked to a current-year student) can be previewed in
// either; everyone else only in their own. Once inside, the regular view
// switcher moves between the two portals (services/viewSwitch.ts).
//
// ADMIN is a preview view only for a restricted admin (an ADMIN holding an
// access role): full admins preview them to check what a role really shows.
// A full admin is never previewed (userDisplay.canImpersonate).

export type PreviewView = 'ADMIN' | 'TEACHER' | 'PARENT'

/**
 * @param role        the target's database role
 * @param hasChildren whether the target is linked to a student this year;
 *                    null while that is still loading
 */
export const previewViewsFor = (role: string, hasChildren: boolean | null): PreviewView[] => {
  if (role === 'PARENT') return ['PARENT']
  const staffView: PreviewView = role === 'ADMIN' ? 'ADMIN' : 'TEACHER'
  return hasChildren ? [staffView, 'PARENT'] : [staffView]
}
