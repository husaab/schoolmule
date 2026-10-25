# schoolmule.ca revamp: the plan

Phase 2 of the website revamp. It turns the research in [README.md](README.md) into a positioning, a site map, page-by-page outlines with draft copy, a visual and motion direction, a call-to-action strategy and an SEO plan. Each decision links to its evidence. Numbers in brackets like **[B7]** point to a pattern in [borrow-list.md](borrow-list.md); **§** points to a README section.

## Founder decisions (2026-10-25)

| Question | Decision | Effect on the build |
|---|---|---|
| Price | **No price on the site** | No `/pricing` page and no price block; the FAQ says pricing depends on school size and is given on the demo call |
| Proof | **"In daily use at Ontario schools"** | The only usage claim; no count, no school name, no quote |
| Trial or demo | **Demo only** | "Start Free Trial" removed everywhere; "Log in" and "Join your school" kept for existing schools |
| Segments | **All small independent schools + an Islamic schools page** | `/for/islamic-schools` ships; Montessori waits |
| Founder | **Name and photo** | Founder note and "Book a demo with Hussein"; a photo slot that falls back to initials until a photo is supplied |
| Security page | **Later, after fixes** | No `/security` page and no nav link yet; Home and the FAQ state only verified facts |
| Contact email | **info@schoolmule.ca** | Shown on Contact, Demo and the footer |

Defaults taken where no answer was given: the demo is **15 minutes**, because that is what the embedded Calendly event books (its link says `30min`, but the event and the outreach emails say 15); no phone number or mailing address; social links removed until confirmed; no mention of the iOS app; legal-text corrections are made for review and ship only with your approval of the preview.

Sections below that say *(FOUNDER)* are resolved by this table.

---

## 1. Positioning and messaging

### Positioning statement

> For principals and owners of small independent schools in Ontario (Islamic, Montessori, faith-based and independent, about 30 to 200 students, JK to Grade 8) who run their school on forms, spreadsheets, email and group chats, **SchoolMule is the one school system where the office, teachers, parents and students each get their own view of the same records.** Unlike district-scale systems that hide their price behind a sales form, or single-purpose apps that only cover messaging or classwork, SchoolMule runs the whole school day, from attendance and grades to report cards and parent messages, and it is set up with you by the person who builds it.

Why this and not "school management for everyone":
- **The open space is small Ontario JK–8 schools with a visible price and real screens.** MySchool owns "Canadian" for mid-to-large schools; Ad-Din owns Ontario Islamic schools; the big suites hide prices and show stock photos ([positioning-map.md](positioning-map.md), README §"Fifty-three sites").
- **The buyer usually has no system at all.** 49 prospects were seen running on Google Forms, PDFs, Gmail and WhatsApp against 19 with a named system, so the story is "your first real system", not "switch your SIS" ([dossier synthesis](notes/dossier-synthesis.md)).
- **"One record, every view" is the thing competitors can't show.** The film already proves it: one quiz travels from teacher to student to parent and back ([B3], [B4], README finding 8).

### Message hierarchy

| Level | Message | Where it lives |
|---|---|---|
| 1. Promise | **Your whole school, in one place.** The film's own line, **One school. Every view.**, plays in the hero loop just below it, so section 2 says **Four views. One set of records.** rather than repeating it | Home hero and film, home section 2, OG image |
| 2. Who it's for | For Ontario independent schools, JK to Grade 8 (about 30 to 200 students) | Pill above every hero [B1] |
| 3. Four views | School leaders: see the whole school without chasing it · Teachers: attendance and grades in minutes, families told in one click · Parents: know how your child is doing without calling the office · Students: classwork, feedback and quizzes in one place | Home section 2, the four role pages |
| 4. Proof | The real product (film and screenshots of a demo school), real report cards, a named school *(FOUNDER)*, the founder's face, a price *(FOUNDER)*, a plain security page | Home sections 6–10, /pricing, /security |
| 5. Risk removers | We set it up with you · we import your lists · parents need no app · works alongside Google Classroom · your data leaves with you | Home "How switching works", FAQ |

