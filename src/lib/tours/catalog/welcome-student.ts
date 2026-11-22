// The welcome tour for students. Offered once to accounts created after
// launch; anyone can replay it from the ? menu.
import { defineTour } from '../defineTour'

export default defineTour({
  id: 'welcome-student',
  version: 1,
  audience: { roles: ['STUDENT'] },
  offer: {
    kind: 'welcome',
    newAccountsOnly: true,
    on: 'home',
    title: 'Welcome to SchoolMule',
    blurb: 'Your classes, your work and your grades, in one place. Want a one-minute look around?',
  },
  steps: [
    {
      id: 'hello',
      kind: 'look',
      target: null,
      // Started from the ? menu or Tours on another page: begin at home.
      where: { route: 'home' },
      title: 'Welcome to SchoolMule',
      body: 'Your classes, your work and your grades, in one place.',
    },
    {
      id: 'home',
      kind: 'look',
      target: 'nav.home',
      title: 'Home',
      body: "What's missing, what's due soon and your new grades, then all your classes.",
    },
    {
      id: 'todo',
      kind: 'look',
      target: 'nav.todo',
      title: 'To-do',
      body: 'The work your teachers have given you, so you always know what to do next.',
    },
    {
      id: 'grades',
      kind: 'look',
      target: 'nav.grades',
      title: 'Grades',
      body: 'Your marks in every class, as soon as your teacher shares them.',
    },
    {
      id: 'messages',
      kind: 'look',
      target: 'nav.messages',
      title: 'Messages',
      body: 'Messages and announcements from your teachers.',
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
      body: 'Replay this tour any time from Tours, at the bottom of Home. New features come with their own short tour.',
    },
  ],
})
