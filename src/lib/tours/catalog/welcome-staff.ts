// The welcome tour for staff (teachers and admins). Offered once to accounts
// created after launch; anyone can replay it from the ? menu. The copy is the
// app's old welcome slideshow, now pointing at the real navigation.
import { defineTour } from '../defineTour'

export default defineTour({
  id: 'welcome-staff',
  version: 1,
  audience: { roles: ['TEACHER', 'ADMIN'] },
  offer: {
    kind: 'welcome',
    newAccountsOnly: true,
    on: 'home',
    title: 'Welcome to SchoolMule',
    blurb: 'Your classes, attendance, grades and messages with families, in one place. Want a one-minute look around?',
  },
  steps: [
    {
      id: 'hello',
      kind: 'look',
      target: null,
      // Started from the ? menu or Tours on another page: begin at home.
      where: { route: 'home' },
      title: 'Welcome to SchoolMule',
      body: 'Your classes, attendance, grades and messages with families, in one place. Here is where everything lives.',
    },
    {
      id: 'home',
      kind: 'look',
      target: 'nav.home',
      where: { nav: 'sidebar' },
      title: 'Your day',
      body: "Today's schedule, work waiting for you to review and what's coming up. Open classes, enter grades or take attendance from the top.",
    },
    {
      id: 'classes',
      kind: 'look',
      target: 'nav.classes',
      where: { nav: 'sidebar' },
      title: 'Classes',
      body: 'Every class you teach. Open one for its students, its work and its grades.',
    },
    {
      id: 'messages',
      kind: 'look',
      target: 'nav.messages',
      where: { nav: 'sidebar' },
      title: 'Messages',
      body: "Families' messages and school announcements. The count shows the threads waiting on your reply.",
    },
    {
      id: 'more',
      kind: 'look',
      target: 'nav.more',
      platforms: ['app'],
      optional: true,
      title: 'Everything else is under More',
      body: 'Attendance, the gradebook, report cards, schedules and Settings: the same tools as on the SchoolMule website.',
    },
    {
      id: 'tours',
      kind: 'look',
      target: 'help.tours',
      platforms: ['web'],
      title: 'Tours live here',
      body: 'Replay this tour any time. When something new arrives, its own short tour shows up here too.',
    },
    {
      id: 'tours-app',
      kind: 'look',
      target: null,
      platforms: ['app'],
      title: 'Find this again any time',
      body: 'Replay this tour any time from More → Tours. New features come with their own short tour.',
    },
  ],
})
