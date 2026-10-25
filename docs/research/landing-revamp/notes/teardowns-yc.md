# YC B2B marketing sites: teardowns for the schoolmule.ca redesign

Captured 2026-10-25 with `tools/shoot.mjs` (desktop 1440×900 fold + full page, iPhone-class 390×844 fold + full page, JSON of headings/nav/CTAs/video). Every visual claim below comes from a screenshot I opened. Text quoted in "double quotes" is verbatim from the live page (DOM text dump or screenshot). Anything I inferred is marked *(inferred)*.

Screenshot paths are relative to `docs/research/landing-revamp/`. Every site has `screenshots/yc/<slug>-desktop-fold.jpg`, `-desktop-full.jpg`, `-mobile-fold.jpg`, `-mobile-full.jpg` and `<slug>.json`. Extra pages use `<slug>-<page>-*`. Some extra evidence files were made by scrolling the page and taking a screenshot at each step, because full-page screenshots miss scroll-triggered content:
- `screenshots/yc/*-scroll-sheet*.jpg`: viewport screenshots taken while scrolling.
- `screenshots/yc/_yc-mobile-midscroll-sheet.jpg`: all 13 sites on a phone after four scroll steps, to show what stays pinned.
- `screenshots/yc/campfire-tour-modal.jpg`, `gusto-how-it-works.jpg`, `flint-request-demo.jpg`: what a secondary CTA opens, captured by clicking it. Nothing was submitted.

**Capture caveats**
- Full-page screenshots miss scroll-triggered content. Tennr's renders almost blank, Vanta's headings come out faded, and Avoca's counters read "0%". I re-shot those sites by scrolling step by step.
- PostHog's homepage scrolls inside an "OS window", so its full-page capture shows only the fold (page height 900px).
- The tool's desktop full-page images came out 1440px wide, not the half scale described in its header comment.

---

## Selection and YC verification

### Takeaway
I verified 13 companies against their ycombinator.com pages and captured all of them. There are 4 established companies (Gusto, Rippling, Vanta, PostHog), 6 recent B2B companies (Resend, Pylon, Avoca, Tennr, Campfire, Numeral) and 3 from YC's Education list (Scout, Flint, ClassDojo). A 14th site, HappyRobot, was captured but cut as off-target. Delve could not be verified and was dropped.

### Cited Findings
| # | Company | Segment | YC batch (as stated on YC page) | Verification URL |
|---|---|---|---|---|
| 1 | Gusto | established | Winter 2012 | https://www.ycombinator.com/companies/gusto |
| 2 | Rippling | established | Winter 2017 | https://www.ycombinator.com/companies/rippling |
| 3 | Vanta | established | Winter 2018 | https://www.ycombinator.com/companies/vanta |
| 4 | PostHog | established | Winter 2020 | https://www.ycombinator.com/companies/posthog |
| 5 | Resend | recent | Winter 2023 | https://www.ycombinator.com/companies/resend |
| 6 | Pylon (usepylon.com) | recent | Winter 2023 | https://www.ycombinator.com/companies/pylon-2 |
| 7 | Avoca | recent | Winter 2023 | https://www.ycombinator.com/companies/avoca |
| 8 | Tennr | recent | Winter 2023 | https://www.ycombinator.com/companies/tennr |
| 9 | Campfire (campfire.ai) | recent | Summer 2023 | https://www.ycombinator.com/companies/campfire-2 |
| 10 | Numeral | recent | Winter 2023 | https://www.ycombinator.com/companies/numeral |
| 11 | Scout (scoutforschools.com) | education | Winter 2025 | https://www.ycombinator.com/companies/scout-4 |
| 12 | Flint (flintk12.com) | education | Summer 2023 | https://www.ycombinator.com/companies/flint-2 |
| 13 | ClassDojo | education | Summer 2012 | https://www.ycombinator.com/companies/classdojo |

