# SchoolMule: verified feature inventory, security facts, website claim audit

Compiled 2026-10-25 from code. Baselines:
- Frontend `schoolmule` main = origin/main = remote = `71b0489` (2026-10-24).
- Backend `schoolmule-backend` remote main = origin/main = `35ebb52` (2026-10-23). The local `main` checkout (`99c7836`) is 2 commits behind. The missing commits are reply reminders (`efa908c`) and the report-email queue (`35ebb52`). Those two were verified with `git show origin/main:<path>`. Everything else is identical in both.
- Unmerged branches (not shipped): FE/BE `feature/classroom-always-on` (removes the classroom on/off switch), FE `feat/finance-manual-credits` (the backend manual-credits migration is on main).

Sources outside the repos, all read-only:
- `railway status` and `railway variables` (names only, plus non-secret host values).
- `curl -I` of https://schoolmule.ca and https://api.schoolmule.ca/api/health.

I did NOT query the production database. Facts that only the DB can confirm are marked **uncertain**. Examples: which schools have a switch on, bucket public flags, the Supabase plan.

Legend: **shipped** = on main in both repos and wired into the UI · **partial** = exists, with notable limits · **branch-only** · **not found**.

---

## 1. Feature inventory

### 1.1 Summary table

| Area | Feature | Status | Users | Per-school gate | Accurate one-liner |
|---|---|---|---|---|---|
| Classroom | Student portal (Google-Classroom-style) | shipped | teacher, student, parent (read-only) | `school_classroom_settings.enabled` (default **off**); sign-in from grade X; QR cards up to grade Y; student email from grade Z; Google-only option | "Classes with a Stream, Classwork, Grades and People tab. Students sign in to turn in work and take quizzes; parents see the same class read-only." |
| Classroom | Quizzes | shipped | teacher, student | portal on | "Quizzes with multiple-choice, checkbox, short- and long-answer questions. Choice questions are auto-scored; release on submit or after review." |
| Classroom | Feedback on work ("lab feedback") | shipped | teacher → student/parent | portal on; `parentsReadPrivateComments` | "Every graded item can carry the teacher's written feedback, which students and parents see with the grade." |
| Gradebook | Weighted gradebook with categories | shipped | teacher, admin | — | "Weighted assessments and categories, autosaving grid, Missing/Excused flags, Excel export." |
| Gradebook | Publish & Notify grade emails | shipped | teacher → families | — (always available) | "Publish grades when you're ready. Families get one email per publish listing each released item, with a one-tap link to ask the teacher." |
| Gradebook | Assessment publishing gate | shipped | teacher, parent | — | "Parents only see grades you've published, and averages are computed from published work only." |
| Parent | AI weekly summary (dashboard) | shipped | parent | **none** (shows whenever the backend has an OpenAI key, which it does in prod) | "Each week parents get a 2–4 sentence AI-written summary of their child's published grades, attendance, missing work and teacher feedback. It is clearly labelled as AI." |
| Parent | Weekly/daily summary email (not AI) | shipped | parent | `parentSummary` switch (default off); parent picks weekly/daily + day | "Optional weekly (or daily) email digest of new grades, missing work and what's due." |
| Comms | Parent–teacher messaging | shipped | parent, teacher, admin, student | — | "Private conversations between families and teachers, optionally pinned to an assessment, with attachments and email notifications." |
| Comms | Attachments | shipped | all messaging users | — | "Attach up to 5 files (images, PDF, Word; 10 MB each) to any message." |
| Comms | Reply reminders + parent nudge | shipped (origin/main only) | teacher, office, parent | `replyReminders`, `parentNudge` (both default off) | "If a parent's message goes unanswered, the teacher is reminded twice. Then the office is told." |
| Comms | Announcements | shipped | teacher, admin → parents (and students) | `announcements.school` permission for whole-school/grade | "Announce to a class, a grade, the whole school, or a hand-picked list of families, with email delivery, read receipts and optional 'Got it' acknowledgements." |
| Comms | Email digests (coalesced) | shipped | all | — | "Message emails are batched: several messages in two minutes arrive as one email, and nothing is sent if you've already read it." |
| Comms | Guardian invites | shipped | teacher → parent | — | "Message a parent who has no account yet. They get an email invite that lands them in the conversation." |
| Reporting | Report cards (grades 1–8) | shipped | admin/teacher; parents view | `report_cards` permission | "One-click or bulk PDF report cards with letter grades (1–3) or percentages (4–8), work habits & behaviour, teacher comments, school logo, signature and stamp." |
| Reporting | T1/T2/Final report card | shipped, **Al Haadi only** | — | hard-coded to `ALHAADIACADEMY` + term "Term 2" | Don't market generically. Use "custom formats built for your school". |
| Reporting | Progress reports (1–8) | shipped | same | — | "Mid-term progress reports with work habits, behaviour and comments per subject." |
| Reporting | JK/SK competency reports | shipped | teacher, admin | grade JK/SK | "Skill-based kindergarten progress reports and report cards with configurable skill domains and standards." |
| Reporting | AI comment drafting | shipped | teacher | — | "Draft report-card and progress comments with AI, then edit." |
| Reporting | Report emails to families | shipped (queued delivery on origin/main) | admin | `report_cards` | "Email report cards (PDF) to parents individually or in bulk, with delivery tracking and retry." |
| Reporting | Analytics + at-risk watchlist + AI | shipped | staff with `analytics` | permission | "School → grade → class → student analytics, trends and term comparisons, plus an at-risk watchlist and an AI assistant that explains it." |
| Reporting | Student Views (saved lists) + certificates | shipped | staff with `students` | — | "Saved rule-based student lists (e.g. honour roll) that export to CSV, email families, or print certificates." |
| Reporting | Exports | shipped | staff | — | "Excel/CSV exports of gradebooks, student views, form submissions, analytics tables and tuition. PDFs of reports and schedules." |
| Ops | Timetable planner (solver) | shipped | admin (`scheduling`) | permission | "Describe your teachers, rooms, courses and rules; the planner generates conflict-free timetables (Google OR-Tools CP-SAT)." |
| Ops | Manual timetable builder | shipped | admin | — | "Or build a timetable by hand: drag sessions to move or resize them, with conflict warnings." |
| Ops | Staff attendance + pay periods | shipped | staff (self), admin (`staff_attendance`) | pay schedule per school | "Staff check in daily; admins see hours per pay period, with Ontario stat holidays paid automatically." |
| Ops | Google Sheets hours export | shipped | admin | sheet linked per school | "Keep a Google Sheet of staff hours up to date automatically, one tab per pay day." |
| Ops | Paid holidays | shipped | admin | calendar events per school | "Ontario statutory holidays are paid automatically; mark extra paid days in the calendar." |
| Ops | Approvals / signup | shipped | admin (`users`) | — | "Parents, teachers and students request an account at your school's sign-up page; you approve them in one place." |
| Ops | Custom staff roles (RBAC) | shipped | full admin | — | "Build custom staff roles (e.g. Office Staff) from 15 permissions." |
| Ops | Tuition (QuickBooks mirror) | partial | admin (`finance`) | QBO connection per school | "See every family's tuition invoiced, paid and outstanding, synced from QuickBooks Online." **Not invoicing, not payments.** |
| Ops | School calendar | shipped | admin edits; parents view | — | "A school calendar for closures, PA days and events, visible to parents." |
| Ops | Forms (registration etc.) | shipped | admin/staff; public | `forms` permission for school-wide | "Build online forms (e.g. registration) with a public link, track submission statuses, import submissions as students, and sync to Google Sheets." |
| Ops | Google sign-in | shipped | all | students: `studentSignIn` can be Google-only | "Sign in with Google." |
| Ops | School-year rollover | shipped | admin (`school_setup`) | — | "Roll over to a new school year with a guided wizard; past years stay viewable." |
| Ops | Student attendance (daily + per class) | shipped | teacher, admin | `attendance.daily` / `attendance.classes` | "Take daily and per-class attendance; parents see their child's attendance history." |
| Ops | Automated absence alerts | **not found** | — | — | Do not claim. |
| Ops | Student profiles | shipped | staff with `students` | — | "Every student's record, grades, attendance, messages and reports in one profile window." |
| Ops | User archive | shipped | admin | — | "Archive staff, parents and students without losing history." |
| Ops | Admin "View as" | shipped | full admin | — | "Admins can preview exactly what a teacher or parent sees (read-only)." |
| Ops | Parent portal | shipped | parent | — | "Parents get one portal per family: overview, classes, grades, messages, attendance, calendar, feedback, report cards and staff directory." |
| Ops | Student/parent invitations | shipped | admin, teacher | — | "Invite students by email or print QR sign-in cards for young grades." |
| Ops | Agenda (student planner) editor | shipped on main; prod status **uncertain** | admin (`scheduling`) | — | Niche; omit or "Build your printed student agenda book". |
| Ops | Observe console | shipped, internal | platform owner only | `PLATFORM_OWNER_EMAILS` | **Not marketable.** |
| Ops | Student Information System | shipped | staff | — | "One record per student: contacts, guardians, OEN, health card, medical notes, homeroom and class enrolment." |
| Platform | Responsive web | shipped | all | — | "Works in any modern browser on desktop, tablet and phone." |
| Platform | Native app / PWA | not found | — | — | Do not claim. (Memory says an iOS app is being built outside these repos.) |
| Platform | French / i18n | not found | — | — | English only. |
| Platform | Arabic / RTL | not found | — | — | Do not claim. (Arabic/Quran/Islamic Studies are recognised as *subjects* for class banners only.) |
| Platform | Accessibility | partial | — | — | No WCAG claim. |
| Billing | Free trial / plans / pricing | not found | — | — | No trial or billing code. "Start Free Trial" goes to a user sign-up page for existing schools. |