Voice: plain words at about a grade 7 reading level, respectful, specific. Mirror the schools' own language ("every child known", "from JK to Grade 8"); avoid "nightmare", "drowning", "revolutionize" (README §"Homepage, section by section"). Short pages: the education median that converts best is about 363 words, so depth lives one click away ([conversion research](notes/conversion-research.md)).

**What we will not say** (README §"Retire these claims"): any customer count we can't verify, 99.9% uptime, FERPA, COPPA, SOC 2, MFA, Canadian data residency, invoicing or payments, absence alerts, a native app, French or Arabic interface, Montessori narrative reporting, "Ministry-approved" or "provincial report card", "20+ hours saved".

---

## 2. Site map

```
/                          Home
/product                   Product overview: every feature, grouped; feature details open in modals
/for/school-leaders        Principals, owners and office staff   (film 1:21–1:28 admin montage)
/for/teachers              Teachers                               (film 0:15–0:38 and 1:09–1:17)
/for/parents               Parents and guardians                  (film 0:54–1:09)
/for/students              Students                               (film 0:38–0:54 and 1:17–1:21)
/for/islamic-schools       Segment page, first of three           (FOUNDER: segments)
/pricing                   Price, worked examples, what's included (FOUNDER: price)
/security                  Security and privacy in plain words
/about                     The founder, why small schools, how we work
/demo                      Book a demo (Calendly kept), watch the tour, sample report card
/contact                   Contact form (kept as is)
/privacy, /terms           Corrected (see §3.12)
```

- **`/for/` namespace.** `/parents` would collide with the app's `/parent` prefix check and `/students` is an app page, so role and segment pages live under `/for/`. Every new path goes into `WEBSITE_PATHS` (`src/lib/authRouting.ts`) and `app/sitemap.ts`.
- **Existing URLs stay.** `/`, `/about`, `/product`, `/demo`, `/contact`, `/privacy`, `/terms` keep their paths. Add redirects for likely guesses: `/features` → `/product`, `/book-a-demo` → `/demo`.
- **Later, only with substance:** `/for/montessori-schools` (only once Montessori reporting is real or the page can stand on the operations layer alone) and `/for/independent-schools` [B19].

### Navigation

Desktop, sticky, white with a hairline border on scroll:

`SchoolMule` · **Product ▾** · Pricing · Security · About · `Log in` · **[Book a demo]**

Product menu (overview first, per your rule):
1. **Overview**: everything SchoolMule does
2. School leaders · Teachers · Parents · Students (each with its role colour dot)
3. *By school:* Islamic schools
4. A small card: "▶ Watch the tour, 1:41"

Phone: logo, a compact **Book a demo** button and a menu button in a sticky header, visible on the first screen and while scrolling [B15]; no pop-ups over the fold. I'm choosing the sticky header over a bottom bar because none of the 13 YC sites uses a bottom bar and a bar covers content on short phones; competitors' phone folds broken by overlays are README finding 10.

Footer: Product (Overview, the four roles, Islamic schools) · Company (About, Pricing, Security, Contact) · Already a SchoolMule school? (Log in, Join your school → `/signup`) · Legal (Privacy, Terms) · "Made in Ontario" *(FOUNDER: city)* · contact email.

---

## 3. Page outlines with draft copy

Copy is a first draft for you to react to. Screens named like `teacher-gradebook/s3` are the film's real captures of the synthetic "Brightwater Academy" (`remotion/public/demo/screens/`); everything shown is labelled "Demo school, sample data".

### 3.1 Home `/`

