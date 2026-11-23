// Parents: book parent–teacher meetings. Offered on the Meetings page, and
// listed under ? only while booking is open for them (audience.when), so a
// school with no meetings never shows it.
//
// The web walks the real booking: choose a teacher, tap a time, then Book,
// which only the parent can press (realAction; × stops the tour first and
// nothing is booked). The app's time picker is a sheet, where a tour can't
// let a time chip through, so there the tour ends on the open sheet and the
// parent picks and books themselves. A parent who has booked everyone hears
// where their meetings are (the teachers step), and the booking steps skip
// themselves (optional).
import { defineTour } from '../defineTour'

export default defineTour({
  id: 'parent-teacher-meetings',
  version: 1,
  audience: { roles: ['PARENT'], when: ['meetings-booking'] },
  offer: {
    kind: 'feature',
    from: '2026-11-22T05:00:00.000Z',
    on: 'meetings',
    title: 'Book your parent–teacher meetings',
    blurb: 'A quick look at booking a time with each teacher. Nothing is booked unless you book it.',
  },
  surfaces: {
    times: { openTarget: 'meetings.choose' },
  },
  steps: [
    {
      id: 'intro',
      kind: 'look',
      target: 'meetings.banner',
      where: { route: 'meetings' },
      title: 'Parent–teacher meetings',
      body: 'Meet each of your children’s teachers in person. Times are first come, first served. You can book, change or cancel until the time shown here.',
    },
    {
      id: 'nav',
      kind: 'look',
      target: 'nav.meetings',
      where: { nav: 'sidebar' },
      platforms: ['web'],
      title: 'Find it in the menu',
      body: 'Meetings stays in the menu while booking is open, so you can come back any time.',
    },
    {
      id: 'nav-app',
      kind: 'look',
      target: null,
      platforms: ['app'],
      title: 'Find it again',
      body: 'Come back any time while booking is open: More → Parent–teacher meetings (on a tablet, it’s in the side menu).',
    },
    {
      id: 'plan',
      kind: 'look',
      target: 'meetings.plan',
      optional: true,
      title: 'Plan my visit',
      body: 'Seeing several teachers? This finds times for all of them back to back, and you check them before anything is booked.',
    },
    {
      id: 'teachers',
      kind: 'look',
      target: 'meetings.teachers',
      title: 'Each child’s teachers',
      body: 'Homeroom first. A green tick means that meeting is booked. Booked meetings are also listed under Your visit at the top, where you can change or cancel them.',
    },
    {
      id: 'choose',
      kind: 'click',
      target: 'meetings.choose',
      optional: true,
      title: 'Choose a time',
      body: 'Pick a teacher you haven’t booked yet.',
    },
    {
      id: 'time',
      kind: 'click',
      target: 'meetings.times',
      optional: true,
      platforms: ['web'],
      title: 'Pick a time',
      body: 'Only times you’re free are shown. Picking one doesn’t hold it yet.',
    },
    {
      id: 'book',
      kind: 'click',
      target: 'meetings.book',
      optional: true,
      realAction: true,
      platforms: ['web'],
      title: 'Book it',
      body: 'The time is yours once you book, and a confirmation email follows. Not ready? Close the tour with ×; nothing is booked.',
    },
    {
      id: 'pick',
      kind: 'look',
      target: 'meetings.times',
      where: { surface: 'times' },
      optional: true,
      platforms: ['app'],
      title: 'Pick a time, then Book',
      body: 'Only times you’re free are shown. The time is yours once you tap Book, and a confirmation email follows. Picking alone doesn’t hold it.',
    },
  ],
})