### 1.2 Per-feature evidence

#### Classroom

**Student portal** (shipped 2026-10-19).
- FE: `src/app/(user)/classes/[classId]/page.tsx` (tabs Stream · Classwork · Grades · People · Settings), `src/app/(user)/classes/[classId]/items/...`, `src/app/(user)/student/*` (home, classes, grades, todo, items, quiz, messages), `src/app/(user)/parent/classes/*` (read-only lens), `src/app/(user)/qr/page.tsx` (QR sign-in), `src/components/classroom/`.
- BE: `routes/classroom.routes.js` (items, topics, attachments/links, copy class, submissions, publish, mark-missing, excuse, quiz questions, banners, QR-card PDF), `routes/studentPortal.routes.js` (student home/classes/todo/turn-in/unsubmit/quiz/announcements/conversations), `services/classroom/*`, migrations `student_portal_00…31`.
- Item kinds: `assessment | assignment | quiz | material` (`database/migrations/student_portal_20_classwork.sql:35`). Submission modes: file/text/done/none. Statuses: draft/scheduled/posted. Audience: all or some.
- Per-school settings: `services/classroom/classroomSettings.js` (origin/main), table `school_classroom_settings` (`student_portal_01_accounts.sql:41`).
  - `enabled` defaults FALSE.
  - `loginFromGrade` defaults '1'.
  - `qrUntilGrade` defaults '3' (QR cards for young students).
  - `studentEmailFromGrade`, `parentsReadPrivateComments`, `studentPhotos` (FALSE), `studentEmailDomains`, `studentSignIn` (`google_or_password` | `google_only`).
- Classroom emails (`services/classroom/classroomNotifier.js`): to students (`new_work`, `due_reminder` at 5 pm, `graded`) and to guardians (`missing_alert` at 4 pm, `weekly_summary`).
- Limits:
  - Grades JK–8 only (`src/lib/schoolUtils.ts` GRADE_OPTIONS).
  - The portal is off until a school turns it on.
  - Files are capped at 10 MB (`classwork-submissions` bucket, `student_portal_21b`).

**Quizzes.**
- `database/migrations/student_portal_30_quizzes.sql`: question kinds `one | many | short | long`, `quiz_release IN ('after_review','on_submit')`.
- BE `controllers/quiz.controller.js`, `services/classroom/quizScoring.js`.
- FE `src/app/(user)/classes/[classId]/items/[itemId]/quiz/page.tsx`, `src/app/(user)/student/items/[itemId]/quiz/page.tsx`.
- Accurate: "auto-scored multiple choice; teacher reviews written answers".

**"Lab feedback".** There is no lab-specific feature; "lab" is the demo film's example (`remotion/src/demo/scenes/Student.tsx:30-36`). The real feature is per-item feedback shown to the student and parent: `src/components/classroom/GradeItemRow.tsx:41`, `NewGradesCard.tsx:53`, and private comment threads `routes/classroom.routes.js:126-127`. Market it as "feedback on every assignment", not "lab feedback".

**Gradebook with weighted categories.**
- The gradebook moved into each class's Grades tab. Old `/gradebook/*` URLs redirect there (`src/components/gradebook/LegacyGradebookRedirect.tsx`).
- Grid: `src/components/gradebook/workspace/GradebookWorkspace.tsx`. It autosaves after 600 ms (`useScoreAutosave`, line 7), exports to Excel (`handleExportExcel`, line 676), and has report-card-comment and progress-comment sub-tabs.
- Engine: `schoolmule-backend/services/gradeEngine.js:1-22`.
  - A grade is the weighted average of assessments with evidence.
  - Blank = not counted; Missing = 0; Excused = ignored.
  - Categories (`is_parent`) roll up their children by weight.
  - One engine feeds the gradebook, report cards, parent portal, analytics, emails and Excel. There is a TS port at `src/lib/gradeEngine.ts`.
- Excel export: `controllers/studentAssessment.controller.js` (ExcelJS).
- "Bulk grade entry" = a spreadsheet-style grid with autosave. Paste/fill-down was not verified; say "fast grid entry".

**Publish & Notify.**
- FE `src/components/gradebook/publish/PublishAssessmentsModal.tsx:542-543` (button text "Publish & Notify" / "Publish & Notify again"), a preview-to-self button (line 508), `DeliveryList.tsx`, `PublishHistoryModal.tsx` (retry).
- BE `routes/assessmentPublish.routes.js`, `controllers/assessmentPublish.controller.js`, `services/gradesDigest.js` (enqueues inside the publish transaction), `services/email/outbox.js` (120 s hold, per-address idempotency key), migration `email_outbox_migration.sql`.
- Email content: one row per released item, plus a "Speak to <teacher> about this" button and a 30-day one-tap sign-in link for parents (`utils/emailLoginLink.js`, TTL `'30d'`).

**Assessment publishing gate.** `controllers/parentPortal.controller.js:33` `PARENT_VIEW = { publishedOnly: true }` → `services/analyticsEngine.js:118,176,419` prunes unpublished assessments before computing, so parent averages are recomputed, not just hidden. Migration `assessment_publish_migration.sql`.

**AI weekly summary.**
- BE `services/aiWeeklySummary.service.js`:
  - Provider and model: OpenAI Chat Completions, model **`gpt-4o-mini`** (line 27), temperature 0.6.
  - Generated on demand when the parent opens the dashboard, cached per student per week, and invalidated when new grades publish.
- Route: `GET /api/parent-portal/students/:studentId/weekly-summary` (`routes/parentPortal.routes.js:48`).
- FE: `src/components/parent/AiWeeklySummaryCard.tsx`, labelled "AI" with the footnote "AI-generated summary of the past week · always confirm details with your child's…". Rendered on `src/app/(user)/parent/dashboard/page.tsx:191`.
- Data sent to OpenAI (`gatherWeekFacts` / `buildUserPrompt`, lines 98-230):
  - the child's name;
  - subject names and assessment names with percentages, for grades **published** that week;
  - attendance counts (present/late/absent);
  - names of missing work;
  - progress-report teacher comments written that week.
- **Opt-in?** No. There is no school or parent switch. It shows whenever the backend has `OPENAI_API_KEY`, which Railway production does (variable name present).
- The separate `parentSummary` switch only controls the non-AI weekly/daily *email* (`queries/classroomEmail.queries.js:291`).

#### Communication

