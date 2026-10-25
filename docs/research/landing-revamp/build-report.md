# schoolmule.ca revamp: build report

Phase 3 and 4. What was built on `feature/landing-revamp`, the evidence behind each decision, what was checked, and what is still open. Numbers like **[B7]** point to [borrow-list.md](borrow-list.md); the plan is [plan.md](plan.md); before and after captures are in [screenshots/schoolmule-before](screenshots/schoolmule-before/) and [screenshots/schoolmule-after](screenshots/schoolmule-after/).

## Pages

| Route | What it is |
|---|---|
| `/` | Home: hero with the film, four views, scattered to settled, follow one quiz, parents, report cards, office, fit, founder, switching, FAQ, closer |
| `/product` | Every verified feature in four groups, each opening its real screen in a modal; the film with a chapter list; "What SchoolMule doesn't do yet" |
| `/for/school-leaders`, `/for/teachers`, `/for/parents`, `/for/students` | One template: the role's chapter of the film, its jobs with real screens, the same quiz from the other three views, role FAQ |
| `/for/islamic-schools` | First segment page: Islamic studies on the report card, registration, families, photos, JK/SK, FAQ |
| `/about` | Why small schools (Cardus figures, linked), the founder note, how we work |
| `/demo` | The Calendly booking (kept), what happens on the call, the film and sample report cards as other doors |
| `/contact` | The contact form (same `sendContactForm` call and honeypot) |
| `/privacy`, `/terms` | Restyled; factual corrections marked below for your review |

All new paths are in `WEBSITE_PATHS` and the sitemap. `/features`, `/book-a-demo` and `/islamic-schools` redirect to the real pages.

## Decisions and their evidence

