// The office: how grades 1-8 progress reports are laid out. First the
// school's subject headings (Report Templates → Subject headings), then a
// class printed as a goals paragraph and a comment, like Salaat (the class's
// Settings → On reports). Offered on the home page after sign-in to anyone
// with the school setup permission, and listed under ?. Show me how on the
// headings tab starts at 'heading', and on a class's On reports at
// 'comments-only'.
//
// Everything after the tab is a look, so the tour never changes a heading or
// a class. The heading, subject and class-list steps skip themselves for a
// school with no headings yet; the goals step skips itself while the class
// isn't set to goals and comment. Opening a class is the person's to do
// (realAction hides "Do it for me": only they know which class it is).
//
// The class steps are web only: the app's tour presses the one thing it
// highlights, so it can't open the class someone picks. The app ends on its
// Classes screen instead, saying where the setting is (a card's ⋮ menu →
// Class settings → On reports).
import { defineTour } from '../defineTour'

export default defineTour({
  id: 'progress-report-layout',
  version: 1,
  audience: { roles: ['ADMIN', 'TEACHER'], anyPermission: ['school_setup'] },
  offer: {
    kind: 'feature',
    from: '2026-11-22T05:00:00.000Z',
    title: 'Subject headings and goals on progress reports',
    blurb: 'Group subjects under your own headings, and print a class like Salaat as a goals paragraph and a comment.',
  },
  steps: [
    {
      id: 'headings-tab',
      kind: 'click',
      target: 'reportTemplates.headingsTab',
      where: { route: 'report-templates' },
      title: 'Subject headings',
      body: 'Your progress report headings are here, in Report Templates.',
    },
    {
      id: 'heading',
      kind: 'look',
      target: 'subjectHeadings.heading',
      optional: true,
      title: 'A heading',
      body: 'Headings print in this order on grades 1–8 progress reports. Rename one here, move it with the arrows, or remove it.',
    },
    {
      id: 'subjects',
      kind: 'look',
      target: 'subjectHeadings.subjects',
      optional: true,
      title: 'The subjects under it',
      body: 'Printed as is the name on the report. Class names are the classes it covers, separated by commas (English for English Language Arts). Left empty, it covers the classes with its own name.',
    },
    {
      id: 'classes',
      kind: 'look',
      target: 'subjectHeadings.classes',
      optional: true,
      title: 'Where each class prints',
      body: 'Every class this year and the heading it prints under. Amber ones aren’t under a heading yet, so they print last, under Other Subjects.',
    },
    {
      id: 'save',
      kind: 'look',
      target: 'subjectHeadings.save',
      title: 'Save headings',
      body: 'Add heading starts a new group. Nothing changes until you press Save headings. Reports generated after that use them; ones already generated need generating again.',
    },
    {
      id: 'open-class',
      platforms: ['web'],
      kind: 'click',
      target: 'classes.grid',
      where: { route: 'classes' },
      realAction: true,
      title: 'A class with no marks',
      body: 'Now open a class like Salaat, which prints a goals paragraph and a comment instead of ratings.',
    },
    {
      id: 'settings-tab',
      platforms: ['web'],
      kind: 'click',
      target: 'class.settingsTab',
      title: 'Settings',
      body: 'Open the class’s Settings.',
    },
    {
      id: 'comments-only',
      platforms: ['web'],
      kind: 'look',
      target: 'classOptions.commentsOnly',
      title: 'Goals and comment only',
      body: 'Turn this on and no ratings print for this class: just the goals paragraph, then each student’s comment.',
    },
    {
      id: 'goals',
      platforms: ['web'],
      kind: 'look',
      target: 'classOptions.goals',
      optional: true,
      title: 'The goals paragraph',
      body: 'Printed above every student’s comment, the same for everyone. It saves when you click away.',
    },
    {
      id: 'teachers',
      platforms: ['web'],
      kind: 'look',
      target: null,
      title: 'What teachers do',
      body: 'In the class’s Grades → Progress comments, teachers pick Excellent, Good, Satisfactory or Needs Improvement, and that rating’s comment fills in, ready to edit. Standard comments there holds the comment for each rating.',
    },
    {
      id: 'class-settings',
      platforms: ['app'],
      kind: 'look',
      target: 'classes.grid',
      where: { route: 'classes' },
      title: 'A class with no marks',
      body: 'For a class like Salaat, tap its ⋮ menu → Class settings → On reports. Turn on Goals and comment only and write the goals paragraph. Teachers then pick a rating in Progress comments, and the comment fills in.',
    },
  ],
})