**Parent–teacher messaging.**
- BE `routes/messaging.routes.js`, `controllers/messaging.controller.js`; migrations `messaging_migration.sql`, `messaging_phase2_migration.sql`, `messaging_leadership_migration.sql`.
- FE `/messages` (staff), `/parent/messages`, `/student/messages`, `/admin-panel/messages` (`messages.all`).
- Conversations are `assessment` threads (pinned to a student × class × published assessment) or `general` threads. Principal/VP messaging uses `users.staff_title`.
- Students' threads always include their parents (student portal).

**Attachments.** `utils/attachmentUpload.js:13-30`: private bucket `message-attachments`; max 5 files, 10 MB each; jpg/png/gif/webp/pdf/doc/docx; signed URLs for 1 h.

**Reply reminders.** origin/main only (local main is behind).
- `services/replyReminders.js`, `queries/replyReminder.queries.js`, `templates/replyReminderEmails.js`, migration `reply_reminders_01.sql`.
- Rules:
  - The teacher is reminded on school day 2 and day 4.
  - Staff with `messages.all` are told the next school day.
  - Guardians get one nudge when a teacher's message goes unanswered.
- Both switches default **off** (`classroomSettings.js` DEFAULTS).
- Which schools have them on is **uncertain** (memory says Al Haadi is on).

**Announcements.** Migrations `announcements_migration.sql`, `announcements_v2_migration.sql:16` (`scope IN ('class','grade','school','custom')`). BE `routes/announcement.routes.js`, `queries/announcement.queries.js`. Features: email jobs, read receipts, opt-in acknowledgements ("Got it"), pinning, attachments, "Reply privately" → General thread. Students can be included (`student_portal_03_announcement_students.sql`).

**Email digests.** `services/messageNotifier.js` (origin/main header): one email per (conversation, recipient) 2 minutes after the first unseen message. It is skipped if the recipient has already read the thread, muted it, or has no address.

**Guardian invites.** `controllers/messaging.controller.js:32,40,177`: an invite email with a 7-day token lands the parent in the thread; resend has a 1 h cooldown; one reminder after 3 days.

#### Reporting

**Report cards (grades 1–8).**
- `templates/reportCardTemplate.js`:
  - grades 1–3 get letters A+…D-; grades 4–8 get `NN.N%`;
  - below 50 = `R`; no evidence = `I` (lines 9-47);
  - Work Habits & Behaviour (E/G/S/N), teacher comments, OEN, days absent;
  - school logo, principal signature and stamp from the `school-assets` bucket.
- BE `routes/reportCard.routes.js` (generate, generate/bulk, feedback, feedback/bulk, view, delete/bulk). PDFs come from Puppeteer (`utils/pdfGenerator.js`) and are stored in the `report-cards` bucket, served by signed URL.
- FE `/report-cards/generate`, `/report-cards/view`; parents see theirs at `/parent/report-cards/[studentId]`.
- Format: **Ontario-style conventions** (OEN, E/G/S/N learning-skill-style ratings, R below 50%). It is **not** the Ontario Ministry provincial report card template. Don't say "provincial report card".
- **T1/T2/Final**: `templates/alHaadiT2ReportCardTemplate.js`, selected only when the school is `ALHAADIACADEMY` and the term contains "term 2" (`controllers/reportCard.controller.js:602, 756`).
- **"Custom per school"**: only by developer build (Al Haadi T2, JK/SK). There is no template builder. The brief's Quebec "bulletins" claim is a services promise, not existing code.

**Progress reports (1–8).** `templates/progressReportTemplate.js`: per-subject Work Habits, Behaviour, Overall (E/G/S/N), core standards, teacher comments; no grades. BE `routes/progressReports.routes.js`.

**JK/SK.**
- BE `routes/jk.routes.js`, `routes/sk.routes.js`: CRUD for domains/skills (JK) and subjects/standards (SK), bulk ratings, comments, teacher-assistant names, single and bulk PDF generation.
- FE `src/app/(user)/gradebook/jk/[classId]`, `/gradebook/sk/[classId]`, `src/components/gradebook/workspace/JKGradebookWorkspace.tsx`, `SKGradebookWorkspace.tsx:52-67`.
- **Exact scales:**
  - JK progress report: **D / B / I / N**. D = Developing, B = Beginning, I = Improvement needed, N = Not assessed (`templates/alHaadiProgressReportJKTemplate.js:277-280`).
  - JK report card: **BG / DV / NI**, plus Learning Skills **E / G / S / N** (`alHaadiReportCardJKTemplate.js:3,471`; `JKDomainEditModal.tsx:152`).
  - SK progress report: **E / G / S / NI / NA** (`alHaadiProgressReportSKTemplate.js:308-312`).
  - SK report card: **E / P / DV / EM / NI / N/A**. E = Exemplary, P = Proficient, DV = Developing, EM = Emerging, NI = Needs Improvement (`alHaadiReportCardSKTemplate.js:4`; `SKGradebookWorkspace.tsx:61-67`).
  - So the brief (E/P/DV/EM/NI/NA = SK report card) and memory (D/B/I/N, BG/DV/NI = JK) are each half right.
- Limits: the templates are Al Haadi's layout (file names `alHaadi*`, name fallback 'Al Haadi Academy'). Any school gets that layout with its own name and logo. "Aligned to Ontario's kindergarten program" is **unverified** (no curriculum mapping in code). Say "skill-based kindergarten reporting".

**Report emails.**
- BE `routes/reportEmails.routes.js`: send, send/bulk, runs, runs/:id, retry (origin/main).
- `services/reportEmails.js`: one email per parent address via `email_outbox`, PDF attached. Recipients are `mother_email`/`father_email` or typed addresses.
- FE `src/components/report-emails/`.

**Analytics / AI insights / at-risk.**
- FE `src/app/(user)/analytics/page.tsx` and `_components/`:
  - views: SchoolOverview, GradeCohort, Class, Subject, Student, TermComparison;
  - charts: Quartile, ScatterDifficulty, TrendLine;
  - `tables/AnalyticsTable.tsx` (CSV);
  - `ai/AtRiskWatchlist.tsx` (deterministic risk score `computeAtRiskScore`, AI explains on demand), `ai/AiInsightsPanel.tsx`, `ai/AiChatDrawer.tsx`, `ai/AiReportComposer.tsx`.
- AI routes: `src/app/api/ai/analytics/{insights,chat,report-composer,at-risk-explain}/route.ts` (all `gpt-4o-mini`, gated by `requireStaffSession(..., { permission: 'analytics' })`).
- Also `src/components/dashboard/DailyBriefing.tsx` → `api/ai/dashboard-briefing`.
- BE `services/analyticsEngine.js`, `routes/analytics.routes.js`.
- **The "AI insights & at-risk watchlist" claim is TRUE.**

**Exports.**
- BE: gradebook xlsx (`controllers/studentAssessment.controller.js`); student views csv/xlsx and certificate PDF (`routes/studentView.routes.js:34-37`); form submissions csv/xlsx (`controllers/registration.controller.js`); tuition grid csv/xlsx (`routes/finance.routes.js:43`); schedule PDF (`services/scheduleExport.js`); staff attendance PDF (`routes/teacherAttendance.routes.js:39`); QR card PDF; report PDFs.
- FE: analytics table CSV.

#### School operations

**Timetable planner (solver).**
- FE `src/app/(user)/admin-panel/schedule-planner/*`, `src/components/schedulePlanner/` (ClassGroups, Courses, Teachers, Rooms, DayTemplates, Rules tabs).
- BE `routes/schedulePlanner.routes.js`, `services/scheduleSolver/` (JS portfolio solver, validator, diagnostics, diversity), `services/scheduleSolver/run.js:91-123`. When `SOLVER_URL` is set it POSTs to the **Python OR-Tools CP-SAT** service, with JS fallback.
- Production Railway has `SOLVER_URL` pointing at a `*.railway.internal:8000` service, so **CP-SAT is deployed** (contrary to an older memory note).
- Output: several diverse valid candidates, or diagnostics when infeasible.
- Sharing: public share links `src/app/(public)/[schoolSlug]/schedule/[token]` (`routes/schedulePublic.routes.js`). Staff views `/my-schedule` and `/school-schedule`.