- Each YC page is server-rendered and embeds `"batch_name"` in its page data. I read the batch from there for the company whose `slug` matches. Example: ClassDojo's page shows `"batch":"S12","batch_name":"Summer 2012"` and the one-liner "Communication app for K-8 teachers, kids, and families" ([YC](https://www.ycombinator.com/companies/classdojo)).
- Slug traps:
  - `/companies/pylon` is a different company: Pylon, "Infrastructure management software for water & electricity companies", Summer 2021 ([YC](https://www.ycombinator.com/companies/pylon)). The support-platform Pylon is `pylon-2`, "The Agentic Support Platform purpose-built for B2B." ([YC](https://www.ycombinator.com/companies/pylon-2)).
  - `/companies/campfire` is "Sprites" ([YC](https://www.ycombinator.com/companies/campfire)). Campfire ERP is `campfire-2`, "The AI Native ERP for the fastest growing companies." ([YC](https://www.ycombinator.com/companies/campfire-2)).
- Education candidates came from YC's industry page ([YC Education](https://www.ycombinator.com/companies/industry/education)):
  - Scout, W25: "AI-powered student information system for K-12 schools", team size 8. This is SchoolMule's own category.
  - Flint, S23: "Personalized learning built for schools".
  - Also on the list but not chosen: Frizzle (S25, "AI Grading for Teachers") and Bloomy (S26, "AI-native learning for every school"), both very new.
- Verified but not captured, because I preferred more relevant sites: Retool W17, Supabase S20, Deel W19, Mintlify W22, Algolia W14, Brex W17 (YC status "Acquired"), Clever S12, Lattice W16, Front S14, Zapier S12, Webflow S13 (YC pages above, same URL pattern).
- Captured but cut: HappyRobot, Summer 2023 ([YC](https://www.ycombinator.com/companies/happyrobot)). Screenshots are in `screenshots/yc/happyrobot-*`. The hero reads "Putting agents to work." with an email field and "BOOK A DEMO"; buyers are enterprise logistics, airlines and utilities.
- Dropped: Delve. There is no YC page at `/companies/delve`, `delve-2`, `delve-ai` or `delveai` (all 404), and I did not find the right slug. Mercury was skipped per the brief.

### Inferences
- The mix leans toward relevance to SchoolMule rather than the "prettiest" sites:
  - owner-operator buyers: Gusto, Avoca, Numeral
  - one platform with several products or audiences: Rippling, ClassDojo, Campfire
  - trust and security selling: Vanta, Scout, Flint
  - film and demo handling: Campfire, PostHog, Pylon, Rippling
  - Resend and Tennr are craft benchmarks with less direct relevance.

### Gaps
- Delve's YC status is unverified.
- YC's directory list pages are JavaScript-driven, so I used the industry page's embedded data. It may not list every education company.

---

## Site teardowns

### 1. Gusto: gusto.com (YC Winter 2012, established)
**Sources:** https://gusto.com, https://gusto.com/instant-demo, https://gusto.com/product/pricing, https://gusto.com/invite/company/explore. YC: https://www.ycombinator.com/companies/gusto (Winter 2012).
**Screenshots:**
- `screenshots/yc/gusto-desktop-fold.jpg`, `gusto-desktop-full.jpg`, `gusto-mobile-fold.jpg`, `gusto-mobile-full.jpg`, `gusto.json`
- `gusto-demo-desktop-fold.jpg` (+ full/mobile/json)
- `gusto-pricing-desktop-fold.jpg` (+ full/mobile/json)
- `gusto-how-it-works.jpg`

1. **First five seconds** ([gusto.com](https://gusto.com), `gusto-desktop-fold.jpg`, `gusto-mobile-fold.jpg`)
   - Headline: "Hire, pay, and grow like a pro."
   - Subhead: "Gusto handles payroll, HR, and more in a snap. That helps you expand your reach and keep betting big on yourself."
   - Primary CTA: "Create free account". Secondary: "How Gusto works". The nav also has "See demo" (text link with an eye icon), a filled "Create free account" button and "Sign in".
   - Desktop fold: a huge serif headline on a red-pink gradient. Below the CTAs sits a staged but real-looking desktop app window ("Spring bonus 2027", "Confirm $28,684.58 withdrawal and submit payroll", "Step 4 of 4") with floating cards ("TIME OFF Review Requests", "TIME TRACKING Manage Team Shifts"). A cookie banner and an "Ask me anything about Gusto" AI chat bubble cover the bottom edge.
   - Phone fold: the header keeps logo, a "Create free account" button and a hamburger. Both CTAs stack full width. The product shot swaps from the desktop window to a phone app screen ("Run Pay", "Double check hours and pay") with the same floating cards.
2. **Video and product imagery**
   - The homepage DOM has no `<video>`. The product is shown as a composited static UI ([gusto.json](https://gusto.com)).
   - "See demo" goes to /instant-demo: "Ready to start a step by step tour?" It is gated by 6 fields (first name, last name, work email, company name, number of employees, company phone) with "Start the demo". The header shows a phone line, "Talk with our team at (800) 936-0383", and a left column lists awards ("4.6 Rating Software Advice | 4,139 reviews", "#1 Most Innovative Company in HR Fast Company | 2025", "Best overall payroll software Nerdwallet | 2025") ([instant-demo](https://gusto.com/instant-demo), `gusto-demo-desktop-fold.jpg`).
   - "How Gusto works" is not a video. It opens a questionnaire ([explore](https://gusto.com/invite/company/explore), `gusto-how-it-works.jpg`):
     - Page title "Learn how Gusto works"
     - "Who do you plan to pay with Gusto?" (Myself / W-2 employees / Contractors)
     - "How many states will you be running payroll in?"
     - "How do you currently run payroll?"
3. **Multiple audiences**
   - Nav dropdowns "Business types" and "For accountants".
   - The pricing page splits into tabs "Pay My Team" / "Pay Myself" ([pricing](https://gusto.com/product/pricing)).
   - An h2 "Every solopreneur deserves support." sits in the homepage carousel ([gusto.json](https://gusto.com)).
4. **Social proof** (`gusto-desktop-full.jpg`, [gusto.com](https://gusto.com))
   - An award strip directly under the hero:
     - CNBC "Best SMB payroll service For user experience 2025"
     - Forbes Advisor 4.5★ 2025
     - G2 "#1 Highest Satisfaction Software G2 Review 2026"
     - Newsweek "America's Best Online Platform Newsweek and Statista 2025"
   - "500,000+ businesses run on Gusto." with customer portrait photos.
   - A stories carousel mixing named quotes with news cards:
     - "Jesse Mason, Co-Owner, Mason's Creamery"
     - "Amy Hayes Stellhorn, CEO, Big Monocle"
     - "Fire safety training company Forge Fire reduced platform costs by 40%…"
   - A stats band, sourced on the page to "Survey of 538 Gusto Customers, September 2024":
     - "9 out of 10 Customers would recommend Gusto"
     - "152 hrs/year Average time saved on tax and compliance by switching to Gusto"
     - "4.5+ stars"
     - "500k+ businesses"
5. **CTAs and pricing**
   - Self-serve signup is primary; the demo is secondary.
   - A closing block "Ready to work with Gusto?" lists 3 steps: "Create your free account. Add your team (or let them self-onboard). Run your first payroll." It then offers four doors:
     - "See plans and pricing: As in real numbers on the page. No proposal or quote needed, just clear and easy options."
     - "Compare Gusto: Find out how we stack up against ADP, Paychex, Rippling, and others."
     - "Explore the demo: Take 5 minutes to check out how Gusto really works."
     - "Talk to sales", linking to `#qualified_scheduler_talk_to_sales` (Qualified scheduler)
   - Pricing is public: "Simple, transparent pricing. Payroll, benefits, and HR all in one place. No hidden fees. Cancel any time." Three tiers, each a base price plus a per-person fee.
   - **Caveat:** two loads minutes apart showed different prices. The screenshot shows Simple $49/mo + $6/mo per person, Plus $80/mo + $12, Premium $180/mo + $22. The text capture shows $49 + $7, $99 + $12, $179 + $22. This is likely price testing *(inferred)*, so don't quote either set as fixed ([pricing](https://gusto.com/product/pricing), `gusto-pricing-desktop-fold.jpg`).
6. **Navigation**
   - "Products ▾ / Business types ▾ / For accountants ▾ / Resources ▾ / Pricing" on the left; "See demo / Create free account / Sign in" on the right.
   - An announcement bar ("Gusto Showcase is back…") sits above. The header is sticky (the DOM check after scrolling showed `position: sticky`).
   - Qualified chat iframe ([gusto.com](https://gusto.com)).
7. **Motion, mobile, section order**
   - Motion: a 3-slide "AutoPilot" carousel and a repeating product-card row (the cards repeat in the DOM, so likely a marquee *(inferred)*). No hero video.
   - Mobile mid-scroll: the header keeps "Create free account" visible (`_yc-mobile-midscroll-sheet.jpg`).
   - Section order:
     1. Announcement bar
     2. Nav
     3. Hero
     4. Award strip
     5. "Showcase Fall 2026, Dream: On" event banner
     6. "500,000+ businesses run on Gusto."
     7. "Put payroll on AutoPilot™" carousel ("Run payroll in five minutes flat.")
     8. "Hiring tools. On your terms." (photo + 4 columns)
     9. "Small business success is no small thing." stories
     10. "Your business does a lot. We do, too." product cards
     11. Stats band
     12. "Ready to work with Gusto?" steps + 4 doors
     13. "DO WHAT YOU DO BEST. We'll handle the rest." + "Compare plans"
     14. Footer
8. **Borrow for SchoolMule**
   - (a) **Device-specific product shot:** the desktop shows the admin app, the phone shows the phone app. A principal on a phone would see the parent/teacher mobile view, which is also the most relatable screen.
   - (b) **The "Ready to…?" closing block:** three plain "what happens next" steps plus four doors (pricing / compare / explore the demo / talk to us). A principal who isn't ready to book still gets a next step.

### 2. Rippling: rippling.com (YC Winter 2017, established)
**Sources:** https://www.rippling.com (served /en-CA to our Toronto-locale browser), https://www.rippling.com/en-CA/tour-video, https://www.rippling.com/en-CA/request-demo, https://www.rippling.com/en-CA/pricing. YC: https://www.ycombinator.com/companies/rippling (Winter 2017; one-liner "One place to run all your HR, IT, and Finance. Globally.").
**Screenshots:**
- `screenshots/yc/rippling-desktop-fold.jpg`, `rippling-desktop-full.jpg`, `rippling-mobile-fold.jpg`, `rippling-mobile-full.jpg`, `rippling.json`
- `rippling-tour-*` (gated tour video)
- `rippling-demo-*` (demo form)

1. **First five seconds** (`rippling-desktop-fold.jpg`, `rippling-mobile-fold.jpg`)
   - Headline: "Manage your entire workforce on one system"
   - Subhead: "Increase savings and automate busy work with global HR, Payroll, IT, and Finance in one place—powered by AI that understands your business."
   - Primary CTA: an inline "Work email address*" field plus a yellow "See Rippling" button. Secondary: "Take a product tour" (play-icon link). Nav CTA: "See a demo".
   - Above the headline: G2 "4.8 stars 16k+ reviews". Below the CTAs: "Software Advice 4.9 star rating", "PC Magazine Editor's Choice", "Capterra 4.9 star rating".
   - Promo bar: "Get your first 3 months free when you sign up for Payroll and HR*."
   - Desktop visual: dark plum; a photographed hand taps a tablet showing stylised UI cards labelled HR / IT / Finance / Payroll.
   - A Qualified chat pops up: "Hey there 👋 Looking for a way to run your entire workforce in one place?" with buttons "Book a demo with sales" / "See Rippling in action" / "Get Customer Support".
   - Phone: the tablet image leaves the fold. Order is rating → headline → email field → full-width "See Rippling" → product tour link → ratings, and the tablet appears below (`rippling-mobile-full.jpg`).
2. **Video and product imagery**
   - No `<video>` on the homepage.
   - "Take a product tour" goes to a gated video: "See Rippling in action. Fill out the form below to watch a video tour of Rippling." It asks for 6 fields (work email, full name, company, HQ, phone, "How did you hear about us?"), then "Watch now". The player poster reads "Play video 10:47" ([tour-video](https://www.rippling.com/en-CA/tour-video), `rippling-tour-desktop-fold.jpg`).
   - Product imagery is stylised real UI. The key piece is an employee record card: "Zoe Adebayo, Senior Account Executive", with Employee ID, Base salary, Home address "Toronto, ON", Device "MacBook Pro", Apps 32, Corp card spend, CRM quota, Active tickets. There is also a permissions panel and a headcount chart (`rippling-desktop-full.jpg`).
3. **Multiple audiences** ([rippling.com](https://www.rippling.com))
   - Product-line cards (HR, IT, Finance, Payroll, Total applications) each carry their own "Get a demo" link, and each goes to a product-specific demo route: `request-demo?product=hr`, `request-rippling-it-live-tour`, `spend-request-demo`, `products/global/request-demo`.
   - The Solutions menu lists 11 industries.
   - The footer lists partner audiences (HR Advisors, Accountants, Brokers, VC Firms, Private Equity).
4. **Social proof**
   - Ratings in the hero.
   - A testimonial carousel led by logos, with name and title (for example Barry's: "Vanessa Sarne, Senior Director, Employee Relations at Barry's"; "Brendan Woodroff, VP of People at Chess.com"; "Tatyana Veremyova, Director of Employment Compliance at y combinator").
   - Story cards ("Y Combinator significantly reduced its admin workload with Rippling, its HR 'tool of choice'") ([rippling.com](https://www.rippling.com)).
5. **CTAs and pricing**
   - Demo-led. The demo form has 7 fields (work email, full name, company, "# of employees + contractors", HQ, phone, "Which product are you interested in?"), then "See Rippling" ([request-demo](https://www.rippling.com/en-CA/request-demo), `rippling-demo-desktop-fold.jpg`).
   - Pricing is quote-only: "Tell us what services you need, and we'll send you a custom quote." ([pricing](https://www.rippling.com/en-CA/pricing)).
6. **Navigation**
   - "Products ▾ / Platform ▾ / Solutions ▾ / Global ▾ / Resources ▾ / Pricing"; then a "🇨🇦 EN" language picker, "Login" and a yellow "See a demo" button.
   - The header is fixed (DOM check) ([rippling.json](https://www.rippling.com)).
7. **Motion, mobile, section order**
   - Mostly static. The right half of "When everything runs on one system" rendered blank in the full-page capture, likely a scroll-triggered visual *(inferred)*.
   - Section order:
     1. Promo bar
     2. Nav
     3. Hero
     4. "Start with the apps you need, or run them all together" (5 product cards)
     5. "Manage your entire global workforce" band
     6. "Rippling is the operating system for your entire workforce". Copy: "Unlike most 'all-in-one' platforms that simply bundle tools, Rippling products share incredibly deep underlying data, controls, and AI capabilities — so they work better together by design." Three cards: "Your business data with people at the center" / "Shared permissions and access controls" / "Get enterprise-grade reporting for real-time visibility everywhere"
     7. "When everything runs on one system, work moves faster" (3 benefits)
     8. Testimonial carousel
     9. "What's new at Rippling"
     10. "Get a demo—live or on demand" ("Request Live Demo" / "Watch tour video")
     11. Mega-footer with "Request a demo to see Rippling in action" email form
8. **Borrow for SchoolMule**
   - (a) **"Data with people at the centre":** one record card that shows everything attached to a person. For SchoolMule this becomes "every student, one record": homeroom, grades, attendance, report card, parent contacts and messages on one card. It is the visual proof of "four portals, one database", and it echoes Rippling's explicit "unlike platforms that simply bundle tools" contrast.
   - (b) **"Live or on demand":** two demo paths. Don't copy the gating, though. Rippling's 6-field gate guards a 10:47 tour, and SchoolMule's 1:41 film should stay open.

### 3. Vanta: vanta.com (YC Winter 2018, established)
**Sources:** https://www.vanta.com, https://www.vanta.com/company/security, https://www.vanta.com/demo, https://www.vanta.com/pricing. YC: https://www.ycombinator.com/companies/vanta (Winter 2018).
**Screenshots:**
- `screenshots/yc/vanta-desktop-fold.jpg`, `vanta-desktop-full.jpg`, `vanta-mobile-fold.jpg`, `vanta-mobile-full.jpg`, `vanta.json`
- `vanta-security-*`
- `vanta-demo-*`

1. **First five seconds** (`vanta-desktop-fold.jpg`, `vanta-mobile-fold.jpg`)
   - Headline: "Get your compliance together"
   - Subhead: "SOC 2, ISO 27001, HIPAA, and 35+ frameworks—automated with AI and continuously monitored."
   - Primary CTA: a pill email field (placeholder "nodrama@llama.com") plus "Get a demo". There is no secondary CTA in the hero. Nav: "Log in" / "Get a demo".
   - Desktop visual: a lavender rounded hero card with a dotted wave texture and an inner banner "Don't tackle AI risk alone. Join us at VantaCon". Below it, a browser-window frame plays an agent sequence ("Calling Vanta MCP…", "Connecting to Claude"). A logo strip (ramp, Cursor, snowflake, clay, Lovable, samsara) is pinned to the bottom of the fold.
   - A Qualified chat opens: "Welcome to Vanta 👋 … How can we help you today?" with "What product is best for me?", "Content Resources" and "Get in touch with our team".
   - Phone: same order. The email pill and "Get a demo" stay side by side, the animated window sits below, then "TRUSTED BY 16,000 BUSINESSES FROM STARTUP TO ENTERPRISE".
2. **Video and product imagery**
   - No `<video>`. The hero is an in-DOM animated product sequence (3 lottie-type elements detected).
   - Product cards hold small stylised UI fragments ("ISO 42001 115 controls passing", "Risk report", "OpenAI ON Critical").
   - The Platform menu has a "See an interactive demo" item ([vanta.com](https://www.vanta.com), `vanta-desktop-full.jpg`).
3. **Multiple audiences**
   - A "Built for you" section ("Whether you're managing a complex program or just getting started.") has three cards:
     - Startups: "Are you a startup founder in need of a SOC 2 yesterday, but lacking time and resources?…"
     - Mid-market: "Security leaders, your risk doesn't stand still between audits…"
     - Enterprise: "…right where CISOs and security leaders need them…"
   - Each card shows that segment's customer logos.
   - The Solutions menu lists Startups, Mid-market, Enterprise, Healthcare, Government, Fintech and AWS ([vanta.com](https://www.vanta.com)).
4. **Social proof**
   - A 12-logo wall under "TRUSTED BY 16,000 BUSINESSES FROM STARTUP TO ENTERPRISE".
   - A large GitHub quote: "Vanta helped us unblock our sales cycle for security questionnaires in a scalable, sustainable way." (Megan Snyder, Director of Customer Assurance, with headshot).
   - "Proof? We've got proof.": 4 tall portrait-photo cards, each with a company logo and name/title (Stepheni Norton; Megan Snyder; Eiwe Lingefors, CIO & CISO; Aaron Kiemele, CISO).
   - "Vanta named a Leader in The Forrester Wave™: Governance, Risk, and Compliance Platforms, Q2 2026", shown with the chart.
   - The demo page shows "4.6/5 (1733) on G2" ([vanta.com](https://www.vanta.com), `vanta-desktop-full.jpg`, [demo](https://www.vanta.com/demo)).
5. **CTAs and pricing**
   - Demo-only. The Plans page lists tier features but says "Request a free demo today to discuss your business needs and get personalized pricing." ([pricing](https://www.vanta.com/pricing)).
   - The demo page ([demo](https://www.vanta.com/demo), `vanta-demo-desktop-fold.jpg`):
     - Heading: "Find out what Vanta can do for your business."
     - "Meet one-on-one with a Vanta expert to:"
       - "Discuss what your business needs (and doesn't need)"
       - "Explore the full capabilities of the Vanta platform"
       - "Tailor strategies to automate your security and compliance"
     - A G2 rating.
     - Form: work email, first name, last name, company, job title, headcount, HQ country, "How can Vanta support your business?" (6 checkboxes), "How did you hear about us?", then "Request a demo".
     - The nav is stripped to logo + "Already have an account? Login".
   - The homepage HTML references Chili Piper and Qualified (demo routing and scheduling) ([vanta.com](https://www.vanta.com)).
   - **Security page** ([company/security](https://www.vanta.com/company/security), `vanta-security-desktop-full.jpg`):
     - Opener: "Security and privacy at Vanta. Security is at the heart of what we do—helping our customers improve their security and compliance posture starts with our own."
     - Governance: 4 numbered principles (least privilege, defense-in-depth, consistency, iterative maturity) and a card: "Vanta maintains a SOC 2 Type II attestation and an ISO 27001 compliance certification. Our SOC 2 Type II report and ISO 27001 certificate are available on our Trust Center." Badges: HIPAA, GDPR, CCPA, PCI DSS.
     - Data protection: Data at rest, Data in transit, Secret management.
     - Product security: penetration testing with the firm named (Doyensec) and "summary penetration test reports available via our Trust Center"; vulnerability scanning.
     - Enterprise security: endpoint protection, secure remote access, security education, identity and access management, vendor security.
     - Data privacy: Privacy Shield, regulatory compliance, "Privacy Policy, DPA, and ISA" plus the subprocessor list.
     - Closing: "Get compliant and build trust—fast" + "Request a demo" + G2 badges.
6. **Navigation**
   - "Platform ▾ / Solutions ▾ / Partners ▾ / Resources ▾ / Plans"; then "Log in" and "Get a demo". The mega-menus give every item a one-line description.
   - The desktop header was `position: static` in the DOM check (it scrolls away). On mobile, the bar with the hamburger is sticky ([vanta.com](https://www.vanta.com)).
7. **Motion, mobile, section order**
   - Motion: hero animation, a framework carousel, and scroll-reveal fades. The "Built for you" card titles and "Proof? We've got proof." came out faded in the static capture *(inferred: fade-in on scroll)*.
   - Section order:
     1. Nav
     2. Hero card
     3. Logo wall
     4. "It's all here" (6 product cards)
     5. "The Vanta Agent: your 24/7 GRC engineer"
     6. GitHub quote
     7. "All the frameworks you need"
     8. "Built for you"
     9. "Proof? We've got proof."
     10. Forrester Wave
     11. "Dive into all things Vanta and agentic trust"
     12. "The new standard for trust" footer
8. **Borrow for SchoolMule**
   - (a) **The security page structure:** principles → data protection (at rest / in transit / secrets) → product security (testing) → people and vendor security → privacy, with a subprocessor list and the proof documents linked. SchoolMule's version should be in plain language for a principal and their board: where data lives, who can see what, backups, what happens if you leave.
   - (b) **The demo page's promise:** "Meet one-on-one with an expert to: discuss what your school needs (and doesn't need)…" with three bullets and one rating, but with far fewer than Vanta's 9+ fields.

### 4. PostHog: posthog.com (YC Winter 2020, established)
**Sources:** https://posthog.com, https://posthog.com/demo. YC: https://www.ycombinator.com/companies/posthog (Winter 2020).
**Screenshots:**
- `screenshots/yc/posthog-desktop-fold.jpg`, `posthog-mobile-fold.jpg`, `posthog-desktop-full.jpg` / `posthog-mobile-full.jpg` (fold only, since the content scrolls inside a window), `posthog.json`
- `posthog-demo-desktop-fold.jpg` (+ full/mobile/json)

1. **First five seconds** (`posthog-desktop-fold.jpg`, `posthog-mobile-fold.jpg`)
   - Headline: "Your product's context layer"
   - Subhead: "PostHog ingests and stores your analytics, errors, replays, and business data so you and your agents can query and act on it." Then: "Join 500,000+ teams already shipping with PostHog."
   - A side card, "Set up [logo] for free": "97% of users pay us $0" / "No credit card required" / "Setup wizard installs PostHog for you". Primary "Get started", secondary "Install with AI". Nav CTA: "Get started – free".
   - Desktop visual: a desktop-OS metaphor.
     - A grassy wallpaper.
     - Desktop icons on the left: Home, Self-driving product, Context warehouse, Pricing, Docs, "Demo" (video thumbnail), Talk to a human.
     - Icons on the right: About us, Changelog, Company handbook, Store, Careers, Trash.
     - The page sits inside a window.
   - The cookie notice is a joke: "Legally-required cookie banner … (Ursula von der Leyen would be so proud.)"
   - Phone: the OS chrome collapses to a top bar with logo, "Get started – free", search, help and account icons; the window content stacks.
2. **Video and product imagery**
   - The hero tab panel ("Ask PostHog anything / Give agents product context / Ship with PostHog") plays an animated, typed demo with a pause button. It is explicitly labelled: "Illustrative demo: PostHog AI investigates falling paid conversion using Google Ads traffic, PostHog funnels, Stripe payments, and GitHub changes… All findings are sample data." ([posthog.com](https://posthog.com)).
   - The "Demo" (demo.mov) page plays a video in a window, "What is PostHog? (Official Demo)", 8:49 long. It autoplays muted with a "Click for sound" control, a captions menu and a 1x speed control ([demo](https://posthog.com/demo), `posthog-demo-desktop-fold.jpg`).
3. **Multiple audiences:** split by job via the 3 tabs. Developers and "agents" are the named audience. No persona pages on the homepage.
4. **Social proof:** "Social proof: Yes they actually use us, no it's not just some random engineer who tried us out 2+ years ago." It comes with a toggle ("Colorful logos" / "'Sleek' logos") and "Open Customers", plus the "500,000+ teams" line ([posthog.com](https://posthog.com)).
5. **CTAs and pricing**
   - Self-serve.
   - A usage-based pricing table sits on the homepage. Examples: free tier "1 million events/mo" then "$0.00005/event"; "5,000 recordings/mo" then "$0.005/recording".
   - Copy: "You never have to 'jump on a quick call' with sales."
   - A "Shameless CTA" parody product box: "NOT ENDORSED BY KIM K", "Hurry: 2455 companies signed up today." ([posthog.com](https://posthog.com)).
6. **Navigation:** "Products / Pricing / Docs / Community / Company / More", then "Get started – free" and search/help/account icons. The top bar is always visible.
7. **Motion, mobile, section order**
   - Motion: window chrome, the animated demo with pause, carousels.
   - Section order (inside the window):
     1. Hero + set-up card
     2. 3-tab demo
     3. Product list
     4. "Social proof"
     5. "All your data, working together"
     6. "Usage-based pricing"
     7. "Why PostHog?" (handbook, sales manual and strategy are public; changelog; "Actually-technical support")
     8. "Bedtime reading" (demo.mov, docs)
     9. "Shameless CTA"
8. **Borrow for SchoolMule**
   - (a) **Honest labelling of demo data.** SchoolMule's film already uses a synthetic demo school. A caption such as "Demo school, sample data" heads off a principal's first privacy question.
   - (b) **The demo-video controls:** muted autoplay with an obvious "Click for sound", captions and a speed control. This matches SchoolMule's muted loop plus "Watch with sound".

### 5. Resend: resend.com (YC Winter 2023, recent)
**Sources:** https://resend.com, https://resend.com/pricing. YC: https://www.ycombinator.com/companies/resend (Winter 2023; "Email for developers").
**Screenshots:** `screenshots/yc/resend-desktop-fold.jpg`, `resend-desktop-full.jpg`, `resend-mobile-fold.jpg`, `resend-mobile-full.jpg`, `resend.json`

1. **First five seconds** (`resend-desktop-fold.jpg`, `resend-mobile-fold.jpg`)
   - Headline: "Email for developers"
   - Subhead: "The best way to reach humans instead of spam folders. Deliver transactional and marketing emails at scale."
   - CTAs: "Get started" / "Documentation". A pill above reads "What you missed at Resend Forward ›". Nav: "Log in" / "Get started".
   - Visual: all black, a serif display face with a grey gradient, and a slowly turning matte-black 3D cube on the right.
   - Phone: the cube moves above the pill and headline; the CTAs go full width.
2. **Video and product imagery**
   - The hero cube is `cube.mp4` (autoplay, muted, loop, about 10 s).
   - Section headers have 3D icon loops (14–20 s each) ([resend.json](https://resend.com)).
   - The product is shown as live-looking code (SDK tabs Node.js, Serverless, Ruby, Python… with a sample), a simulated webhooks log, the editor UI and analytics.
3. **Multiple audiences:** developers only. SDK and language tabs act as the "audience" switch. "Enterprise" is in the nav.
4. **Social proof** ([resend.com](https://resend.com))
   - A logo grid under the hero: "Companies of all sizes trust Resend to deliver their most important emails." (Warner Bros., max, Raycast, Mistral AI, replit, anghami, Gumroad, Decathlon, supabase, Leap, Payload, Paper), plus "Explore Enterprise".
   - "Beyond expectations": 10 named quotes with role and company, for example "Sahil Lavingia, CEO of Gumroad" and "Peter Suhm, Ops at Tailwind": "We're a small team with a lot on our plates. Email infrastructure is something we don't want to think about, and with Resend we don't have to."
5. **CTAs and pricing:** self-serve. Public pricing: Free $0/mo, $20/mo, $90/mo, Custom ("Start for free and scale as you grow.") ([pricing](https://resend.com/pricing)).
6. **Navigation:** "Features ▾ / Company ▾ / Enterprise ▾ / Help ▾ / Docs ▾ / AI ▾ / Pricing", then "Log in" / "Get started". Sticky.
7. **Motion, mobile, section order**
   - Motion: cube and icon loops, animated code and logs.
   - Section order:
     1. Nav
     2. Hero
     3. Logos
     4. "Integrate this weekend"
     5. "First-class developer experience"
     6. Test mode
     7. Modular webhooks
     8. "Write using a delightful editor"
     9. "Go beyond editing"
     10. "Develop emails using React"
     11. "Reach humans, not spam folders"
     12. "Everything in your control"
     13. "Beyond expectations"
     14. "Email reimagined. Available today."
     15. Footer: address, an "All systems operational" status pill, and Security / SOC 2 / GDPR links (`resend-desktop-full.jpg`)
8. **Borrow for SchoolMule** (craft benchmark; developer audience, so lower relevance)
   - (a) **Restraint:** one confident line, one ambient object and two CTAs.
   - (b) **A footer trust row:** a live "All systems operational" status pill next to Security / Privacy links. It is cheap to add and reassuring to a school buying cloud software *(inferred)*.

### 6. Pylon: usepylon.com (YC Winter 2023, recent)
**Sources:** https://www.usepylon.com, https://www.usepylon.com/interactive-demo/agentic-support, https://www.usepylon.com/schedule-demo, https://www.usepylon.com/pricing. YC: https://www.ycombinator.com/companies/pylon-2 (Winter 2023).
**Screenshots:**
- `screenshots/yc/pylon-desktop-fold.jpg`, `pylon-desktop-full.jpg`, `pylon-mobile-fold.jpg`, `pylon-mobile-full.jpg`, `pylon.json`
- `pylon-walkthrough-*`
- `pylon-demo-*`

1. **First five seconds** (`pylon-desktop-fold.jpg`, `pylon-mobile-fold.jpg`)
   - Eyebrow: "THE AGENTIC SUPPORT PLATFORM". Headline: "The new way to run customer support."
   - Subhead: "Pylon lets humans and agents collaborate on customer work—investigating, resolving, and acting on every signal."
   - CTAs: "Book a demo" (black) / "View walkthrough" (outline). Nav: "Sign in" / "Book a demo".
   - Banner: "Pylon x Devin integration launch. Join us live on 10/27 [Register Now]".
   - Visual: a full-bleed violet motion-blur background video. The headline sits bottom-left; the subhead and CTAs sit bottom-right. A logo marquee directly below reads "Trusted by 1,500+ B2B customers globally".
   - Phone: banner, a floating black nav pill, the stacked hero, and both CTAs side by side.
2. **Video and product imagery**
   - The hero background is a 25 s muted loop (abstract, not product) ([pylon meta](https://www.usepylon.com)).
   - "Let's get to work" is a product panel: a prompt box over a violet burst, with 4 tabs "Set up & improve / Intake / Contextualize / Operate" and an underline progress bar on the active tab. It likely auto-advances *(inferred)* (`pylon-desktop-full.jpg`).
   - "View walkthrough" opens an ungated interactive demo: "Agentic Support. See how Pylon investigates issues in the background, drafts replies in your tone of voice, and pulls customer context from every connected tool." It is a clickable product screen that ends with the overlay "Ready to see this in action for your own team? Book a Demo". The page HTML references Navattic ([walkthrough](https://www.usepylon.com/interactive-demo/agentic-support), `pylon-walkthrough-desktop-fold.jpg`).
   - The footer links an "Interactive Demos" library and "Videos".
3. **Multiple audiences:**
   - An Enterprise nav item.
   - Footer "Compare" pages: vs Zendesk, Intercom, Plain, Front, Salesforce, Jira.
   - An agent carousel by job.
4. **Social proof:**
   - The 1,500+ logo marquee.
   - One big testimonial card: Cognition, "Pylon's AI agents handle the repetitive work that used to consume my day…" (Mike Sholkov, Head of Support Engineering at Cognition).
5. **CTAs and pricing**
   - Demo-led. Public seat prices are "$89/seat" and "$139/seat", with an enterprise "Custom quote" and AI credits ([pricing](https://www.usepylon.com/pricing)).
   - Demo page ([schedule-demo](https://www.usepylon.com/schedule-demo), `pylon-demo-desktop-fold.jpg`):
     - "Schedule a personalized 30-minute demo. All fields are required."
     - Fields: work email, first name, last name, company, "How did you hear about us?", then "Book a demo".
     - The right panel says "Fill in the form and unlock your booking time" over a blurred calendar ("What's a good time for a call?").
   - Closing band: "Go Agentic." with an email field and "Book a demo".
6. **Navigation:** "Product / Applied AI / Enterprise / Integrations / Customers / Resources / Pricing", then "Sign in" / "Book a demo". It is a floating black rounded bar. The mobile header is fixed (DOM check).
7. **Motion, mobile, section order**
   - Motion: hero video, the tab panel, carousels, a logo marquee.
   - Section order:
     1. Banner
     2. Nav
     3. Hero
     4. Logo marquee
     5. "Let's get to work" 4-tab panel
     6. "Stop doing the work. Start directing agents." (Assist Agent / Automations / Slack Agent / Support Agent / Skills)
     7. "Turn raw customer data into usable intelligence." integration table
     8. Cognition testimonial
     9. "The latest from Pylon"
     10. "Go Agentic."
     11. Footer
8. **Borrow for SchoolMule**
   - (a) **Four labelled tabs with a progress line, synced to an animated panel.** Map them to Staff / Teacher / Parent / Student, with each tab playing that portal's chapter of the 1:41 film.
   - (b) **A demo form that shows where it leads:** "Fill in the form and unlock your booking time" over the calendar, plus the stated length ("30-minute demo"). Both tell a busy principal exactly what they're signing up for.

### 7. Avoca: avoca.ai (YC Winter 2023, recent)
**Sources:** https://www.avoca.ai, https://www.avoca.ai/demo, https://www.avoca.ai/try-avoca. YC: https://www.ycombinator.com/companies/avoca (Winter 2023; "AI-powered Sales Agent for Service-Based Industries").
**Screenshots:**
- `screenshots/yc/avoca-desktop-fold.jpg`, `avoca-desktop-full.jpg`, `avoca-mobile-fold.jpg`, `avoca-mobile-full.jpg`, `avoca.json`
- `avoca-demo-*`

1. **First five seconds** (`avoca-desktop-fold.jpg`, `avoca-mobile-fold.jpg`)
   - Headline: "THE AI FRONT OFFICE FOR SERVICE BUSINESSES" ("SERVICE BUSINESSES" in blue).
   - Subhead: "Always-on agents that answer every call, fill every board, and keep your team focused on the work that matters."
   - CTAs: "Book a Demo" (filled blue) / "Talk to our AI" (outline with bracket corners). Nav: "Login" / "Book a Demo".
   - Banner: "Avoca raises $125M Series B at $1B valuation Read more →".
   - Visual: a blueprint-grid background. On the right, a real photo of a plumber under a sink, with three floating trust chips: "Trusted by 1,000+ Service Leaders", "Enterprise Ready Trust & Security", "ServiceTitan Certified App". Under the photo, a row of industry chips (Roofing, HVAC, **Plumbing**, Electrical, Auto Repair… 13 in the DOM) swaps the photo.
   - Phone: the CTAs stack full width and the photo moves below them.
2. **Video and product imagery**
   - No autoplay video.
   - "Customer Stories" is a full-width dark carousel of click-to-play customer videos, with a "Play" button and a YouTube button. The first is GRANITE COMFORT "From 9 to 1 Contact Centers"; thumbnails include "An After-Hours Revolution", "Scaling with AI", "The Best Decision", "Hold Times Elimination" and "Boosting Booking Rates" (`avoca-desktop-full.jpg`).
   - "Talk to our AI" opens /try-avoca: "Talk to Avoca's AI CSR. Hear exactly what your customers hear." It runs in 3 steps: Select Voice (Neal / Erin "Professional and empathetic" / Tucker) → Add Your Info → Receive a Call ([try-avoca](https://www.avoca.ai/try-avoca), via WebFetch).
   - The product appears as stylised mini-UIs: a call timeline ("0:02 Inbound call answered 2s wait / 0:28 Emergency escalation / 1:01 Job booked CRM Synced") and a call score ("Jackie's Call 62/100").
3. **Multiple audiences:** industry chips in the hero plus an "Industries" menu. The copy speaks to sizes: "from growing shops to multi-location operations. Built to perform whether you're running one location or one hundred." ([avoca.ai](https://www.avoca.ai)).
4. **Social proof**
   - Customer logos, each tagged "Case Study".
   - Outcome stats on the cards: "35% Increase in booking rate", "15% Outbound booking rate", "5x Reduction in QA time". These are animated counters; the static capture caught them at "0%".
   - The video stories.
   - A quote wall. Examples: "I can run a $100M business with 9 CSRs because Avoca handles 70% of our entire call volume…" and "When a hurricane knocked out our phones and internet… Avoca stepped in…" ([avoca.ai](https://www.avoca.ai)).
5. **CTAs and pricing**
   - Demo-only; there is no pricing link.
   - Closing band: "EVERY MOMENT, HANDLED. See how Avoca can handle your inbound calls in a 20-minute demo." with "Talk to Us".
   - Demo page ([demo](https://www.avoca.ai/demo), `avoca-demo-desktop-fold.jpg`):
     - "CAPTURE EVERY LEAD. WIN EVERY CUSTOMER. See in 30 minutes how Avoca's AI can answer every call, fill every board, and grow your revenue."
     - Under "Get A Personalized Demo", the first step is **one field** ("Business email") with "Get started".
     - Logos, then an industry carousel with a photo testimonial: "Matt Sommer, President, Shipley Energy" with "33% Inbound Calls Handled With AI".
   - Note the homepage says 20 minutes and the demo page says 30.
6. **Navigation:** "Products ▾ / Industries ▾ / Customers / Resources ▾", then "Login" / "Book a Demo". Sticky. Each mega-menu item has a one-line description (for example "Talk to our AI: Hear our AI CSR live").
7. **Motion, mobile, section order**
   - Motion: the hero photo carousel by industry, count-up stats, the video carousel.
   - Section order:
     1. Banner
     2. Nav
     3. Hero
     4. Case-study logo row
     5. "YOUR BUSINESS SCALES ON YOUR TERMS." (Convert / Nurture / Coach)
     6. Customer Stories video carousel
     7. Quote wall
     8. "UNDER THE HOOD: Enterprise-grade security" ("SOC 2 Certified"; "Protect customer data: Your customers trust you with their information. We handle it with the same care you do."; "Deployed at scale"), plus integration badges (ServiceTitan Certified App, HouseCall Pro, FieldRoutes)
     9. "EVERY MOMENT, HANDLED."
     10. Footer, with Trust & Safety linking to trust.avoca.ai
8. **Borrow for SchoolMule**
   - (a) **A hands-on secondary CTA with no salesperson.** For SchoolMule that could be "See it as a parent", a read-only tour of the demo school's parent portal *(inferred; would need building)*.
   - (b) **Segment chips in the hero** that swap the photo and quote (Islamic school / Montessori / Christian / independent K–8), plus a logo row where each logo is tagged "Case study".

### 8. Tennr: tennr.com (YC Winter 2023, recent)
**Sources:** https://www.tennr.com. YC: https://www.ycombinator.com/companies/tennr (Winter 2023; "Fast, Transparent Patient Experiences").
**Screenshots:**
- `screenshots/yc/tennr-desktop-fold.jpg`, `tennr-mobile-fold.jpg`, `tennr.json`
- `tennr-desktop-full.jpg` / `tennr-mobile-full.jpg` (mostly blank because content reveals on scroll)
- `tennr-scroll-sheet.jpg` (viewport shots while scrolling)

1. **First five seconds** (`tennr-desktop-fold.jpg`, `tennr-mobile-fold.jpg`)
   - Eyebrow: "RIGHT PATIENT. RIGHT CARE SETTING. EVERY TIME." Headline: "Move patients forward".
   - Subhead: "Tennr is an agentic patient orchestration platform built for policy-grade decisioning and patient flow at scale. Tennr helps providers navigate patients through complex payer requirements, countless engagements, and every step in between."
   - The hero's only CTA is "LEARN MORE". The nav button is "BOOK A DEMO".
   - Banner: "Join us Nov. 3 for a live webinar on fertility's shift from self-pay to insurance".
   - Visual: full-bleed terracotta with stacked translucent parallelogram shapes. It is abstract, with no product, and the serif headline sits bottom-left.
   - Phone: the shapes sit behind the text; the subhead runs to 7 lines; there is one button.
2. **Video and product imagery:** no `<video>`. The product appears later as stylised UI, for example a "Phone Calling Activity" table ("240 outbound, 120 inbound"), plus abstract shapes per benefit (`tennr-scroll-sheet.jpg`).
3. **Multiple audiences:** a "Who We Serve" dropdown lists DME & Manufacturers, Infusion Providers, Fertility Clinics, Physician Groups, Hospitals & Health Systems and Specialty Pharmacies, each with its own /solutions page ([tennr.com](https://www.tennr.com)).
4. **Social proof**
   - "Trusted nationwide" logos.
   - 3 testimonials with headshot, name, title and organisation, for example "Amy Willis, Director of Complex Rehab at King Drug": "We hit 260 faxes in one day… and were able to manage it."
   - Case-study cards with outcome titles: "Home Medix Takes Referrals 75% Faster Than Before with 4X the Volume" and "From a 3-week backlog to same-day patient intake".
   - A "Press" section ([tennr.com](https://www.tennr.com), `tennr-scroll-sheet.jpg`).
5. **CTAs and pricing:** demo-only. LEARN MORE, GET STARTED and BOOK A DEMO all go to /book-a-demo. No pricing.
6. **Navigation:** "Product / Who We Serve ▾ / Customer Stories / Resources / Company ▾", then "BOOK A DEMO". Sticky. After scrolling, the nav turns light and "BOOK A DEMO" becomes a filled terracotta button (`tennr-scroll-sheet.jpg`).
7. **Motion, mobile, section order**
   - Motion: heavy scroll-triggered reveals and sticky "scrollytelling" lists, where the active item is dark and the rest are greyed. A full-page screenshot renders almost empty.
   - Section order:
     1. Banner
     2. Nav
     3. Hero
     4. "AT A GLANCE: With Tennr, patients flow"
     5. "THE BOTTOM LINE: No delays. Fewer denials. Optimal patient journeys."
     6. "Trusted nationwide"
     7. "Proactive communication eliminates obstacles to care"
     8. "Patient flow, optimized" (5 steps)
     9. Testimonials
     10. "Tennr sets a new standard for healthcare ops"
     11. Case studies
     12. Press
     13. "No backlog, no bottlenecks—just growth"
     14. Footer
8. **Borrow for SchoolMule**
   - (a) **Case-study titles written as before → after outcomes** ("From a 3-week backlog to same-day patient intake"). SchoolMule should only do this with real Al Haadi numbers.
   - (b) **A cautionary pattern:** content that stays invisible until scroll animations fire breaks screenshots and link previews, and risks readers who skim fast or turn motion off *(inferred)*. Keep SchoolMule's copy visible without animation.

### 9. Campfire: campfire.ai (YC Summer 2023, recent)
**Sources:** https://campfire.ai, https://campfire.ai/product-demo. YC: https://www.ycombinator.com/companies/campfire-2 (Summer 2023).
**Screenshots:**
- `screenshots/yc/campfire-desktop-fold.jpg`, `campfire-desktop-full.jpg`, `campfire-mobile-fold.jpg`, `campfire-mobile-full.jpg`, `campfire.json`
- `campfire-tour-modal.jpg`
- `campfire-demos-*`
- `campfire-scroll-sheet.jpg`

1. **First five seconds** (`campfire-desktop-fold.jpg`, `campfire-mobile-fold.jpg`)
   - Headline: "Month end shouldn't take all month" ("all month" in light green).
   - Subhead: "Close 3 to 10 days faster with the AI Native ERP built for modern finance teams."
   - CTAs: "Try Campfire" (pill with an orange arrow) / "Take a product tour →" (text link). Nav: "Sign In" / "Get Started".
   - Visual: deep green, with a 3D-rendered monitor showing a realistic dashboard ("Welcome, Andrew") and floating cards (a Controller headshot, "Revenue $2.1M", "AI Close Agent", a chart prompt "show top five vendors by spend"). A logo marquee follows: "Trusted by industry leaders:".
   - Phone: stacked layout; the monitor stays, below the CTAs.
2. **Video and product imagery**
   - "Take a product tour" opens a modal ([campfire.ai](https://campfire.ai), `campfire-tour-modal.jpg`):
     - Title: "Explore Campfire". Instruction: "Select a chapter below to view by product, or press play to start from the beginning."
     - Chapters: "01 Reporting / 02 Ember AI / 03 Core Accounting / 04 Revenue Automation".
     - A presenter on camera; the video is 9:16 long (duration 556 s).
     - Ungated, with a "Request demo" button inside the modal.
   - A second, 38-second video sits in the "Meet Ember" section *(position inferred)*.
   - /product-demo: "Join our weekly demo. Wednesday, October 28, 1:00 PM EDT … Register Now / Save my spot". Navattic appears in that page's HTML ([product-demo](https://campfire.ai/product-demo), `campfire-demos-desktop-fold.jpg`).
3. **Multiple audiences:** a Solutions menu, and a rotating jobs list ("The top accounting teams use Campfire for:" Flux analysis, Accruals, Account reconciliations, Cash forecasting…).
4. **Social proof**
   - A logo marquee.
   - Quote: "Campfire helped us automate so much that we went from $10M to over $200M in ARR without having to grow our accounting team." (Tim Ryan, Senior Accounting Manager).
   - Case cards with portrait photos and metrics: "5–6 Days Shaved off close" (PostHog), "80+ Hours Saved Monthly" (Klarity), "20x Revenue Without increased headcount" (Replit).
   - "Real support from real accountants." with a team photo ([campfire.ai](https://campfire.ai), `campfire-scroll-sheet.jpg`).
5. **CTAs and pricing:** "Try Campfire" / "Get Started" / "Get a demo". There is no pricing link in the nav; the footer has a "Savings Calculator". The weekly live demo is a separate path.
6. **Navigation:** "Products ▾ / Solutions ▾ / Partners ▾ / Customers / Resources ▾", then "Sign In" / "Get Started". Fixed.
7. **Motion, mobile, section order**
   - Motion: the rotating jobs list, scroll fades, a logo marquee.
   - Section order:
     1. Nav
     2. Hero
     3. Logos
     4. "The top accounting teams use Campfire for:"
     5. "Get to know Campfire: One platform for general ledger, revenue, reporting, and close management." (4 module cards with UI)
     6. Quote
     7. "The AI-native ERP, powered by Accounting Intelligence"
     8. "Ask anything and get answers in seconds. Meet Ember, your accounting assistant."
     9. "Built for complexity. Ready for scale."
     10. "Hear from finance teams like yours."
     11. "See what your team could do with Campfire."
     12. Footer
8. **Borrow for SchoolMule**
   - (a) **The chaptered film modal.** "Pick a portal, or press play to start from the beginning", with chapters Staff / Teacher / Parent / Student and a "Book a demo" button inside the modal. It is the closest real-world template for SchoolMule's 1:41 four-portal film.
   - (b) **A weekly live group demo** ("Join our weekly demo: Wednesday…"). It suits principals who would rather watch alongside others than book a 1:1.

### 10. Numeral: numeral.com (YC Winter 2023, recent)
**Sources:** https://www.numeral.com, https://www.numeral.com/pricing. YC: https://www.ycombinator.com/companies/numeral (Winter 2023; "The AI-native sales tax solution.").
**Screenshots:**
- `screenshots/yc/numeral-desktop-fold.jpg`, `numeral-desktop-full.jpg`, `numeral-mobile-fold.jpg`, `numeral-mobile-full.jpg`, `numeral.json`
- `numeral-pricing-*`
- `numeral-scroll-sheet.jpg`

1. **First five seconds** (`numeral-desktop-fold.jpg`, `numeral-mobile-fold.jpg`)
   - Headline: "Sales tax, solved."
   - Subhead: "The trusted solution for U.S. sales tax, VAT, and GST compliance, used by 3,500+ global businesses."
   - Primary CTA: a "What's your work email?" field plus "Get started for free". Nav: "Sign in" / "Book a demo" (filled). No secondary CTA in the hero.
   - Visual: plain white with a huge sans headline. A wide video panel starts at the bottom of the fold (a globe with jurisdiction labels such as "Japan 10%").
   - Phone: the email field sits over a full-width button. The video panel rendered as a pale placeholder in our capture.
2. **Video and product imagery**
   - The hero video is a 30 s autoplay, muted loop. It mixes real footage (a person at a desk) with UI cards (`numeral-scroll-sheet.jpg`).
   - A 10 s character video sits lower ([numeral meta](https://www.numeral.com)).
   - The UI cards are stylised real UI: "Order #4892" tax lines, "Virginia Approaching exposure", a registrations table, and an exemption certificate showing "Analyzing…".
3. **Multiple audiences:** Solutions: Ecommerce / Software / Distribution & wholesale / Global. A "Tailor-made solutions." section uses photo cards.
4. **Social proof**
   - A logo row.
   - "Trusted by over 3,500 customers." as a photo carousel with a quote: "Numeral handles the tax complexity behind the scenes so we can move faster and live a little easier." (Karsten Loose, Founder, Karlon Group).
   - An integrations wall (Shopify, Stripe, NetSuite, QuickBooks, Xero…).
5. **CTAs and pricing:** free self-serve plus demo. Public pricing ([pricing](https://www.numeral.com/pricing), `numeral-pricing-desktop-fold.jpg`):
   - "No contract required."
   - Monitoring: "Free".
   - Professional: "$75 per filing", "$150 registration".
   - Enterprise: "Custom".
   - "The Numeral guarantee: Your sales tax will be filed on time, or we'll pay your penalties and interest charges."
6. **Navigation:** "PRODUCT ▾ / SOLUTIONS ▾ / PRICING / RESOURCES ▾" in monospace caps, then "Sign in" / "Book a demo". The nav stays pinned while scrolling (`numeral-scroll-sheet.jpg`).
7. **Section order**
   1. Nav
   2. Hero
   3. Video panel
   4. Logos
   5. "Human expertise, agentic capabilities. End-to-end compliance done for you." (Tax engine / Nexus monitoring / Filings & remittance / Registrations / Exemption certificate management)
   6. "Sales tax, VAT and GST compliance in 90+ countries."
   7. "Advanced capabilities for scaling businesses."
   8. "The human layer of Numeral.":
      - "The Numeral guarantee"
      - "Concierge service: Real human support from onboarding through filings and beyond."
      - "Tax research experts"
      - "Audit support"
   9. "Trusted by over 3,500 customers."
   10. "Tailor-made solutions."
   11. "40+ integrations for a simplified workflow."
   12. "Tax infrastructure to sell globally."
   13. Footer
8. **Borrow for SchoolMule**
   - (a) **"The human layer" section.** It names the people and promises behind the software: concierge onboarding, experts, audit support. A principal buying from a small vendor wants to know who picks up the phone *(inferred)*.
   - (b) **A plain-language guarantee** as risk reversal. Only use one SchoolMule can keep, for example "we move your data in for you before term starts", and only if it's true.

### 11. Scout: scoutforschools.com (YC Winter 2025, education)
**Sources:** https://scoutforschools.com. YC: https://www.ycombinator.com/companies/scout-4 (Winter 2025; "AI-powered student information system for K-12 schools").
**Screenshots:**
- `screenshots/yc/scout-desktop-fold.jpg`, `scout-desktop-full.jpg`, `scout-mobile-fold.jpg`, `scout-mobile-full.jpg`, `scout.json`
- `scout-scroll-sheet.jpg`

1. **First five seconds** (`scout-desktop-fold.jpg`, `scout-mobile-fold.jpg`)
   - A pill above the headline: "🐻 for California and Oregon schools and districts".
   - Headline: "The SIS for innovators."
   - Subhead: "Scout is the agentic student information system that expands your operational capacity to support students in their unique, self-paced learning journeys."
   - Hero CTA: "Learn more" (circle-chevron button). Nav: "Schedule a demo" (outline button).
   - Visual: a full-bleed painterly landscape (California hills, a cypress, blue sky with textured clouds) inside a floating white rounded nav card. It is illustration, with no product.
   - Phone: the same layout, centred, with the nav card collapsed to a hamburger.
2. **Video and product imagery:** no video. Four numbered job modules each carry a realistic UI card filled with sample student data (`scout-scroll-sheet.jpg`, [scoutforschools.com](https://scoutforschools.com)):
   - Enrollment: "Scout AI extracted & verified, From birth_certificate.pdf · 2 seconds … Emma R. Wilson, Verified … Emma is enrolled. Old way: 1–2 weeks of paperwork. 4 min".
   - Compliance: "AUDIT PACKET · SPRING 2026, Ready for export, 147 students … 30 seconds to assemble. Old way: ~3 days of binder-filling".
   - Reporting: a prompt-generated dashboard ("ENROLLED 1,247 / COMPLIANT 99.2% / ON TRACK 87%").
   - Student success: "US HISTORY · SELF-PACED" (Aaliyah ahead / Marcus on pace / Sofia needs help).
3. **Multiple audiences**
   - Segmented by job: 01 Enrollment / 02 Compliance / 03 Reporting / 04 Student Success.
   - Segmented by region via the pill. The page's DOM also contains a geo-aware prompt, "Scout isn't in Ontario yet — want to be first in line? Notify me", with a state picker. It came through in the text capture from our Ontario connection but not in the fold screenshot, so it is likely a conditional modal or banner *(inferred)* ([scoutforschools.com](https://scoutforschools.com)).
4. **Social proof**
   - "Trusted by schools across California and Oregon": a row of county office of education seals and school logos.
   - "Hear from our happy customers": three coloured cards with long quotes, photo, name, role and school. "Kelly Haight, Principal, Hearthstone School"; "Dr. Robert Walker, Director, iGranada"; "Sarah Bruce, Data Insights Director, Trivium Charter School".
   - "Save money. Save time. Save headaches.": pie charts of busywork vs teaching "With other SIS providers" vs "With Scout".
   - "Backed by world-class education investors."
5. **CTAs and pricing**
   - "Schedule a demo" goes straight to a 30-minute Calendly booking (calendly.com/noah-teachwithscout/30min), with **no form on the site**.
   - The final section reads "Ready to see Scout in action? Get in touch hey@scoutforschools.com".
   - No pricing ([links capture](https://scoutforschools.com)).
6. **Navigation:** "Platform / About / Customer Experience / Resources / Careers / Contact", then "Schedule a demo". A fixed, floating rounded card.
7. **Section order**
   1. Nav
   2. Hero
   3. Logos
   4. "Agents for every part of your school and district operations.":
      - "Onboard a student in 4 minutes, not 4 weeks."
      - "Audit-ready exports in 30 seconds."
      - "Ask a question. Get a dashboard."
      - "Same course. Every student moves at their pace."
   5. Testimonials
   6. "Save money. Save time. Save headaches."
   7. "For the love of learning." (manifesto + photo strip)
   8. "Expert assistance, any time of day." ("Our expert engineers, with deep knowledge of Scout, respond in under an hour, wherever you communicate: Teams, Slack, email, WhatsApp, you name it.")
   9. "Best-in-class data security." ("…FERPA, COPPA, and California's data requirements (SOPIPA)…")
   10. Investors
   11. "Ready to see Scout in action?"
   12. Footer, with a Trust Center at trust.oneleet.com
8. **Borrow for SchoolMule**
   - (a) **A region pill above the headline**, such as "for Ontario independent schools". It tells a principal at a glance that the product is built for their rules and their report cards.
   - (b) **Job modules with "Old way … → now …" mini-UIs** using sample student data, plus **direct calendar booking** (zero-field demo), plus testimonials from named principals.

### 12. Flint: flintk12.com (YC Summer 2023, education)
**Sources:** https://www.flintk12.com, https://flintk12.com/pricing, https://flintk12.com/christian-schools, https://vimeo.com/1236324809 (oEmbed). YC: https://www.ycombinator.com/companies/flint-2 (Summer 2023; "Personalized learning built for schools").
**Screenshots:**
- `screenshots/yc/flint-desktop-fold.jpg`, `flint-desktop-full.jpg`, `flint-mobile-fold.jpg`, `flint-mobile-full.jpg`, `flint.json`
- `flint-pricing-*`
- `flint-christian-schools-*`
- `flint-request-demo.jpg`
- `flint-scroll-sheet-1.jpg`, `flint-scroll-sheet-2.jpg`

1. **First five seconds** (`flint-desktop-fold.jpg`, `flint-mobile-fold.jpg`)
   - Headline: "Where teachers reach every student" ("every" has an orange brush underline). There is **no subhead**.
   - CTAs: "Start for free" (orange) / "Request a demo" (outline). Nav: "Login" / "Start for free →".
   - Banner: "New: our free AI Literacy for Teachers certification course is out now. Start the course".
   - Desktop visual: a **live, coded product UI** (not an image) of a sample school, "Oak Hill Academy". It shows Biology 101 → "Photosynthesis check-in" with an Activity analysis (Strengths / Areas of improvement / Follow-up) and a live Sessions table of students.
   - The mascot "Sparky" peeks over the window and runs a guided tour ("I'm Sparky! Your class just … 1 of 4, Back / Next").
   - A strip of independent-school logos sits at the bottom of the fold (Brophy, McDonogh, Harker, Wesleyan School, The Stony Brook School, Pine Crest, ASIJ…).
   - Phone: the product UI is **dropped**. After the stacked CTAs comes "Built to FERPA, COPPA and GDPR standards." with FERPA / COPPA / GDPR / ESSA Tier 4 badges, then logos (`flint-mobile-full.jpg`).
2. **Video and product imagery**
   - A 54-second overview video on Vimeo, "Flint | The Personalized AI Learning Platform for Classrooms" (uploaded 2026-10-15, per Vimeo oEmbed). It is click-to-play and sits after the testimonial carousel (`flint-scroll-sheet-1.jpg`).
   - A teacher video-testimonial wall ("Working side-by-side with teachers"): a grid of teacher faces with one play button.
   - The footer links a "Demo video".
   - "Request a demo" opens a Calendly routing form with **2 fields** (Name, Email) and the note "Are you a teacher looking to start using Flint? Get started for free here." (`flint-request-demo.jpg`).
3. **Multiple audiences**
   - Solutions menu and footer: Teachers, Students, School leaders, District leaders, Parents, Universities, **Christian schools, Jewish schools**, plus UK variants ("Headteachers", "Trusts") ([links](https://www.flintk12.com)).
   - The Christian schools page reads "Flint for Christian schools. We believe education is more than academics. Flint helps Christian schools integrate faith and learning without compromising on rigor, safety, or pedagogy." It has a "Get a free trial" CTA, "Trusted by dozens of Christian schools across the country" logos, and the same 54 s video ([christian-schools](https://flintk12.com/christian-schools), `flint-christian-schools-desktop-fold.jpg`).
4. **Social proof**
   - Compliance badges right under the hero.
   - "Trusted by 250,000+ teachers at schools like these." with a logo wall of 20+ schools.
   - A long carousel of named teacher quotes with headshot and school, for example "William Heyler, History teacher at 'Iolani".
   - A live counter, "5,243,629 classroom conversations with Sparky". It read 5,243,630 in a later capture.
   - Research stats with citations ("+127% Higher scores during practice", PNAS, June 2025; "2× Twice the learning, in less time", Harvard, Scientific Reports, 2025; "6 to 9 months Extra learning every year").
   - "Six weeks a year, handed back" ("5.9 hrs", "25%" of grading time, "51%" say the workload eased).
   - These numbers count up as they animate; a text capture taken mid-animation read +118% / 6 to 8 months / 22% / 45% (`flint-scroll-sheet-1.jpg`).
5. **CTAs and pricing:** free-first plus demo. Public pricing ([pricing](https://flintk12.com/pricing), `flint-pricing-desktop-fold.jpg`):
   - "Flint is free for up to 80 users (users can be teachers or students*)!"
   - "Up to 150 users $3,000 / year: For small pilots. $1.67/user/month"
   - "Up to 250 users $4,000 / year: For smaller schools. $1.33/user/month"
   - "Up to 500 users $6,500 / year: For midsize schools. $1.08/user/month"
   - "Over 500 users Custom"
   - Every tier's button is "Contact sales". Also: "Funding shouldn't be a barrier. Let's talk."
6. **Navigation**
   - "Solutions ▾ / Outcomes ▾ / Resources ▾ / Pricing", then "Login" and "Start for free →". Sticky.
   - A chat bubble: "Need help? The team typically replies in under 6h".
   - The footer has Compare pages (MagicSchool, Khanmigo, SchoolAI, Brisk, ChatGPT for Teachers, Gemini for Education, Claude for Teachers…).
7. **Section order**
   1. Banner
   2. Nav
   3. Hero (live UI + tour)
   4. Compliance badges
   5. Logo wall
   6. Teacher quotes
   7. 54 s video
   8. Counter + subject mascots
   9. "One-on-one attention for every student"
   10. Feature grid (… "SIS and LMS rostering", "Google and Microsoft sign-in")
   11. "Students learn more when teachers use Flint"
   12. "Working side-by-side with teachers" video wall
   13. "Six weeks a year, handed back"
   14. "Bridging the AI skills gap in the classroom" (tools, AI literacy course, "Campfire sessions" weekly webinars, AI policy library)
   15. "Learning feels different when it fits you." ("Get started" / "Request a demo")
   16. Footer
8. **Borrow for SchoolMule**
   - (a) **Faith and segment pages** ("Flint for Christian schools", "Jewish schools") with segment-specific logos and copy. SchoolMule's Islamic-school ICP warrants a "SchoolMule for Islamic schools" page (then Montessori and others).
   - (b) **Public, size-banded school pricing** with a free tier and "Funding shouldn't be a barrier. Let's talk.", plus compliance badges directly under the hero. SchoolMule would use Ontario-relevant claims, verified first.

### 13. ClassDojo: classdojo.com (YC Summer 2012, education)
**Sources:** https://www.classdojo.com, https://www.classdojo.com/districts/solutions/. YC: https://www.ycombinator.com/companies/classdojo (Summer 2012; "Communication app for K-8 teachers, kids, and families").
**Screenshots:**
- `screenshots/yc/classdojo-desktop-fold.jpg`, `classdojo-desktop-full.jpg`, `classdojo-mobile-fold.jpg`, `classdojo-mobile-full.jpg`, `classdojo.json`
- `classdojo-schools-*`

1. **First five seconds** (`classdojo-desktop-fold.jpg`, `classdojo-mobile-fold.jpg`)
   - Headline: "Where classrooms become communities"
   - Subhead: "Loved by more than 45 million students and parents. Free for teachers, forever."
   - Then "Get started as a..." with **five role tiles**: Teacher / Parent / Student / School Leader / District Leader. Below them, 4.5 stars and "2 million+ reviews". Nav: "Log in" / "Sign up".
   - Banner: "New for school leaders this back to school. Check it out".
   - Visual: white, with a bold rounded headline and colourful role icons. A collage of blob-cropped photos (families, classrooms) peeks in at the bottom, and a floating "Get the ClassDojo app" QR-code card sits on the right.
   - Phone: the role tiles are **replaced by a single "Sign up" button**. The photo collage stays, with a second "Sign up" in the middle.
2. **Video and product imagery:** no video on the homepage. The product is shown as illustrated UI vignettes: a message thread marked "Translated from Spanish", Stories feed posts, Events cards, Points monsters, toolkit icons (`classdojo-desktop-full.jpg`).
3. **Multiple audiences**
   - The role picker.
   - Nav "Schools / Districts / Families".
   - The districts page, "All-in-one K–12 communication, districtwide", has role sections for "Executive Director of Communications", "Technology Leaders", "Superintendents" and "Instructional Leaders" ([districts](https://www.classdojo.com/districts/solutions/), `classdojo-schools-desktop-fold.jpg`).
4. **Social proof**
   - "45 million" in the subhead and "2 million+ reviews".
   - The meta description claims "Used in 95% of US schools." ([classdojo.json](https://www.classdojo.com)).
   - "Our community is our superpower": a wall of teachers' social posts (handles shown).
   - "Privacy first—always", linking to the ClassDojo Privacy Center.
5. **CTAs and pricing:** signup-led ("Free for teachers, forever."). The paid family plan ("ClassDojo Plus") is in the footer. The district path is "Learn more".
6. **Navigation:** "Products ▾ / Schools ▾ / Districts ▾ / Families", then a language/flag picker, "Log in" and "Sign up". Sticky.
7. **Section order**
   1. Banner
   2. Nav
   3. Hero + role tiles + rating
   4. Photo collage, "Keeping teachers, families, and kids connected"
   5. Five feature rows:
      - "Stay connected—instantly" (messages "automatically translated into more than 190+ languages")
      - "Offer a window into their world" (Stories)
      - "Keep everyone up-to-date" (Events)
      - "Help them grow their own way" (Points / Portfolios)
      - "Build the best classroom yet" (Teacher Toolkit)
   6. Dojo Islands banner
   7. "Our community is our superpower"
   8. "Privacy first—always"
   9. "Let's get growing"
   10. Footer with app badges
8. **Borrow for SchoolMule**
   - (a) **"Get started as a…" role tiles right under the headline.** SchoolMule's portals become tiles (Principal & office / Teacher / Parent / Student), each opening that portal's film chapter or page. It is the clearest single-glance expression of "one platform, several audiences".
   - (b) **Benefit rows written per relationship** ("Stay connected—instantly"; auto-translation for families) plus a short "Privacy first—always" block linking to a privacy page.

---

## Cross-site patterns for SchoolMule

### Takeaway
None of the 13 sites autoplays a narrated product film in the hero. Hero motion is either ambient loops (Resend, Pylon, Numeral) or in-page animated UI (Vanta, PostHog, Flint). Full films sit one click away, and the best ones are ungated and chaptered (Campfire). For a multi-audience school platform, the strongest borrowable set is:
- ClassDojo's role tiles
- Pylon's or Campfire's four labelled chapters
- Rippling's "everything attached to one person" record card
- Scout's region pill with "old way → new way" modules
- Flint's faith-segment pages and public school pricing
- Vanta's security-page skeleton

### Cited Findings
- **Film placement.**
  - Full product videos are reached through a secondary CTA, never autoplayed with sound in the hero:
    - Campfire: a chaptered 9:16 modal, ungated ([campfire.ai](https://campfire.ai), `campfire-tour-modal.jpg`)
    - Rippling: a 10:47 tour behind a 6-field form ([tour-video](https://www.rippling.com/en-CA/tour-video))
    - PostHog: an 8:49 "demo.mov", muted autoplay with "Click for sound" and captions ([demo](https://posthog.com/demo))
    - Flint: a 54 s Vimeo, click-to-play, mid-page ([flintk12.com](https://www.flintk12.com))
  - Hero loops are abstract or brand footage: Resend's cube (about 10 s), Pylon's 25 s background, Numeral's 30 s globe and footage ([resend.com](https://resend.com), [usepylon.com](https://www.usepylon.com), [numeral.com](https://www.numeral.com)).
- **Interactive demos.**
  - Navattic is referenced on Pylon's ungated walkthrough and on Campfire's demo page ([walkthrough](https://www.usepylon.com/interactive-demo/agentic-support), [product-demo](https://campfire.ai/product-demo)).
  - Gusto's "instant demo" tour is gated behind 6 fields ([instant-demo](https://gusto.com/instant-demo)).
  - Flint's hero is itself a coded, steppable product tour ("1 of 4") ([flintk12.com](https://www.flintk12.com)).
  - Avoca lets a visitor have its AI call their phone ([try-avoca](https://www.avoca.ai/try-avoca)).
- **Several audiences on one platform.**
  - Role tiles: ClassDojo, "Get started as a..." Teacher / Parent / Student / School Leader / District Leader ([classdojo.com](https://www.classdojo.com)).
  - Persona and faith pages: Flint, including Christian / Jewish schools ([flintk12.com](https://www.flintk12.com)).
  - Per-product demo routes: Rippling ([rippling.com](https://www.rippling.com)).
  - Segment chips that swap the hero photo: Avoca ([avoca.ai](https://www.avoca.ai)).
  - Segment cards with matching logos: Vanta ([vanta.com](https://www.vanta.com)).
- **"One system" proof.**
  - Rippling's argument: "Unlike most 'all-in-one' platforms that simply bundle tools, Rippling products share incredibly deep underlying data, controls, and AI capabilities — so they work better together by design." It is shown with a single employee record card ([rippling.com](https://www.rippling.com)).
  - Campfire's "One platform for general ledger, revenue, reporting, and close management." ([campfire.ai](https://campfire.ai)).
- **Demo friction ranges from zero to many fields:**

  | Site | Demo form |
  |---|---|
  | Scout | 0 fields: direct Calendly link ([scoutforschools.com](https://scoutforschools.com)) |
  | Avoca | 1 field: business email ([demo](https://www.avoca.ai/demo)) |
  | Flint | 2 fields via Calendly ([flintk12.com](https://www.flintk12.com)) |
  | Pylon | 5 fields, and the calendar is revealed alongside ([schedule-demo](https://www.usepylon.com/schedule-demo)) |
  | Rippling | 7 fields ([request-demo](https://www.rippling.com/en-CA/request-demo)) |
  | Vanta | 9 fields + checkboxes ([demo](https://www.vanta.com/demo)) |

  Rippling, Vanta, Numeral and HappyRobot also start the demo or signup with an email field inside the hero.
- **Demo length is stated** by Pylon ("30-minute demo") and by Avoca (20 minutes on the homepage, 30 on the demo page) ([schedule-demo](https://www.usepylon.com/schedule-demo), [avoca.ai](https://www.avoca.ai), [demo](https://www.avoca.ai/demo)).
- **Pricing visibility:**
  - Public among owner-operator and education sellers: Gusto, Numeral, Resend, Pylon, PostHog, and Flint's school tiers ($3,000 / $4,000 / $6,500 per year).
  - Quote-only among enterprise demo-led sellers: Rippling, Vanta, Avoca, Tennr, Scout.
  - Sources: [gusto pricing](https://gusto.com/product/pricing), [numeral pricing](https://www.numeral.com/pricing), [flint pricing](https://flintk12.com/pricing), [rippling pricing](https://www.rippling.com/en-CA/pricing), [vanta pricing](https://www.vanta.com/pricing).
- **Trust selling:**
  - A dedicated security page with numbered principles and data-protection sections: Vanta ([security](https://www.vanta.com/company/security)).
  - A security section on the homepage itself:
    - Avoca: "SOC 2 Certified" ([avoca.ai](https://www.avoca.ai))
    - Scout: "FERPA, COPPA, and California's data requirements (SOPIPA)" ([scoutforschools.com](https://scoutforschools.com))
    - ClassDojo: "Privacy first—always" ([classdojo.com](https://www.classdojo.com))
  - Compliance badges directly under the hero: Flint ([flintk12.com](https://www.flintk12.com)).
  - Hosted trust centres: Vanta, Avoca, Scout (Oneleet), HappyRobot.
- **Mobile.**
  - None of the 13 uses a bottom sticky CTA bar.
  - Gusto, PostHog and HappyRobot keep the primary CTA in the mobile header; the rest collapse to a hamburger (`_yc-mobile-midscroll-sheet.jpg`, `happyrobot-mobile-fold.jpg`).
  - Product visuals are swapped or moved on phones rather than shrunk:
    - Gusto swaps to a phone app screen.
    - Rippling moves its tablet below the CTAs.
    - Flint drops its UI for compliance badges.
    - ClassDojo swaps its role tiles for one "Sign up" (`*-mobile-fold.jpg`, `*-mobile-full.jpg`).
- **Live chat and demo routing:** Qualified chat or scheduler on Gusto, Rippling and Vanta, opening with buttons like "Book a demo with sales" and "What product is best for me?" ([rippling.com](https://www.rippling.com), [vanta.com](https://www.vanta.com), [gusto.com](https://gusto.com)).
- **Human reassurance:**
  - Numeral's "The human layer of Numeral." (guarantee, concierge, experts) ([numeral.com](https://www.numeral.com)).
  - Campfire's "Real support from real accountants." ([campfire.ai](https://campfire.ai)).
  - Scout's "respond in under an hour, wherever you communicate" ([scoutforschools.com](https://scoutforschools.com)).
  - Gusto's phone number on its demo gate ([instant-demo](https://gusto.com/instant-demo)).

### Inferences
- SchoolMule's current hero (a muted film loop under the headline, with "Watch with sound" opening the film in a modal) already matches the PostHog and Campfire pattern. The improvement is **chapters**: "Pick a portal — Staff · Teacher · Parent · Student — or press play", the same four labels as ClassDojo-style role tiles under the headline, and a "Book a demo" button inside the film modal.
- To make "one database" concrete for a non-technical principal, show one student record that all four portals read from, in the style of Rippling's employee card. This could be a still from the film.
- For principals on phones, lead with the parent and teacher mobile screens (as Gusto does). Keep the primary CTA in the mobile header (Gusto, PostHog). Make booking near-frictionless: a direct calendar (Scout) or one email field (Avoca), with the length stated ("30-minute demo", Pylon).
- Owner-operator and education sellers publish pricing; enterprise sellers hide it. A small-school buyer is closer to the first group, so a Flint-style size-banded price list (or at least "from $X") likely reduces demo no-shows from sticker shock *(hypothesis, untested)*.
- Faith and segment pages (Flint) plus a region pill (Scout) are cheap and match SchoolMule's real ICP: Islamic independent schools in Ontario.
- Avoid scroll-only reveals that hide content (the Tennr pattern) and count-up numbers that read "0%" in previews (Avoca); both look broken in screenshots and link previews.

### Gaps
- Motion was judged from stills, DOM video metadata and step-scroll captures. Exact animation timing, autoplay behaviour on real iOS, and whether Pylon's tabs auto-advance were not observed directly.
- Gusto's prices differed between two loads minutes apart (A/B or geo testing suspected). I couldn't determine which set is canonical.
- Scout's "isn't in Ontario yet" prompt was present in the DOM text but not seen rendered, so its trigger is unknown.
- No conversion data is public for any of these patterns. "Borrow" recommendations rest on relevance and fit, not measured lift.
- Demo-form length beyond the first step (Avoca after the email, Flint's Calendly after Name/Email) was not explored, because the brief was read-only with no submissions.
