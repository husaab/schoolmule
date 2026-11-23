// Teachers: My Meetings, their day of parent–teacher meetings. Offered on the
// page, and listed under ? only while they take part in meetings still to
// come (audience.when). Everything here is a look: closing a time or printing
// is theirs to do. The summary and close steps skip themselves on a day with
// nothing booked, or nothing open.
import { defineTour } from '../defineTour'

export default defineTour({
  id: 'my-meetings',
  version: 1,
  audience: { roles: ['TEACHER', 'ADMIN'], when: ['meetings-teaching'] },
  offer: {
    kind: 'feature',
    from: '2026-11-22T05:00:00.000Z',
    on: 'my-meetings',
    title: 'Your parent–teacher meetings',
    blurb: 'Where your day of meetings lives, how to open a family’s Student summary, and Print my day.',
  },
  steps: [
    {
      id: 'schedule',
      kind: 'look',
      target: 'meetings.schedule',
      where: { route: 'my-meetings' },
      title: 'Your day, time by time',
      body: 'Booked families, open times and breaks, in order. Each meeting day has its own tab.',
    },
    {
      id: 'nav',
      kind: 'look',
      target: 'nav.myMeetings',
      where: { nav: 'sidebar' },
      optional: true,
      title: 'Find it in the menu',
      body: 'My Meetings stays in the menu, with how many meetings you have left, until the meetings are over.',
    },
    {
      id: 'summary',
      kind: 'look',
      target: 'meetings.summary',
      optional: true,
      title: 'Student summary',
      body: 'Open a child’s Student summary for your class, or for all of their classes. Homeroom teachers get all classes first.',
    },
    {
      id: 'close',
      kind: 'look',
      target: 'meetings.close',
      optional: true,
      title: 'Need a few minutes?',
      body: 'Close an open time so no family can book it, and reopen it the same way. Booked times stay put; the office moves families if needed.',
    },
    {
      id: 'print',
      kind: 'look',
      target: 'meetings.print',
      title: 'Print my day',
      body: 'One PDF: your schedule, then each family’s Student summary in meeting order.',
    },
    {
      id: 'hours',
      kind: 'look',
      target: 'meetings.hours',
      title: 'My hours',
      body: 'Your days, hours and meeting length. If the office allows it, Change my days and hours lets you set your own hours and breaks.',
    },
  ],
})