**Manual builder / "drag-and-drop".** `src/components/schedulePlanner/WeeklyGrid.tsx:64-74` (drag a session to a new day/time, drag its bottom edge to resize), `SessionEditorModal.tsx`, `conflicts.ts` (conflict detection for hand-placed sessions). **"Drag-and-drop with conflict alerts" is accurate for the manual builder.** The generated timetables need no conflict alerts by construction.

**Staff attendance and pay periods.**
- BE `routes/teacherAttendance.routes.js` (`/checkin`, `/me/pay-period`, `/pay-schedule`, `/pay-periods`, `/work-days/:teacherId`, `/hours-per-day/:teacherId`, `/pdf`), `services/staffAttendance/assembly.js`, `services/payPeriods.js`; migrations `staff_pay_schedules*.sql`, `staff_work_schedules_migration.sql`.
- FE `/staff-attendance`, `/my-attendance`.
- Staff are assumed present on their work days (computed at read time).
- Check-in is self-reported in-app. There is no geofence, IP or QR check.

**Google Sheets hours export.**
- `services/google/staffHoursSyncEngine.js`, `staffHoursSheetLayout.js`, `sheetSyncWorker.js`; routes `/teacher-attendance/sheet*`; migration `staff_hours_sheet_migration.sql`.
- OAuth scope is `drive.file` only (privacy page). Tokens are encrypted with AES-256-GCM (`utils/tokenCrypto.js`).

