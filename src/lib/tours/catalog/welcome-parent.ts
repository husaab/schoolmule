// The welcome tour for parents. Offered once to accounts created after
// launch; anyone can replay it from the ? menu.
import { defineTour } from '../defineTour'

export default defineTour({
  id: 'welcome-parent',
  version: 1,
  audience: { roles: ['PARENT'] },
  offer: {
    kind: 'welcome',
    newAccountsOnly: true,
    on: 'home',
    title: 'Welcome to SchoolMule',
    blurb: "How your children are doing at school, in one place. Want a one-minute look around?",
  },
  steps: [
    {
      id: 'hello',
      kind: 'look',
      target: null,
      // Started from the ? menu or Tours on another page: begin at home.
      where: { route: 'home' },
      title: 'Welcome to SchoolMule',
      body: 'How your children are doing at school, in one place: marks, attendance, report cards and messages with their teachers.',
    },
    {
      id: 'home',
      kind: 'look',
      target: 'nav.home',
      where: { nav: 'sidebar' },
      title: 'Overview',
      body: 'New marks, announcements and messages show up here first. With more than one child, pick whose school day you are looking at.',
    },
    {
      id: 'classes',
      kind: 'look',
      target: 'nav.classes',
      where: { nav: 'sidebar' },
      title: 'Classes',
      body: 'What each class is doing this week, and anything a teacher needs from you.',
    },
    {
      id: 'messages',
      kind: 'look',
      target: 'nav.messages',
      where: { nav: 'sidebar' },
      title: 'Messages',
      body: "Write to your children's teachers and read school announcements.",
    },
    {
      id: 'grades',
      kind: 'look',
      target: 'nav.grades',
      where: { nav: 'sidebar' },
      platforms: ['web'],
      title: 'Grades, attendance and more',
      body: 'Grades, attendance, the calendar, report cards and the staff directory each have their own page in this menu.',
    },
    {
      id: 'more',
      kind: 'look',
      target: 'nav.more',
      platforms: ['app'],
      optional: true,
      title: 'Everything else is under More',
      body: 'Grades, attendance, the calendar, report cards, the staff directory, Settings and Help & support.',
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
