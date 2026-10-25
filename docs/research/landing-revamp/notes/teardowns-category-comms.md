# Category teardowns: parent-communication, classroom and small-school tools

Captured 2026-10-25 with `tools/shoot.mjs` (desktop 1440×900 fold + half-scale full page, iPhone-class 390×844 @2x fold + full page, JSON of title/meta/headings/nav/CTAs/video). Every fold screenshot was opened and looked at. For full pages, crops were read where text was too small, and rendered text was pulled with a headless browser (`document.body.innerText`) for verbatim quotes. All paths below are relative to `docs/research/landing-revamp/`. Read-only browsing: nothing was signed up for, submitted or booked.

Sites (12): Brightwheel, ClassDojo, Seesaw, Educa, Transparent Classroom, Montessori Compass, Google Classroom, ParentSquare, Lillio (formerly HiMama), plus three faith-targeted tools: Ad-Din (Canadian, Islamic), Alif Cloud (Islamic, North America) and SchoolCues (multi-faith small schools).

## Scope notes and corrections to the brief

- **"Educa is in 15 of our ~60 prospect dossiers": I could not reproduce this.** A whole-word search for "Educa" across `sales/` (367 dossier files plus `leads/leads.csv`) finds **0** mentions. The words that do appear are "Education", "Educational" and so on, which is probably where the count came from. What the dossiers actually mention: Google Classroom in **15** dossier files, Edsby in 4, Seesaw in 3, Transparent Classroom in 1 (Uxbridge Montessori) and ClassDojo in about 1. **Ad-Din**, which wasn't in the brief, is the confirmed incumbent at IIT Academy (Scarborough) and was seen in use at Darul-Uloom Chatham (`portal.ad-din.ca`), per `sales/leads/leads.csv`. Educa is still torn down below as requested.
- **Montessori Compass is not defunct.** It relaunched as "Montessori Compass 2.0" and has a dedicated Canada page, so it is covered directly.
- **Animated counters:** Brightwheel's and Seesaw's homepage stats count up as you scroll, and the screenshots caught them part-way. Brightwheel showed "15hrs / 73% / 77.5% uptime", Seesaw "24M+ / 99K / 97%". The final values, read from rendered text after scrolling, are given below. Treat the screenshot numbers as artifacts, not claims.
- **Slug collision:** the SIS-vendor researcher also captured `schoolcues-*` (the same homepage) into this folder. My unique SchoolCues captures are `schoolcues-islamic-*` and `schoolcues-canadian-*`.

## Cross-site takeaways (what this category teaches SchoolMule)

### Takeaway
The products that win teachers and parents (Brightwheel, ClassDojo, Seesaw, ParentSquare) all **send each visitor down a path for their role, right in the hero**, and they **sell parent adoption through concrete mechanisms**: auto-translation, no app or login needed, parents seeing only their own child, "never miss a moment". Meanwhile the small-school, Montessori and faith segment is **won on public per-student pricing, free migration and local proof**. Only Montessori Compass (Canada page: data residency, CAD billing, PIPEDA) and Ad-Din (Ontario Ministry report cards, a wall of Ontario mosques and schools) make a real Canada pitch. That gap is SchoolMule's opening, but Ad-Din already owns it for Islamic schools in Ontario.