**Paid holidays.** `services/staffAttendance/statHolidays.js:3-72`: **Ontario** ESA stat holidays computed from the date (New Year's, Family Day, Good Friday, Victoria Day, Canada Day, Labour Day, Thanksgiving, Christmas, Boxing Day). Civic Holiday and Easter Monday are excluded; schools mark those as paid in the calendar. Migration `staff_paid_holidays_migration.sql`. **Ontario-only.**

**Approvals / signup.**
- FE `/signup` (directory) → `/signup/[schoolSlug]` → `/parent|teacher|student`; `/admin-panel/approvals`.
- BE `routes/adminApproval.routes.js` (approve, role, name, decline, restore, resend-verification, verify-email), `routes/adminStudentRequest.routes.js`, `services/approvalActions.js`.
- The directory is a **static list of 5 schools** (`src/lib/schoolUtils.ts:68-74`). Onboarding a new school needs a DB enum migration plus code changes (`signup_schools_2026_10_migration.sql`). There is **no self-serve school sign-up**.

**RBAC.**
- `schoolmule-backend/config/permissions.js`: 15 permission keys in 5 groups (Academics, People, Attendance, Communication, Operations); built-in Admin and Teacher; "Office Staff" preset.
- Enforcement: `middleware/access.js` (re-reads from the DB on every request); FE `src/lib/permissions.ts` ROUTE_RULES.
- FE `/admin-panel/roles`; migration `staff_roles_migration.sql`.

**Tuition (QuickBooks).**
- BE `routes/finance.routes.js`, `routes/financePublic.routes.js` (OAuth callback), `services/finance/qbo*.js`, `financeSyncWorker.js`, `gridAssembly.js`, `alerts.js`; migrations `finance_qbo_migration.sql`, `finance_manual_credits_migration.sql`.
- FE `/finance/tuition`.
- QBO calls are reads only (no POST to QBO besides the OAuth token exchange, `services/finance/qboAuth.js:57,205`), although the OAuth scope is the full `com.intuit.quickbooks.accounting` (`qboAuth.js:21`).
- **Limits:**
  - It is a read-only mirror of QBO invoices and payments, grouped into families (expected monthly parent/subsidy amounts, anomalies, manual prepaid credits, CSV/Excel export).
  - **No invoicing, no payment collection, no payment plans, no parent-facing tuition view.**
  - The in-app invoicing tables were **dropped** in June 2026 (`database/migrations/drop_deprecated_features_migration.sql:1-17`, commit `098e3b8`, 2026-06-05).
  - Which schools have QBO connected is **uncertain** (memory: Al Haadi).

**Calendar.** `routes/schoolCalendar.routes.js` (CRUD), migration `school_calendar_migration.sql` (staff_day off|paid|work); FE `/admin-panel/school-calendar`, `/parent/calendar`.

**Forms.**
- FE `/admin-panel/forms` (builder with dnd-kit `src/components/registration/FormBuilder/`), `/submissions`, `/statuses`; public form `src/app/(public)/[schoolSlug]/[formSlug]`.
- BE `routes/registration.routes.js` (import submissions as students, mappings), `registrationPublic.routes.js`, Google Sheets sync (`services/google/sheetSyncEngine.js`).
- Migrations `registration_*`, `google_sheets_sync_migration.sql`.
- Public submissions log IP for spam prevention (privacy page).

**Google sign-in.** BE `POST /api/auth/google` (`routes/auth.routes.js`), `services/google/googleSignIn.js`, migration `google_sign_in_migration.sql` (users.google_sub). Basic profile only.

**School-year rollover.** BE `routes/schoolYear.routes.js:15-16` (`/rollover/preview`, `/:id/rollover`), `controllers/schoolYearRollover.controller.js`; FE `/admin-panel/school-settings/new-year`; `X-School-Year` header + `middleware/resolveSchoolYear.js`.

**Student attendance.**
- BE `routes/attendance.routes.js` (POST/GET `/general`, `/class`, `/class/:classId`).
- FE `/attendance/general`, `/attendance/class`, `/attendance/class/[classId]`; parent `/parent/attendance`.
- Statuses: present / late / absent.
- **Automated absence alerts: not found.** No code emails parents on absence. A git grep for absence/attendance email/notify on origin/main returned nothing.
- **Compliance/"state compliance" reports: not found.** There is no attendance export for students, only days-absent on report cards.
- The 4 pm alert that does exist is for **missing work**, not attendance.

**Student profiles.** `src/components/student/profile/StudentProfile.tsx`, `StudentProfileHost.tsx`, tabs Overview/Grades/Attendance/Messages/Reports; URL `?profile=<id>` (`src/lib/studentProfileUrl.ts`); BE `routes/student.routes.js:36-39`.

**User archive.** BE `routes/adminUser.routes.js:26-27`, `routes/student.routes.js:43-44`; migration `user_archive_migration.sql`. Archived accounts are refused on every request (`middleware/access.js:35`).

**Admin "View as".**
- BE `routes/adminUser.routes.js:28` → `controllers/adminUser.controller.js:50` (`IMPERSONATION_TTL = "2h"`, `impersonator` claim).
- `middleware/verifyUserMiddleware.js:7,57-61` refuses any non-GET/HEAD/OPTIONS request with `IMPERSONATION_READ_ONLY`.
- FE `src/components/impersonation/ImpersonationBar.tsx`. Full-admin only.

**Parent portal sections.** `src/components/sidebar/Sidebar.tsx:79-87`: Overview, Classes, Grades, Messages, Attendance, Calendar, Feedback, Report Cards, Staff Directory (plus `/parent/notifications` prefs). BE `routes/parentPortal.routes.js`. Child switcher for multi-child families. Dual-role staff-parents switch views (`POST /api/auth/view`).

**Student/parent invitations.**
- Students: email-import invites (`controllers/studentEmailImport.controller.js`, `services/classroom/studentInvites.js`, `/student-invite` page, password min 8 + common-password check at line 150-169), QR cards PDF (`routes/classroom.routes.js:64`), student account requests (`controllers/studentRequest.controller.js`).
- Parents: guardian invites from messaging; admin invites from `/admin-panel/users` (7-day token).

**Observe console.** `src/app/(user)/observe/*`, `routes/observe.routes.js` behind `middleware/requirePlatformOwner.js`. Internal monitoring; **not marketable**.

**Student Information System.** Fields (`src/components/student/StudentFormFields.tsx:87-292`): full name, grade (JK–8), DOB, OEN, health card, gender, student email, homeroom teacher, mother/father name, email, phone, address, emergency contact, medical & allergy notes. Bulk class enrolment `routes/class.routes.js:52-53`. Multi-year history via school years.

**Other shipped items not on the list.**
- What's New / patch notes (`/whats-new`, `/admin-panel/patch-notes`).
- Teacher dashboard with AI Daily Briefing (`src/components/dashboard/DailyBriefing.tsx`).
- Student Views with certificates.
- School assets (logo/signature/stamp, `/admin-panel/school-assets`).
- Parent relations admin (`/admin-panel/relations`).
- Dual-role staff+parent accounts.
- Email letterhead per school (`templates/emailLayout.js`; sender `"School" <school@schoolmule.ca>` or the school's own verified domain, `services/email/senderIdentity.js`).
- Profile photos (`services/profile/photos.js`).
- Class copy to next term (`routes/classroom.routes.js:102-103`).

#### Platform

- **Responsive web:** yes; sidebar mobile mode; QR sign-in for shared classroom devices.
- **No PWA:** no manifest, no service worker (`next.config.ts` is empty; no `manifest*` under `src/app`).
- **No native app** in either repo (no capacitor/react-native/expo in `package.json`). Memory notes an iOS app is in progress elsewhere; **do not claim**.
- **Languages:** English only. No i18n library (`package.json`); `<html lang="en">` (`src/app/layout.tsx:56`). French is only recognised as a subject (`src/lib/classIdentity.ts:13-77`). The brief's "French-language setup" is a services promise, not code.
- **Arabic/RTL:** none (no `dir="rtl"`, no Arabic fonts).
- **Accessibility:** about 737 `aria-*` attributes and 187 `role=` in `src/`; `prefers-reduced-motion` honoured in 2 places (`globals.css:382`, `HeroDemoVideo.tsx:42`); stack-aware Escape in the shared Modal. No axe/jsx-a11y tooling and no WCAG audit. **Do not claim WCAG/AODA conformance.**

---

## 2. Security & privacy facts

### Where data lives
- **Database:** Supabase Postgres. Production `PG_HOST` (Railway env) = `aws-0-us-east-2.pooler.supabase.com`, i.e. **AWS us-east-2 (Ohio, USA)**. The local backend `.env` points at the same pooler host. → **Do NOT claim Canadian data residency.**
- **Backend:** Railway, project "schoolmule", service `schoolmule-backend`, environment `production`, region **`us-east4-eqdc4a`** (Railway US East, Virginia), 1 replica (`railway status --json`). Public API `api.schoolmule.ca` (headers: `server: railway-hikari`, `x-powered-by: Express`).
- **Frontend:** Vercel (`server: Vercel` on schoolmule.ca; HSTS `max-age=63072000`). The Next.js AI routes run as Vercel functions. Their region is **uncertain** (not configured, so likely Vercel's default US East).
- **File storage:** Supabase Storage, same project/region. Buckets referenced in code:
  - `avatars`: **private** (`student_portal_02b_avatars_bucket.sql`, `public=false`, 2 MB, jpeg/png/webp). Signed URLs for 6 h (`services/profile/photos.js:14`).
  - `classwork-submissions`: **private** (`student_portal_21b`, 10 MB). Signed URLs.
  - `message-attachments`: private per memory. Signed URLs for 1 h (`utils/attachmentUpload.js:16`).
  - `report-cards`, `progress-reports`: accessed only by signed URL (1 h; parent routes 10 min).
  - `agendas`, `registration-forms`: signed URLs.
  - `school-assets`: **public** per code comment (`services/classroom/classView.js:10`, class banners via `getPublicUrl`). Logos, **principal signatures and school stamps** are also stored here (signed URLs are used, but the bucket itself is public). Flag internally.
  - `patch-note-images`: public.
  - Exact bucket flags for buckets created outside migrations are **uncertain** (not checked in the DB).
- **Email:** Resend. One team; senders `@schoolmule.ca` plus a school's own verified domain (`services/email/senderIdentity.js`). Resend's data region is **uncertain** (not set in code; Resend's default is US). Memory says both Resend teams were on the **free plan** (100/day) as of 2026-10-10. Verify before scaling claims.
- **AI:** OpenAI API (`https://api.openai.com/v1/chat/completions`, `gpt-4o-mini`) from two places:
  1. Backend AI weekly summary for parents (see §1.2). It sends the student's name, published assessment names and percentages, attendance counts, missing-work names, and progress-report comments.
  2. Next.js `/api/ai/*` routes for staff. Comment generators send student name, subject, work-habit/behaviour ratings and grade %. Analytics chat/insights/report-composer/at-risk-explain send the analytics snapshot on screen (student names and grades).
  - All staff routes require a live staff session (`src/lib/server/aiSession.ts`).
  - **OpenAI is not listed as a service provider on the privacy page.**
- **Other processors in use but not on the privacy page:**
  - Intuit QuickBooks (finance).
  - Vercel (hosting; `@vercel/analytics` in `src/app/(user)/layout.tsx`, signed-in app only).
  - Calendly (embed on /demo).
  - Google is listed.
- **Observability data:** own tables `request_events`, `login_events`, `error_events`, `client_events` (`observe_migration.sql`), retained **90 days** (`services/observe/retentionWorker.js:1-19`). Pino logs redact passwords and tokens (`logger.js:42-57`).

### Authentication and access
- **Passwords:** bcrypt, 10 rounds (`controllers/auth.controller.js:244,275`; `user.controller.js:179`). Adult minimum length is only **6** (`auth.controller.js:125`). Student invite passwords need ≥8 plus a common-password check (`services/classroom/studentInvites.js:150-169`).
- **Sessions:** JWT (HS256 via `jsonwebtoken`).
  - Staff/parent tokens last **7 days** (`auth.controller.js:34`); students **12 h** (line 36); "View as" tokens **2 h** (`adminUser.controller.js:50`); parent email one-tap links **30 days** (`utils/emailLoginLink.js:20`, separate HMAC-derived key).
  - Tokens are stored in browser `localStorage` (`src/services/authService.ts:10-20`) and sent as a Bearer header.
  - Student sessions can be revoked (`sessionRevoked`, `auth.controller.js:1095`).
  - Archived accounts are refused on every request (`middleware/access.js`).
- **MFA:** **none** (no TOTP/2FA code anywhere).
- **Google sign-in:** Google Identity Services code flow, basic profile only (`services/google/googleSignIn.js`). Schools can force Google-only sign-in for students.
- **Rate limiting** (`middleware/globalRateLimit.js`, `middleware/spamProtection.js`):
  - 1000 req/min per signed-in user (per IP when anonymous).
  - Failed password sign-ins: 10 / 15 min per network+account.
  - Failed sign-ins on any route: 100 / 15 min per network.
  - Signup 5/h per IP; contact form 5/h per IP plus honeypot; password reset 3 / 15 min; verification email 3 / 15 min.
  - QR cards 10 failures / 15 min per card.
- **Role/permission enforcement:**
  - Server-side RBAC on every request (`middleware/access.js` re-reads permissions from the DB; `config/permissions.js`).
  - Class-scoped guards: `requireClassOwnership`, `requireGradebookAccess`, `requireStudentAccess`, `verifyParentOwnsStudent`, `studentFence` (students fenced to `/api/student`).
  - Note: `middleware/parentApiGate.js` defaults to **log-only** (`RBAC_PARENT_GATE` is not set on Railway). It is defense in depth on top of per-route guards; don't describe it as enforced.
- **Tenant isolation:** rows carry a `school` column; staff tokens are bound to one school. RLS is enabled with **no policies** on 53 migration-created tables (`grep "ENABLE ROW LEVEL SECURITY"`), so PostgREST/anon access is denied by default. The backend connects server-side (pg pool + service-role Supabase client).
- **Read-only impersonation:** enforced in `middleware/verifyUserMiddleware.js:57-61`. Full-admin only (`config/permissions.js:13-15`).
- **Audit/observability:**
  - Login events, request events and error events in the owner-only Observe console.
  - Publish audit (`assessment_publication_batches/_emails`); finance link audit (`family_link_audit`); report email runs.
  - There is **no** general per-record change audit log or customer-facing audit log. Say "sign-in and activity logging", not "audit logging".
- **Missing:** no `helmet`/CSP/X-Frame-Options headers (none on schoolmule.ca or the API); `x-powered-by: Express` is exposed.

### Data handling
- **Signed URLs** for photos (6 h), messages (1 h), classwork, report PDFs (1 h; 10 min on some routes).
- **Student photo consent gating:** `school_classroom_settings.student_photos` defaults FALSE (`student_portal_01_accounts.sql:53`). `services/profile/photos.js:85-130` drops student photo URLs while it is off. Adult photos are optional and never gated.
- **Encryption in transit:**
  - Browser↔Vercel and browser↔Railway use HTTPS (HSTS on the site).
  - Backend↔Supabase uses TLS (`config/database.js` `ssl: { rejectUnauthorized: false }`): encrypted, but **the certificate is not verified**.
  - Backend↔CP-SAT solver uses plain HTTP on Railway's private network (`SOLVER_URL=http://…railway.internal:8000`).
- **Encryption at rest:**
  - Supabase's provider default (AES-256 at rest per Supabase's documentation; not configurable in code).
  - Application-level **AES-256-GCM** only for Google and QuickBooks refresh tokens, with a separate key per integration (`utils/tokenCrypto.js:1-45`; env `GOOGLE_TOKEN_ENC_KEY`, `QBO_TOKEN_ENC_KEY`).
- **Backups:** **nothing documented.** `services/agendaAssembler.js:28-30` refers to "the free plan's 50MB object limit", which suggests the Supabase project is on the **Free plan**. Managed daily backups/PITR are paid-plan features. → **Do not claim "daily backups" until the plan is confirmed.** The terms page (`terms/page.tsx:60-61`) already says "including regular backups"; that is also unverified.
- **Deletion/archive:**
  - Users and students are soft-archived (`is_archived`) with history kept.
  - Hard delete exists (`DELETE /api/admin/users/:id`, `DELETE /api/students/:id`), guarded per memory.
  - There is no self-serve school-wide export or delete; the terms page says it happens on request.
  - Retention: observe tables 90 days; other data kept while the account exists (privacy page).
- **Children's data:** the privacy page (`privacy/page.tsx:159-165`) says "We are not directed at children and do not knowingly collect information directly from them". **This conflicts with the shipped student portal.** Students sign in, turn in work, answer quizzes and message teachers, and schools can collect student emails. Update this before launch.

### Do NOT claim (no evidence)
- FERPA / COPPA "compliant": US laws, no assessment in code or docs.
- SOC 2, ISO 27001, "regular security audits", penetration tests.
- Canadian data residency: data is in **US** (Ohio DB, Virginia API).
- PIPEDA/MFIPPA compliance badges (nothing documented). It is fine to say the terms page is governed by Ontario law.
- MFA, "end-to-end encryption", "TLS 1.3" (not configured by us), "256-bit AES encryption for all data".
- 99.9% uptime/SLA. There was an **11-hour outage on 2026-10-22** (memory `project_secret_rotation_outage.md`).
- "Daily backups", "unlimited storage", "unlimited concurrent users with auto-scaling" (1 Railway replica), "<200 ms response time".

### Safe, verifiable security statements
- "Passwords are hashed with bcrypt; we never store them in readable form."
- "Role-based access: every request is checked against the user's role and permissions on the server."
- "Each school's data is separated; staff accounts can only reach their own school."
- "Sign-in attempts are rate-limited per account and per network."
- "Files, photos and report cards are served through short-lived signed links."
- "Student photos stay hidden until your school turns them on."
- "Admins can preview a teacher's or parent's view in a read-only mode."
- "Google and QuickBooks connection tokens are encrypted (AES-256-GCM)."
- "Hosted on Supabase (database & files), Railway (API) and Vercel (website), in the United States."
- "AI features use OpenAI; parents' weekly summaries are labelled as AI-generated."
- "We don't sell data or use it for advertising." (Privacy page; consistent with code: no ad trackers, and Vercel Analytics only inside the app.)

---

## 3. Current website audit

### 3.1 Factual claims, by file and line

Status: **V** verified · **U** unverified (can't be proven from code; needs founder confirmation) · **F** false or contradicted by code.

**`src/app/(prelogin)/page.tsx` (homepage)**

| Line | Claim | Status | Note |
|---|---|---|---|
| 51,54 | SIS: "Centralize … in one secure location"; profiles, parent contacts, multi-term tracking | V | §1.2 SIS |
| 59,62 | "PDF report cards in minutes"; one-click, bulk, **"Custom templates"** | V / partial | No template builder; custom = built by us |
| 67,70 | Analytics: live dashboards, trend analysis, data exports | V | |
| 75,78 | "Visual schedule builder with conflict detection"; Drag-and-drop, Conflict alerts, Multi-grade | V | Manual builder (`WeeklyGrid.tsx`) + solver |
| 83,86 | "Handle tuition, payments, and invoicing without separate billing software"; **Auto invoicing**, Payment tracking, Revenue reports | **F** | Invoicing dropped 2026-06; finance is a read-only QBO mirror. "Payment tracking" (from QBO) is V; "Revenue reports" partial (tuition grid) |
| 91,94 | Parent portal: real-time grades, attendance, communications; Grade access, **"Attendance alerts"**, Direct messaging | partial / **F** | No attendance alerts. Grades are shown once published (not "real-time") |
| 99 | "20+ Hours Saved per week on admin" | U | Brief says to use honestly as a positioning outcome; no measurement |
| 100 | "100% Faster report card generation" | U (meaningless) | Drop |
| 101 | "99.9% Uptime, Reliability guarantee" | **F** | No SLA; 11 h outage 2026-10-22 |
| 123 | "Trusted by 50+ Schools Nationwide" | **F** | Signup directory lists 5 schools (`src/lib/schoolUtils.ts:68-74`); brief says "several (5+)" Ontario schools and forbids "50+" |
| 137-140 | "streamlines everything from student enrollment to report cards" | V | |
| 146-157 | CTAs "Request Demo" → `/demo`; "Start Free Trial" → `/signup` | **F** (trial) | `/signup` is "Find your school" for existing tenants; no trial exists |
| 251 | "Designed for educators, by educators" | U | |
| 271,356,389,470 | Fake URL bars `schoolmule.ca/gradebook`, `/parent`, `/attendance`, `/analytics` | F (cosmetic) | The real gradebook lives at `/classes/<id>`; parent at `/parent/dashboard` |
| 277,362,395,476 | Screenshots `public/images/*.png` | stale | Gradebook/Analytics 2026-06-05; Parent Portal/Attendance/ReportCard/Student/Tuition from 2025-07-24 (TuitionScreenshot shows the dropped invoicing UI) |
| 297 | "Weighted assessments, automatic calculations, and instant report card generation" | V | |
| 301 | Weighted categories, real-time calculations, bulk grade entry | V | "bulk" = grid entry |
| 329-333 | Child dashboards, **"Real-time report card access"**, direct school communication | V | Report cards visible once generated |
| 415 | "automated parent notifications" (attendance) | **F** | |
| 418 | "General & class-specific attendance" V; **"Automated absence alerts"** F; **"Compliance report generation"** F | | |
| 495 | "flag at-risk students early" | V | AtRiskWatchlist |
| 501-503 | "96% Avg. Attendance", "+12% Grade Trend", "20h Saved / Week" | U (illustrative) | Presented as data; no source. Remove or label as example |
| 520 | Live attendance & enrollment charts; grade distribution & trends; **at-risk early alerts** | V / partial | At-risk is a watchlist, not pushed alerts |
| 542-557 | 5-star testimonial "SchoolMule has transformed…" — **Majida Shoauib, Principal, Al Haadi Islamic School** | U | Al Haadi's name in code is **"Al Haadi Academy"** (`src/lib/schoolUtils.ts:5`); confirm the person, the quote, the spelling and the permission. No source for "5 stars" |
| 581 | "Join forward-thinking schools…" | U | |
| 582 | "start your free trial today" | F | |
| 603 | `info@schoolmule.ca` | U | Not verifiable; the backend contact form goes to `SUPPORT_EMAIL` (a different inbox). Confirm the mailbox exists |

**`src/app/(prelogin)/product/page.tsx`**

| Line | Claim | Status | Note |
|---|---|---|---|
| 53 | "lifecycle management from enrollment to graduation" | partial | Enrolment via forms/import; no graduation workflow (rollover only) |
| 57-60 | demographics & contacts V; "Family management for multi-child families" V (parent-student links; finance families); bulk enrollment & class assignments V; historical tracking V | | |
| 69 | "standards-based grading" | partial | Only JK/SK competency grading |
| 73-76 | weighted categories V; real-time V; **"Multi-term support (semester, trimester)"** partial (configurable terms per year; T1/T2/Final card Al Haadi only); grade analytics/trends V | | |
| 85,89-92 | One-click PDF V; teacher feedback V; **"Custom school branding"** V (logo/signature/stamp); digital parent portal access V | | |
| 101,105-108 | real-time analytics dashboard partial; **"Automated parent notifications"** F; **"State compliance reports"** F (also US wording) | | |
| 117,121-124 | **"automated invoicing"**, **"Flexible payment plans"**, **"Automated invoice generation"** F; "Real-time payment tracking" partial (scheduled QBO sync); "Revenue analytics" partial | | |
| 131 | Browser support "Chrome 90+, Firefox 88+, Safari 14+, Edge 90+" | U | Not tested/declared anywhere (no browserslist) |
| 132 | "Minimum 1 Mbps per user" | U | |
| 133-134 | Desktop/tablet/mobile responsive; Windows/macOS/Linux/iOS/Android | V (browser) | No native apps |
| 137 | "< 200ms average" response time | U | Observe has latency data, but no published figure |
| 138 | "Unlimited with auto-scaling" | **F** | 1 Railway replica; pool max 20 |
| 139 | "Unlimited with backups" | **F/U** | Supabase plan limits; backups undocumented |
| 140 | "99.9% SLA" | **F** | |
| 147 | "256-bit AES encryption" U (provider default only); "SSL/TLS 1.3 transport" U; **"End-to-end protection"** F; "Encrypted at rest" V (provider default) | | |
| 151 | Role-based permissions V; **"Multi-factor auth"** F; Session management V; "Audit logging" partial (sign-in/request logs, internal) | | |
| 155 | **"FERPA compliant", "COPPA compliant", "Regular security audits"** | **F/U** | US laws; no evidence |
| 160-163, 426 | Setup 1-2 days, migration 1-2 days, training 1 week, go-live day 14, "~1.5 weeks" | U | Services claims; no tooling for self-import beyond form import |
| 199 | "the most advanced school management platform available" | U (puffery) | |
| 456 | "CSV, Excel, and PDF export capabilities for all your data" | partial | Many exports exist; not "all data" |
| 470 | "Real-time or scheduled data synchronization options" | partial | Google Sheets sync (forms, staff hours); QBO sync. No general sync/API |
| 497 | "24/7 email support", "Phone support during business hours", **"Live chat assistance"**, "Screen sharing sessions" | F/U | No chat widget in code; 24/7 unverified |
| 513 | "Video tutorial library", "Live training webinars", "Comprehensive documentation", "On-site training available" | U | No docs site or video library in the repos (only one `public/videos/al-haadi-finance-guide.mp4`) |

**`src/app/(prelogin)/about/page.tsx`**

| Line | Claim | Status | Note |
|---|---|---|---|
| 52 | "Enterprise-grade security and FERPA compliance" | F | |
| 64 | "50+ Schools Served" | F | |
| 65 | "10,000+ Students Managed" | U, almost certainly F | Playground seed alone = 110 students; small schools |
| 66 | "99.9% Uptime Record" | F | |
| 67 | "24/7 Support Available" | U | |
| 72-81 | Testimonials "Sarah Bennett, Principal, Maplewood Elementary" and "Michael Rodriguez, Administrator, St. Mary's Academy" | **F (fabricated-looking)** | Neither school is a tenant (`schoolUtils.ts:68-74`). Remove |
| 86 | "FERPA Compliant" | F | |
| 87 | "SSL Encryption — 256-bit encryption for all data" | U | |
| 88 | "Role-Based Access — Granular user permissions" | V | RBAC |
| 89 | "Daily Backups — Automated with 99.9% uptime" | F/U | |
| 113,119 | "Built by Educators, for Educators"; "Trusted by Schools Nationwide" | U / F | Tenants are in Ontario |
| 124,151 | "founded by educators"; "Founded in 2025 by former educators and technology experts" | U | 2025 is consistent with first commits (FE 2025-05-01, BE 2025-05-19) |
| 339,346,353 | "Former principals, teachers…", "Senior engineers from top tech companies", "Dedicated support team" | U | |

**`src/app/(prelogin)/demo/page.tsx`**

| Line | Claim | Status | Note |
|---|---|---|---|
| 91, 146 | "personalized **15-minute** demonstration"; Duration 15 minutes | **Inconsistent** | Calendly event slug is `/30min` (line 194); brief says 60-minute demo |
| 147-149 | Video call with screen sharing; tailored to school size; "Implementation plan provided" | U | |
| 122 | "Watch real report card generation" | V (capability) | |
| 225 | "Join schools that have already streamlined…" | U | |
| 236-239 | "Start Free Trial" → `/signup` | F | |

**`src/app/(prelogin)/contact/page.tsx`**: "within 24 hours" (127, 277) and "Within 24 business hours" (152) are inconsistent and unverified. `info@schoolmule.ca` (138-141) unverified. "Ask about pricing & plans" (163) is fine.

**`src/app/(prelogin)/privacy/page.tsx`** (updated 15 Oct 2026). Accurate on Google scopes, the encrypted refresh token, no ad trackers, and tenant isolation. **Gaps:**
- the service provider list (132-142) omits **OpenAI, Vercel, Intuit/QuickBooks, Calendly**;
- the children's section (159-165) conflicts with student accounts;
- "Information schools provide" omits student-entered content (submissions, quiz answers, messages) and profile photos;
- "Staff accounts — … encrypted password" (25): passwords are *hashed*, not encrypted.

**`src/app/(prelogin)/terms/page.tsx`** (updated 2 Sep 2026):
- "regular backups" (60-61) is unverified;
- "we do not use it to train models" (32) is consistent (OpenAI API; check OpenAI's API data-use terms to back it);
- "Features … depend on its plan" (17): no plans exist in code;
- governing law Ontario (97).

**`src/components/prefooter/Footer.tsx`**
- `info@schoolmule.ca` (10).
- "Pricing" link → `/contact` (17): no pricing page.
- Social links `twitter.com/schoolmule`, `linkedin.com/company/schoolmule`, `facebook.com/schoolmule` (119-141): **unverified; possibly not SchoolMule's accounts.** Verify or remove.
- "© {year} SchoolMule. All rights reserved."

**`src/components/prenavbar/*`:** no factual claims. Links are listed below.

**`src/app/layout.tsx`**
- Meta description (26) and OG/Twitter descriptions (35, 42): "simple, modern platform for attendance, grades, report cards, and parent communication". V.
- Title default "SchoolMule: Student Management System" (23). OG title "School Management System" (34). These are inconsistent.

### 3.2 Routes, CTAs and destinations

Website routes: `/` (`(prelogin)/page.tsx`), `/about`, `/product`, `/demo`, `/contact`, `/privacy`, `/terms`. The shared layout `(prelogin)/layout.tsx` mounts `WebsiteRedirect`.
- `WEBSITE_PATHS = ['/', '/about', '/product', '/contact', '/demo']` (`src/lib/authRouting.ts:57`). Signed-in users on these paths are sent to their home before paint (`WEBSITE_REDIRECT_SCRIPT` in `layout.tsx:68`, `src/lib/websiteVisit.ts`), unless `?website=1` was used in the tab.
- `/privacy` and `/terms` are not in WEBSITE_PATHS, so signed-in users can read them. They are outside AuthGuard, so signed-out users can too.
- **Any new marketing page must be added to `WEBSITE_PATHS`.**

| Location | CTA text | Destination |
|---|---|---|
| Navbar (`Navlinks.tsx:44-55`) | About / Product / Demo / Contact | `/about`, `/product`, `/demo`, `/contact` |
| Navbar signed-out (79-85) | Log In · **Get Started** | `/login` · `/signup` |
| Navbar signed-in (62-75) | Dashboard · Logout | `homeFor(user)` (`/dashboard`, `/parent/dashboard`, `/student`, or an onboarding step) · `signOutLocally()` |
| Logo | — | `/` |
| Home hero (146,153) | Request Demo · **Start Free Trial** | `/demo` · `/signup` |
| Home hero video (`HeroDemoVideo.tsx`) | Watch with sound (1:41) | opens a modal with `/videos/schoolmule-demo-{720p,1080p}.mp4` |
| Home final CTA (587,594) | Schedule Demo · Start Free Trial | `/demo` · `/signup` |
| Home final CTA (603) | info@schoolmule.ca | `mailto:` |
| Product CTA (540,547,555) | Schedule Technical Demo · Contact Sales Team · Contact us | `/demo` · `/contact` · `/contact` |
| About CTA (394,401) | Schedule Demo · Contact Us | `/demo` · `/contact` |
| Demo CTA (229,236) | Contact Sales · Start Free Trial | `/contact` · `/signup` |
| Footer | Features · Demo · Pricing · About Us · Contact · Privacy Policy · Terms of Service · email · Twitter/LinkedIn/Facebook | `/product` · `/demo` · **`/contact`** · `/about` · `/contact` · `/privacy` · `/terms` · `mailto:info@schoolmule.ca?subject=SchoolMule Inquiry` · external |

**What "Start Free Trial" / "Get Started" actually does:**
- `/signup` (`src/app/(user)/signup/page.tsx`) is "Find your school" over the static `SIGNUP_SCHOOLS` (5 tenants).
- Picking a school → `/signup/<slug>` → parent/teacher/student request form → email verification → **school admin approval**.
- A prospective school **cannot** start a trial there.
- `/signup` is listed in the sitemap.

**Calendly:**
- `src/app/(prelogin)/demo/page.tsx:192-200`: inline `<div className="calendly-inline-widget" data-url="https://calendly.com/husseinsaab14/30min" style={{height:'650px'}}>` plus `next/script` `https://assets.calendly.com/assets/external/widget.js`, `strategy="lazyOnload"`.
- The booking link is on the founder's personal Calendly handle.
- Calendly sets third-party cookies and is not mentioned in the privacy policy.

**Contact form:**
- `src/app/(prelogin)/contact/page.tsx`: fields name, email, message, plus a hidden honeypot `website` (233-242; checked client-side at 54-57).
- Calls `sendContactForm()` (`src/services/emailService.ts:20-28`) → `POST /api/email/contact` via `apiClient`.
- Backend: `routes/email.routes.js` applies `contactFormLimiter` (5/h/IP), `honeypotValidation`, `validateInput`, then `controllers/email.controller.js:sendContactEmail`. That sends through Resend with `platformSender('contact', { replyTo: visitorEmail })` **to `process.env.SUPPORT_EMAIL`** (a different inbox from the displayed `info@schoolmule.ca`).
- On failure: 500 with a retry message. On success: toast + "Message Sent!" panel.

### 3.3 Metadata, OG, structured data, SEO
- `src/app/layout.tsx:21-48`:
  - `metadataBase` and canonical `https://schoolmule.ca` (applies to every page, so `/about` etc. all canonicalise to the homepage). **Bug**: per-page canonical needed.
  - robots index/follow; keywords; `applicationName`.
  - openGraph {title, description, type website, siteName} with **no `images`**; twitter `summary_large_image` with **no image**.
  - icons `/favicon.ico` (apple icon is also the .ico).
- No `opengraph-image`, `twitter-image`, `robots.ts`, `manifest` or `apple-icon` files.
- **No per-page metadata:** every prelogin page is `'use client'` and exports none, so all pages share the root title "SchoolMule: Student Management System".
- JSON-LD: only `WebSite` {name, alternateName, url} (`layout.tsx:58-66`). No Organization, SoftwareApplication, Product, FAQ or Review schema.
- Sitemap (`src/app/sitemap.ts`): `/`, `/about`, `/product`, `/demo`, `/contact`, `/login`, `/signup`, `/forgot-password`, all with `lastModified: new Date()`. It **omits `/privacy` and `/terms`** and includes auth pages.
- Analytics on the marketing site: **none** (`@vercel/analytics` is only in `src/app/(user)/layout.tsx:6`).

### 3.4 Fonts and colour tokens
- **Fonts** (`src/app/layout.tsx:7-19`): `next/font/google` **Roboto** (300/400/500/700, `--font-roboto`) and **Outfit** (400–800, `--font-outfit`), both `display: swap`, latin subset.
  - `globals.css:83-87` `@theme inline`: `--font-sans: Outfit, Roboto, system-ui`; `--font-display: Outfit`.
  - `body { font-family: Roboto }` (`globals.css:91-94`). Net effect: body text is Roboto; `font-sans`/`.font-display` utilities are Outfit.
  - `tailwind.config.ts` (Roboto default, `--font-roboto-mono`) is **inert** under Tailwind v4: `globals.css` uses `@import "tailwindcss"` with no `@config`, and `--font-roboto-mono` is never defined.
- **Colour tokens** (`globals.css:10-80`, `:root`):
  - `--primary-50…900` (Tailwind cyan: 500 `#06b6d4`, 600 `#0891b2`, 700 `#0e7490`, 900 `#164e63`).
  - `--accent-50…600` (amber; 500 `#f59e0b`).
  - `--success-50/500/600` (emerald).
  - `--slate-50…950`.
  - `--background #fff`, `--background-subtle #f8fafc`, `--foreground #0f172a`.
  - Gradients `--gradient-primary` (cyan→teal-ish 135°), `--gradient-accent`, `--gradient-hero`, `--gradient-mesh`.
  - Shadows `--shadow-sm…2xl`, `--shadow-glow`, `--shadow-card(-hover)`.
  - Easing `--ease-out-expo`, `--ease-in-out-expo`; `--section-padding: clamp(4rem, 8vw, 8rem)`.
- **In practice the marketing pages use raw Tailwind classes, not the tokens:**
  - `from-cyan-600 to-teal-600` gradients on CTAs and headline accents; slate text; per-feature tints cyan/emerald/violet/amber/rose/sky;
  - dark sections `from-slate-900 via-slate-800`;
  - the logo `public/logo/trimmedlogo.png`.
- No dark mode on the website (dark scheme only scoped to the Observe console, `globals.css:851-853`). `prefers-reduced-motion` handled at `globals.css:382`.

### 3.5 Top fixes for the redesign (from this audit)
1. Remove "50+ schools", "10,000+ students", "99.9% uptime/SLA", FERPA/COPPA, MFA, "end-to-end", the fabricated testimonials, live chat/24-7 claims and invoicing claims. Use the brief's approved wording: "in use at several Ontario Islamic schools".
2. Replace "Start Free Trial" (no trial; `/signup` is for existing schools) with "Book a demo" / "Talk to us". Fix the demo length (15 vs 30 vs 60 min).
3. Lead with what is real and distinctive:
   - Publish & Notify grade emails with "Ask the teacher";
   - parent–teacher messaging with reply reminders;
   - the student portal (Classroom-style) with quizzes;
   - JK/SK skill-based reports;
   - the CP-SAT timetable generator;
   - AI-drafted comments, AI parent weekly summary, at-risk watchlist;
   - staff hours with Ontario stat holidays and a Google Sheet;
   - QuickBooks tuition mirror;
   - custom roles.
4. Security page: US hosting (Supabase us-east-2, Railway us-east4, Vercel); bcrypt; RBAC; signed URLs; encrypted integration tokens; the OpenAI disclosure. Fix the privacy page (OpenAI/Vercel/Intuit/Calendly; student accounts; "hashed" not "encrypted").
5. Add per-page metadata (server components or `generateMetadata`), per-page canonicals, an OG image, and `/privacy`/`/terms` in the sitemap. Add new marketing paths to `WEBSITE_PATHS`.
