// The office: set up parent–teacher meetings, from New meetings to opening
// booking. Web only: in the app, Setup and the Board open on the website.
// Offered on the home page after sign-in to anyone with the scheduling
// permission, and listed under ?, even before their school has any meetings
// (that's when they need it); starting it opens the meetings list. Create is theirs to press (realAction): the tour never makes a
// draft. Show me how on an event's page starts at 'setup-days' (fromStep).
import { defineTour } from '../defineTour'

export default defineTour({
  id: 'meetings-setup',
  version: 1,
  audience: { roles: ['ADMIN', 'TEACHER'], anyPermission: ['scheduling'] },
  offer: {
    kind: 'feature',
    from: '2026-11-22T05:00:00.000Z',
    title: 'Set up parent–teacher meetings',
    blurb: 'From the days and hours to opening booking. Families hear nothing until you open it.',
  },
  surfaces: {
    newMeetings: { openTarget: 'meetings.new' },
  },
  steps: [
    {
      id: 'new',
      kind: 'click',
      target: 'meetings.new',
      where: { route: 'meetings-office' },
      platforms: ['web'],
      title: 'New meetings',
      body: 'Start here. It makes a draft with your school calendar’s meeting days filled in.',
    },
    {
      id: 'days',
      kind: 'type',
      typeMin: 0,
      target: 'meetings.newDays',
      where: { surface: 'newMeetings' },
      platforms: ['web'],
      title: 'Days and hours',
      body: 'Check each day and its hours. Breaks, teachers’ own hours and rooms come next, on the Setup page.',
    },
    {
      id: 'create',
      kind: 'click',
      target: 'meetings.create',
      where: { surface: 'newMeetings' },
      realAction: true,
      platforms: ['web'],
      title: 'Create the draft',
      body: 'This saves a draft and opens its Setup. Families hear nothing until you open booking. Not ready? Close the tour with ×.',
    },
    {
      id: 'setup-days',
      kind: 'look',
      target: 'meetings.setupDays',
      platforms: ['web'],
      title: 'Days, hours and breaks',
      body: 'Every teacher uses these hours unless they have their own. Add a break, like prayer or dinner, and the times fit around it.',
    },
    {
      id: 'setup-teachers',
      kind: 'look',
      target: 'meetings.setupTeachers',
      platforms: ['web'],
      title: 'Who takes part',
      body: 'Untick anyone who isn’t taking part. Click a teacher’s days to give them their own days, hours, breaks, meeting length or room.',
    },
    {
      id: 'open',
      kind: 'look',
      target: 'meetings.openBooking',
      platforms: ['web'],
      title: 'Open booking',
      body: 'Open it now, or pick a date and time. Every family gets the invitation at that moment, and families without an account are invited to make one.',
    },
    {
      id: 'board',
      kind: 'look',
      target: 'meetings.tabs',
      platforms: ['web'],
      title: 'The Board',
      body: 'Once families book, the Board shows every teacher’s day. Book, move or cancel for a family who calls the office.',
    },
  ],
})