| Decision | Evidence |
|---|---|
| One call to action, **Book a demo**, in every hero and every closer, and beside **Log in** and **Sign up** in the nav (on phones Book a demo sits at the top of the menu). "Start Free Trial" is gone | No trial exists in the code ([feature verification](notes/feature-verification.md)); your decision; one label everywhere (README pattern table); ClassDojo's "Join your school" [B4] |
| Hero: who it's for above the headline, a plain headline, the real product right below, the film one tap away with its length | Scout and MySchool region pills [B1]; real product first [B7]; 57% of viewing time is above the fold (NN/g); labelled play button with length (Loom, Toast) [B6] |
| The film plays as **silent chapter loops** (330 KB on phones to 1 MB) that load only after the page has loaded and when on screen; the full film with sound opens at the right chapter, lists its chapters, and ends on "Book a demo" | Video alone doesn't reliably lift conversion (Unbounce, ~35,000 pages); speed does (Portent, Vodafone); Campfire's chaptered tour [B5]. Today's hero made phones download 10 MB |
| **Four views. One set of records.** Tabs that each play their role's chapter and link to its page; the same four as links beside the hero on desktop | Role tiles (ClassDojo, Brightwheel) and per-role product switches (Superhuman, Mercury) [B4] |
| **Follow one quiz through the school**: the film's story in five real captures, with the screen pushing in toward what matters | One record proves "one database" [B3]; no competitor shows a parent's grade view or the grade email [B8] |
| **From scattered to settled**: the forms, spreadsheets and group chats becoming one student record | 49 prospects run on that patchwork, 19 on a named system [B2] |
| **Parents actually use it**: no app, only their own child, the week in a few lines, unanswered questions chased | Parents prefer email (83%) to an app (39%); ParentSquare's "no app" [B19] |
| **Real report cards** printed by SchoolMule's own templates for the demo school, opening in a modal | Report cards are the most consistent complaint in competitor reviews and nobody shows one [B8] |
| Office features as a list whose rows open the real screen **in a modal** | Your modal rule; depth one click away (Notion, Vercel) |
| **Islamic schools page** with specifics, and no Hifz or Arabic-interface claim | Flint's faith pages [B21]; your segment decision; SchoolCues' noun-swapped pages are the anti-pattern |
| **Founder note** with Hussein's photo; the only usage line is "In daily use at Ontario schools" | Real faces and peers build trust [B16, B17]; your decisions |
| **How switching works** in three steps; **FAQ** in the order principals ask; the price question answered as "on your demo call" | [B20]; [B23]; your no-price decision |
| `/product` ends with **what SchoolMule doesn't do yet** | "Be clear in promises" (EdWeek) |
| **Demo page**: calendar first on phones, the length stated (15 minutes, what the Calendly event actually books), a privacy line beside it, the film and sample report cards as doors for the not-ready | Instant booking [B11]; a privacy line raised sign-ups by half in a controlled test [B12]; Ramp's three doors [B13] |
| **Measurement from day one**: Vercel Web Analytics (cookie-free) on the website, with events `demo_click` (by placement), `film_open`, `film_complete`, `demo_booked` (Calendly's own signal), `feature_open`, `report_samples_open`, `contact_sent` | The site had no analytics (README "Measure from day one"). Custom events need a Vercel Pro plan; page views work on any plan |
| Light and white, Outfit with the film's Instrument Serif accent in each page's headline, role colours from the film, product frames as a tray with the screen set in | Your direction and the film's look; AA contrast (teal text and buttons use `#0e7490`) |

### Claims removed from the site
"Trusted by 50+ Schools Nationwide", "50+ Schools Served", "10,000+ Students Managed", 99.9% uptime and SLA, FERPA and COPPA, multi-factor sign-in, "end-to-end protection", invoicing and payment plans, absence alerts, compliance reports, 24/7 support and live chat, "20+ hours saved", "100% faster report cards", the two About-page testimonials, and the Al Haadi quote (not approved for use; the usage line you chose replaces it).

### SEO
- Every page has its own title, description and canonical. Before, every page set its canonical to the homepage.
- An Open Graph image for each page (generated at build in Outfit and Instrument Serif with a frame of the film).
- Structured data: Organization (every page), SoftwareApplication (no price, no rating), VideoObject with the chapters as clips (Home, Product, role pages), FAQPage, BreadcrumbList.
- `robots.txt` and a sitemap of the public pages (sign-in pages removed, privacy and terms added).

## Checks

| Check | Result |
|---|---|
| `npx tsc --noEmit` | Pass |
| ESLint on every file this branch changes | Pass |
| `npx eslint .` (whole project) | **Fails with 17 errors, all in app files this branch doesn't touch** (React hooks rules in agenda, dashboard, attendance, contact-us, parent dashboard, registration, schedule planner and the shared modal), so they are already on `main` |
| `npx vitest run` | 77 files, 1,250 tests pass |
| `npx next build` | Pass; every website page and Open Graph image is static |
| Playwright, 12 pages at 1440×900, 768×1024 and 390×844 | No horizontal overflow; no console errors other than `/_vercel/insights/script.js` 404, which only exists on Vercel. Reviewed by eye and fixed (see the captures in [schoolmule-after](screenshots/schoolmule-after/)) |
| Lighthouse mobile, local production build | See below |

Lighthouse (mobile, `next start` on localhost; full output in [lighthouse-local.txt](lighthouse-local.txt)):

| Page | Perf | A11y | Best practices | SEO |
|---|---|---|---|---|
| Home, Product, Teachers, Students, Islamic schools | 91 | 100 | 96 | 100 |
| School leaders | 90 | 100 | 96 | 100 |
| Parents | 89 (91 the run before) | 100 | 96 | 100 |
| About, Demo, Contact | 94 | 100 | 96 (Demo 75) | 100 |
| Privacy, Terms | 95 | 100 | 96 | 100 |

- Local performance is pessimistic. `next start` serves over HTTP/1.1, which Lighthouse simulates with six connections, so twenty-odd scripts, styles and images queue behind each other. Vercel serves HTTP/2 from a CDN. The real number should be taken on the preview: run [tools/lighthouse.sh](tools/lighthouse.sh) against the preview URL.
- Best practices 96 everywhere is the localhost-only analytics 404. On `/demo` it is 75 because Calendly's embed sets third-party cookies, which comes with keeping the Calendly booking.
- The biggest remaining cost on every page is the app-wide stylesheet (37 KB gzipped, render-blocking) that the website shares with the app. Splitting it needs a separate root layout for the website, which I left alone.

## Changes outside the website
- **Roboto is no longer preloaded** (root layout). The website never uses it, and preloading it slowed every page's largest paint. App pages still load it; on a first visit they may show the fallback font for a moment.
- The root layout's default title and description are updated, and its site-wide canonical (which pointed every page, app included, at the homepage) is removed.
- The navbar and footer are shared with the sign-in, sign-up, password and verification pages, so those pages get the new design too.
- The marketing site's old screenshots in `public/images/` are deleted (one showed the removed invoicing screen), along with the unused `HeroBackground` and old nav links.
- **Mobile app:** marketing pages are exempt from the web-to-app porting rule, so `schoolmule-mobile` is unchanged.

## Not verified yet
- **Lighthouse on the Vercel preview.** The branch couldn't be pushed from this session (see the reply).
- **A real contact-form send.** The call, payload and honeypot are unchanged, but sending would email your inbox; send one test message on the preview.
- **A real Calendly booking**, and that `demo_booked` arrives in Vercel Analytics.

## For you
**Wording to confirm** (each is a promise on the site):
- The founder note: "I build SchoolMule, and I work with every school directly: setting up your classes, your report card and your staff. When something isn't right, you email me."
- "Send us your lists… we bring them in" and "No big migration project. Most of it is on us."
- "Your details only go to us. No mailing list." under the calendar.
- "Improvements ship every week" (About).
- The privacy and terms edits: providers added (Vercel, OpenAI, Intuit QuickBooks, Calendly), a section on what the AI features send, the children's section rewritten for the student portal, "encrypted password" changed to hashed, and "regular backups" removed from the terms.

**Product bugs found while building** (not fixed here; they are app and backend work):
1. **Every school's JK and SK report cards print Al Haadi's website and "Principal: Sr. Majida".** The kindergarten templates (`schoolmule-backend/templates/alHaadiReportCardSKTemplate.js` and the JK one) hard-code them. The images on the site use the demo school's details.
2. The progress report's legend letters are white on pale colours (unreadable), and its "Common Core Standards" wording is US terminology. The progress report image was kept off the site because of this.
3. The website's contact form reported errors through a notification tray that the website doesn't render, so failed sends were silent. **Fixed here:** errors now show in the form.
4. The Calendly event's link says `30min` but the event is 15 minutes.

**Later, as you decided:** a security page (after MFA, a longer password minimum and backups), pricing, and a Montessori page.

**Small product idea from the Islamic schools page:** staff titles are limited to Mr., Ms., Mrs. and Dr. Adding Sister, Brother, Ustadh and Ustadha would fit how these schools address staff.

## Changes after the founder's review (2026-10-25)
- Hussein's headshot in the founder note and the small avatars (`public/marketing/founder.jpg`, `founder-face.jpg`).
- The navbar has **Log in** and **Sign up** (families and staff who haven't joined yet use the site too), beside a quieter **Book a demo** without the arrow. On phones, Log in and Sign up stay in the bar and Book a demo moves to the top of the menu. "Join your school" is now "Sign up" everywhere.
- FAQ: "Where is our data stored?" now reads "Securely, on Amazon Web Services (AWS) cloud servers…", encrypted in transit and at rest. The French question is removed. (`/product` still lists "A French or Arabic interface" under what SchoolMule doesn't do yet.)
