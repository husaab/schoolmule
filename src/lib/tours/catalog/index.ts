// Every tour SchoolMule has. Importing a tour file registers it (defineTour).
//
// To add a tour for a new feature:
//   1. Add catalog/<feature>.ts with `export default defineTour({ ... })`.
//   2. Import it below and add it to CATALOG.
//   3. Mark what it points at: data-tour="name" on the web,
//      <TourTarget id="name"> in the app. tourTargets.test.ts fails until
//      every target exists.
//
// A feature tour (offer.kind 'feature', offer.from = launch day) pops up once
// on the home page after sign-in for everyone in its audience who had an
// account by then, one New card per visit; newer accounts get only the
// welcome tour. Everyone can start or replay it from ? (the app's Tours).
import meetingsSetup from './meetings-setup'
import myMeetings from './my-meetings'
import parentTeacherMeetings from './parent-teacher-meetings'
import welcomeParent from './welcome-parent'
import welcomeStaff from './welcome-staff'
import welcomeStudent from './welcome-student'

export const CATALOG = [welcomeStaff, welcomeParent, welcomeStudent, parentTeacherMeetings, myMeetings, meetingsSetup] as const