| # | Section | Draft copy | Visual | Evidence |
|---|---|---|---|---|
| 1 | **Hero** | Pill: *For Ontario independent schools · JK to Grade 8*<br>H1: **Your whole school, *in one place.***<br>Sub: Attendance, grades, report cards and parent messages in one simple system, with a view for your office, teachers, parents and students.<br>Buttons: **Book a demo** · ▶ Watch the tour **1:41**<br>Under the buttons: *30 minutes with the founder. We set it up with you.* | Desktop: the film's muted loop in a light browser frame. Phone: the poster, then a light loop after the page has loaded (see §4.3). | Region pill: Scout, MySchool [B1]. Plain H1: NN/g attention, Unbounce plain language. Real product first, matched to the device: Toddle, Linear, Gusto [B7]. Film behind a labelled play button with its length: Loom, Toast [B6] |
| 2 | **Four views. *One set of records.*** | Everyone works from the same records, so the grade a teacher enters is the grade a parent sees at home.<br>Four tabs, one per role, each with its colour, a one-line promise, a screenshot or chapter loop, and "See how it works for teachers →".<br>Small link: *Already use SchoolMule? Log in* | Tabs swap a screenshot or the role's chapter clip. | Role tiles: ClassDojo, Brightwheel; per-role product switch: Superhuman, Mercury, Pylon [B4]; routes logins away from the sales path |
| 3 | **From scattered to *settled.*** | Most small schools run on Google Forms, spreadsheets, email and WhatsApp groups. SchoolMule puts it all on one record per student. | The school's real stack (Registration form, Grades.xlsx, Report card template.docx, Parents group chat, Attendance binder) settling into one student profile card. | 49 patchwork schools in the dossiers [B2]; Rippling's one-record card [B3] |
| 4 | **Follow one quiz through the school** (the signature section) | 1. Ms. Saleh types Quiz 3 scores. Totals update as she types.<br>2. She clicks **Publish & Notify**. Each family gets one email listing what's new.<br>3. Adam opens SchoolMule and sees 19/20, with her feedback.<br>4. His mother reads it and asks a question from the grade itself.<br>5. The question arrives with Quiz 3 pinned. Ms. Saleh replies.<br>Caption: *One set of records, not five apps stitched together.* | Five real captures in sequence: `teacher-gradebook`, the publish modal, `student-home`, `parent-grades/composer`, `teacher-reply/thread`. Desktop: a stepper with the screen on the right; phone: stacked cards. | The film's own story; "one record" proof [B3]; the parent grade email as an artefact [B8]; nobody in the category shows a parent's grade view on a phone (README finding 3) |
| 5 | **Parents actually use it** | No app to install: families get an email when something's new, and sign in with one tap. They only see their own child, and only the grades you've published. Each week they get a short summary of how their child is doing, written by AI and labelled that way. If a parent's question goes unanswered, SchoolMule reminds the teacher. | Phone frame: `parent-phone/homeFull`. | US parents prefer email (83%) over an app (39%); ParentSquare's "no app or sign-in required" [B19] |
| 6 | **Report cards, *without the late nights.*** | Write comments in the gradebook (AI can draft a first version), then make a whole class's report cards in one go: PDFs with your logo, signature and stamp. Ontario-style report cards for Grades 1–8, skill-based reports for JK and SK, and mid-term progress reports. Have your own format? We build it for you. | A real report card PDF page from the demo school (new capture). | Report cards are the most consistent complaint in competitor reviews, and no competitor shows one (README finding 3) [B8] |
| 7 | **Everything else your office runs on** | Cards: Timetables · Staff hours and pay periods · Approvals and staff roles · Tuition from QuickBooks · Calendar · Forms and registration · Announcements · Analytics · New school year. Each card opens a modal with a screenshot and two lines. | Modal per card (your modal rule). | Depth one click away: Notion, Vercel (README pattern table, "Structure") |
| 8 | **Built for schools like yours** | Quran, Arabic and Islamic Studies sit next to Math and Science on the same report card. JK and SK are reported on skills, not percentages. Ontario stat holidays are counted in staff pay. Student photos stay hidden until you turn them on. → *SchoolMule for Islamic schools* | Small real crops (class banners, JK/SK report, photo setting). | Specifics beat noun-swapped segment pages (SchoolCues anti-pattern) [B21] |
| 9 | **Proof** | A founder note: "I'm Hussein. I build SchoolMule and I set up every school myself: your classes, your report card, your staff accounts. When something's wrong, you email me, and I fix it." *(FOUNDER: wording, photo)*<br>Plus one named principal quote with photo, school, size and city *(FOUNDER: permission)*. | Founder photo; principal photo. | Peers are trusted most (72%); real faces raise trust; stock people ignored [B16, B17] |
| 10 | **Price** *(FOUNDER)* | One line and worked examples, e.g. "From $X per student per month, everything included. A 100-student school pays $Y a month." → See pricing | | Visible pricing: TrustRadius, HockeyStack (17.5% vs 10.3%), cost is the top deal-breaker for 63% of education buyers [B9, B10] |
| 11 | **Your data, in plain words** | Four cards: Who sees what · Where your data lives (in the United States, with the providers named) · Photos and files · Leaving is easy. → Read our security page | | Post-PowerSchool scrutiny (74%); the commissioners' checklist [B18] |
| 12 | **How switching works** | 1. Send us your student, family and class lists. We import them. 2. We set up your school year and your report card. 3. Teachers start with attendance; families get their invitations. Works alongside Google Classroom. *(FOUNDER: confirm onboarding)* | Three numbered steps. | Montessori Compass "we'll help migrate your data", Toast "Switch to Toast" [B20] |
| 13 | **FAQ** (in the buyer's order) | What does it cost? · Where is our data stored? · Can you bring in our spreadsheets? · Will my teachers manage it? · Do parents need an app? · Can it make our report card? · Does it work with Google Classroom? · Is it in French? (No, English only today) · What if we leave? · Who are you? | Accordion; FAQPage structured data. | README §"The questions to answer before the call" [B23] |
| 14 | **Closer** | **See it with your school in mind.** Book a demo · or: Watch the tour · See pricing · Ask a question | | Gusto's doors by readiness; switching vs new school [B22] |

Target length: about 600 words of body copy, each section a heading, one or two sentences and a visual.

### 3.2 Role pages `/for/school-leaders`, `/for/teachers`, `/for/parents`, `/for/students`

Shared template, so the four read as one system:
1. **Hero in the role's colour:** pill "For teachers", H1, one-line sub, **Book a demo**, and the role's film chapter playing muted in a frame with "▶ Watch this part with sound", which opens the full film at that chapter.
2. **Three to five jobs**, each a real screenshot crop and two lines.
3. **"What everyone else sees":** the same moment from the other three views (for example, the teacher's publish → the parent's email → the student's grade), linking across the role pages.
4. **Role FAQ** (three or four questions).
5. **Closer.** The parent and student pages add "Your school uses SchoolMule? Log in" first, then "Want it at your child's school? Send this page to your principal."

| Page | H1 draft | Chapter | Jobs (all verified shipped) |
|---|---|---|---|
| School leaders | **See your whole school, *without chasing it.*** | 1:21–1:28 | Report cards for a whole class at once · timetables generated from your rules, or built by hand · staff check-in, hours per pay period, a live Google Sheet · approvals and custom staff roles · every message in one inbox, with reply reminders · analytics and an at-risk list · tuition from QuickBooks · "View as" any teacher or parent (read-only) |
| Teachers | **Attendance and grades in minutes. *Families told in one click.*** | 0:15–0:38, 1:09–1:17 | Your day at a glance · attendance with Mark all present · a weighted gradebook that saves as you type (Missing and Excused handled) · Publish & Notify · questions arrive with the assessment pinned · report-card comments with AI first drafts · classwork and quizzes (when your school turns the student portal on) |
| Parents | **Know how your child is doing, *without calling the office.*** | 0:54–1:09 | The week at a glance, with an AI-written summary · grades by class, with the teacher's feedback · Ask the teacher about a specific grade · attendance, calendar and announcements · report cards to download · every child in one place · no app to install, one-tap sign-in from email |
| Students | **Your work, your feedback, *what's due.*** | 0:38–0:54, 1:17–1:21 | What's due and what's new · turn in work and take quizzes · feedback on every graded item · works on a phone · Google sign-in, QR sign-in cards for young grades |

### 3.3 Product overview `/product`

- H1: **Everything a small school runs on.** Sub: One system for the office, the classroom and home.
- The film as a **chaptered player** (Campfire's pattern [B5]): "Watch it all, or jump to a part: Teachers 0:15 · Students 0:38 · Parents 0:54 · The office 1:21".
- Features grouped under Classroom, Communication, Report cards, School operations, Platform. Each card opens a modal with a screenshot, the accurate one-liner from README §"Lead with the features", and who uses it.
- **"What SchoolMule doesn't do yet"**, said plainly: invoices and payments (tuition is read from QuickBooks), a French interface, a phone app *(FOUNDER: app timing)*, Montessori observation records. School leaders tell vendors to "be clear in promises" (EdWeek), and saying it first removes a demo-call surprise.

### 3.4 Islamic schools `/for/islamic-schools` *(FOUNDER: lead segment)*

- Pill: *For Islamic schools in Ontario*. H1: **Ontario subjects and Islamic studies, *in one system.***
- Sections: Quran, Arabic and Islamic Studies on the same gradebook and report card · JK and SK skills reports · registration forms with a public link, imported straight into student records · announcements and private messages in place of WhatsApp groups · student photos hidden until you turn them on · a board-ready one-page summary [B24] (a PDF to forward to your board, since 46% of Islamic dossiers describe a school run by a masjid or association board) · a named Ontario Islamic school *(FOUNDER: permission)*.
- Not claimed: Hifz tracking, Arabic interface.
- Evidence: Flint's faith pages [B21]; Ad-Din is the incumbent to beat, so this page must show real report cards and a real reference (README §"Islamic schools carry most of the observed pain").

### 3.5 Pricing `/pricing` *(FOUNDER: price and whether to publish)*

- H1: **Simple pricing for small schools.** Per-student price in CAD, with worked examples at 50, 100, 150 and 200 students, everything included (all four views, every feature), setup and import, contract length, and any months you don't pay (Transparent Classroom charges nothing in months a school is closed).
- FAQ: what counts as a student, mid-year starts, what's extra (only true items), how to cancel and take your data.
- Avoid Montessori Compass's mistake: check every example against the formula.
- If you'd rather not publish: no `/pricing`, and the FAQ answer gives a range: "Most schools our size pay between $X and $Y a month."

### 3.6 Security and privacy `/security`

Plain-language cards (Notion's style), on Vanta's structure, answering the Ontario and Alberta commissioners' PowerSchool checklist [B18]:
1. **Where your data lives.** In the United States: database and files on Supabase (AWS Ohio), the app on Railway (Virginia), the website on Vercel. *(If you move to a Canadian region, this becomes our strongest line.)*
2. **Who can see what.** Every request is checked against the person's role on our server. Parents see only their own children, and only published grades. Staff see only their own school.
3. **How accounts are protected.** Passwords are hashed with bcrypt. Sign-in attempts are rate-limited. Google sign-in. *(FOUNDER: MFA and password length first.)*
4. **Files, photos and report cards.** Served through short-lived signed links. Student photos stay hidden until your school turns them on.
5. **AI.** What the weekly summary and comment drafts send to OpenAI, and that it is labelled as AI.
6. **If something goes wrong.** A written breach-response promise *(FOUNDER)*.
7. **Your data is yours.** Export on request, deletion when you leave *(FOUNDER: process)*.
8. **Our providers.** Supabase, Railway, Vercel, Resend, OpenAI, Google, Intuit QuickBooks, Calendly: what each does.
9. **What we don't have yet.** No SOC 2 report. We'll say so rather than imply it.

README §"Hosting" recommends closing MFA, the 6-character password minimum, the backup plan and the privacy-page errors before this page goes live. **FOUNDER:** publish now with honest gaps, or after those fixes.

### 3.7 About `/about`

- H1: **Built in Ontario, *for schools like yours.*** The founder's real story (why small schools, how it started), with a photo *(FOUNDER: story, photo)*.
- How we work: you talk to the person who builds it; we set up every school; we ship improvements every week (the What's New log is real).
- Remove: "Founded by former educators… senior engineers from top tech companies", "50+ schools", "10,000+ students", "99.9% uptime", the two placeholder testimonials (README §"Retire these claims"; *FOUNDER* to confirm the founding facts).

### 3.8 Demo `/demo`

- H1: **Book a 30-minute demo.** Sub: You'll talk with Hussein, who builds SchoolMule. Tell him how your school runs today and he'll show you SchoolMule set up that way.
- **Three doors** (Ramp [B13]): **Pick a time** (the existing Calendly inline embed, kept, loading when the section nears the screen) · **Watch the 1:41 tour** · **See a sample report card** (a PDF from the demo school).
- What happens on the call (three bullets) and a privacy line under the calendar: *Your details go only to us. No mailing list.* (A one-line privacy reassurance raised sign-ups by about half in a controlled test, [B12].)
- One length everywhere: 30 minutes, matching the Calendly event. **FOUNDER:** cut the Calendly questions to name, email and school size (an optional phone field cut sign-ups 37% in a controlled test [B11]), and whether to move off the personal Calendly handle.

### 3.9 Contact `/contact`

- Keep the form and `sendContactForm` exactly as wired.
- H1: **Ask us anything.** State a real response time and the address that actually receives the form *(FOUNDER: is `info@schoolmule.ca` real? The form goes to `SUPPORT_EMAIL`)*. Side card: "Rather talk? Book a demo."

### 3.10–3.11 Shared pieces

- **Navbar** (§2), **footer** (§2), and a **closing call-to-action band** reused at the end of every page.
- **Feature modal** used on Home section 7 and `/product`.

### 3.12 Privacy and terms (text for your review, not legal advice)

The audit found: OpenAI, Vercel, Intuit and Calendly are missing from the provider list; "not directed at children" contradicts the student portal; "passwords are encrypted" should read "hashed"; the terms promise "regular backups" that aren't documented. I'll draft corrected text for you to approve; I won't publish legal changes without your sign-off.

---

## 4. Visual and motion direction

### 4.1 Look

- **Light and white throughout**, like the re-done film. Page background `#ffffff` with a few soft washes (`#eefbfb`, `#f4f8fb`) behind product shots.
- **Brand teal and accessible text.** `#0891b2` is the brand teal for graphics, focus rings and large display accents. On white it is only 3.7:1, below AA for normal text, so text links and button fills use `#0e7490` (5.4:1 with white text). Ink `#0b1324` for headings, slate `#475569` for body (7.6:1).
- **Role colours from the film**, used consistently for the four views: school leaders deep teal `#0b3b52`, teachers teal `#0891b2`, parents amber `#d97706` (amber text at `#b45309` for AA), students indigo `#4f46e5`. Each role page and tab carries its colour as a dot, a wash and the frame glow.
- **Type from the film.** Outfit (400/500/600/700) for everything, with one Instrument Serif italic phrase per headline at most ("in one place.", "Every view."). Self-hosted with `next/font`; Roboto goes away from the marketing pages.
- **Imagery: only the real product.** 2× captures of the synthetic demo school in light browser frames (Mac traffic lights, a `schoolmule.ca/...` address) and phone frames for parent and student views, cropped with the rects in `captures.json`. No stock photos of children (category anti-pattern, NN/g on stock people) and only synthetic names.
- **Layout.** A 1200px content column, generous vertical rhythm (96–128px between sections on desktop, 64–80px on phones), and cards with a 1px slate-200 border and a soft two-layer shadow, never heavy drop shadows.

### 4.2 Motion (framer-motion, with taste)

- **Reveal on scroll:** opacity 0→1 and 12px rise, 500ms, the film's ease-out `cubic-bezier(0.16, 1, 0.3, 1)`, once per element, 60ms stagger. Media boxes reserve their aspect ratio so nothing shifts.
- **Tabs and steppers:** 200ms crossfade between screens; the active tab's underline slides (`layoutId`).
- **Hover:** cards lift 2px with a shadow change; buttons darken. No hover-only information.
- **Signature moment:** in "Follow one quiz", the active step's screenshot zooms gently to the element that matters (using the capture rects), echoing the film's camera.
- **Never:** count-up numbers (Brightwheel was caught at "77.5% uptime"), scroll-jacking, parallax on text, autoplaying sound.
- **Reduced motion:** no transforms or zooms, instant tab swaps, posters instead of loops. Implemented with `MotionConfig reducedMotion="user"` plus a `useReducedMotion` check in the film player.
- **Bundle:** `LazyMotion` with `domAnimation` and the `m` component, used only inside small client islands; the rest of each page is server-rendered.

### 4.3 The film

- **`HeroDemoVideo` keeps every behaviour:** a muted loop, the "Watch with sound" pill opening the modal from the start, pausing off screen, and the poster for reduced-motion visitors. It gains props for a `loopSrc`, a `chapter` start time for the modal, and a label.
- **Lighter files.** Today phones download a 10 MB 720p file to loop silently. I'll cut short, silent loops with ffmpeg from the 1080p master: a hero loop and one clip per chapter, with a poster frame each. A test cut of 0:09–0:23 at 960 px, 24 fps came out at **284 KB**; chapter clips should each stay under about 1 MB. The full film with sound loads only when someone presses play. Loops start after the page has loaded, and never when Save-Data is on.
- **Chapters.** The modal can open at a chapter (`currentTime`), and the player shows the chapter list. Label the footage "Demo school, sample data". Put **Book a demo** inside the modal when the film ends (Campfire [B5]).
- **Placement.** Home hero (loop); each role page (its chapter); `/product` (the chaptered player); `/demo` (a door). Every video below the first screen loads lazily, only when it nears the screen.
- **Content cautions** from the code audit: the phone chapter must read as the web app on a phone, not an installable app, and the AI weekly summary shown at 0:54 must be disclosed on the privacy page.

### 4.4 Prototype

A rough clickable prototype of the new homepage (hero, the four views, "Follow one quiz", parents, closer, at desktop and phone width) accompanies this plan, so you can react to the type, colour and structure before I build.

---

## 5. Calls to action and SEO

### 5.1 Calls to action

| Role | Label | Where | Why |
|---|---|---|---|
| Primary | **Book a demo** | Nav (desktop and phone), every hero, every closer, inside the film modal at the end | One label everywhere (README pattern table); the real conversion today is the demo |
| Secondary | ▶ **Watch the tour 1:41** | Home hero, `/product`, `/demo` | Long film one click away, with its length [B6]; on phones, "Send me the tour" for later [B14] |
| Doors by readiness | See pricing · Ask a question · Watch the tour · Starting a new school? | Closer band | Gusto's four doors; Toast's "New openings" [B22] |
| Existing users | **Log in**; **Join your school** (→ `/signup`) | Nav, footer, the "Every view" section, parent and student pages | Routes logins away from sales (ClassDojo's "Join your school") |
| Removed | ~~Start Free Trial~~ | Everywhere | There is no trial; `/signup` is for joining an existing school *(FOUNDER: trial)* |

Booking: the Calendly inline widget stays on `/demo`, with its script loaded as the section nears the screen. Calendly's `calendly.event_scheduled` message becomes the conversion event.

Measurement (the site has no analytics today): add Vercel Web Analytics (cookie-free) to the marketing layout only, with events for demo clicks, film plays and completions, and booked meetings; add UTM tags to outreach links by segment. The privacy page will mention it.

### 5.2 SEO

- **Fix the basics.** Every page currently canonicalises to the homepage, which tells Google to ignore the other pages. Each page gets its own title (template `%s · SchoolMule`), description and canonical. Add `/privacy`, `/terms` and every new page to the sitemap; drop `/login` and `/forgot-password` from it.
- **Open Graph images** per page, generated with `next/og` (`opengraph-image.tsx`) in Outfit and Instrument Serif with a product shot, so a link shared in a WhatsApp group or email shows a real preview.
- **Structured data (JSON-LD):** `Organization` (logo, email, founder) on every page; `SoftwareApplication` (category BusinessApplication, operating system Web, `offers` only if pricing is public, **no ratings**); `VideoObject` for the film with `hasPart` `Clip` chapters, which can earn "key moments" in Google; `BreadcrumbList` on subpages; `FAQPage` on Home, Pricing and Security.
- **Search targets** (one primary phrase per page, in the title, H1 and first paragraph):

| Page | Primary phrase | Secondary |
|---|---|---|
| Home | school management software for Ontario independent schools | private school software Canada; student information system small school |
| /for/islamic-schools | Islamic school management software Ontario | software for Islamic schools Canada; madrasa school management |
| /for/school-leaders | school administration software for private schools | timetable generator for schools; staff attendance software |
| /for/teachers | gradebook and report card software for teachers | online gradebook Ontario; report card comments |
| /for/parents | parent portal for private schools | school parent communication app |
| /pricing | school management software pricing per student | SIS pricing Canada |
| /security | student data privacy school software Canada | |

- **Speed is SEO and conversion.** Budget per page on mobile: LCP under 2.5 s (a `next/image` priority poster as the largest paint), CLS under 0.05, under about 150 KB of JavaScript (gzipped) per page. Lighthouse mobile at least 90 on every page; no third-party script loads before interaction except analytics.

---

## 6. How I'll build it (Phase 3, after your answers)

- **Git.** I'll work on `feature/landing-revamp` in a separate `git worktree` so this shared checkout's branch never changes under other sessions, committing only my files with `git commit -o <paths>`.
- **New component set** in `src/components/marketing/`: section shell, pill, heading with a serif accent, buttons, browser and phone frames, role tabs, the "Follow one quiz" stepper, the feature modal (on the shared `Modal`), FAQ accordion, price block, closer band, navbar and footer, and the film player (`HeroDemoVideo` extended, not replaced).
- **Assets.** Copy the chosen captures into `public/marketing/` (served through `next/image` as AVIF/WebP). Capture the screens the film lacks (a report card PDF, a JK/SK report, the timetable planner, staff hours, forms, announcements, the admin overview) with `remotion/capture` against the PLAYGROUND school, never production. Cut the chapter loops with ffmpeg.
- **Mobile app.** Marketing pages are exempt from the web-to-app porting rule, so `schoolmule-mobile` is untouched.
- **Checks (Phase 4).** Playwright screenshots of every page at 1440×900, 768×1024 and 390×844, which I'll review and fix. Then `npx tsc --noEmit`, lint, `npx next build`, Lighthouse mobile on every page, keyboard-only and contrast checks. Then push for the Vercel preview and send you the link.

---

## 7. Questions only you can answer

The README lists 33 open questions. These are the ones that change the build:

1. **Price.** Publish a per-student price in CAD with worked examples (recommended), a "from $X a month" line, or no price at all? What are the numbers, the minimum, the setup fee and the contract length?
2. **Proof.** How many schools use SchoolMule today? May the site name Al Haadi Academy, and is the homepage quote from "Majida Shoauib" real, correctly spelled and approved? Until you confirm, the site will use no count, no school name and no quote.
3. **Trial or demo.** Drop "Start Free Trial" for "Book a demo" everywhere (recommended; no trial exists), with "Join your school" kept for existing schools?
4. **Segments.** Lead the homepage with all small independent schools and add an Islamic schools page now, holding Montessori until narrative reporting exists? And will you keep or stop the "Montessori narrative assessment" line in outreach (about 109 drafts)?
5. **You on the site.** May I use your name and photo ("Book a demo with Hussein"), and what is the real founding story? Is the demo 30 minutes?
6. **Security page timing.** Publish now with honest US hosting and stated gaps, or after MFA, a longer password minimum, a backup plan and the privacy-page fixes? Is a move to a Canadian region planned?
7. **Smaller facts.** Which email, phone number and mailing address to show? Should the site mention the iOS app (TestFlight only today)? Which social accounts are yours? What onboarding do you actually offer (free import, who builds the report-card format)?