### Cited Findings
- Role routing in or right under the hero is standard:
  - Brightwheel: "I'm an admin or director / I'm a staff member / I'm a parent or guardian" ([mybrightwheel.com](https://mybrightwheel.com/), `screenshots/category/brightwheel-desktop-fold.jpg`).
  - ClassDojo: "Get started as a..." Teacher / Parent / Student / School Leader / District Leader ([classdojo.com](https://www.classdojo.com/), `classdojo-desktop-fold.jpg`).
  - Seesaw: an "I am a..." dropdown in the utility bar ([seesaw.com](https://seesaw.com/)).
  - ParentSquare: persona tabs Superintendents / Teachers and staff / Comms leaders / Tech leaders / Families and students ([parentsquare.com](https://www.parentsquare.com/)).
  - Ad-Din: "Software for every leader" grid, Imam … Parents … Teachers … Students ([ad-din.ca](https://www.ad-din.ca/)).
- Parent-adoption mechanisms named on the sites:
  - ClassDojo: messages "automatically translated into more than 190+ languages" ([classdojo.com](https://www.classdojo.com/)).
  - ParentSquare: "No app or sign-in required for families" and "over 99% contactability" ([parentsquare.com](https://www.parentsquare.com/)).
  - Transparent Classroom: "parents only see information about their child" ([transparentclassroom.com](https://www.transparentclassroom.com/)).
  - Lillio: "Never miss a moment with Lillio" ([lillio.com/users/parents](https://www.lillio.com/users/parents)).
  - Seesaw quote: "When one of our parents saw that Seesaw messages were translated to their native language on their phone, it brought tears to their eyes" ([seesaw.com](https://seesaw.com/)).
- Teacher-adoption mechanisms named on the sites:
  - ClassDojo: "Free for teachers, forever." ([classdojo.com](https://www.classdojo.com/)).
  - Transparent Classroom: "With just 10 minutes a day, you can enter all your presentations, observations, notes and photos." and "Designed by Montessorians, for Montessorians." ([transparentclassroom.com](https://www.transparentclassroom.com/)).
  - Lillio: "built by educators" ([lillio.com](https://www.lillio.com/)).
  - Google Classroom quote: "It didn't require a lot of training. Children and staff were set up in seconds." ([edu.google.com](https://edu.google.com/workspace-for-education/products/classroom/)).
- Public per-student pricing is the norm for small, Montessori and faith vendors:
  - Transparent Classroom: $2.00 USD per child per month ([transparentclassroom.com](https://www.transparentclassroom.com/)).
  - Montessori Compass: $2.00/student/month, or $1.50 billed annually; $2.50 CAD on the Canada page ([montessoricompass.com](https://www.montessoricompass.com/), [/canada/](https://www.montessoricompass.com/canada/)).
  - Educa: $1.29–$1.59 a month per child ([geteduca.com/pricing](https://www.geteduca.com/pricing/)).
  - Alif Cloud: free up to 30 students, then $1.49/student/month ([alifcloud.com/pricing](https://www.alifcloud.com/pricing)).
  - SchoolCues: "As low as $75.00/mo for a 12-month school year." ([schoolcues.com](https://www.schoolcues.com/)).
- ECE-chain and district vendors hide prices: Brightwheel ("Request pricing" quiz), Lillio (every product says "Get a quote"), ParentSquare ("Contact sales") and Seesaw ("Talk To Sales") ([brightwheel pricing](https://mybrightwheel.com/pricing/), [lillio pricing](https://www.lillio.com/features/pricing), [ParentSquare packages](https://www.parentsquare.com/platform/compare-packages/), [Seesaw pricing](https://seesaw.com/en-ca/pricing-packages/)).
- Canada-specific claims:
  - Montessori Compass: "Your student data stays in Canada.", billing in Canadian dollars, "built to align with … PIPEDA" ([montessoricompass.com/canada](https://www.montessoricompass.com/canada/)).
  - Seesaw: "Comply with Canadian privacy laws like PIPEDA and MFIPPA", "590,000+ educators, students, and families in Canada" ([seesaw.com/canada](https://seesaw.com/canada/)).
  - Google: Education Plus priced at C$7.80 per user per year ([compare editions](https://edu.google.com/intl/ALL_ca/workspace-for-education/editions/compare-editions/)).
  - Ad-Din: "Ontario-Aligned Academic Management Anywhere" ([ad-din.ca](https://www.ad-din.ca/)).
  - ParentSquare: "US-based data storage and processing" ([security](https://www.parentsquare.com/platform/security-and-compliance/)).
  - Lillio is Toronto-headquartered but its site speaks in "North America" and "state-aligned" terms ([lillio.com](https://www.lillio.com/); [HQ](https://app.welcometothejungle.com/companies/Lillio)).

### Inferences
- **The hero needs to serve two jobs.** It should convert the principal by default, and it should quietly route teachers, parents and students who arrive looking for login or help. The four role buttons map neatly to SchoolMule's four portals, so "one database, four portals" can be shown rather than just stated: one tile per portal, each with a real phone screenshot.
- **Parent and teacher adoption should be a named section, not implied.** Give the concrete mechanisms (translation, no app needed, email sign-in, parents see only their own child, a teacher's time to grade or post) plus one parent quote and one teacher quote.
- **Publishing a per-student price matches what the small-school competitors in this segment do.** Hiding it puts SchoolMule in the district-vendor bucket. Montessori Compass's Canadian-dollar price is the closest analogue.
- **The Canada page is the most copyable pattern found:** data residency + CAD + PIPEDA (and Ontario MFIPPA) + a local association discount. For SchoolMule, add Ontario report cards (Ad-Din's wedge).
- **Prefer static stat numbers.** Animated counters show wrong numbers in screenshots, slow phones and link previews, and "77.5% uptime" is a real risk for a trust-sensitive buyer.

### Gaps
- No site published conversion data, so "what works" is inferred from convergence across vendors, not from measured outcomes.
- I could not read Ad-Din's school-module price (it's behind a 7-step configurator that won't advance without selections) or a current ParentSquare price. Capterra returned 403. A search summary cites about US$3,000 for up to 600 students, unverified.
- Seesaw's current free-teacher offering is unclear. The pricing page says "Seesaw licenses are only available for schools or districts" ([pricing](https://seesaw.com/en-ca/pricing-packages/)) but doesn't say whether a free teacher tier still exists.

## Site teardowns

### Brightwheel (mybrightwheel.com)
Screenshots: `screenshots/category/brightwheel-desktop-fold.jpg`, `brightwheel-desktop-full.jpg`, `brightwheel-mobile-fold.jpg`, `brightwheel-mobile-full.jpg`, `brightwheel.json`; extras `brightwheel-montessori-*`, `brightwheel-pricing-*`. Sources: [home](https://mybrightwheel.com/), [Montessori](https://mybrightwheel.com/montessori/), [pricing](https://mybrightwheel.com/pricing/).

1. **First five seconds.**
   - Eyebrow (the page's H1): "#1 childcare management software". Display headline: "More time with children. Less time on admin." No subhead. Instead, "First, tell us about yourself." leads into three large role buttons: "I'm an admin or director" / "I'm a staff member" / "I'm a parent or guardian", then "Already use brightwheel? Login". Header CTAs: "Login" (outline) and "Get a demo" (coral).
   - Desktop visual: two tilted devices on a periwinkle background. Left is a tablet check-in grid with real toddler photos; right is a phone "Messages" view and a tablet "Billing" view. Both are autoplaying, muted, looping `.webm` animations.
   - Under the fold line: "brightwheel is the #1 childcare software for ECE programs ★★★★★ 4.9 | 160,000+ reviews", with Capterra Shortlist 2026, Software Advice Front Runners 2026 and GetApp Category Leaders 2025 badges.
   - Phone: no menu icon visible in the fold. The three role buttons fill the screen, with stars and badges right below.
2. **Video and imagery.** Simplified, illustrated UI (not raw screenshots) with real child photos. Photo testimonial cards, and a stock photo of a support agent. No explainer video on the homepage.
3. **Audiences.** The role chooser appears in the hero and again at the bottom ("Tour the easiest all-in-one childcare and preschool app"). There is a "Designed with you in mind" section with three persona cards (Administrators & directors / Teachers & staff / Parents & guardians). "Who we serve" lists Preschools, Multisite, In-home, Camps & afterschool, Childcare centers, **Montessori**, Starting a new center, and Government partners. The Montessori page's headline is "#1 software for Montessori programs", with a scope and sequence "AMS & AMI-aligned".
4. **Social proof.**
   - Reviews strip plus badges (top). A thin logo row: "Trusted by thousands of leading early childhood education programs".
   - A testimonial carousel. Each card has a photo, first name, initial, centre and city, for example "Brightwheel has cut out a third of my busy work…" (Kelly R., Director at Good Shepherd Learning Center, Douglassville, PA).
   - A stat band with final values "#1 / 20hrs saved each month / 95% customer satisfaction / 99.9% Uptime and 24×7 monitoring (we don't crash)". The screenshot caught the counter mid-animation at 15hrs / 73% / 77.5%.
5. **CTAs and pricing.**
   - The demo plus the role quiz. Pricing is custom: "Request pricing" runs a 6-step quiz (role, operating status, licensed capacity 1–100+, number of locations).
   - The homepage has a savings calculator ("How many children… staff… Families who pay late each month?").
   - The pricing page ran a "GIVEAWAY" banner (a $250 prize for signing up by 10/31).
6. **Trust and privacy.** Nothing in the homepage body. There is a "Security & Safety" footer link, plus the uptime claim.
7. **Navigation and layout.**
   - Top nav: Who we serve / Features / Resources / Pricing / What's new · 2026 | Login | Get a demo.
   - Section order: role-chooser hero → reviews and badges → "Why millions of educators and families love brightwheel" (4 value cards) → logos → "Your complete preschool & childcare management system" (accordion + UI) → savings calculator → "What educators are saying" → stat band → "The support that sets us apart" ("connect to a live human via chat in under 30 seconds… We migrate your data in under 24 hours") → persona cards → repeated role chooser → footer.
   - Motion: autoplay UI loops, carousel, count-up stats. Page height 7,537px desktop, 10,366px phone.
8. **Positioning.**
   - Segment: US early childhood (preschools, centres, Montessori, camps). Not K-8.
   - Breadth: all-in-one (billing, payroll, CACFP menus, admissions/CRM, curriculum, comms).
   - Price: quote only. Inferred mid-tier per child; nothing public.
   - Canada fit: low to moderate. The Montessori FAQ says "millions of educators in the US and Canada", and the demo forms list provinces.
   - Montessori fit: dedicated page. Faith fit: none, beyond an incidental Riverbend Christian School testimonial.
9. **Borrow / avoid.**
   - **Borrow:** the role-first hero routes parents and staff away from the demo funnel in one tap, and the second role chooser at the page bottom catches scrollers. **Borrow:** a savings calculator framed around the director's pain (late payers, staff hours). SchoolMule's version could be report-card hours.
   - **Avoid:** count-up stats ("77.5% uptime" in a screenshot) and quote-only pricing for a 100-student school.

### ClassDojo (classdojo.com), including its school-wide product
Screenshots: `classdojo-desktop-fold.jpg`, `classdojo-desktop-full.jpg`, `classdojo-mobile-fold.jpg`, `classdojo-mobile-full.jpg`, `classdojo.json`; extras `classdojo-school-leaders-*`, `classdojo-families-*`. Sources: [home](https://www.classdojo.com/), [school leaders](https://www.classdojo.com/school-leaders/), [families](https://www.classdojo.com/families/), [privacy & security](https://www.classdojo.com/privacy-and-security/). YC: **Summer 2012**, verified at [ycombinator.com/companies/classdojo](https://www.ycombinator.com/companies/classdojo) ("Communication app for K-8 teachers, kids, and families").

1. **First five seconds.**
   - Hello bar: "New for school leaders this back to school. Check it out". H1: "Where classrooms become communities". Subhead: "Loved by more than 45 million students and parents. Free for teachers, forever."
   - "Get started as a..." five illustrated tiles: Teacher / Parent / Student / School Leader / District Leader. Below them, ★★★★½ "2 million+ reviews". On desktop, a floating QR card reads "Get the ClassDojo app".
   - Header: Log in / Sign up (purple).
   - Visual: a blob-shaped photo collage of real families and classrooms (parents and kids on a couch with a tablet, kids walking to school).
   - Phone: the five tiles collapse into one big "Sign up" button, followed by stars and the photo collage.
2. **Video and imagery.** Real lifestyle photography plus illustrated UI cards (message bubbles, Stories feed, events, Points monsters) and brand monster characters. No video on the homepage. The school-leaders page has a hero video with a "Sound on" toggle.
3. **Audiences.**
   - The five-way chooser, plus top nav Products / Schools / Districts / Families.
   - **School-wide pitch** ([school leaders](https://www.classdojo.com/school-leaders/)): "One app to bring your whole school together", subhead "Reach every family, support your teachers, and start the year connected. Free for every school.", CTAs "Schedule a demo" / "Join your school".
   - Families page: "Everything you need for a year they'll love", with App Store and Google Play badges and Learn / Play / Connect tabs.
4. **Social proof.**
   - Homepage: user counts (45M, 2M+ reviews) and "Our community is our superpower" (social-post-style teacher shout-outs). Meta description: "Used in 95% of US schools." No logos.
   - School-leaders page: metric tiles ("25% More active families", ">80% Messages read the same day", "89% Teachers say ClassDojo builds better family relationships") and principal quotes with story links, for example "School must feel like home for families… Reading rates are up 48% as a result." (Brittany Daley, Principal of Hamilton Elementary).
5. **CTAs and pricing.** Free sign-up. The FAQ reads: "ClassDojo is always free for schools, teachers, and now districts. Our business model relies on an optional paid subscription model that offers extra ways to engage, which some families opt into. We also offer DojoTutor…" ([school leaders](https://www.classdojo.com/school-leaders/)).
6. **Trust and privacy.**
   - Homepage section: "Privacy first—always", linking to the ClassDojo Privacy Center.
   - Privacy page: "fully compliant with COPPA and FERPA, as well as GDPR in Europe"; "fully certified by iKeepSafe"; "We never share any of your information or students' information with advertisers or marketers"; stored on AWS; encryption at rest and in transit. The footer links a Common Sense privacy report.
   - No Canada or PIPEDA claims. The locale picker shows a US flag.
7. **Navigation and layout.**
   - Top nav: Products / Schools / Districts / Families | 🌐🇺🇸 | Log in | Sign up.
   - Section order: chooser hero → photo collage "Keeping teachers, families, and kids connected" → five alternating feature rows ("Stay connected—instantly", "Offer a window into their world", "Keep everyone up-to-date", "Help them grow their own way", "Build the best classroom yet") → "Dojo Islands (Beta) — A world of adventure awaits." → "Our community is our superpower" → "Privacy first—always" → "Let's get growing" photo CTA → footer.
   - Short page: 6,826px desktop, 6,630px phone.
8. **Positioning.**
   - Segment: US K-8 mass market (now "for middle and high school too"). Breadth: communication, behaviour, portfolios and school-wide announcements; not an SIS. Price: free, monetized through families.
   - Canada fit: nothing Canada-specific. Faith and Montessori fit: none.
9. **Borrow / avoid.**
   - **Borrow:** "Join your school" as the secondary CTA on the leaders page. It lets a teacher who arrives on a principal page self-serve. **Borrow:** show one real parent message with the "Translated · See original" affordance (school-leaders page phone mock), which proves translation instead of claiming it.
   - **Avoid:** imitating consumer-scale numbers SchoolMule can't match. Peer-scale proof works better for 30–200-student schools.

### Seesaw (seesaw.com)
Screenshots: `seesaw-desktop-fold.jpg`, `seesaw-desktop-full.jpg`, `seesaw-mobile-fold.jpg`, `seesaw-mobile-full.jpg`, `seesaw.json`; extras `seesaw-canada-*`, `seesaw-pricing-*`. Sources: [home](https://seesaw.com/), [Canada](https://seesaw.com/canada/), [pricing](https://seesaw.com/en-ca/pricing-packages/).

1. **First five seconds.**
   - Utility bar: "Sales: 1-855-673-3729 · Customer Support · I am a... · Canada (English)". The geo-locale was picked up automatically.
   - H1: "The World's Leading Elementary Learning Experience Company". Subhead: "Purpose-built, all-in-one platform for PreK–6: LMS, digital portfolios, multimodal learning, assessments and insights, admin tools, and family engagement features — plus optional supplemental curriculum packages."
   - Primary CTA "Request A Demo" (pink). Header repeats "Request A Demo" and adds "Log In". No secondary hero CTA.
   - Visual: stylized UI cards on lavender (a drawing/record toolbar, a "Sort the Shapes" activity, a "Messages" pane).
   - Phone: a five-line headline and an eight-line subhead push the CTA to the bottom of the fold.
2. **Video and imagery.** Stylized UI in the hero; real photos on the persona cards; a video tile "5 Powerful Ways Schools are Unlocking the Magic of Seesaw" lower down.
3. **Audiences.** The "I am a..." dropdown, and "Seesaw's Learning Experience Platform Keeps Everyone in the Learning Loop" with four cards (Teachers / Students / Families / Administrators). The pricing page offers a "Yes, we have Seesaw / New to Seesaw" split.
4. **Social proof.**
   - A badge row (Tech & Learning awards, ISTE Seal, Instructure ESSA Level 4/3, Digital Promise, CAST).
   - Stat cards (final values): "25M+ … trusted and loved by over 25 million educators, students, and families", "100K Seesaw Ambassadors", "98% Teachers agree…" (footnote: US-only survey, May 2023).
   - Research & Evidence grid. Three quote cards, including the parent-translation quote (Sheila Teri, Instructional Technology Coordinator, Virginia).
   - Canada page: "Trusted and loved by 590,000+ educators, students, and families in Canada", with first-name quotes from a BC teacher, a Saskatchewan VP and a Québec enseignante (in French).
5. **CTAs and pricing.** No prices. Tiers are Seesaw LMS / Instruction & Insights / Seesaw AI, with "Talk To Sales" / "Request A Demo". "Seesaw licenses are only available for schools or districts."
6. **Trust and privacy.**
   - Pricing and footer: FERPA/GDPR, SOC 2, iKeepSafe COPPA, Student Privacy Pledge.
   - Canada page: "Comply with Canadian privacy laws like PIPEDA and MFIPPA". No data-residency claim found.
7. **Navigation and layout.**
   - Top nav: Products / Solutions / Learning & Resources / Pricing | Search | Request A Demo | Log In.
   - Section order: hero → badge row → stat cards → persona cards → "Why Schools and Districts Choose Seesaw" hub diagram (Schedule A Meeting) → video → Needs Assessment Survey → Research & Evidence → Partnerships (Amazon, OMNIA) → quotes → "Get Started with Seesaw!" → footer.
   - Height: 8,337px desktop, 11,875px phone.
8. **Positioning.**
   - Segment: PreK–6 schools and districts (US first, with a Canada page). Breadth: LMS + portfolio + family comms (classroom layer, not admin/SIS). Price: district quote, inferred mid-to-high per seat.
   - Canada fit: moderate. There's a Canada page with PIPEDA/MFIPPA, and 3 SchoolMule dossiers mention Seesaw. Faith and Montessori fit: none.
9. **Borrow / avoid.**
   - **Borrow:** a dedicated Canada page with provincial voices, including French.
   - **Borrow:** the emotional parent quote about translated messages, as proof of parent adoption.
   - **Avoid:** district-speak hubs ("Equity & Access", "Embedded AI") and badge walls that mean nothing to a 100-student principal.
   - **Avoid:** an eight-line subhead on phones.

### Educa (geteduca.com)
Screenshots: `educa-desktop-fold.jpg`, `educa-desktop-full.jpg`, `educa-mobile-fold.jpg`, `educa-mobile-full.jpg`, `educa.json`; extra `educa-pricing-*`. Sources: [home](https://www.geteduca.com/), [pricing](https://www.geteduca.com/pricing/). Background: a Wellington, NZ e-portfolio and learning-stories product founded in 2009 ([Idealog](https://idealog.co.nz/tech/2014/07/education-app-now-maori-connects-generations); [GetApp NZ](https://www.getapp.co.nz/software/107449/educa)).

1. **First five seconds.**
   - H1: "Create inspired explorers". Subhead: "Children who are inspired to explore the world around them receive the greatest foundation for lifelong learning and success." / "Create space and time to cultivate exploration and early learning with Educa."
   - CTA: "Explore Educa today 🚀". Header: "Register for a free trial" (outline) and "Sign In ▾".
   - Visual: a right-hand mosaic of stock photos (toddlers on a wall, an educator with babies) and flat illustration tiles (hands, mountain flags, a heart-eye).
   - Phone: the mosaic comes first and the headline is below it. The cookie bar ("Accept & Close" / "Decline") covers the subhead and CTA. Our capture tool's consent-dismiss pattern didn't match "Accept & Close"; real visitors see the same bar.
2. **Video and imagery.** Lifestyle photos and illustration. Small UI screenshots (a learning story, a phone feed, a curriculum list) inside each section. A laptop/tablet/phone device mockup ("Your tool for the adventure"). No video.
3. **Audiences.** Narrative sections by stakeholder: "Teachers inspire adventure" (CTA "Take back teacher time ⏰"), "Inspiration's a team effort" (families: "Get everyone involved 🏠"), "Explorers follow a path" (curriculum and leaders). "Educa is built for education teams." Settings: Early Childhood Education / Schools / Outside School Hours Care, plus Specialist Learning Support and Home-based ECE.
4. **Social proof.**
   - First-name quotes with centre and country (Pico, Roosevelt Island Day Nursery, NYCDOE, US; Kylie, Rosy Cheeks Early Learning Centre, NZ; Gabriele, Carlingford Kindergarten, Australia).
   - "Our Partners & Endorsements" logos: NCCCC, NHSA, QUALITYstarsNY, SALSA, DRDP (2015).
   - No counts, ratings or app-store figures.
5. **CTAs and pricing.** Public pricing:
   - BASIC "Record and Share": $1.29 a month per child, paid monthly.
   - ADVANCED "Assess, Measure and Manage": $1.39 prepaid annually or $1.59 paid monthly, per child.
   - 15-child minimum; over 200 children, contact sales. Add-ons include student log-in at 20c per child. Currency isn't stated. Free trial.
6. **Trust and privacy.** Only a privacy-policy link. Sign-in regions are NZ, Australia and Worldwide. No Canada or PIPEDA claim.
7. **Navigation and layout.**
   - Top nav: How It Works / Pricing / Resources ▾ / About Educa ▾ | Register for a free trial | Sign In ▾.
   - Section order: hero → teachers → families → path → device mockup → "built for education teams" → specialised settings → partners → footer.
   - Height: 5,654px desktop, 10,532px phone.
8. **Positioning.**
   - Segment: early-years learning stories (NZ/AU origin, with US endorsements), expanding to schools and OSHC. Breadth: portfolio + family comms + planning. Price: low and public (about $1.29–1.59/child/month).
   - Canada fit: none visible on the site. A third-party listing says it is used in Canada ([Capterra ZA listing](https://www.capterra.co.za/software/151689/educa)).
   - Montessori fit: not mentioned. Faith fit: none.
9. **Borrow / avoid.**
   - **Borrow:** the pricing structure: a public per-child price, a minimum, and "over 200 children, talk to us". That fits SchoolMule's 30–200 band.
   - **Avoid:** a poetic headline that never says what the product is or who it's for.
   - **Avoid:** letting a consent bar cover the only phone CTA.

### Transparent Classroom (transparentclassroom.com)
Screenshots: `transparent-classroom-desktop-fold.jpg`, `transparent-classroom-desktop-full.jpg`, `transparent-classroom-mobile-fold.jpg`, `transparent-classroom-mobile-full.jpg`, `transparent-classroom.json`; extra `transparent-classroom-pricing-*`. Sources: [home](https://www.transparentclassroom.com/), [pricing](https://www.transparentclassroom.com/pricing?locale=en).

1. **First five seconds.**
   - H1 (all caps): "SIMPLE, MEANINGFUL RECORD KEEPING". Subhead (italic): "Designed by Montessorians, for Montessorians." CTA "Request a Trial" (blue). A play button over a darkened full-bleed **real UI** (Math lesson-progress grid with student names and M/P cells).
   - A grey band: "Used by over 3000 Montessori schools."
   - Header: language globe / Tour / Sign in / Request Trial.
   - Phone: the same composition in a big type size, with the CTA in the fold.
2. **Video and imagery.**
   - Real product screenshots in every section: progress grid, lesson planner, observations with photos, child history, daily tracking, conference report, forms, enrollment chart, announcements, attendance.
   - A team Zoom-grid photo. A 2020-dated COVID screening phone mockup.
3. **Audiences.** Teacher and admin voice throughout. Parent value is stated, not given its own section: "You decide what to share, and parents only see information about their child." No role switcher.
4. **Social proof.** Only the "over 3000 Montessori schools" count. No testimonials, logos or ratings.
5. **CTAs and pricing.** Pricing is shown on the homepage: "$2.00 USD per child / month. Unlimited classrooms. Unlimited staff. Unlimited support and training. Each month, you are charged only for children actively enrolled the previous month. If you are closed in the summer, you pay nothing." CTAs: Request a Trial / Request a Demo.
6. **Trust and privacy.** No certifications. A data promise: "We never delete a child's data unless you ask us, even after they have left the school. Their records are retained for free." Support promise: "email responses within 24 business hours and bugs addressed within five business days."
7. **Navigation and layout.**
   - Top nav: Tour / Sign in / Request Trial.
   - Section order: hero → count band → about 14 alternating feature rows → "Can't wait to get started?" → more rows → "Safeguard your school with COVID-19 health screenings." → "We've got your back." (team, "many of whom are Montessori trained") → "Still have questions? Schedule a live demonstration with our support team." → price block → Duwamish land acknowledgement (Seattle office) → footer.
   - Static, no motion. Height: 9,246px desktop, 13,304px phone.
8. **Positioning.**
   - Segment: Montessori schools (US, Seattle). Breadth: mid (records, lesson planning, parent sharing, forms, enrollment, attendance). Price: low and public ($2 USD/child/month).
   - Canada fit: no Canada pitch (USD only), though Uxbridge Montessori (Ontario prospect) uses it. Montessori fit: core.
9. **Borrow / avoid.**
   - **Borrow:** the fairness promise in the price ("closed in the summer, you pay nothing", pay only for enrolled children). It speaks directly to a small-school bursar.
   - **Borrow:** real UI everywhere.
   - **Avoid:** a COVID-screening section still live in 2026 (it signals an unmaintained product), and a single count as the only proof.

### Montessori Compass (montessoricompass.com)
Screenshots: `montessori-compass-desktop-fold.jpg`, `montessori-compass-desktop-full.jpg`, `montessori-compass-mobile-fold.jpg`, `montessori-compass-mobile-full.jpg`, `montessori-compass.json`; extra `montessori-compass-canada-*`. Sources: [home](https://www.montessoricompass.com/), [pricing](https://montessoricompass.com/pricing), [Canada](https://www.montessoricompass.com/canada/).

1. **First five seconds.**
   - Top bar: "Switching from paper, spreadsheets, or another system? **We'll help migrate your data—free.**" plus Login.
   - H1: "Montessori Record Keeping built for your classroom." Subhead: "Stay organized, document learning, and keep families connected—all in one Montessori platform." Bold line: "Start with what you need. Built to grow with your school."
   - CTAs: "Start Your Free 30-Day Trial" (yellow) / "Talk to Us" (outline). Below them: "Trusted by Montessori schools since 2012."
   - Visual: a **real UI** screenshot (Journal → Mathematics lesson grid with student avatar photos).
   - Phone: everything stacks with both CTAs in the fold, and the screenshot follows.
2. **Video and imagery.** Real UI throughout, including a tabbed tour. A headshot for the endorsement. No video on the homepage. There is a separate Webinar page.
3. **Audiences.** Three pillars: Classroom Management / School Administration / Parent Communication. Section header: "Clarity in the Classroom. Confidence at Home." Identity line: "We're Montessori people, too."
4. **Social proof.**
   - An authority endorsement from Tim Seldin, President, Montessori Foundation: "…the most thorough, rigorous, and complete Montessori Scope and Sequence I have ever seen anywhere in the world…".
   - The "Montessori Foundation Scope & Sequence—Exclusively in Montessori Compass" content moat, and "Supporting thousands of Montessori educators… since 2012".
   - Canada page: a "Montessori Canada · Special offer for enrolled schools" pill.
5. **CTAs and pricing.**
   - The homepage shows prices: Monthly $2.00/student/month ("starts at $10/month, which includes your first 5 student profiles"); Annual $1.50/student/month, billed at $18/student/year ("Save 25%").
   - Pricing page: Growth Suite at $6 / $4; onboarding DIY $0 / Done-For-You $995 / Strategic Launch $2,995.
   - Canada page: **$2.50 CAD/student/month** and **$24 CAD/student/year**, plus "Save an additional 20% off your Montessori Compass subscription!". The page shows that next to a "Montessori Canada · Special offer for enrolled schools" pill; that the two are linked is inferred.
   - A visible error: the homepage example "50 active students = $50/month" contradicts its own formula ($10 + 45 × $2 = $100).
6. **Trust and privacy.** Canada page: "Your student data stays in Canada."; "All Canadian school data is stored on secure, enterprise-grade servers located in Canada."; "billed in Canadian dollars—no exchange-rate markup"; "built to align with Canadian privacy expectations, including PIPEDA"; geo banner "🇨🇦 You're viewing Montessori Compass for Canada". FAQ: student data "is never shared with or sold to third parties".
7. **Navigation and layout.**
   - Top nav: Scope and Sequence / Growth Suite / Pricing / Webinar / Contact | Start Your Free 30-Day Trial.
   - Section order: hero → three pillars → endorsement → Scope & Sequence → tabbed tour (Record Keeping, Lesson Planning, Share Photos, Student Insights at a Glance, Daily/Weekly Activity Reports, Record Observations, Customizable Trackers, Attendance) → Growth Suite upsell → "Switching is easier than you think." (1 Start your free trial → 2 We migrate your data—free → 3 Begin in your classroom) → two pricing cards → "Ready to get started?" → footer.
   - Height: 6,140px desktop, 10,981px phone.
8. **Positioning.**
   - Segment: Montessori schools from infants to age 12, small and owner-led. Breadth: records + comms + light admin; the Growth Suite adds admissions and marketing (through AiMS). Price: low and public, in CAD for Canada.
   - Canada fit: **strong** (data residency, CAD, PIPEDA, Montessori Canada partnership). Montessori fit: core.
9. **Borrow / avoid.** This is the closest model for SchoolMule.
   - **Borrow:** the Canada page structure (data in Canada, CAD, PIPEDA, local association offer).
   - **Borrow:** the free-migration bar plus the three-step "Switching is easier than you think".
   - **Borrow:** the price card on the homepage with a worked per-student example.
   - **Avoid:** arithmetic errors in that example. A principal will check the math.

### Google Classroom (edu.google.com, Google for Education)
Screenshots: `google-classroom-desktop-fold.jpg`, `google-classroom-desktop-full.jpg`, `google-classroom-mobile-fold.jpg`, `google-classroom-mobile-full.jpg`, `google-classroom.json`; extra `google-classroom-pricing-*`. Sources: [Classroom page](https://edu.google.com/workspace-for-education/products/classroom/) (the brief's URL redirects here), [compare editions (CA)](https://edu.google.com/intl/ALL_ca/workspace-for-education/editions/compare-editions/).

1. **First five seconds.**
   - Banner: "Gemini now has added data protection. Chat with Gemini to save time, personalize learning and inspire creativity." Breadcrumb, then the Google Classroom logo.
   - H1: "Where teaching and learning come together". Subhead: "Google Classroom helps educators create engaging learning experiences they can personalize, manage, and measure. Part of Google Workspace for Education, it empowers educators to enhance their impact and prepare students for the future."
   - CTAs: "Contact sales" (filled) / "Sign in to Classroom" (outline). Header: Sign in / Contact sales.
   - Fold visual: **none**, just white space. The next heading is "Introducing no-cost AI tools in Google Classroom".
   - Phone: two full-width CTAs.
2. **Video and imagery.** Real UI screenshots in cards. Case-study video thumbnails ("Explore the global impact of Google Classroom"). Educator photos inside the persona tabs.
3. **Audiences.** Tabs: "Education Leaders / Educators / IT Administrators" ("Classroom can be learned in minutes and serves all types of learners and educators, regardless of their tech savviness."). No parent or guardian persona.
4. **Social proof.** A quote carousel, for example "When looking at an LMS solution, Classroom had this balance of being really intuitive, but also incredibly powerful. It didn't require a lot of training. Children and staff were set up in seconds." (Graham Macaulay, Director of Strategic Partnerships, LEO Academy Trust, UK). An ISTE Seal "JUN. 2026–2028" block. Global case studies.
5. **CTAs and pricing.** Education Fundamentals: "No cost" for qualifying institutions. Education Plus: C$7.80 per user per year. Google AI Pro for Education add-on: C$19.50–C$31.20 per user per month. Teaching and Learning add-on: unpriced.
6. **Trust and privacy.** The nav has "Our Commitment" and "Privacy and Security". The Gemini data-protection banner. "A secure, reliable, and extensible platform for school communities of all sizes".
7. **Navigation and layout.**
   - Top nav: Our values / Products / Pricing / AI / Resources | search | Sign in | Contact sales.
   - Section order: hero → AI tools → "Enrich and personalize learning" → "Amplify instruction with tools that simplify everyday tasks" → "Operate with solutions designed to gain visibility, insights, and control" → global impact → quote → ISTE → persona tabs → "Bring all of your tools together with Google Workspace for Education" → "Ready to transform your school?" → footer.
   - Height: 11,917px desktop.
8. **Positioning.**
   - Segment: all K-12 and higher-ed, global. Breadth: LMS/coursework only (no attendance registers, report cards, tuition or SIS). Price: free for qualifying institutions.
   - Canada fit: CAD pricing, and used in 15 SchoolMule dossiers. Faith and Montessori fit: none.
9. **Borrow / avoid.**
   - **Borrow:** the "set up in seconds / didn't require a lot of training" proof, which is the teacher-adoption objection answered by a customer.
   - **Position against it as complementary:** for a Google-Classroom school, SchoolMule is the records, attendance, report-card and parent-portal layer, not a replacement for coursework.
   - **Avoid:** an empty hero and a feature-sprawl page.

### ParentSquare (parentsquare.com)
Screenshots: `parentsquare-desktop-fold.jpg`, `parentsquare-desktop-full.jpg`, `parentsquare-mobile-fold.jpg`, `parentsquare-mobile-full.jpg`, `parentsquare.json`; extras `parentsquare-private-schools-*`, `parentsquare-pricing-*`. Sources: [home](https://www.parentsquare.com/), [private & charter](https://www.parentsquare.com/solutions/private-charter-schools/), [packages](https://www.parentsquare.com/platform/compare-packages/), [security](https://www.parentsquare.com/platform/security-and-compliance/).

1. **First five seconds.**
   - Lime announcement bar: "New research: what 1,000+ parents want from school communication. Get the report".
   - H1: "The K-12 family engagement platform built to reach every family". Subhead: "One unified platform for communication, websites, attendance, and payments—built to reach every family, without barriers."
   - CTAs: "Explore the platform →" (filled, dark green) / "Get a demo" (outline). Header: "Get demo" / "Sign in".
   - Visual: an **autoplaying muted looping video** of real kids boarding a yellow school bus, with floating capability chips (Intelligence, Websites, Notifications, Communication, Engagement, Attendance).
   - Phone: same order with both CTAs in the fold; the chips are cropped.
2. **Video and imagery.** Hero video; UI stat cards; a superintendent **video testimonial**; stock photos.
3. **Audiences.**
   - "Built for schools, designed for families" tabs: Superintendents / Teachers and staff / Comms leaders / Tech leaders / Families and students.
   - Solutions menu includes "Private and Charter Schools". That page's headline is "Deliver a family experience that attracts, engages, and retains", with CTA "Schedule a demo". Its HTML title still reads "Communications for Small & Medium Districts".
4. **Social proof.**
   - "Family engagement infrastructure trusted by 42,000+ schools" (district seal logos). Meta: "22M students".
   - Video quote from R.J. Gravel, Superintendent, Glenbrook High School District 225, IL: "…increase our satisfaction rates to over 90%…".
   - "over 99% contactability within weeks of implementation".
   - The private page quotes Kimberly Winters (Principal, St. Joseph School, Danville PA) and Celeste Akiu (Principal, Holy Family Catholic Academy, HI).
5. **CTAs and pricing.** No public prices. Packages Engage / Engage Premium / Engage 360, plus add-ons (Smart Sites, Payments, Virtual Phone, Attendance Plus), all "Contact sales". Third-party figure of about US$3,000 for up to 600 students is unverified (see Gaps).
6. **Trust and privacy.** SOC 2 Type 2; ISO 27001; iKeepSafe (FERPA/COPPA); "US-based data storage and processing" on AWS; AES-256; "Information is never shared with advertisers or marketers." The footer has a Trust Center, System Status and AI Principles. No Canada claim.
7. **Navigation and layout.**
   - Top nav: Platform / Solutions / Resources and Support / Company | Get demo | Sign in.
   - Section order: hero → "We help schools connect with families—all of them" ("No app or sign-in required for families, no added complexity for staff") → "Engaged families lead to confident, successful students" → logos + testimonials → persona tabs → "Made for how schools actually work" use-case cards → "The platform behind family engagement: All of your tools, one platform" → "Take the first step toward an all-in-one solution" → resources → footer with app badges.
   - Height: 10,559px desktop.
8. **Positioning.**
   - Segment: US K-12 districts, with a private/charter page. Breadth: a broad communications suite (messaging, alerts, websites, attendance outreach, payments, forms); not an SIS. Price: district quote, inferred high for a 100-student school.
   - Canada fit: low (US data residency). Faith fit: Catholic-school testimonials only.
9. **Borrow / avoid.**
   - **Borrow:** "No app or sign-in required for families". SchoolMule's one-tap email sign-in and email digests can be framed the same way, which answers the "parents won't download another app" objection.
   - **Borrow:** "contactability" as a parent-reach metric.
   - **Avoid:** superintendent/district framing, and a stale page title on the segment page.

### Lillio, formerly HiMama (lillio.com)
Screenshots: `lillio-desktop-fold.jpg`, `lillio-desktop-full.jpg`, `lillio-mobile-fold.jpg`, `lillio-mobile-full.jpg`, `lillio.json`; extras `lillio-pricing-*`, `lillio-parents-*`. Sources: [home](https://www.lillio.com/), [pricing](https://www.lillio.com/features/pricing), [parents](https://www.lillio.com/users/parents); Toronto HQ ([HiMama press](https://himama.com/press), [Welcome to the Jungle](https://app.welcometothejungle.com/companies/Lillio)).

1. **First five seconds.**
   - Logo lockup: "Lillio · formerly himama". Eyebrow: "TRUSTED BY THOUSANDS OF CHILDCARE PROVIDERS".
   - H1: "The only childcare management software built by educators". Subhead: "Built by educators who understand what your program needs, Lillio brings attendance, family communication, billing, and planning together in one easy-to-use platform."
   - CTA: "Book a tour of Lillio" (yellow). Header: "Log In" / "Request a Demo" (yellow). Rating line: "Reviewed by 35,000+ happy customers 4.9 ★★★★½".
   - Visual: a flat **illustrated** UI collage (dashboard with an "85 Scheduled" donut, Weekly planner, "Invoice paid" chip, "NEW Message" card, cartoon child photo, curriculum box). A chat widget.
   - Phone: "Request a Demo" stays in the header, with a full-width CTA and the rating in the fold.
2. **Video and imagery.** Illustrated UI in the hero. A brand video with real classroom footage under "Trusted by thousands of childcare centers". Persona photos. The parents page leads with a family photo and "Never miss a moment with Lillio".
3. **Audiences.** "Users" menu: Owners & Directors / Parents / Educators / Enterprise / Home Daycare. The parents page reads: "LILLIO IS FOR FAMILIES · Access real-time updates, daily activity reports, photos and videos, a two-way communication portal, and much more, directly from the Lillio app!"
4. **Social proof.**
   - Stats: "4.9 star rating / 2.1B moments shared with families / 500k curriculum kits delivered / 25K CEUs distributed".
   - **Testimonials tagged with role and size**, for example "Owner | 9 Classrooms" (Missy Knechel, Victory Early Learning Academy: "Lillio billing has saved so much time…") and "Executive Director | 15+ locations" (Gateway Region YMCA).
   - "Why partner with Lillio" stats (e.g., "95% of customers say Lillio fosters better communication with parents") and two case-study cards.
5. **CTAs and pricing.** Quote only. All four products (Center Management + Billing & Payments; Lillio Academy; Curriculum Kits; Digital Curriculum) say "Get a quote".
6. **Trust and privacy.** Footer links to "Internet Safety" and "Vulnerability Reporting". No certifications or data-residency claim on the homepage.
7. **Navigation and layout.**
   - Top nav: Solutions / Users / Resources / About / Pricing | Log In | Request a Demo.
   - Section order: hero → video + stats → "Grow your center with Lillio's all in one solution" (Center Management / Family Engagement / Caring & Teaching / Professional Development) → testimonials → "Why partner with Lillio" → resources → "World-class customer support" → FAQ → "Ready to see what Lillio can do?" → footer ("Toll Free North America 1-800-905-1876", Google Translate picker).
   - The "Grow your center" section is a scroll-pinned animation that rendered **blank** in the full-page capture (`lillio-desktop-full.jpg`).
   - Height: about 8,763px desktop as rendered.
8. **Positioning.**
   - Segment: childcare centres (ECE), North America. Breadth: all-in-one plus curriculum and PD. Price: quote.
   - Canada fit: a Canadian company (Toronto), but the site's voice is US-generic ("state-aligned", QRIS). Faith fit: an incidental Lutheran-centre testimonial.
9. **Borrow / avoid.**
   - **Borrow:** size-tagged testimonials. A SchoolMule version would read "Principal | 140 students | JK–8 | Mississauga", so a 60-student school can see itself.
   - **Borrow:** a dedicated parents page with a family-moment hero.
   - **Avoid:** hiding Canadian roots, and scroll-jacked sections that can render empty.

### Ad-Din (ad-din.ca): Canadian Islamic-institution platform
Screenshots: `ad-din-desktop-fold.jpg`, `ad-din-desktop-full.jpg`, `ad-din-mobile-fold.jpg`, `ad-din-mobile-full.jpg`, `ad-din.json`; extras `ad-din-academics-*`, `ad-din-pricing-*`. Sources: [home](https://www.ad-din.ca/), [academics](https://www.ad-din.ca/academics), [pricing](https://www.ad-din.ca/pricing), [help docs on Ontario report cards](https://ad-din.atlassian.net/wiki/x/iADVH). **Verified faith targeting:** "A Unified Platform Purpose-Built for Islamic Institutions."

1. **First five seconds.**
   - H1: "Masjid, Madrasah & School Operation is challenging. Your Management Software shouldn't be". Subhead: "Stop juggling spreadsheets and scattered systems. One platform to manage everything—from prayer times to classrooms".
   - CTAs: "Book a Demo →" (white pill) / "Get Started" (outline). Header: Products / Resources | Home / Pricing / Log In / "Request a Demo" / "Get Started".
   - Visual: an 18-slide carousel of glossy images (a masjid hall with prayer-time LED boards; a teacher in a kufi with hijab-wearing students before an Arabic and "GRADE 5" whiteboard). They look AI-generated or 3D-rendered, inferred from the rendering style.
   - Phone: CTAs in the fold, images below, a green chat bubble.
2. **Video and imagery.** The homepage has a YouTube demo embed. The academics page uses **real UI** ("Add Student Profile" with faith-specific fields: "Quran Type Preference (13 Line vs 15 Line)", "Total Existing Quran Juz/Para Memorized").
3. **Audiences.** "Software for every leader" grid, three verbs per role: Imam / Masjid Admin / Madrasah Admin / **Parents** ("View grades · Pay fees online · Receive updates") / **Teachers** ("Grade assignments · Track Quran progress · Mark attendance") / **Students** ("Check homework · View schedule · Track achievements") / Congregants / Volunteers.
4. **Social proof.**
   - "Trusted By" scrolling logos, **each labelled with its city**: Scarborough, Cambridge, Markham, Georgetown, Kingston, Red Deer, Malton, Kitchener, Ajax, Chatham, Edmonton, Toronto, Brantford, Sarnia (plus Buffalo/Seldon USA and Campbelltown AU).
   - "Join 100+ Islamic Institutions Using Ad-Din".
   - Seven Canadian case studies: IIT Academy, Manar Academy, International School of Cambridge (ISOC), Madaniyya Academy, Darul Uloom Canada, Anjuman-E-Anwarul Islam of Malton, Islamic Foundation of Toronto.
   - Testimonials are mostly Google Play reviews (e.g., "S Sanah": "…It saved me so much time preparing report cards according to the ministry expectations!"), and they repeat within the carousel.
   - Support stats: "< 4h Response Time · 45+ YouTube Videos · 55+ Help Articles".
5. **CTAs and pricing.** "Simple, Transparent Pricing for Every Institution — Start free, scale as you grow. No hidden fees." The pricing page is a 7-step calculator. Step 1 (Masjid) shows Free $0/year, Basic $9.99/year, Premium $120/year, Premium Lifetime $749 one-time. School-module pricing isn't shown without selections.
6. **Trust and privacy.** "Hosted on Microsoft Azure Tier 4 Data Centers"; "fully managed SaaS". No PIPEDA or residency statement found on the homepage.
7. **Navigation and layout.**
   - Section order: carousel hero → "Your Masjid, Madrasah & School Operation doesn't need a ton of apps." (video) → Trusted By → "Our Products" (Masjid / Madrasah / **Academic School — "Ontario-Aligned Academic Management Anywhere… designed to meet Ontario (Canada) Ministry of Education Reporting Mandates"** / Website) → "Our support is unmatched." → "See Ad-Din in Action" + testimonials → contact form (Freshsales) → Success Stories → "What sets us apart" → "Why Ad-Din is Stress-Free" → pricing teaser → role grid → footer with app badges and WhatsApp.
   - Height: 10,361px desktop. A middle band rendered blank in the half-scale capture (lazy content); text was confirmed via the rendered DOM.
8. **Positioning.**
   - Segment: Canadian (Ontario-heavy) mosques, madrasahs and full-time Islamic JK–12 schools. Breadth: very broad (prayer-time displays, donations, livestream, websites, SIS, gradebook, Hifz tracking, Ontario report cards plus a separate Islamic Studies card). Price: low (free tier; school price hidden).
   - Canada fit: **very high**. Faith fit: **very high**. The incumbent at SchoolMule prospects IIT Academy and Darul-Uloom Chatham.
9. **Borrow / avoid.**
   - **Borrow:** city-labelled local proof ("Markham, Canada"). For a small Ontario school, five local names beat "42,000 schools".
   - **Borrow:** the three-verbs-per-role grid, a compact way to show four portals.
   - **Avoid:** an 18-slide hero that mixes mosque displays with school admin, and recycled Play Store reviews as testimonials.

### Alif Cloud (alifcloud.com): Islamic-school SaaS, North America
Screenshots: `alif-cloud-desktop-fold.jpg`, `alif-cloud-desktop-full.jpg`, `alif-cloud-mobile-fold.jpg`, `alif-cloud-mobile-full.jpg`, `alif-cloud.json`; extra `alif-cloud-pricing-*`. Sources: [home](https://www.alifcloud.com/), [pricing](https://www.alifcloud.com/pricing); listed on Capterra as "Dugsi Cloud", founded 2014 ([Capterra](https://www.capterra.com/p/166910/Dugsi-Cloud/)). **Verified faith targeting:** "Purpose-built for Islamic schools". The meta description names Minneapolis–St. Paul, Seattle, Columbus, Dallas, Chicago and Toronto.

1. **First five seconds.**
   - Pill: "Purpose-built for Islamic schools". H1: "Run Your Islamic School With Clarity and Confidence." Subhead: "Families register from their phone, signing the enrollment agreement and paying the application fee if you require them. Staff run student records, Quran progress, attendance, billing, and parent messaging from one system built for Islamic schools."
   - CTAs: "Get started free →" (blue) / "View Pricing" (outline). Header: Log in / Get started free. Below: "Trusted by 50+ Islamic schools across North America" with letter-initial avatars (A N M S).
   - Visual: a crisp coded dashboard mockup ("Al-Noor Islamic Academy", 342 students, 94% attendance, revenue, enrollment trend).
   - Phone: headline, subhead and a full-width "Get started free" in the fold.
2. **Video and imagery.** A UI mockup with demo data. No photos or video.
3. **Audiences.** Admin-led, with parents framed through features ("Parents Enroll Themselves", "Parents Stay Informed"). No role switcher.
4. **Social proof.** "50+ Islamic Schools / 12,000+ Students Managed / 98% Satisfaction Rate / 4.9/5". Three quotes with **initials avatars and no locations** (Fatima Hassan, Principal, Al-Noor Academy; Ahmed Khan, Administrator, Iqra School; Maryam Osman, Founder, Bayyinah Academy). "Trusted by schools including" is plain text, not logos. I couldn't verify any of it; it reads as generic.
5. **CTAs and pricing.** "Free up to 30 students, then $1.49 per student a month." Starter: free forever, with caps (30 students, 5 classes, 3 teachers, 20 parents). Standard: $1.49/student/month, "About 5¢ per student a day", 14-day trial, 30-day money-back. Scale: custom. A slider calculator ("Your school of 50 students $74.50 / month"). "226 features. Every one of them on every plan." Currency isn't stated.
6. **Trust and privacy.** "Care With Family Data": role-scoped access, plus a one-time code on sign-in from a new city. "Your data is yours. Export your records anytime." No COPPA/PIPEDA certifications.
7. **Navigation and layout.**
   - Top nav: Features / Solutions / Pricing / Islamic Schools / Blog | Log in | Get started free.
   - Section order: hero → "THE REALITY: Running an Islamic School Shouldn't Feel Like Chaos." (pain cards incl. "WhatsApp Chaos") → "From Overwhelmed to In Control." (Without/With comparison) → features (Quran & Islamic Curriculum first) → trust stats + quotes → "Built Different. Built for Islamic Schools." → "226 features" table → FAQ (SEO questions like "What is the best Islamic school software?") → CTA → footer.
   - Height: 10,272px desktop, 19,501px phone.
8. **Positioning.** Segment: Islamic day, weekend, dugsi and madrasah schools, US-led and naming Toronto. Breadth: all-in-one (enrollment, SIS, Quran tracking, LMS, billing through Stripe, SMS). Price: low and public. Canada fit: low to moderate (Toronto named; no Ontario report cards, no residency). Faith fit: very high.
9. **Borrow / avoid.**
   - **Borrow:** the before/after "Without X / With X" list in the school's own words ("WhatsApp groups for parent communication" → "SMS, voice, and email from one platform"). That pain is common in SchoolMule's prospect dossiers.
   - **Borrow:** a student-count price slider.
   - **Avoid:** unverifiable initials-only testimonials, and letter placeholders where logos should be.

### SchoolCues (schoolcues.com): low-cost small-school SIS sold to faith schools
Screenshots: `schoolcues-desktop-fold.jpg`, `schoolcues-desktop-full.jpg`, `schoolcues-mobile-fold.jpg`, `schoolcues-mobile-full.jpg`, `schoolcues.json` (slug shared with the SIS researcher; same homepage); unique extras `schoolcues-islamic-*`, `schoolcues-canadian-*`. Sources: [home](https://www.schoolcues.com/), [Islamic schools](https://www.schoolcues.com/islamic-schools.html), [Canadian schools](https://www.schoolcues.com/canadian-schools.html). **Faith targeting verified:** a school-type grid with Catholic, Islamic, Jewish Day, Lutheran, Episcopal, Christian and Classical Christian tiles, and "Also Serving Faith-Based School Communities".

1. **First five seconds.**
   - A **modal demo form covers the hero on load**, on desktop and on phone: "You Are One Step Closer to Accessing the Leading Low Cost All-in-One Small School Management System.", in red "DO NOT USE THIS FORM TO CONTACT SUPPORT" and "If you do not have an answer for a required field, please type in "NA".", 12 fields, "SCHEDULE A DEMO".
   - Hero under the modal (from rendered text): "School Management Solutions Simplified for Small Schools" + "Schedule a Demo", with a module-icon carousel (Admissions, Parent Engagement, Mobile Chat, School Communication, Alumni Management, Parent App).
   - Header: Home / Customers / Platform / Features / Pricing / Contact / Blog / Schedule a Demo / "Sign in | Sign up".
2. **Video and imagery.** **Real phone screenshots** of the Parent App and Admin App ("Olympus Heritage School" demo data). A Vimeo "OUR STORY" embed. Stock-photo tiles. A modules wheel graphic.
3. **Audiences.** "Powerful features for administrators, teachers and parents." A 26-tile "Ideal low-cost solution for small schools" grid (Online, Homeschools, Micro-Schools, Catholic, Private, Independent, Lutheran, Montessori, Waldorf, Islamic, Charter, Episcopal, **Canadian Schools**, Preschools, Christian, Classical Christian, Gifted, Jewish Day, Rural, Adult Ed, Special Ed, Nursery, Sports, Hybrid, Startup, Afterschool). Each tile links to a **templated page**: the Islamic and Canadian pages carry identical copy with the noun swapped ("exclusively geared towards Islamic/Canadian school administration"). The Canadian page talks ACH and QuickBooks, and the copy still references "the current crisis".
4. **Social proof.** "Small Schools - Big Ideas" strip of small customer logos; "Monthly Engagement Numbers for Schools & Parents"; "over 10 years" serving small schools.
5. **CTAs and pricing.** "As low as $75.00/mo for a 12-month school year."; footer "From $75/month · No setup fees". Checklist: "No Set Up Fee / No Training Fee / No Hidden Charges / No Support Fee / Unlimited Training / Unlimited Support / Unlimited Texting / Easy Set Up / Free Upgrades / Mobile App for Parents".
6. **Trust and privacy.** None shown beyond policy links. No PIPEDA or Canadian hosting despite the Canadian page.
7. **Navigation and layout.**
   - Section order: modal over hero → logos → "Stay Connected on the Go!" (apps + checklist) → "School Management Software for Increasing Parent Engagement" (video + wheel) → engagement numbers → about 30-module grid → school-type grid → "Our Pricing" → "About SchoolCues" → contact form → footer.
   - Height: 9,684px desktop and **24,202px phone** (very long).
8. **Positioning.** Segment: US small private and faith schools (lists Canada). Breadth: all-in-one (SIS, admissions, payments, gradebook, report cards, donations, alumni). Price: low and public (from $75/month). Canada fit: thin, templated. Faith fit: broad multi-faith, with no faith-specific features shown.
9. **Borrow / avoid.**
   - **Borrow:** the "no setup / training / support fee, unlimited support" checklist, which addresses the hidden-cost fear of small schools.
   - **Borrow:** a "find your school type" entry point, Montessori / Islamic / Christian / independent, done honestly.
   - **Avoid:** a load-time modal form, "type NA", and find-and-replace segment pages. A principal who reads two of them will notice.

## Positioning data

| Vendor | Target segment (size, type, geography) | Breadth | Price level + evidence | Canada fit | Faith / Montessori fit |
|---|---|---|---|---|---|
| Brightwheel | US early-childhood centres, preschools, Montessori, camps; single to multisite | All-in-one ECE (billing, payroll, admissions, curriculum, comms) | Quote only, via a 6-step "Request pricing" quiz ([pricing](https://mybrightwheel.com/pricing/)); level unknown, inferred mid | Low–moderate: "US and Canada" in the Montessori FAQ; provinces in forms ([Montessori](https://mybrightwheel.com/montessori/)) | Montessori page ("AMS & AMI-aligned"); no faith |
| ClassDojo | US K-8 mass market, now school-wide and districts | Comms + behaviour + portfolios + school-wide announcements | Free for teachers and schools; families pay for an optional subscription ([FAQ](https://www.classdojo.com/school-leaders/)) | Low: nothing Canada-specific | None |
| Seesaw | PreK–6 schools and districts, US + Canada | LMS + portfolio + family comms | District quote; tiers with no prices ([pricing](https://seesaw.com/en-ca/pricing-packages/)); inferred mid–high | Moderate: Canada page, PIPEDA/MFIPPA, 590K Canadian users ([Canada](https://seesaw.com/canada/)) | None |
| Educa | Early-years settings (NZ/AU origin, US endorsements), some schools/OSHC | Learning stories / portfolio + family comms + planning | Low, public: $1.29–$1.59/child/month, 15-child minimum ([pricing](https://www.geteduca.com/pricing/)) | Low: no Canada region or claims; third-party says used in Canada | Not Montessori-marketed; no faith |
| Transparent Classroom | Montessori schools, US (Seattle), any size | Records + lesson planning + parent sharing + forms/enrollment/attendance | Low, public: $2.00 USD/child/month, unlimited staff ([home](https://www.transparentclassroom.com/)) | Low–moderate: USD only, no Canada pitch; used by an Ontario prospect (Uxbridge Montessori) | Montessori core; no faith |
| Montessori Compass | Montessori schools (infant to 12), small and owner-led | Records + comms + light admin; Growth Suite adds admissions | Low, public: $2.00 or $1.50 USD/student/month; **$2.50 CAD** / $24 CAD per year ([Canada](https://www.montessoricompass.com/canada/)) | **High**: Canadian data residency, CAD billing, PIPEDA, Montessori Canada offer | Montessori core (Montessori Foundation scope & sequence); no faith |
| Google Classroom | All K-12 and higher-ed, global | LMS / coursework only | Free (Fundamentals, qualifying institutions); Education Plus C$7.80/user/year ([editions](https://edu.google.com/intl/ALL_ca/workspace-for-education/editions/compare-editions/)) | High availability (CAD, Canadian locale); 15 SchoolMule dossiers | None |
| ParentSquare | US K-12 districts, plus private/charter | Broad comms suite (messaging, alerts, websites, attendance outreach, payments); no SIS | District quote, "Contact sales" ([packages](https://www.parentsquare.com/platform/compare-packages/)); inferred high for small schools | Low: "US-based data storage and processing" ([security](https://www.parentsquare.com/platform/security-and-compliance/)) | Catholic-school testimonials only |
| Lillio (HiMama) | Childcare centres (ECE), North America; single to multi-location | All-in-one ECE + curriculum kits + PD | Quote only: every product says "Get a quote" ([pricing](https://www.lillio.com/features/pricing)) | Moderate: Toronto company ([press](https://himama.com/press)) but US-generic site voice | None |
| Ad-Din | Canadian (Ontario-heavy) mosques, madrasahs, full-time Islamic JK–12 schools; "100+ Islamic Institutions" | Very broad: masjid displays, donations, websites, SIS, gradebook, Hifz, Ontario report cards | Low: free tier; Masjid $9.99–$120/year or $749 lifetime; school price hidden in a configurator ([pricing](https://www.ad-din.ca/pricing)) | **Very high**: "designed to meet Ontario (Canada) Ministry of Education Reporting Mandates" ([home](https://www.ad-din.ca/)); 14 Canadian cities in its logo wall | **Very high (Islamic)**; incumbent at IIT Academy and Darul-Uloom Chatham |
| Alif Cloud | Islamic day, weekend, dugsi and madrasah schools, North America (US-led; names Toronto) | All-in-one: enrollment, SIS, Quran tracking, LMS, Stripe billing, SMS | Low, public: free to 30 students, then $1.49/student/month ([pricing](https://www.alifcloud.com/pricing)) | Low–moderate: Toronto in meta; no Ontario report cards or residency | Very high (Islamic) |
| SchoolCues | US small private and faith schools (templated "Canadian Schools" page) | All-in-one small-school SIS + comms + payments + donations + alumni | Low, public: "As low as $75.00/mo for a 12-month school year" ([home](https://www.schoolcues.com/)) | Low: templated page with US payment rails (ACH, QuickBooks), no PIPEDA | Broad multi-faith (Catholic, Islamic, Jewish, Lutheran, Christian) + Montessori tiles; no faith-specific features shown |
