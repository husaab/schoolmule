# What we'll borrow and why

Twenty-four patterns from the 53 teardowns, each traced to where it came from, why it should work for a small Ontario school's principal, and where it goes on schoolmule.ca. Back to the [main report](README.md); every site is summarised in [teardown-table.md](teardown-table.md).

**Confidence** combines the strength of the evidence (A–D grades from the [conversion research](notes/conversion-research.md): A controlled test, B large observational benchmark or survey, C vendor case or anecdote, D expert opinion; "T" means transferred from another setting, "V" means published by a vendor that sells the tactic) with how directly it fits our buyer. No source measures demo bookings for school software specifically, so "High" means strong fit and consistent evidence, not proven lift. Copy in quotes is a draft, not final wording.

---

### 1. Say who it's for above the headline

- **Pattern:** a small pill above the H1 naming the region and segment, with the headline itself in plain words.
- **Came from:** Scout's "for California and Oregon schools and districts" ([fold](screenshots/yc/scout-desktop-fold.jpg)); MySchool's H1 "…Built For Canadian Schools" ([fold](screenshots/category/trymyschool-desktop-fold.jpg)).
- **Evidence for our buyer:** today's H1, "The Complete School Management Solution", never says who it serves ([fold](screenshots/schoolmule-before/home-desktop-fold.jpg)). Attention concentrates at the top of the page (57% of viewing time above the fold, NN/g, B) ([NN/g](https://www.nngroup.com/articles/scrolling-and-attention/)). The category's Canada claims are thin or templated, and none speaks to small Ontario JK–8 schools ([SIS teardowns](notes/teardowns-category-sis.md)).
- **Apply to SchoolMule:** homepage hero pill "For Ontario independent schools, JK–8"; each segment page swaps it ("For Ontario Islamic schools").
- **Confidence:** High.

### 2. Name the school's real stack and show it becoming one record

- **Pattern:** a before/after block in the school's own words, listing the tools it uses today and what replaces them.
- **Came from:** Alif Cloud's "From Overwhelmed to In Control" Without/With list ("WhatsApp groups for parent communication" → "SMS, voice, and email from one platform") ([full page](screenshots/category/alif-cloud-desktop-full.jpg)); Ad-Din's "Stop juggling spreadsheets and scattered systems" ([fold](screenshots/category/ad-din-desktop-fold.jpg)).
- **Evidence for our buyer:** 49 prospects were observed running on Google Forms, Jotform, PDFs, Gmail and WhatsApp against only 19 with a named SIS; 69% show no system publicly ([dossier synthesis](notes/dossier-synthesis.md)).
- **Apply to SchoolMule:** homepage section "Your first real system" and the Islamic-schools page. Frame it as lifting a load ("registration forms, attendance sheets and WhatsApp groups, in one place"), never as the school failing; the outreach voice is already respect-first.
- **Confidence:** High for Islamic schools (observed); Medium for Montessori and secular schools (pain mostly unverified).

### 3. Prove "one database" with one student's record

- **Pattern:** a single record card showing everything attached to one person.
- **Came from:** Rippling's "Your business data with people at the center" employee card ([full page](screenshots/yc/rippling-desktop-full.jpg)); Veracross's "one-person, one-record" promise ([fold](screenshots/category/veracross-desktop-fold.jpg)).
- **Evidence for our buyer:** the buyer's problem is scattered systems (pattern 2); the product really has a student profile with record, grades, attendance, messages and reports in one window ([feature verification](notes/feature-verification.md)). No conversion data exists for this device; it is a fit judgement.
- **Apply to SchoolMule:** the visual for "Your first real system", showing one synthetic demo-school student; reuse a frame from the film.
- **Confidence:** Medium-high.

### 4. Role tiles that open each portal and route logins

- **Pattern:** a row of role tiles right under the headline, each leading to that role's view.
- **Came from:** ClassDojo's "Get started as a..." Teacher / Parent / Student / School Leader / District Leader ([fold](screenshots/yc/classdojo-desktop-fold.jpg)); Brightwheel's "I'm an admin or director / I'm a staff member / I'm a parent or guardian" ([fold](screenshots/category/brightwheel-desktop-fold.jpg)); FACTS's "I'm an Administrator / I'm a Parent/Student" router.
- **Evidence for our buyer:** role routing is standard across the communication tools ([comms teardowns](notes/teardowns-category-comms.md)). A small school's site gets parents and teachers looking for the login (inference). Persona-page lift data is vendor-only (C, V) ([Clearbit](https://clearbit.com/resources/books/drive-website-conversions/personalization-strategies-Livestorm-Dropbox-DocSend)).
- **Apply to SchoolMule:** homepage "Every view" strip with four tiles (Office & principal · Teacher · Parent · Student), each opening its film chapter, plus "Already use SchoolMule? Log in". On phones, collapse to a compact list as ClassDojo does.
- **Confidence:** Medium.

### 5. A chaptered film modal with "Book a demo" inside

- **Pattern:** the film opens in a modal: "pick a chapter, or press play to start from the beginning", with the booking button inside.
- **Came from:** Campfire's "Explore Campfire" modal ([screenshot](screenshots/yc/campfire-tour-modal.jpg)); Superhuman's per-product hero switcher and Mercury's per-tab clips ([SaaS teardowns](notes/teardowns-saas.md)).
- **Evidence for our buyer:** short videos hold attention (under one minute averages 52% engagement, Wistia, B) ([Wistia](https://wistia.com/blog/optimal-video-length)); chapters let a principal jump to the parent view. Video does not reliably lift conversion on its own (Unbounce, B), so the film should serve the visitor, not replace the CTA ([Unbounce](https://unbounce.com/landing-page-optimization/video-on-landing-pages)).
- **Apply to SchoolMule:** chapters at 0:15 (teacher), 0:38 (student), 0:54 (parent) and 1:21 (office); "Book a demo" pinned in the modal; the four role tiles (pattern 4) deep-link to the chapters.
- **Confidence:** Medium.

### 6. A labelled, click-to-play film with its length, captions and "sample data" label

- **Pattern:** the film sits behind a clear play button that states its length; muted loops are short and silent; demo data is labelled.
- **Came from:** Loom's player badge "1.2× · 1 min → 50 sec" ([fold](screenshots/saas/loom-desktop-fold.jpg)); Toast's "▶ How Toast is Built For Busy" pill ([fold](screenshots/saas/toast-desktop-fold.jpg)); PostHog's demo page with "Click for sound" and captions ([demo page](screenshots/yc/posthog-demo-desktop-fold.jpg)) and its homepage demo labelled "All findings are sample data" ([fold](screenshots/yc/posthog-desktop-fold.jpg)).
- **Evidence for our buyer:** none of the 13 YC sites autoplays a narrated film in the hero ([YC teardowns](notes/teardowns-yc.md)); faster pages convert better (Portent B; Vodafone A, T) ([Portent](https://www.portent.com/blog/analytics/research-site-speed-hurting-everyone.htm), [Vodafone](https://web.dev/case-studies/vodafone)); the current hero loads a 10 MB file on phones. Labelling the synthetic school answers the first privacy question before it is asked.
- **Apply to SchoolMule:** hero secondary button "▶ Watch the 1:41 tour"; on phones show a poster frame only; captions on; a corner label "Demo school · sample data".
- **Confidence:** Medium-high.

### 7. Real product in the hero, matched to the device

- **Pattern:** the hero shows the actual product, and the phone version shows the phone view rather than a shrunken desktop.
- **Came from:** Linear's app window rebuilt as live HTML ([fold](screenshots/saas/linear-desktop-fold.jpg)); Gusto swapping to its phone app on phones ([phone](screenshots/saas/gusto-mobile-fold.jpg)); Toddle's real-UI collage with the button above it ([phone](screenshots/category/toddleapp-mobile-fold.jpg)).
- **Evidence for our buyer:** education landing traffic is about 85% mobile (Unbounce, B) ([Unbounce Education](https://unbounce.com/conversion-benchmark-report/education-conversion-rate/)); the converged practice across all 15 SaaS homepages is real product in the first screen ([SaaS teardowns](notes/teardowns-saas.md)).
- **Apply to SchoolMule:** desktop hero shows the teacher or office view; the phone hero shows the parent's phone view (the grade email with "Ask the teacher" or the parent dashboard).
- **Confidence:** High.

### 8. Show the artefacts: report cards and the parent grade email

- **Pattern:** real screenshots and downloadable samples of what the product produces.
- **Came from:** Transparent Classroom's real UI in every section ([fold](screenshots/category/transparent-classroom-desktop-fold.jpg)); Montessori Compass's lesson grid ([fold](screenshots/category/montessori-compass-desktop-fold.jpg)).
- **Evidence for our buyer:** no SIS vendor shows an Ontario-style report card or a kindergarten skills report ([SIS teardowns](notes/teardowns-category-sis.md)); report-card inflexibility is the most consistent complaint across small-school reviews (4 of 8 products) ([buyer research §4](notes/buyer-research.md)); report cards appear in 206 dossiers ([dossier synthesis](notes/dossier-synthesis.md)).
- **Apply to SchoolMule:** a homepage section with a grades 1–8 report card and a JK/SK skills report from the demo school, plus a downloadable sample PDF on the demo page. Say "Ontario-style" or "in your school's format", never "provincial report card" or "Ministry-approved" ([feature verification](notes/feature-verification.md), [Manual](https://files.ontario.ca/edu-private-schools-policy-procedures-manual-2013-en-2021-11-25.pdf)).
- **Confidence:** High.

### 9. Price on the page, with worked examples by school size

- **Pattern:** a per-student price (or "from $X") and a small table of what a 50-, 100-, 150- and 200-student school would pay.
- **Came from:** Sycamore's "One price. Every module. No surprises." with examples from 50 to 1,000 students ([pricing](screenshots/category/sycamore-pricing-desktop-fold.jpg)); Flint's size bands ([pricing](screenshots/yc/flint-pricing-desktop-fold.jpg)); Alif Cloud's student-count slider ([pricing](screenshots/category/alif-cloud-pricing-desktop-fold.jpg)).
- **Evidence for our buyer:** visible pricing turned 17.5% of form fills into pipeline vs 10.3% hidden (HockeyStack, B) ([HockeyStack](https://hockeystack.com/lab-blog-posts/state-of-pricing-demo-case-study-pages)); cost is the top deal-breaker for 63% of education buyers (B) ([Tech & Learning](https://www.techlearning.com/business/the-state-of-school-purchasing-report-2026)); "Contacting a vendor for a mysterious quote is a waste of time" ([EdWeek](https://www.edweek.org/advertise/the-wired-marketer-advice-from-k-12-leaders-to-vendors-they-dont-mince-words-2-25-25/2025/03)); 21 of 24 call scripts expect "too small / can't afford it", and Islamic tuition runs about $200–$600 a month ([dossier synthesis](notes/dossier-synthesis.md)).
- **Apply to SchoolMule:** homepage price block and a pricing page in CAD. Check the arithmetic: Montessori Compass's own example contradicts its formula ([comms teardowns](notes/teardowns-category-comms.md)).
- **Confidence:** Medium-high (the founder must set the price).

### 10. A "no surprise fees" list, only with items that are true

- **Pattern:** a short checklist of costs the school will not face.
- **Came from:** SchoolCues' "No Set Up Fee, No Training Fee, No Hidden Charges, No Support Fee, Unlimited Training, Unlimited Support…" ([full page](screenshots/category/schoolcues-desktop-full.jpg)); Transparent Classroom's "If you are closed in the summer, you pay nothing" ([full page](screenshots/category/transparent-classroom-desktop-full.jpg)).
- **Evidence for our buyer:** reviewers complain about add-on fees and cost that "grows with the number of parents"; Sycamore is praised for no add-ons ([buyer research §2, §4](notes/buyer-research.md)). Competitors charge card and ACH processing fees ([Sycamore pricing](https://sycamoreleaf.com/pricing/)); SchoolMule mirrors QuickBooks and takes no payment cut.
- **Apply to SchoolMule:** under the price block and on the pricing page. Include only what the founder confirms (setup fee? migration? per-parent costs?).
- **Confidence:** Medium.

### 11. Instant booking with two fields and a stated length

- **Pattern:** an embedded calendar where the principal picks a slot immediately; name and email only; the length stated; slots within days.
- **Came from:** Scout's "Schedule a demo" going straight to a 30-minute Calendly ([scoutforschools](https://scoutforschools.com)); Pylon's "Schedule a personalized 30-minute demo" with the calendar shown beside the form ([demo](screenshots/yc/pylon-demo-desktop-fold.jpg)); Ramp's one-field booking ([demo](screenshots/saas/ramp-demo-desktop-fold.jpg)).
- **Evidence for our buyer:** 62–65% of form-fillers book when they can schedule instantly vs an unsourced 30–40% otherwise (B, V) ([RevenueHero](https://revenuehero.io/2025-inbound-benchmark), [Chili Piper](https://help.chilipiper.com/hc/en-us/articles/33750048681875--Jan-2024-The-Sauce-What-s-a-good-demo-conversion-rate)); an optional phone field cut sign-ups 37% (A, T) ([NextAfter](https://www.nextafter.com/?p=14159)); same-day meetings outperform eight-days-out (C) ([Focus Digital](https://focus-digital.co/average-no-show-rate-for-booked-sales-meetings-by-booking-channel/)). Category demo forms run 7–11 fields with no scheduler.
- **Apply to SchoolMule:** the /demo page and every "Book a demo" button; keep the existing Calendly embed, remove the phone field if any, add one optional "number of students", settle one length (15, 30 or 60 minutes is unresolved), lazy-load the embed.
- **Confidence:** High.

### 12. One privacy line next to the booking form

- **Pattern:** a plain sentence under the form saying what happens to the details.
- **Came from:** Toast's line under its email field, "Email used for marketing. See our Privacy Statement" ([fold](screenshots/saas/toast-desktop-fold.jpg)); ours should promise the opposite.
- **Evidence for our buyer:** a privacy reassurance under a sign-up form converted 27.1% vs 18.1% without it (A, T, n = 682) ([NextAfter](https://www.nextafter.com/?p=12850)); privacy is the leading Ontario fear after the PowerSchool breach ([buyer research §2](notes/buyer-research.md)).
- **Apply to SchoolMule:** under the calendar: "Your details go only to [founder name]. No mailing list." Also disclose Calendly in the privacy policy, which it currently omits ([feature verification](notes/feature-verification.md)).
- **Confidence:** Medium-high.

### 13. Three doors on the demo page

- **Pattern:** the demo page offers a live call, a short video and a self-serve sample side by side.
- **Came from:** Ramp's "See how Ramp works": 30-minute live demo, two-minute interactive tour, five walkthroughs ([demo](screenshots/saas/ramp-demo-desktop-fold.jpg)); Rippling's "Get a demo—live or on demand" ([rippling](https://www.rippling.com/en-CA)).
- **Evidence for our buyer:** 61% of B2B buyers prefer a rep-free experience (Gartner, B) ([Gartner](https://gartner.com/en/newsroom/press-releases/2025-06-25-gartner-sales-survey-finds-61-percent-of-b2b-buyers-prefer-a-rep-free-buying-experience)); two-thirds research before contacting sales (G2, B) ([G2](https://learn.g2.com/2025-g2-buyer-behavior-report)). Interactive demos are used 88% on desktop (B, V) ([Navattic](https://navattic.com/report/state-of-the-interactive-product-demo-2025)), so the clickable demo school is a later stretch goal.
- **Apply to SchoolMule:** /demo with Book a call · Watch the 1:41 tour · Download a sample report card.
- **Confidence:** Medium.

### 14. "Send me the tour" on phones

- **Pattern:** on phones, an email field that sends the tour for later instead of asking for a call now.
- **Came from:** Attio's phone hero, which replaces "Start for free" with an email field and "Send me a demo" ([phone](screenshots/saas/attio-mobile-fold.jpg)).
- **Evidence for our buyer:** education traffic is about 85% mobile but desktop converts 17.6% better (B) ([Unbounce Education](https://unbounce.com/conversion-benchmark-report/education-conversion-rate/)); capturing intent on the phone and finishing at a desk follows from that (inference).
- **Apply to SchoolMule:** phone hero and demo page: "Email me the 1:41 tour and a sample report card". It creates follow-up work, so only if the founder will answer every one.
- **Confidence:** Medium-low.

### 15. A sticky phone CTA and a way to reach a person

- **Pattern:** the demo button stays visible while scrolling on phones; a number or email is one tap away.
- **Came from:** Toast's fixed "Get a Free Demo" bar (found in the DOM) and "SALES" number in its phone header ([phone](screenshots/saas/toast-mobile-fold.jpg)); Gusto's sticky header with "Create free account" ([phone](screenshots/saas/gusto-mobile-fold.jpg)); Jobber's toll-free number in the nav ([fold](screenshots/saas/jobber-desktop-fold.jpg)).
- **Evidence for our buyer:** major CTAs belong where attention is (NN/g, B); a sticky mobile CTA lifted orders in one e-commerce case (C, T) and GoodUI's tests are paywalled ([conversion research §2](notes/conversion-research.md)).
- **Apply to SchoolMule:** sticky "Book a demo" in the phone header (or a bottom bar), and a tap-to-call number only if the founder publishes one.
- **Confidence:** Medium.

### 16. Named, local, size-tagged peer proof

- **Pattern:** a real person with photo, role, school, size and city, instead of a logo wall.
- **Came from:** Ad-Din's logo wall with each school's city ([full page](screenshots/category/ad-din-desktop-full.jpg)); Lillio's testimonials tagged with role and size ("Owner | 9 Classrooms") ([full page](screenshots/category/lillio-desktop-full.jpg)); Jobber's named customer photo strip ([fold](screenshots/saas/jobber-desktop-fold.jpg)).
- **Evidence for our buyer:** peers are education buyers' most trusted source (72%, B) ([Tech & Learning](https://www.techlearning.com/business/the-state-of-school-purchasing-report-2026)); real faces raise trust through social presence (A, T) ([Cyr et al.](https://aisel.aisnet.org/misq/vol33/iss3/8)); stock people are ignored (B) ([NN/g](https://www.nngroup.com/articles/photos-as-web-content/)); near-perfect ratings lose credibility (B, T) ([Spiegel](https://spiegel.medill.northwestern.edu/wp-content/uploads/sites/2/2021/04/Spiegel-research-reveals-4.5-stars-are-better-than-5-The-Medill-IMC-Spiegel-Research-Center.pdf)); Islamic schools trust through word of mouth ([buyer research §10](notes/buyer-research.md)).
- **Apply to SchoolMule:** homepage proof section and the Islamic page: "[Name], Principal, Al Haadi Academy · [N] students · JK–8 · [city]", only with permission and a confirmed quote. One real voice beats several placeholders.
- **Confidence:** High in principle; limited by what the founder can confirm.

### 17. The founder and the human layer

- **Pattern:** a visible person behind the product, with a concrete support promise.
- **Came from:** Toddle's signed "open letter from our founder" ([full page](screenshots/category/toddleapp-desktop-full.jpg)); Numeral's "The human layer of Numeral" ([full page](screenshots/yc/numeral-desktop-full.jpg)); Scout's "respond in under an hour, wherever you communicate" ([scoutforschools](https://scoutforschools.com)).
- **Evidence for our buyer:** support is the most consistent praise in small-school reviews ([buyer research §4](notes/buyer-research.md)); 12 call scripts anticipate "who are you / is this legit" and many principals answer to a board ([dossier synthesis](notes/dossier-synthesis.md)); "I will buy from vendors I trust" ([EdWeek](https://www.edweek.org/advertise/the-wired-marketer-advice-from-k-12-leaders-to-vendors-they-dont-mince-words-2-25-25/2025/03)).
- **Apply to SchoolMule:** a founder photo and short note on the homepage and about page ("you talk to the person who builds it"), with a real response time. Remove the unverified team claims first.
- **Confidence:** Medium-high.

### 18. A plain-language security page built on the regulators' checklist

- **Pattern:** short cards answering where data lives, who can see it, how it is protected, what happens in a breach, what AI sees and what happens when you leave.
- **Came from:** Vanta's security page structure ([fold](screenshots/yc/vanta-security-desktop-fold.jpg)); Notion's plain cards, including "Customer data is never used to train AI models" ([fold](screenshots/saas/notion-security-desktop-fold.jpg)).
- **Evidence for our buyer:** the PowerSchool findings tell boards to demand contract privacy terms, MFA, limited vendor access and breach plans ([OIPC Alberta](https://oipc.ab.ca/ontario-and-alberta-privacy-commissioners-release-investigation-findings-into-powerschool-breach-affecting-school-boards-and-other-educational-bodies/)); 74% of school leaders expect more vendor-security scrutiny (B) ([GovTech](https://www.govtech.com/education/k-12/k-12-leaders-to-scrutinize-ed-tech-vendor-security-practices)); badges help only when familiar (B, T) ([CXL](https://cxl.com/research-study/trust-seals/)).
- **Apply to SchoolMule:** a /security page plus a homepage summary. State US hosting (Supabase in Ohio, Railway in Virginia, Vercel), name OpenAI, and publish only after MFA, a stronger password rule, a backup policy and a corrected privacy page exist ([feature verification §2](notes/feature-verification.md)).
- **Confidence:** High on the need; the content depends on closing the gaps.

### 19. Parent adoption, proven with the product

- **Pattern:** specific promises about how parents get information, shown with a real screen.
- **Came from:** ParentSquare's "No app or sign-in required for families" ([full page](screenshots/category/parentsquare-desktop-full.jpg)); ClassDojo's school-leaders page showing a real translated message ([fold](screenshots/category/classdojo-school-leaders-desktop-fold.jpg)); Transparent Classroom's "parents only see information about their child".
- **Evidence for our buyer:** 83% of US parents prefer personal email for teacher communication, 39% an app (B, US) ([EdSurge](https://edsurge.com/news/2019-10-15-project-tomorrow-survey-in-an-app-world-email-still-reaches-parents)); 26 dossiers record "no parent portal" ([dossier synthesis](notes/dossier-synthesis.md)).
- **Apply to SchoolMule:** a homepage parent section and a parents page: the Publish & Notify email, the one-tap email sign-in link, "Ask the teacher", "parents only see published grades for their own child". Do not claim translation; it does not exist ([feature verification](notes/feature-verification.md)).
- **Confidence:** High.

### 20. "How switching works" in three steps

- **Pattern:** three numbered steps from first call to first day, with help moving data.
- **Came from:** Montessori Compass's top bar "Switching from paper, spreadsheets, or another system? We'll help migrate your data—free." and "Switching is easier than you think" ([Canada fold](screenshots/category/montessori-compass-canada-desktop-fold.jpg)); Gradelink's "Watch a free demo / Let us get you set up / Rest assured" ([full page](screenshots/category/gradelink-desktop-full.jpg)); Cal.com's three-step "How it works" ([full page](screenshots/saas/cal-com-desktop-full.jpg)).
- **Evidence for our buyer:** "Can you import our spreadsheets, and who does it?" is a top buyer question; the cleanest switch is a summer cutover after a three-to-five-month implementation ([buyer research §1, §3](notes/buyer-research.md)).
- **Apply to SchoolMule:** homepage section and a "Switching to SchoolMule" page. Say "free" or give timelines only once the founder confirms what onboarding includes (the current "~1.5 weeks" claim is unverified).
- **Confidence:** Medium-high.

### 21. Real segment pages, Islamic first

- **Pattern:** a page per school type with its own language, proof and specifics.
- **Came from:** "Flint for Christian schools" with segment logos and copy ([fold](screenshots/yc/flint-christian-schools-desktop-fold.jpg)); Montessori Compass's Canada page as the depth model ([fold](screenshots/category/montessori-compass-canada-desktop-fold.jpg)).
- **Evidence for our buyer:** the pipeline is 115 Islamic, 104 Montessori and 73 secular schools, each describing itself differently ("Ontario curriculum + Islamic studies"; "from Casa through Grade 8"; "every child known") ([dossier synthesis §5](notes/dossier-synthesis.md)); lift data for persona pages is vendor-only (C, V), so the case is message match with outreach emails.
- **Apply to SchoolMule:** /islamic-schools (Quran, Hifz, Arabic and Islamic Studies as report-card subjects, JK/SK, registration forms and waitlists, photo controls, a named reference), /independent-schools, then /montessori once narrative reporting is real.
- **Confidence:** Medium.

### 22. Doors for the two buying situations: switching, and starting a new school

- **Pattern:** explicit entry points for "moving from something else" and "opening a school".
- **Came from:** Toast's featured menu cards "Switch to Toast" and "New openings" ([menu](screenshots/saas/toast-desktop-megamenu.jpg)); Edsby's "Moving from something else?" comparison pages ([edsby](https://www.edsby.com/)); Gusto's four-door closer ([full page](screenshots/yc/gusto-desktop-full.jpg)).
- **Evidence for our buyer:** 322 new Ontario independent schools opened between 2022 and 2025, most of them small, and every school must file its Notice of Intention by September 1 ([CP24](https://cp24.com/local/toronto/2026/07/18/if-the-gta-population-is-up-why-are-public-school-numbers-down), [ontario.ca](https://ontario.ca/page/private-schools-notice-intention-operate-private-school)); 22 prospects were founded since 2019 and 32 show expansion signals; a few run Edsembli/Maplewood or Ad-Din ([dossier synthesis](notes/dossier-synthesis.md)).
- **Apply to SchoolMule:** homepage closer and a "For schools" menu: "Starting a school? Be ready before September" and "Moving from spreadsheets or another system?".
- **Confidence:** Medium.

### 23. An Ontario FAQ in the order principals ask

- **Pattern:** a country-specific FAQ answering the real buying questions in plain words.
- **Came from:** Ramp's Canadian FAQ (GST/HST, CAD cards, eligibility) on its en-CA homepage ([full page](screenshots/saas/ramp-desktop-full.jpg)); Cal.com's FAQ before its closer.
- **Evidence for our buyer:** the buyer-research question ranking (cost, data, import, teachers, parents, report card, references, exit); vendor question lists (FACTS, Edsembli); buyers want self-serve answers first ([buyer research §3](notes/buyer-research.md)).
- **Apply to SchoolMule:** homepage FAQ and pricing page, including honest answers on hosting (US), French (English-only today), apps (works in the phone's browser) and data export.
- **Confidence:** High.

### 24. A forwardable one-pager for the board

- **Pattern:** a document a principal can send to the people who sign.
- **Came from:** Edsby's "Reviewer's Guide" as its second CTA ([edsby](https://www.edsby.com/)); Gradelink's "DOWNLOAD BROCHURE" beside its demo button ([full page](screenshots/category/gradelink-desktop-full.jpg)).
- **Evidence for our buyer:** 46% of Islamic prospects are run inside a masjid or association board, and boards or founders often sign ([dossier synthesis §4](notes/dossier-synthesis.md), [buyer research §1](notes/buyer-research.md)).
- **Apply to SchoolMule:** a one-page PDF (what it does, price, hosting and security summary, reference school, onboarding steps) linked from the pricing, security and demo pages.
- **Confidence:** Medium.

---

## What we will NOT copy

1. **Pop-ups and forms over the first screen.** SchoolCues opens an 11-field form with red "type NA" instructions on load ([phone](screenshots/category/schoolcues-mobile-fold.jpg)); Veracross's Canada pop-up hides the headline on phones ([phone](screenshots/category/veracross-mobile-fold.jpg)); Blackbaud stacks a promo slide-in and an AI chat on its fold ([desktop](screenshots/category/blackbaud-k12-desktop-fold.jpg)).
2. **A hero with no button.** Sycamore ([desktop](screenshots/category/sycamoreschool-desktop-fold.jpg)), PowerSchool ([phone](screenshots/category/powerschool-mobile-fold.jpg)) and Alma ([desktop](screenshots/category/getalma-desktop-fold.jpg)) give the visitor nothing to press in the first screen.
3. **Abstract, poetic or AI-first headlines.** "Technology with Heart. Powered by Data." ([FACTS](screenshots/category/factsmgt-desktop-fold.jpg)), "Create inspired explorers" ([Educa](screenshots/category/educa-desktop-fold.jpg)), "Powered by AI" ([Blackbaud](screenshots/category/blackbaud-k12-desktop-fold.jpg)). A non-technical principal cannot test them against a problem.
4. **Counts a small school can't relate to, or that we can't prove.** "over 60 million students in 90 countries" ([PowerSchool](screenshots/category/powerschool-desktop-fold.jpg)), "45 million" ([ClassDojo](screenshots/yc/classdojo-desktop-fold.jpg)), and our own "Trusted by 50+ Schools Nationwide" ([before](screenshots/schoolmule-before/home-desktop-fold.jpg)).
5. **Count-up numbers and scroll-only content.** Brightwheel's stats were captured mid-animation at "77.5% uptime" ([full page](screenshots/category/brightwheel-desktop-full.jpg)); Tennr's full page renders almost blank ([full page](screenshots/yc/tennr-desktop-full.jpg)); a Lillio section rendered empty ([full page](screenshots/category/lillio-desktop-full.jpg)). These break in link previews, slow phones and screenshots.
6. **Gated videos called "demos".** Gradelink puts a recorded video behind a 10-field form ([demo gate](screenshots/category/gradelink-demo-desktop-fold.jpg)); Rippling gates a 10:47 tour behind 6 fields ([tour gate](screenshots/yc/rippling-tour-desktop-fold.jpg)). Our 1:41 film stays open.
7. **Long demo forms.** Veracross asks 10 fields plus a captcha ([demo](screenshots/category/veracross-demo-desktop-fold.jpg)); MySchool 10 with no scheduler ([demo](screenshots/category/trymyschool-demo-desktop-full.jpg)); Vanta 9 plus checkboxes ([demo](screenshots/yc/vanta-demo-desktop-fold.jpg)).
8. **Noun-swapped segment pages.** SchoolCues' Islamic and Canadian pages carry the same copy with one word changed ([Islamic](screenshots/category/schoolcues-islamic-desktop-fold.jpg), [Canadian](screenshots/category/schoolcues-canadian-desktop-fold.jpg)). Principals in the same network will notice.
9. **Testimonials nobody can check.** Initials-only avatars with no locations ([Alif Cloud](screenshots/category/alif-cloud-desktop-full.jpg)), first-name-only quotes ([Gradelink](screenshots/category/gradelink-desktop-full.jpg)), recycled app-store reviews ([Ad-Din](screenshots/category/ad-din-desktop-full.jpg)), and our own About page's placeholder principals ([before](screenshots/schoolmule-before/about-desktop-full.jpg)).
10. **Badge collages of mixed claims.** MySchool puts HIPAA and ISO 9001 beside review stars on a K–12 site ([full page](screenshots/category/trymyschool-desktop-full.jpg)); our current FERPA and COPPA badges are the same mistake.
11. **Stock adults, AI-looking scenes and mixed-audience heroes.** MySchool's stock photos ([fold](screenshots/category/trymyschool-desktop-fold.jpg)), Sparkrock's cut-out stock photo ([fold](screenshots/category/edsembli-desktop-fold.jpg)), Ad-Din's 18-slide carousel mixing mosque displays with classrooms ([fold](screenshots/category/ad-din-desktop-fold.jpg)), Alma's watercolour illustration ([fold](screenshots/category/getalma-desktop-fold.jpg)).
12. **Sloppiness that signals neglect.** FACTS cards with buttons labelled "Button" ([full page](screenshots/category/factsmgt-desktop-full.jpg)); Montessori Compass's "50 active students = $50/month" contradicting its own formula ([full page](screenshots/category/montessori-compass-desktop-full.jpg)); Transparent Classroom's COVID screening section in 2026 ([full page](screenshots/category/transparent-classroom-desktop-full.jpg)); Gradelink's quote site still reading "© 2022" ([quote site](screenshots/category/gradelink-pricing-desktop-full.jpg)); Veracross giving three different school counts.
13. **Quote-only pricing for small schools.** Brightwheel's six-step price quiz ([pricing](screenshots/category/brightwheel-pricing-desktop-fold.jpg)) and Lillio's "Get a quote" on every product ([pricing](screenshots/category/lillio-pricing-desktop-fold.jpg)) put a small school in the district-vendor bucket.
14. **Autoplaying the long film on phones.** Our current hero starts the 1:41 loop under the buttons on phones ([before](screenshots/schoolmule-before/home-mobile-fold.jpg)); no teardown site autoplays a narrated film in its hero.
