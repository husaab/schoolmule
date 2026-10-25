# SaaS marketing-site teardowns: Linear, Vercel, Stripe, Ramp, Mercury, Attio, Notion, Loom, Raycast, Cal.com, Superhuman, Jobber, Gusto, Toast (+ Rippling bonus)

Captured on 2026-10-25 with `tools/shoot.mjs`: headless Chromium, `en-CA` locale, `America/Toronto` timezone, desktop 1440×900 and phone 390×844 @2x. All paths below are relative to `docs/research/landing-revamp/`. Each site has `screenshots/saas/<slug>-desktop-fold.jpg`, `-desktop-full.jpg`, `-mobile-fold.jpg`, `-mobile-full.jpg` and `<slug>.json`. I looked at every fold. I read every desktop full page in cropped segments, and the phone full pages for Linear, Jobber and Attio. For all 15 homepages I also ran a mid-scroll check for sticky and fixed elements on phone and desktop (DOM query; results quoted where relevant).

Capture caveats, which apply throughout:
- **Geo-redirects.** Stripe (`/en-ca`), Ramp (`/en-ca/`) and Rippling (`/en-CA`) served Canadian pages, which is what an Ontario principal would see. Toast showed a "view our site in Canada (English)" modal on its pricing and demo pages.
- **Cookie banners.** These partly cover the Ramp, Superhuman and Toast phone folds and the Ramp desktop fold. The tool's auto-dismiss didn't match labels like "Opt in to all".
- **Unpainted sections.** Some scroll-triggered sections didn't paint in the full-page captures: Vercel's lower half, Mercury's footer and Toast's middle. For Vercel and Mercury I recovered the text with a DOM text dump.
- **Motion.** Motion can't be seen in stills. Claims about motion come from the `<video>` attributes in the JSON, or from two captures of the same page showing different content. Those are marked *(inferred)*.
- **Read-only.** No forms were submitted, nothing was signed up for, nothing was booked. On the Mercury demo I opened the role menu and the "Customize" dialog but did not submit it.

YC status: **Gusto is listed as "Winter 2012"** ([YC](https://www.ycombinator.com/companies/gusto)). **Stripe is "Summer 2009"** ([YC](https://www.ycombinator.com/companies/stripe)), which the brief didn't mention. **Mercury**: the brief says it's a YC company, but I couldn't verify its batch. `ycombinator.com/companies/mercury` returns 404 ([YC](https://www.ycombinator.com/companies/mercury)), so this is left for the YC researcher.

Choice of the 14th site: **Toast** (restaurant POS). It is a vertical all-in-one platform sold through demos to owner-operators who run a busy floor, which is the closest analogue to a principal. I also captured **Rippling**, as a bonus teardown for its "one system, many departments" story, and the Housecall Pro homepage. Housecall Pro is close enough to Jobber that it isn't torn down; see the short note after Rippling.

---

## Q1. What does each site actually show a visitor, on desktop and on a phone?

### Takeaway
Across all 15 homepages the pattern is the same. Show the real product in the first screen, either as live HTML/CSS UI (Linear, Attio, Cal.com) or as a muted autoplay loop (Ramp, Notion, Toast). Keep any longer film behind a play button (Loom, Toast). Make "many roles" concrete with switchers or tabs (Superhuman, Mercury, Raycast, Toast). The sites selling to owner-operators (Jobber, Gusto, Toast) add things the developer tools skip: real named customers with photos, ratings next to the CTA, a sales phone number in the header, published prices, and a phone layout that swaps in phone-relevant CTAs.

### 1. Linear — linear.app
Screenshots: `screenshots/saas/linear-desktop-fold.jpg`, `linear-desktop-full.jpg`, `linear-mobile-fold.jpg`, `linear-mobile-full.jpg`, `linear.json`. Pricing: `linear-pricing-desktop-fold.jpg` (+ `-desktop-full`, `-mobile-*`, `.json`).

- **First five seconds, desktop.** H1 "The product development system for teams and agents". Subhead "Purpose-built for planning and building products. Designed for the AI era." There are no buttons in the hero itself. The only hero link is "New · Loops →" on the right, and the nav carries "Log in" and "Sign up" (white pill). The fold visual is a large dark window of the real Linear app: issue "DRV-8852 Faster app launch", a sidebar (Pulse, Inbox, My issues, Reviews), and an activity feed — [linear.app](https://linear.app) (fold screenshot).
- **First five seconds, phone.** The H1 wraps to four lines, followed by the subhead and "New Loops →". The product window sits below, cropped so it bleeds off the right edge. The header (Log in / Sign up / hamburger) is `position: fixed` mid-scroll — [linear.app](https://linear.app) (mobile fold; sticky check).
- **Video and imagery.** There are zero `<video>` elements. The hero UI is real DOM: the JSON's hero-CTA list contains app labels such as "Search workspace", "New issue", "Pulse" and "Inbox". Each section has its own real-UI vignette: Slack-style thread and board, timeline, agent panels, code diff. The full-page capture shows an agent chat panel ("Linear · Opus 5.5") overlaid on the hero that wasn't in the fold capture, so the hero animates *(inferred)* — [linear.app](https://linear.app).
- **Audiences.** One audience: product teams. There are no persona tabs. The sections follow the product workflow instead: "Intake and integrations", "Planning and monitoring", "AI and automations", "Build, review, and ship" — [linear.app](https://linear.app).
- **Social proof.**
  - A logo strip right under the hero (OpenAI, Vercel, Salesforce, Figma, Cursor, coinbase, ramp), captioned in mono "POWERING THE COMPANIES BUILDING THE FUTURE".
  - A dated changelog strip (e.g. "OCT 22, 2026").
  - Two large quote cards with logo, name and role: Gabriel Peal, Staff Software Engineer, OpenAI ("You'll probably build a better product, just because of the craft that using Linear infuses on your brain."), and Nik Koblov, Head of Engineering, Ramp ("Our speed is intense and Linear helps us be action biased.").
  - The line "Linear powers over 40,000 product teams."
  - [linear.app](https://linear.app)
- **CTAs and pricing.** Self-serve. The closer reads "Built for the future. Available today." with "Get started" and "Contact sales". Pricing is public:

  | Plan | Price |
  |---|---|
  | Free | $0, "Free for everyone" |
  | Basic | US$10 per user/month (billed-yearly toggle) |
  | Business | US$16 per user/month; "Get started" + "Contact sales" |
  | Enterprise | Custom, "Annual billing only"; "Contact sales" |

  — [linear.app/pricing](https://linear.app/pricing)
- **Navigation.** Product, Resources, Customers, Pricing, Now, Contact | Log in | Sign up. Fixed header. Footer columns: Product, Features, Company, Resources, Connect, plus Privacy/Terms/DPA/AUP — [linear.app](https://linear.app).
- **Motion, type, colour, mobile, section order.**
  - Style: all dark. Large neutral sans with tight tracking. Headings use two tones: a bright lead sentence, then the rest in grey ("A new species of product tool. *Purpose-built for…*"). Mono "FIG 0.1" microlabels. Two bright quote cards (lavender, neon yellow) break the dark.
  - Phone: the page shrinks from 9,960 px to 5,876 px (JSON), and the principle cards become a horizontal swipe row.
  - Order: hero + app window → logos → manifesto + 3 principles → Intake → Planning → AI → Build/ship → Changelog → 2 quotes + 40,000 → closer → footer.
  - [linear.app](https://linear.app)
- **Borrow.**
  - (a) Render the hero product view as real HTML at full fidelity. It's crisp at any width, readable as text, fast on a phone, and cheap to update. SchoolMule could show a real gradebook or attendance view under the headline and keep the film one click away.
  - (b) Name sections after the user's workflow stages rather than features: for a school, attendance → grading → report cards → telling parents.

### 2. Vercel — vercel.com
Screenshots: `screenshots/saas/vercel-desktop-fold.jpg`, `vercel-desktop-full.jpg`, `vercel-mobile-fold.jpg`, `vercel-mobile-full.jpg`, `vercel.json`. The lower half of both full pages rendered blank (scroll-triggered sections), so the text below that point is from a DOM dump.

- **First five seconds, desktop.** H1 "Agentic Infrastructure". There is no subhead paragraph. Instead, a three-line list on the right reads "For coding agents" / "To ship apps and agents" / "Automated by agents". In the DOM each line expands, e.g. "For coding agents to deploy in their native language, with Vercel's API, CLI, MCP, and Skills." CTAs "Deploy now" (black) and "Talk to sales". The visual is a large black 3D triangle (the logo) with a soft shadow, and a logo row closes the fold (Meta, DoorDash, OpenAI, SpaceX, The Weather Company, Polymarket) — [vercel.com](https://vercel.com).
- **First five seconds, phone.** Triangle first, then a centred H1. The three-line list collapses to a single monospace line ("To ship apps and agents"), which is probably rotating *(inferred)*. Full-width stacked "Deploy now" / "Talk to sales", then a logo marquee. No sticky header on phone — [vercel.com](https://vercel.com) (mobile fold; sticky check).
- **Video and imagery.** No `<video>`. The product imagery is customers' real UIs used as proof: Notion's AI chat ("Notion powers millions of agent conversations daily on Vercel.") and Zapier's homepage ("Zapier serves over 100 million monthly website visits on Vercel.") — [vercel.com](https://vercel.com).
- **Audiences.** Split by job in the hero list. Enterprise is a top-level nav item. The footer's "Build" column lists AI Apps, Web Apps, Marketing Sites, Platforms, Commerce, Platform Engineers, Design Engineers — [vercel.com](https://vercel.com).
- **Social proof.** The logo row in the fold, and one named customer plus a metric per section (Notion, Zapier) — [vercel.com](https://vercel.com).
- **CTAs and pricing.** The nav carries all three motions: "Get a Demo" (outlined), "Log In", "Sign Up" (black). Pricing is a top-level nav link (page not captured) — [vercel.com](https://vercel.com).
- **Navigation.** Products, Resources, Enterprise, Pricing | Get a Demo | Log In | Sign Up. Sticky on desktop. The footer is very wide (Agent Stack, Core Platform, Tools, Frameworks, SDKs, Build, Learn, Explore, Company, Help, Legal & Trust, Social) with an "ALL SYSTEMS NORMAL" status line and a system/light/dark toggle — [vercel.com](https://vercel.com) (DOM).
- **Motion, type, colour, mobile, section order.**
  - Style: light, near-white. A large light-weight grotesk H1 with tight tracking; mono only on the phone subline.
  - Length: a very short page (5,333 px desktop).
  - Order: hero → logos → "Build agents on infrastructure that thinks like them" (Notion case + feature list) → "Ship apps that scale from zero to millions instantly" (Zapier case) → "Recently shipped" (Backends, Agents, Sandbox) → closer "Built by you, or your agents" (Deploy now / Onboard your agent) → footer.
  - [vercel.com](https://vercel.com)
- **Borrow.**
  - (a) Anchor each capability section on one named customer plus one number, e.g. "<School> publishes report cards for N students in X minutes" (a hypothetical example).
  - (b) Keep it brutally short: three sections and out.

### 3. Stripe — stripe.com (served stripe.com/en-ca)
Screenshots: `screenshots/saas/stripe-desktop-fold.jpg`, `stripe-desktop-full.jpg`, `stripe-mobile-fold.jpg`, `stripe-mobile-full.jpg`, `stripe.json`.

- **First five seconds, desktop.** A single H1 holds both sentences. The second is set in lighter slate and works as the subhead: "Financial infrastructure to grow your revenue. Accept payments, offer financial services and implement custom revenue models – from your first transaction to your billionth."
  - Above it: a live counter, "Global GDP running on Stripe: 1.73836982%". The phone load showed "1.73836987%", so it ticks *(inferred)*.
  - CTAs: "Get started ›" (indigo) and "Sign up with Google".
  - Visual: an animated orange/pink/purple gradient ribbon.
  - Logo bar at the fold edge: OpenAI, FreshBooks, amazon, SKIP, NVIDIA, JOBBER, Ford, 1Password. SKIP and FreshBooks suggest Canada-localised logos *(inferred)*.
  - [stripe.com/en-ca](https://stripe.com/en-ca)
- **First five seconds, phone.** Only the first sentence survives: "Financial infrastructure to grow your revenue." The long subhead is dropped. Full-width stacked buttons, then two logos at a time. No sticky header mid-scroll (only the cookie banner is fixed) — [stripe.com/en-ca](https://stripe.com/en-ca) (mobile fold; sticky check).
- **Video and imagery.** No `<video>` on the homepage. Product imagery is stylised but real UI in bento cards, each with an expand icon:
  - a "Pay Roastery US$5.46" terminal
  - a checkout form
  - a usage meter
  - an agentic-commerce chat
  - a Visa card
  - a crypto globe
  - "Embed payments in your platform", with a Daybreak Yoga receipt and a connected-accounts table in CAD.

  A "Stripe Sessions" keynote banner has "Watch now", a click-to-watch talk — [stripe.com/en-ca](https://stripe.com/en-ca).
- **Audiences.** The body segments by stage and type: "Transform your enterprise…" (Stripe for enterprises), "Build a foundation for your startup…" (Stripe for startups), "Make your SaaS platform a complete financial operating system" (Stripe for platforms), and a dark developer band. The footer's Solutions column lists 25+ segments, including Non-profits and Public sector — [stripe.com/en-ca](https://stripe.com/en-ca).
- **Social proof.**
  - A dark stats band, "The backbone of global commerce": "135+ currencies and payment methods supported", "US$1.9tn in payments volume processed in 2025", "99.999% historical uptime", "200m+ active subscriptions managed on Stripe Billing".
  - An enterprise case accordion: Hertz with an aerial photo and "160 countries / 11k+ locations globally", then URBN, Instacart, Le Monde.
  - A startup carousel: Lovable, Gamma, Runway, Supabase.
  - A quote from Kurtis Moyer, Lead Product Manager of Payments, Mindbody ("…from Canadian yoga studios to British boxing classes…").
  - Developer stats: 500m+ API requests/day, 10k+/second, 150k+ transactions/minute.
  - [stripe.com/en-ca](https://stripe.com/en-ca)
- **CTAs and pricing.** Self-serve in the hero; "Contact sales" is the nav's filled primary button. The closer "Ready to get started?" offers "Start now" / "Contact sales" plus two mini-cards: "See what you'll pay — Integrated per-transaction pricing with no hidden fees" and "Start building — …in as little as 10 minutes." Pricing is public, per transaction — [stripe.com/en-ca](https://stripe.com/en-ca).
- **Navigation.** Products, Solutions, Developers, Resources, Pricing | Sign in | Contact sales. Footer: Products and pricing; Solutions; Developers; Integrations and custom solutions; Resources; Company; Support; "Canada (English)" — [stripe.com/en-ca](https://stripe.com/en-ca).
- **Motion, type, colour, mobile, section order.**
  - Motion: the gradient ribbon, the ticking counter, a fibre-burst animation in the stats band.
  - Style: a two-tone sentence pattern in every heading (dark lead, grey continuation). Light page with a navy developer band.
  - Length: 14,613 px desktop vs 20,524 px phone (JSON). It stacks rather than cuts.
  - Order: hero → logos → "Flexible solutions for every business model" bento → Sessions banner → stats band → "Powering businesses of all sizes" (enterprise / experts / startups / platforms + quote) → developer band ("Choose an integration path": no-code / pre-integrated platforms / build your own) → "What's happening" → "Book of the week" → closer → footer.
  - [stripe.com/en-ca](https://stripe.com/en-ca)
- **Borrow.**
  - (a) Write the two-tone heading as a single sentence, and drop the subhead on phones.
  - (b) A "choose your path" block. For SchoolMule: switch the whole school / start with report cards / start with parent messaging.

### 4. Ramp — ramp.com (served ramp.com/en-ca/)
Screenshots: `screenshots/saas/ramp-desktop-fold.jpg`, `ramp-desktop-full.jpg`, `ramp-mobile-fold.jpg`, `ramp-mobile-full.jpg`, `ramp.json`. Demo page: `ramp-demo-*` (ramp.com/see-a-demo). Security: `ramp-security-*`.

- **First five seconds, desktop.** H1 "Time is money. Save both." Subhead "Bring corporate cards, expenses, bill payments and accounting automation together. Built for Canadian finance teams." The primary CTA is an inline email field ("What's your work email?") with "Get started" in neon chartreuse. The nav has "Sign in", "See a demo" (chartreuse) and "Get started" (black). The visual is an autoplay, muted, looping, controls-less video (`cdn.air.inc`) of product UI: a Reporting chart, a Bills list with QuickBooks, PO/invoice matching, a "Flagged for review" card, and the Ramp card — [ramp.com/en-ca](https://ramp.com/en-ca/) (fold; JSON videos).
- **First five seconds, phone.** The phone load served a different H1, "Canada, meet Ramp.", with subhead "Cards, expenses, and bill payments for Canadian businesses. Already trusted by 85,000 customers worldwide." Below that: the email field, "Get started for free", and the consent line "By submitting your email, you agree to opt in to marketing emails." Two headlines on two loads points to an A/B test or a breakpoint-specific hero *(inferred)*. The phone page has 4 autoplay loops — [ramp.com/en-ca](https://ramp.com/en-ca/) (mobile fold; JSON).
- **Video and imagery.** Real but stylised UI: floating panels with design-tool corner handles. "Snap and done" shows a phone-chat mock (receipt sent over text or WhatsApp). The demo page also offers "Five product walkthroughs", i.e. videos — [ramp.com/en-ca](https://ramp.com/en-ca/), [ramp.com/see-a-demo](https://ramp.com/see-a-demo).
- **Audiences.**
  - Country: the hero says "Built for Canadian finance teams", and there is a Canadian FAQ (GST/HST, CAD and USD cards, eligibility, ERPs, cost).
  - Two roles: "Trusted by finance, loved by employees.", i.e. finance approvers vs card-holding staff.
  - Footer Solutions: Startups, Small business, Mid market, Enterprise.
  - [ramp.com/en-ca](https://ramp.com/en-ca/)
- **Social proof.**
  - "Join 85,000 businesses on Ramp." with logos right under the hero (Fullscript, 1Password, Notion, Shopify, Visa, Discord, 1-800-GOT-JUNK?, Stripe).
  - A Canadian case study: Othership, Justin Dourado, Director of Finance ("As a Canadian company growing quickly in the U.S., Ramp gave us the scalable foundation…").
  - Stats: "Up to 5%+ average customer savings in the first year", "Up to 85% transaction reviews automated", "Up to 3x faster book close after switching". Each is footnoted, with the method explained in the footer.
  - Three quotes: Shopify (Roberto Restrepo, Head of Finance), ElevenLabs (Maciej Mylik), Notion (Rama Katkar, CFO).
  - [ramp.com/en-ca](https://ramp.com/en-ca/)
- **CTAs and pricing.** Email-first signup, plus "See a demo" in the nav. The demo page ("See how Ramp works") offers **three doors**:
  1. "Experience Ramp with a live demo — Schedule an expert-run, 30 minute tour of the platform." One field (work email) and "Schedule a demo".
  2. "Interactive product tour — Takes 2 minutes — Click around our platform to see Ramp in action."
  3. "Five product walkthroughs."

  On the phone the demo page collapses to one email field and "See a demo". There is a public "Ramp Canada pricing" link and a pricing FAQ; the pricing page itself wasn't captured — [ramp.com/see-a-demo](https://ramp.com/see-a-demo), [ramp.com/en-ca](https://ramp.com/en-ca/).
- **Security page.** "Peace of mind at every step". SSO (Google/Okta/Azure), card controls, "24/7 monitoring", encryption, and "Compliant software you can trust" with SOC 2 Type II and PCI cards — [ramp.com/security](https://ramp.com/security).
- **Navigation.** en-CA: Products, Resources, Customers, Pricing | Sign in | See a demo | Get started; fixed header. The US 404 page showed a different nav (Products, Solutions, Partners, Resources, Pricing). Footer: About us; Products; Platform; Partners; Solutions; Free tools and resources; long regulatory disclosures; a final email capture ("Join the 85,000+ businesses…") — [ramp.com/en-ca](https://ramp.com/en-ca/).
- **Motion, type, colour, mobile, section order.**
  - Style: light warm greys with a chartreuse accent and one dark stats band; geometric sans.
  - Order: hero + video → logos → "All your spend, in one place." (4 product columns) → "Snap and done" → "Busywork? Done." accordion → Othership case → "Trusted by finance, loved by employees." (stats + quotes) → "One platform, for all of finance." grid → FAQs → hero repeated with email → footer.
  - [ramp.com/en-ca](https://ramp.com/en-ca/)
- **Borrow.**
  - (a) **The three-door demo page**: live call / 2-minute click-through / short videos. It's the natural home for the 1:41 film next to "Book a call".
  - (b) A two-role proof section. "Trusted by finance, loved by employees" becomes "Trusted by principals, loved by teachers and parents".
  - (c) A country-specific FAQ: Ontario report cards, OEN, privacy law (wording to be confirmed by SchoolMule).

### 5. Mercury — mercury.com (YC; batch not verified here)
Screenshots: `screenshots/saas/mercury-desktop-fold.jpg`, `mercury-desktop-full.jpg`, `mercury-mobile-fold.jpg`, `mercury-mobile-full.jpg`, `mercury.json`. Interactive demo: `mercury-demo-*` (demo.mercury.com/dashboard).

- **First five seconds, desktop.** H1 "Radically different banking". Subhead "Apply online in 10 minutes to experience banking¹ unlike anything that's come before." CTAs: an email field ("Enter your email") with "Open account", then "Launch demo" as a glass secondary.
  - Visual: a full-bleed, cinematic shot of a desk, chair and laptop on a misty valley hilltop. It's a `<video>` named `hero-scrub-lg.mp4` (muted, no autoplay, no loop), which suggests a scroll-scrubbed sequence *(inferred)*. The full-page capture's next section shows the laptop's dashboard, so the scroll appears to zoom into the product *(inferred)*.
  - Announcement bar: "Introducing Mercury Payroll — AI-powered, full-service payroll, built into Mercury →". An FDIC disclaimer pill sits at the bottom of the hero.
  - [mercury.com](https://mercury.com)
- **First five seconds, phone.** Same scene. Email field full width, with "Open account" and "Launch demo" side by side. Mid-scroll a sticky bottom bar appears with "Log in / Open account" (DOM) — [mercury.com](https://mercury.com) (mobile fold; sticky check).
- **Video and imagery.**
  - A chaptered, tabbed showcase: "Everything you do with money. All in one place." Four tabs (Business banking & more / Cards & expense management / Payments & invoicing / Accounting) each play their own product-UI video; a pause control is visible on the phone. Each tab has a "Launch demo" link.
  - Feature cards with play buttons (receipts, automations, team management) are short UI clips.
  - [mercury.com](https://mercury.com) (DOM text dump; a phone mid-scroll check showed the tab video's pause control)
- **Interactive demo.** demo.mercury.com is **ungated**: the real product with fake data ("Welcome, Jane", a $5,216,471.18 balance).
  - A banner reads "Explore the Mercury Demo. Customize your experience".
  - A **role switcher**: "Viewing as Admin ▾ → View as Employee".
  - The account switcher includes "Pico Accountants — Advisor Portal", a third role (accountant).
  - A "Try out Mercury for yourself" panel has segment chips (Startup / Ecommerce / Agency / More) and guided tasks ("Send money to contractors", "Invite your team members", "Create cards for your team", …).
  - The "Customize the Mercury demo" dialog (first name, last name, email, company, industry, balance) emails a personalised demo link.
  - The demo renders a proper phone layout.
  - [demo.mercury.com](https://demo.mercury.com/dashboard)
- **Audiences.** "Mercury for business" / "Mercury for personal" (h2s); segment chips in the demo; a Solutions footer (Ecommerce, Agencies, SaaS, VC Funds, Crypto, LLCs, Life Science, Accounting Firms, Climate, Real Estate & Construction, Healthcare Services) — [mercury.com](https://mercury.com).
- **Social proof.**
  - "Loved by 450K+ of the most ambitious entrepreneurs on the planet", with logos (Supabase, Linear, Lovable, Partiful, ElevenLabs, Phantom).
  - A **video-portrait testimonial carousel**: Karri Saarinen, Founder, Linear, "Unlike most financial institutions, Mercury is built on software. Everything can be done within the app in 1-2 minutes."
  - A quote from Paul Copplestone, Founder and CEO, Supabase.
  - Stats: "450K+ Entrepreneurs love us", "1 in 3 Startups choose Mercury", "$20B+ Monthly transaction volume", "4.9 Apple App Store rating".
  - Press cards: "$1B in annualized revenue and 4+ years profitable", "Mercury hits $5.2B valuation".
  - [mercury.com](https://mercury.com)
- **CTAs and pricing.** "Open account" (email-first) and "Launch demo". The nav has "Log in" and "Open account". "Contact sales" isn't a visible nav button, though a link to mercury.com/contact/sales exists somewhere on the page (found in a link scan; I didn't confirm where). Pricing is in the nav (not captured) — [mercury.com](https://mercury.com).
- **Navigation.** Products, Solutions, Resources, About, Pricing | Log in | Open account; sticky. Footer (DOM): Banking, Platform, Resources, Finance Ops, Solutions, Account, About, Legal, Follow Us — [mercury.com](https://mercury.com).
- **Motion, type, colour, mobile, section order.**
  - Style: a photographic light hero, then a charcoal-dark body with pastel product cards and very quiet sans type.
  - Order: announcement → photo hero → tabbed product showcase with videos → 450K+ logos + video testimonials → "Banking's been a headache. Now, it's a head start." (4 cards) → Supabase quote → "Get started fast" accordion → "Stop losing money to fees" accordion → "Run your business like a seasoned pro" → stats → protection (20x coverage, security, controls) → press → footer.
  - [mercury.com](https://mercury.com)
- **Borrow.**
  - (a) **An ungated, role-switchable live demo**: "Viewing as Admin → View as Employee", plus an advisor portal. This is the closest live analogue to a "View as Principal / Teacher / Parent / Student" tour of a demo school.
  - (b) **Tabbed showcase where each tab plays its own short UI clip.** The chapters of the 1:41 film map straight onto tabs.

### 6. Attio — attio.com
Screenshots: `screenshots/saas/attio-desktop-fold.jpg`, `attio-desktop-full.jpg`, `attio-mobile-fold.jpg`, `attio-mobile-full.jpg`, `attio.json`.

- **First five seconds, desktop.** H1 "Welcome to agentic revenue." Subhead "Attio is the platform that builds pipeline, advances deals, and grows accounts around the clock." CTAs "Talk to sales" (outlined) and "Start for free" (black). A pill above reads "GTM lessons from Elena Verna and more ›", and a black announcement bar reads "The new architecture for agentic revenue is here →".
  - Visual: a macOS-style window of real Attio UI, a Companies table with AI columns "ICP Fit" and "Estimated ARR" (rows for Vercel, Cursor, GitHub…).
  - The full-page capture showed a different screen ("Home — Good morning, Alex", "Ask anything…", meetings), so the hero cycles through app screens *(inferred)*.
  - [attio.com](https://attio.com)
- **First five seconds, phone.** **The CTA changes on phone.** An email field ("Your email address") and a full-width black **"Send me a demo"**, with "Talk to sales →" as a text link. "Start for free" isn't in the phone hero. The UI window sits cropped below, with an Intercom bubble. A sticky announcement header shows mid-scroll — [attio.com](https://attio.com) (mobile fold; JSON `mobile.heroCtas`).
- **Video and imagery.** No `<video>`. Every product visual is live HTML: tables, kanban pipeline, workflow canvas, an AI answer showing its SQL, charts — [attio.com](https://attio.com).
- **Audiences.** A section with a left-hand vertical tab list (Build pipeline / Convert leads / Run sales motions / Forecast revenue / Retain and expand) that turns into stacked sections on the phone. A role-specific section, "For the people who own the number." Footer columns "Attio for" (Startups, Deal flow) and **"Import from"** (Salesforce, Hubspot, Pipedrive, Zoho, Excel, CSV) — [attio.com](https://attio.com) (DOM footer).
- **Social proof.** A logo grid right after the hero (granola, turbopuffer, parallel, Modal, Wispr Flow, Railway, Listen, taskrabbit, AIUC, WORDSMITH). Scale stats: "30M MCP tool calls/month", "2.6B API requests/month", "76k active customer agents", "15M emails synced/day". "Trusted by 30,000+ customers" with tabbed case studies (granola: "83% faster lead triage"). A changelog dated "September 23, 2026" — [attio.com](https://attio.com).
- **CTAs and pricing.** Free plus sales. The nav has "Sign in" and "Start for free". Pricing is in the nav (not captured). There's a newsletter capture ("Stay ahead of GTM") — [attio.com](https://attio.com).
- **Navigation.** Platform, Resources, Developers, Customers, Pricing | Sign in | Start for free; sticky with the announcement bar. Footer: Platform, Company, Import from, Attio for, Apps, Resources, Trust Center — [attio.com](https://attio.com).
- **Motion, type, colour, mobile, section order.**
  - Style: light, cool grey, with one dark connectivity/SDK block. Two-tone headings (black lead, grey continuation).
  - Order: announcement → hero + UI → logo grid → "The intelligent system that never sleeps" + 5-step tabs → connectivity → SDK/API/MCP → scale stats → customer stories → changelog → newsletter → closer "Agentic revenue runs on Attio." → footer.
  - [attio.com](https://attio.com)
- **Borrow.**
  - (a) **A phone-aware CTA.** Phone visitors get "Send me a demo" (leave an email, get the tour later) instead of a trial they can't use on a phone. That is exactly the principal-on-a-phone case.
  - (b) An **"Import from" / switching column**, e.g. "Switching from spreadsheets / Google Classroom / [incumbent]". Which tools to name is SchoolMule's call.

### 7. Notion — notion.com
Screenshots: `screenshots/saas/notion-desktop-fold.jpg`, `notion-desktop-full.jpg`, `notion-mobile-fold.jpg`, `notion-mobile-full.jpg`, `notion.json`, `notion-desktop-megamenu.jpg`. Security: `notion-security-*`.

- **First five seconds, desktop.** H1 "Where teams and agents ● Create together." The verb sits in a coloured pill and rotates: "Create" on the desktop load, "Ship" on the phone load *(inferred animation)*. Subhead "Capture context, find answers, and automate tasks with AI built for your team." CTAs "Get Notion free" (blue) and "Request a demo" (pale blue).
  - Visual: real product UI ("Ramp HQ", a customer's workspace used as demo content) with Notion's hand-drawn characters peeking around it.
  - It's an autoplay, muted, looping hero video (`web-homepage-hero-1920x1200_final.mp4`).
  - Logos sit inside the fold (OpenAI, A24, Figma, FedEx, ramp, Cursor, substack, NVIDIA, TOYOTA).
  - [notion.com](https://www.notion.com)
- **First five seconds, phone.** A row of seven illustrated avatar faces replaces the product shot above the H1. The hero video is present but `autoplay=false` on the phone (JSON). Full-width stacked CTAs, then "The most ambitious companies run on Notion." logos. The sticky header keeps "Get Notion free" — [notion.com](https://www.notion.com) (mobile fold; JSON; sticky check).
- **Video and imagery.** Autoplay hero loop of real UI. Feature cards with real UI snippets (Meetings database, "H2 Deal Flow Dashboard", Engineering Tasks + Coding Agent). Testimonial cards are colour-tinted video stills of the speakers — [notion.com](https://www.notion.com).
- **Audiences.**
  - Use-case tiles under "See what Notion can do": Triage product feedback / Resolve support tickets in Slack / Respond to security alerts faster / Automate weekly reporting / Create your own developer tools.
  - Product mega-menu: Capture / Find / Automate.
  - Footer column "Notion for": Enterprise, Small businesses, Startups, Developers.
  - [notion.com](https://www.notion.com) (megamenu screenshot)
- **Social proof.**
  - "Trusted by teams that ship.": three tinted portrait cards with quotes set in serif. Michael Truell, Co-founder & CEO (Cursor); Renee Solorzano, Sr. Director of Product Design (Faire); Ben Levick, Head of Operations & Internal AI (Ramp).
  - A stats ticker: "100M users in over 50 countries", "Over 50% of YC companies", "1.4M+ community members", "62% of Fortune 100 use Notion", plus a truncated G2 #1 item.
  - [notion.com](https://www.notion.com)
- **CTAs and pricing.** Free plus demo. "Request a demo" appears in the nav, as the hero secondary, and in the closer "Get started today." Pricing is a nav link (not captured) — [notion.com](https://www.notion.com).
- **Security page.** "Security @ Notion" with links to the Trust Center, Security Exhibit and Shared Responsibility Model. Plain-language cards:
  - Authentication & Access Controls, "Your Data, Your Rules", Data Residency (Enterprise).
  - Availability: redundancy, backups, DR/BCP tested annually.
  - **AI governance: "Customer data is never used to train AI models by Notion or its subprocessors."**
  - Privacy: retention, subprocessor list, ISO 27701/27018, CCPA, GDPR, HIPAA BAA for Enterprise.
  - Contact emails for security and abuse.
  - [notion.com/security](https://www.notion.com/security)
- **Navigation.** Product, Resources, Pricing, Request a demo | Log in | Get Notion free; sticky. Footer: Product, Resources, Company, Notion for, a Marshall McLuhan quote in serif, and a language selector — [notion.com](https://www.notion.com).
- **Motion, type, colour, mobile, section order.**
  - Length: a very short homepage (4,687 px desktop).
  - Style: white with a warm-beige closer. Heavy bold display sans; serif for quotes; hand-drawn illustration.
  - Order: hero (rotating verb + video) → logos → "AI where your team works." (3 feature cards) → use-case tiles → "Trusted by teams that ship." → stats ticker → "Get started today." → footer.
  - [notion.com](https://www.notion.com)
- **Borrow.**
  - (a) **Short page, fast handoff**: hero → three feature cards → proof → CTA.
  - (b) **A security page in plain cards** that a non-technical principal can read: where data lives, who can see it, "never used to train AI". These claims are only usable if they're true for SchoolMule.

### 8. Loom — loom.com
Screenshots: `screenshots/saas/loom-desktop-fold.jpg`, `loom-desktop-full.jpg`, `loom-mobile-fold.jpg`, `loom-mobile-full.jpg`, `loom.json`.

- **First five seconds, desktop.** H1 "One video is worth a thousand words". Subhead "Easily record and share AI-powered video messages with your teammates and customers to supercharge productivity". CTAs "Get Loom for free" (blue) and "Install Chrome Extension" (pale, download icon). A banner above reads "Loom is Live on Product Hunt! … Record for agents…".
  - Visual: a large rounded video frame, a Loom embed (`loom.com/embed/…`). It's click-to-play, with a big play button and a **speed badge "1.2× · ~~1 min~~ ⚡ 50 sec"**.
  - [loom.com](https://www.loom.com) (fold; JSON embeds)
- **First five seconds, phone.** Only "Get Loom for free" remains; the Chrome-extension CTA is gone. A fixed bottom sheet offers "Record, share, and watch on the go. Download Loom for iOS" — [loom.com](https://www.loom.com) (mobile fold; sticky check).
- **Video and imagery.** The hero video plays in Loom's own player, so the product demonstrates itself. Feature sections use autoplay muted loops of camera "bubbles" over UI (`cdn.loom.com/…/bubbs/angelina.mp4`) — [loom.com](https://www.loom.com).
- **Audiences.** "Video messaging for all use cases" cards (Sales, Engineering, Customer support, Design) plus "See all use cases". Footer Solutions: Sales, Engineering, Design, Marketing, Product Management, Support, Presentation, Team Alignment, **Education**, Webcam Recorder. A "Loom for Enterprise" band — [loom.com](https://www.loom.com).
- **Social proof.** "Millions of people across 400,000 companies choose Loom" with a three-row logo wall. A testimonial carousel (Alexis Ohanian, Founder, SevenSevenSix). A security band: "Keep your content safe" (SSO, SCIM, retention) — [loom.com](https://www.loom.com).
- **CTAs and pricing.** Free. The nav has "Get Loom for free" and "Contact Sales". Pricing is a nav link — [loom.com](https://www.loom.com).
- **Navigation.** Apps, Solutions, Resources, Enterprise, Pricing, Sign In | Get Loom for free | Contact Sales, under an "Atlassian Loom" lockup. Footer: App, Solutions, For Business, Downloads, Resources, Company (including "vs Vidyard", "vs Zoom Clips", "vs Microsoft Clipchamp") — [loom.com](https://www.loom.com).
- **Motion, type, colour, mobile, section order.**
  - Style: light, Atlassian blue, heavy rounded display font, big rounded blue blocks.
  - Order: banner → hero video → logos → "Show it in Loom, ship with any agent" → "The easiest screen recorder you'll ever use" → feature rows → security band → use cases → feature checklist → blog → Loom for Enterprise → testimonials → CTA "Loom powers great campaigns." → footer.
  - [loom.com](https://www.loom.com)
- **Borrow.**
  - (a) **Show the film in a real player frame with the time cost visible.** Loom's "1 min → 50 sec" badge respects the viewer's time; SchoolMule's version is "1:41".
  - (b) **Drop desktop-only CTAs on phones** and put in the action a phone user can actually take.

### 9. Raycast — raycast.com
Screenshots: `screenshots/saas/raycast-desktop-fold.jpg`, `raycast-desktop-full.jpg`, `raycast-mobile-fold.jpg`, `raycast-mobile-full.jpg`, `raycast.json`.

- **First five seconds, desktop.** H1 "Your shortcut to everything." Subhead "A collection of powerful productivity tools all within an extendable launcher. Fast, ergonomic and reliable." CTA "Download for Mac", with "macOS Tahoe and Apple Silicon required" and "Install via Homebrew | Download V1" underneath, plus a "The Raycast Keyboard →" pill. The visual is abstract red light streaks on black; there's no product in the fold — [raycast.com](https://www.raycast.com).
- **First five seconds, phone.** **The download CTA is removed.** Only "The Raycast Keyboard →" remains, so there is no conversion action on a phone for a Mac app — [raycast.com](https://www.raycast.com) (mobile fold; JSON).
- **Video and imagery.** No `<video>`. After the hero comes real UI in a macOS frame (Clipboard History), extension cards (Linear, Google Translate, Spotify), an AI chat window, isometric line illustrations, and a giant keyboard closer — [raycast.com](https://www.raycast.com).
- **Audiences.** **Persona tabs inside a section**: "There's an extension for that." with Productivity / Engineering / Design / Writing. The nav is split by platform and segment (Pro, AI, iOS, Windows, Teams, Enterprise) — [raycast.com](https://www.raycast.com).
- **Social proof.** "Built for professionals like you. Used by seriously productive people." A named-user carousel with avatars (Adam Whitcroft, Designer; Guillermo Rauch, CEO, Vercel; Marques Brownlee, Creator, MKBHD), each with "Favorite Feature" and "Top Extension" fields. Community counts (Slack 37k members, X 90k followers) and a YouTube row — [raycast.com](https://www.raycast.com).
- **CTAs and pricing.** Free download; Pricing in the nav; no demo — [raycast.com](https://www.raycast.com).
- **Navigation.** Store, Pro, AI, iOS, Windows, Teams, Enterprise, Blog, Pricing | Log in | Download, in a floating rounded bar fixed to the top. Footer: Product, Core Features, Top Extensions, Company, Community, By Raycast, newsletter — [raycast.com](https://www.raycast.com) (DOM footer).
- **Motion, type, colour, mobile, section order.**
  - Style: dark with a red accent; mono microcopy.
  - Order: hero → "Take shortcuts, not detours." product window → "It's not about saving time." → extensions with tabs → AI agent → testimonials → "Don't repeat yourself." → "What else can Raycast do?" → community → developer section → keyboard closer "Take the short way." → footer.
  - [raycast.com](https://www.raycast.com)
- **Borrow.**
  - (a) Testimonials with a **"Favourite feature" field** per named person. For example: "Favourite feature: report cards in one click" for a named teacher.
  - (b) Persona tabs inside a feature section (Principal / Teacher / Parent / Student).

  Low relevance otherwise: the audience is developers and power users.

### 10. Cal.com — cal.com
Screenshots: `screenshots/saas/cal-com-desktop-fold.jpg`, `cal-com-desktop-full.jpg`, `cal-com-mobile-fold.jpg`, `cal-com-mobile-full.jpg`, `cal-com.json`. Pricing: `cal-com-pricing-*`.

- **First five seconds, desktop.** H1 "The better way to schedule your meetings". Subhead "A fully customizable scheduling software for individuals, businesses taking calls and developers building scheduling platforms where users meet users." CTAs "Sign up with Google" (black, full width) and "Sign up with email ›", with "No credit card required" beneath. A pill reads "Cal.com launches v6.9.5 ›".
  - Visual: a real booking widget: "Ethan Taylor — **Academic Counseling** — Virtual counseling session for university students to discuss academic progress and well-being", with 15m/30m/45m/1h options and a calendar.
  - Rating badges sit right under the widget (Trustpilot, Product Hunt, G2).
  - The full-page capture showed a different example ("Isabella Valce — Photoshoot"), so the widget rotates use cases *(inferred)*.
  - [cal.com](https://cal.com)
- **First five seconds, phone.** Same order, stacked: the widget drops below the CTAs, and the header keeps "Sign in" and "Get started" fixed — [cal.com](https://cal.com) (mobile fold; sticky check).
- **Video and imagery.** No `<video>`. The product itself is the hero (the booking page), and feature cards carry UI snippets — [cal.com](https://cal.com).
- **Audiences.** The Solutions menu (from the phone DOM) splits "By team size" (For Individuals / For Teams / For Enterprises) and by use case (Recruiting, Sales, HR, **Education**, Support, Healthcare, Telehealth, Marketing). Footer "Use Cases" includes **Higher Education** and **Tutoring**. The hero example is itself an education one — [cal.com](https://cal.com) (JSON; DOM footer).
- **Social proof.** Rating badges in the hero. A logo row (Framer, ramp, PlanetScale, coinbase, storyblok, AngelList). A testimonial carousel (Aria Minaei, CEO, Theatre.JS; Ant Wilson, Co-Founder & CTO, Supabase). A "Wall of love" of social posts with avatars, then an FAQ — [cal.com](https://cal.com).
- **CTAs and pricing.** Free signup, with "Book a demo" as a secondary button on several sections, plus "Talk to sales". Pricing is public ("Choose your Cal.com subscription"); the page shows no currency label:

  | Plan | Price | Notes |
  |---|---|---|
  | Individuals | Free | "*Free forever" |
  | Teams | $12 per user/month | yearly toggle, "Save 25%", 14-day trial |
  | Organizations | $28 per user/month | 14-day trial |
  | Enterprise | Custom | annual |

  — [cal.com/pricing](https://cal.com/pricing)
- **Navigation.** Solutions, Enterprise, Cal.ai, Developer, Resources, Pricing | Sign in | Get started; fixed. Footer: Solutions, Use Cases, Resources, Company, Downloads, language selector, "Get a demo" / "Talk to sales", and "Cal.com vs Calendly" — [cal.com](https://cal.com) (DOM footer).
- **Motion, type, colour, mobile, section order.**
  - Style: light grey canvas, white card frames, hairline grid. Tight display sans. Small pill labels per section (How it works / Benefits / Testimonials / App store / Wall of love / FAQ).
  - Length: 8,521 px desktop vs 14,496 px phone (it stacks).
  - Order: hero → logos → "With us, appointment scheduling is easy" (01 Connect your calendar / 02 Set your availability / 03 Choose how to meet) → "Your all-purpose scheduling app" bento → "…and so much more!" icon grid → testimonials → app store → Wall of love → FAQ → closer → footer.
  - [cal.com](https://cal.com)
- **Borrow.**
  - (a) **"How it works" in three numbered steps.** That's the right altitude for a non-technical principal: e.g. "1. We bring in your students and staff · 2. Teachers take attendance and enter marks · 3. Parents see it on their phone".
  - (b) **Use an education example as the hero data.** SchoolMule should do the same with an Ontario school (synthetic names).

### 11. Superhuman — superhuman.com
Screenshots: `screenshots/saas/superhuman-desktop-fold.jpg`, `superhuman-desktop-full.jpg`, `superhuman-mobile-fold.jpg`, `superhuman-mobile-full.jpg`, `superhuman.json`.

- **First five seconds, desktop.** There is no `<h1>` element. The heading text reads "Bring AI inside every app and tab with Superhuman Go", with CTAs "Try Go" (lavender) and "Learn more ›". A bar above reads "Looking for Superhuman Mail? Learn more →".
  - Visual: a product video (Google Doc "East Bay Expansion Proposal" with a Go suggestion "Payback period changed … 14 months → 16 months · Knowledge Checker · 3 sources"), autoplay, muted, **not looping**.
  - Bottom-left of the hero is a **product list**, "One toolkit to win your workday": **Mail** — The most productive email app ever made; **Go** — The agent that works everywhere you work; **Docs** — The best place for teams and AI to work together.
  - [superhuman.com](https://superhuman.com) (fold; JSON)
- **First five seconds, phone.** The phone load landed on the **Mail** slide: "Save 4+ hours each week with Superhuman Mail", "Get Mail", "Learn more ›", with a "Next slide" control in the DOM. So the hero is a per-product carousel that advances when each video ends *(inferred from different loads, non-looping videos, and the "Next slide" control)*. Nothing is sticky on the phone — [superhuman.com](https://superhuman.com) (mobile fold; JSON; sticky check).
- **Video and imagery.** One hero video per product (`hero-go-desktop-2x.mp4`, `hero-mail-desktop-2x.mp4`), all real product UI in gradient frames. The section cards are real UI too (inline suggestions, chat, Go app, auto drafts, split inbox) — [superhuman.com](https://superhuman.com).
- **Audiences.** Organised by **product, not role**. A use-case tab row reads Featured / Prep for meetings / Write and edit / Automate your emails / Build agents. A "Superhuman for enterprise" band. On desktop, a sticky sub-nav reads "Your Superhuman suite: Get the suite | Mail | Grammarly | Docs | Go" — [superhuman.com](https://superhuman.com) (sticky check).
- **Social proof.** A logo row (OpenAI, Figma, Rivian, Brex, Zapier, DoorDash). One large quote: Jonathan Linke, Marketing Manager, Digital Media, Enterprise Retail Company, "Go helps me stay in one tab and actually finish things…". "Love" is a top-level nav item — [superhuman.com](https://superhuman.com).
- **CTAs and pricing.** Per-product CTAs (Try Go / Get Mail / Try Docs). The nav has only "Contact sales" and "Sign in", with no signup button. "Request a demo" sits in the enterprise band, and the closer is "Make it your best workday yet / Get started". Pricing is a nav dropdown (not captured) — [superhuman.com](https://superhuman.com).
- **Navigation.** Products, Solutions, AI, Resources, Pricing, Love | Contact sales | Sign in. Footer: Products, Company, Legal, Connect, under a giant "SUPERHUMAN" wordmark — [superhuman.com](https://superhuman.com).
- **Motion, type, colour, mobile, section order.**
  - Style: off-white with lavender CTAs, a deep-purple enterprise band and a maroon footer. Light-weight grotesk headings in two tones: grey lead, strong product name.
  - Order: hero carousel → logos → Go section (+ use-case tabs) → quote → Mail section → Docs section → enterprise → closer → footer.
  - [superhuman.com](https://superhuman.com)
- **Borrow.**
  - (a) **A hero with a product switcher list, where each item swaps in its own video.** This is the most direct model for the four portals: Staff / Teacher / Parent / Student each become a slide, cut from the 1:41 film.
  - (b) A two-tone heading that sets the portal name in strong weight ("…with the **Parent app**").

### 12. Jobber — getjobber.com
Screenshots: `screenshots/saas/jobber-desktop-fold.jpg`, `jobber-desktop-full.jpg`, `jobber-mobile-fold.jpg`, `jobber-mobile-full.jpg`, `jobber.json`. Pricing: `jobber-pricing-*`. Demo: `jobber-demo-*` (/dlp/book-a-demo/).

- **First five seconds, desktop.** H1 "Run a stronger service business". Subhead "From first quote to final payment, Jobber keeps your work, team, and revenue moving forward from one powerful platform." CTAs "Start Free Trial" (lime) and "Find Your Plan" (outlined, goes to pricing). The rating line sits right under them: "4.5 ★ 4,883 Google Play Reviews". The utility bar reads "Limited time offer: save up to 40% Save Now · Español · Log In".
  - Visual: a **strip of real customer photos, each captioned with name and business**: Mary Anne Bowcott — Westcom Plumbing and Gas; Clover Hubbard — Love Green Clean; Adrian Garcia — Reliable Kitchen Services; Erica Krupin — Kroopin's Poopin Scoopin; Jessica Bannister — Cam Cool Refrigeration; Jesse Jurkowski — Montreal Contractors.
  - A chat toast pops up: "Hi there! 👋 How can I help you today? — Jeanine from Jobber", with chips **"Speak to an Expert" / "Book a demo" / "Get support (existing customers)"**.
  - [getjobber.com](https://www.getjobber.com)
- **First five seconds, phone.** Same stack with full-width buttons, then the photo carousel. The chat toast covers the bottom. The header (with Start Free Trial) is sticky mid-scroll — [getjobber.com](https://www.getjobber.com) (mobile fold; sticky check).
- **Video and imagery.** No `<video>`. The UI is shown as collage mockups with torn-paper edges: a client website "Lawncare Inc.", AI quote features, a phone push notification "New high value quote just came in". Real tradespeople photography throughout — [getjobber.com](https://www.getjobber.com).
- **Audiences.**
  - Jobs-to-be-done tabs: "Get Noticed / Win Jobs / Work Smarter / Boost Profits".
  - Industry grid: "Proud partner to service pros in over 50 industries." (Cleaning, Construction & Contracting, Electrical, HVAC, Handyman, Landscaping, Lawn Care, Painting, Plumbing, Pressure Washing, Roofing, Tree Care, + "See All Industries →").
  - "Industries" is a top-level nav item, and the footer has "Industries We Serve".
  - [getjobber.com](https://www.getjobber.com)
- **Social proof.**
  - The rating in the hero and the named photo strip.
  - An inline quote from Stacy Flanagan (SEF The Lawn Surgeon), with "92 million+ Jobs completed by Jobber-powered businesses".
  - Band: "Join over 400,000 service pros who trust Jobber": 92 million+ jobs, 100K+ businesses, 12 hours+ saved on average per week, 44% revenue growth on average in first year.
  - A quote from Mitchell Gordy (MITHGO Outdoor Services): **"I can invoice from my cell phone. I'm not tied to my office."**
  - The demo page adds G2 4.6 (460+ reviews) and Capterra 4.6 (1,420+).
  - [getjobber.com](https://www.getjobber.com), [demo](https://www.getjobber.com/dlp/book-a-demo/)
- **CTAs and pricing.** The free trial is primary, repeated as an inline email + "Start Free Trial" with "No credit card required". A demo is secondary: chat chip, footer link, /dlp/book-a-demo/. A **toll-free phone number sits in the nav** (1-888-721-1115).
  - **Pricing** (public). H1 "Try Jobber for free now. Pick a plan later." It has a team-size selector ("Just me"), a Monthly/Annual toggle and a promo, "Save up to 40% · Offer ends October 30th". All figures are billed annually, 1 user, with no currency label on the page:

    | Plan | Promo price | Was | Price after 12 months |
    |---|---|---|---|
    | Core | $21/mo | $49 | $29/mo |
    | Connect (Recommended) | $70/mo | $139 | $99/mo |
    | Grow | $105/mo | $199 | $149/mo |

    The meta description adds "plans from $29 to $529/mo … solo contractors to 15+ person teams".
  - **Demo form**: First Name*, Last Name*, Business Name*, Industry, Business Email*, Business Phone Number* (Canadian flag default), and two consent checkboxes (SMS, email), then "Next" (multi-step; Chili Piper scheduler embed).
  - [getjobber.com/pricing](https://www.getjobber.com/pricing/), [book-a-demo](https://www.getjobber.com/dlp/book-a-demo/)
- **Navigation.** Product, Industries, Pricing, Resources | phone | Start Free Trial, with a utility bar (Español / Log In). Footer: Industries We Serve, Features, Resources, Company, phone, email — [getjobber.com](https://www.getjobber.com).
- **Motion, type, colour, mobile, section order.**
  - Style: dark navy with a lime accent, chunky bold geometric display type, torn-paper texture, and sticker-style stat labels on a warm off-white body.
  - Order: promo bar → hero + named photo strip → "The all-in-one system for high-performing service pros" tabs → 400,000 stats + email CTA → photo band → "AI built for blue collar businesses" → industries grid → quote + "You've got this, and we've got your back." email CTA → "Our business is helping yours succeed." (Masters of Home Service, Jobber Academy, Free Tools, Grants, Events) → footer.
  - [getjobber.com](https://www.getjobber.com)
- **Borrow.**
  - (a) **A hero strip of real, named owner-operators with their business names.** "People like you" is the strongest trust signal for this buyer. SchoolMule's version is principals and teachers with their school names, with permission.
  - (b) **A concierge chat with chips that split prospects from customers** ("Book a demo / Speak to an expert / Get support"), plus a phone number in the nav, because principals do call.

### 13. Gusto — gusto.com (YC W12, verified)
Screenshots: `screenshots/saas/gusto-desktop-fold.jpg`, `gusto-desktop-full.jpg`, `gusto-mobile-fold.jpg`, `gusto-mobile-full.jpg`, `gusto.json`. Pricing: `gusto-pricing-*`. Demo: `gusto-demo-*` (/instant-demo).

- **First five seconds, desktop.** H1 "Hire, pay, and grow like a pro." in a large display serif, white on a coral-red gradient. Subhead "Gusto handles payroll, HR, and more in a snap. That helps you expand your reach and keep betting big on yourself." CTAs "Create free account" (white) and "How Gusto works" (outlined). The visual is a real product dashboard ("Pay / Spring bonus 2027 — Confirm $28,684.58 withdrawal and submit payroll") with floating cards "TIME OFF · Review Requests" and "TIME TRACKING · Manage Team Shifts" — [gusto.com](https://gusto.com).
- **First five seconds, phone.** **The desktop dashboard is swapped for a phone-app screen** ("Run Pay — Double check hours and pay"), so the product shot matches the device. A floating "Ask ✨" AI button. Mid-scroll the header is sticky with "Create free account", and a second sticky row holds "See a demo / Get in touch" — [gusto.com](https://gusto.com) (mobile fold; sticky check).
- **Video and imagery.** No `<video>` on the homepage. A hand holding a phone ("All set! Payroll complete"), product UI and editorial photography. The interactive demo at /instant-demo is **gated by 6 fields**: First name, Last name, Work email, Company name, Number of employees, Company phone, then "Start the demo". Its left column shows "4.6 Rating — Software Advice | 4,139 reviews", "#1 Most Innovative Company in HR — Fast Company | 2025" and "Best overall payroll software — Nerdwallet | 2025", with "Talk with our team at (800) 936-0383" — [gusto.com/instant-demo](https://gusto.com/instant-demo).
- **Audiences.**
  - Nav items "**Business types**" and "**For accountants**". Accountants are courted as a separate influencer audience.
  - Footer "Built for you": Starting a business, Switch to Gusto, Remote and Global, Why Gusto. Also "For Accountants" and "For Developers".
  - The homepage has a section "Every solopreneur deserves support.", and the pricing page has tabs "**Pay My Team / Pay Myself**".
  - [gusto.com](https://gusto.com), [pricing](https://gusto.com/product/pricing)
- **Social proof.**
  - An awards strip right under the hero: CNBC "Best SMB payroll service, For user experience 2025"; Forbes Advisor 4.5; G2 "#1 Highest Satisfaction Software, G2 Review 2026"; Newsweek "America's Best Online Platform 2025".
  - "500,000+ businesses run on Gusto." with floating customer photos.
  - A "Small business success is no small thing." carousel: Jesse Mason, Co-Owner, Mason's Creamery; Forge Fire "reduced platform costs by 40%".
  - Stats: "9 out of 10 customers would recommend Gusto", "152 hrs/year saved on tax and compliance", "4.5+ stars", "500k+ businesses", footnoted "Survey of 538 Gusto Customers, September 2024".
  - [gusto.com](https://gusto.com)
- **CTAs and pricing.** "Create free account" is primary everywhere. "See demo" (with an eye icon) in the nav leads to the interactive demo.
  - **Pricing** is public ("Simple, transparent pricing — Payroll, benefits, and HR all in one place. No hidden fees. Cancel any time."):

    | Plan | Base | Per person |
    |---|---|---|
    | Simple | $49/mo | + $6/mo |
    | Plus (BEST VALUE) | $80/mo | + $12/mo |
    | Premium | $180/mo | + $22/mo |

  - **The closer, "Ready to work with Gusto?", offers four doors**:
    1. "See plans and pricing — As in real numbers on the page. No proposal or quote needed, just clear and easy options."
    2. "Compare Gusto — …against ADP, Paychex, Rippling, and others."
    3. "Explore the demo — Take 5 minutes to check out how Gusto really works."
    4. "Talk to sales."

    These sit beside a three-step list ("Create your free account. / Add your team (or let them self-onboard). / Run your first payroll.") and "Sign up for free".
  - [gusto.com](https://gusto.com), [pricing](https://gusto.com/product/pricing)
- **Navigation.** Products, Business types, For accountants, Resources, Pricing | See demo | Create free account | Sign in. The menus open on click, not hover, so they weren't captured. Footer: Pricing, Built for you, For Accountants, For Developers, Get Started (Interactive Demo, Contact Sales with phone), Services, Company, Licenses, Support, Resources, Tools, Talk Shop — [gusto.com](https://gusto.com).
- **Motion, type, colour, mobile, section order.**
  - Style: coral/red gradient hero, cream body, deep-teal CTA buttons with a rainbow underline. **A custom display serif for headings**, sans body, playful illustration. A "Dream: On — Showcase Fall 2026" banner.
  - Order: hero → awards → Showcase banner → "500,000+ businesses run on Gusto." → "Payroll at the speed of." carousel ("Run payroll in five minutes flat." …) → "Hiring tools. On your terms." → customer stories → "Your business does a lot. We do, too." product grid → stats → "Ready to work with Gusto?" four doors → "DO WHAT YOU DO BEST. We'll handle the rest." → footer.
  - [gusto.com](https://gusto.com)
- **Borrow.**
  - (a) **A four-door closer by readiness** (pricing / compare / 5-min demo / talk), with honest microcopy like "real numbers on the page".
  - (b) **A device-matched product shot**: the phone UI on phones. Parents and principals live on their phones.
  - (c) **Audience nav** ("Business types", "For accountants"). SchoolMule's version: "For principals / For teachers / For parents", or "School types" (Islamic, Montessori, independent).

### 14. Toast — pos.toasttab.com (my pick for the third owner-operator site)
Screenshots: `screenshots/saas/toast-desktop-fold.jpg`, `toast-desktop-full.jpg`, `toast-mobile-fold.jpg`, `toast-mobile-full.jpg`, `toast.json`, `toast-desktop-megamenu.jpg`. Pricing: `toast-pricing-*`. Demo: `toast-demo-*`. The pricing and demo folds are partly covered by a "view our site in Canada (English)" modal; the homepage loaded the US site.

- **First five seconds, desktop.** H1 "Built For Busy", with "Busy" circled in a hand-drawn orange stroke. Subhead "The POS built for peak volume, slim margins, and complexity at scale — trusted by 180,000 locations† like yours."
  - Primary CTA: an email field ("Email address*") with "Get Started", plus "Email used for marketing. See our Privacy Statement".
  - Secondary: **"Under 10 employees? Shop now →"**, a self-serve fork for tiny shops.
  - A pill, **"▶ How Toast is Built For Busy"**, opens a click-to-play brand film.
  - The nav CTA is "Get a Demo".
  - Visual: an **autoplay, muted, looping background video of a cook in a busy kitchen, with a Toast kitchen screen visible on the wall**: real-world footage with the product in place.
  - [pos.toasttab.com](https://pos.toasttab.com)
- **First five seconds, phone.** The subhead is shortened to "The POS made for peak volume, slim margins, and complexity at scale.", dropping the 180,000 claim. The "Shop now" fork is gone. The header shows **"SALES (617) 297-1005"** instead of nav links. The mid-scroll DOM check found a **fixed bottom "Get a Free Demo" bar**; it was hidden under the cookie banner in my screenshot, so it's confirmed in the DOM only — [pos.toasttab.com](https://pos.toasttab.com) (mobile fold; sticky check).
- **Video and imagery.** The hero background loop; the "How Toast is Built For Busy" play pill; product-grid card videos (`HP-POS.mp4`, `HP-Hardware.mp4`); customer-story videos (`rebel720`, `waterhouse`, `stobys2`, `caribou`, `burger25`) that start on scroll (`autoplay=false` at load) *(inferred)*, behind a "▶ See how they stay busy" control. A mix of real UI, hardware and real restaurants — [pos.toasttab.com](https://pos.toasttab.com) (JSON videos).
- **Audiences.**
  - A Restaurants/Retail split in the nav, plus a "Restaurants" segment pill in the header and a Restaurants/Retail toggle on the platform grid.
  - The **mega-menu** has "Service models" (Quick service, Full service, Fast casual), "Restaurant concepts" (17, e.g. Bar and lounge, Cafe and bakery, Food truck, Pizza, Fine dining, Hotel & Resorts, Catering and events, Sushi, Golf & Country Club…) and "Capabilities". Its featured cards are **"Switch to Toast — Outgrown your tech? Toast makes switching easy."** and **"New openings — We'll handle the tech, so you can focus on what matters most."**
  - A chip cloud, "We help build businesses that last" (Full Service, Pizzeria, Food Truck, Cafe & Bakery, … Grocery, Butcher Shop, Hybrid).
  - [pos.toasttab.com](https://pos.toasttab.com) (megamenu screenshot)
- **Social proof.**
  - A restaurant logo marquee under the hero (Le Diplomate, Popup Bagels, Carmine's, TGI Fridays, Caribou Coffee, Carbone, Tatiana, Applebee's, Topgolf).
  - G2 Summer 2025 badges (Grid Leader, Fastest Implementation, Momentum Leader).
  - "Where the work gets results — Revenue at Toast restaurants is on average more than 47% greater than the average US restaurant.¹"
  - A video case carousel: "20% growth in revenue — Rebel Cheese in New York City grew 20% in its first year…" with a **handwritten signature** of Kirsten Maitland, Owner & Co-founder.
  - Footnotes disclose sources and that one featured customer "was compensated for their time".
  - [pos.toasttab.com](https://pos.toasttab.com)
- **CTAs and pricing.** Demo-led: "Get a Demo" in the nav, "Get a Free Demo", "Start for $0", "Compare Plans", and sales phone numbers in the phone header and as footer pills ("Sales: (857) 301-6002", "Customer Care: (617) 682-0225").
  - **Demo page**: "Get a free, virtual product demo — Schedule a consultation with a live product…" (partly hidden by the region modal). Visible fields: First and Last Name*, a "Which…" field (truncated), Email Address*, Phone, Business name, then "Get a Demo". G2 badges and "Trusted by over 180,000² business locations" alongside.
  - **Pricing**: "Flexible pricing options for every restaurant and retailer". **Starter Kit "Starting at $0/month"** (hardware kit with no upfront cost; "Ideal for single-location restaurants who need 1-2 terminals"), "Point of Sale" (monthly software subscription, choose your own hardware), and "Build Your Own — Custom pricing — Get a Quote".
  - [request-demo](https://pos.toasttab.com/request-demo), [pricing](https://pos.toasttab.com/pricing)
- **Navigation.** Restaurants, Retail, Products, Pricing, Resources | segment pill | language globe | Login | Get a Demo, under a rotating announcement bar. Footer: Customers, Products, Resources, Company; "How can we help? Contact us." with sales and care phone pills; region selector; app badges; numbered footnotes — [pos.toasttab.com](https://pos.toasttab.com).
- **Motion, type, colour, mobile, section order.**
  - Style: an espresso-dark video hero, orange accent and cream body, with the hand-drawn orange circle reused on the closer "Let's get **busy**". Rounded cards and an orange gradient CTA panel.
  - Order: announcement → video hero → logo marquee → "Get busy. Stay busy. Run busy." 8-card platform grid (POS, Toast IQ, Hardware, Online ordering, Marketing, KDS, Integrations, Payments) → AI section "Data. Decision. Action. Impact." (4 steps) → "Designed for what happens mid-shift" (Offline mode, 24/7 support, Sales forecasting, …) → orange panel "You've got options. We think we're the best one." (Start for $0 / Compare Plans) → "Where the work gets results" video stories → "We help build businesses that last" → "2026 Spring Release — The stuff that keeps you up? On it." → closer "Let's get busy" with email → footer.
  - [pos.toasttab.com](https://pos.toasttab.com)
- **Borrow.**
  - (a) **Real footage of the workplace with the product in place.** For SchoolMule: the film or the hero loop opens in a real school office or classroom with SchoolMule on the screen, rather than floating UI.
  - (b) **Featured nav cards for the two big entry situations**, "Switch to Toast" and "New openings". SchoolMule's version: "Switching from another system?" and "Opening a new school or campus?".
  - (c) **On phones: a sticky "Get a Free Demo" bar plus a tap-to-call sales number in the header.**

### Bonus — Rippling — rippling.com (served rippling.com/en-CA)
Screenshots: `screenshots/saas/rippling-desktop-fold.jpg`, `rippling-desktop-full.jpg`, `rippling-mobile-fold.jpg`, `rippling-mobile-full.jpg`, `rippling.json`.

- **First five seconds.** H1 "Manage your entire workforce on one system". Subhead "Increase savings and automate busy work with global HR, Payroll, IT, and Finance in one place—powered by AI that understands your business." CTA: work email with "See Rippling", then "▶ Take a product tour". "4.8 stars · 16k+ reviews" (G2) sits *above* the H1, and a ratings row sits below the CTA (Software Advice 4.9, PC Magazine Editor's Choice, Capterra 4.9). A promo bar reads "Get your first 3 months free…".
  - Visual: a hand tapping a tablet that shows **four department panels (HR, IT, Finance, Payroll) on one screen**.
  - A chat pops up ("Hey there 👋 Looking for a way to run your entire workforce in one place?") with chips "Book a demo with sales / See Rippling in action / Get Customer Support".
  - The phone keeps the same stack, with a sticky promo bar.
  - [rippling.com/en-CA](https://www.rippling.com/en-CA)
- **The "one database" story, told explicitly.**
  - "Start with the apps you need, or run them all together" (HR / IT / Finance / Payroll / Total applications, each with "Get a demo").
  - Then: **"Rippling is the operating system for your entire workforce — Unlike most 'all-in-one' platforms that simply bundle tools, Rippling products share incredibly deep underlying data, controls, and AI capabilities — so they work better together by design."**
  - Then: **"Your business data with people at the center"**, shown as a single employee record card (Zoe Adebayo, Senior Account Executive: Employee ID, Base salary, Home address Toronto ON, Device MacBook Pro, Apps 32, Corp card spend, CRM quota, Active tickets).
  - Then: "Shared permissions and access controls — Define rules once and have them enforced everywhere."
  - Then: "When everything runs on one system, work moves faster" (eliminate duplicate systems / automate end-to-end workflows / AI that works on unified data).
  - [rippling.com/en-CA](https://www.rippling.com/en-CA)
- **Proof, CTAs, nav.**
  - Proof: a Barry's quote (Vanessa Sarne, Senior Director, Employee Relations); badges (G2 Leader Fall 2026, TrustRadius Buyer's Choice 2026, Software Advice Front Runners 2026, Capterra Shortlist 2026).
  - CTAs: the closer is **"Get a demo—live or on demand"** (Request Live Demo / Watch tour video), and the footer asks again ("Request a demo to see Rippling in action").
  - Nav: Products, Platform, Solutions, Global, Resources, Pricing | 🇨🇦 EN | Login | See a demo.
  - Footer Solutions by industry, including Non-profits and Restaurants.
  - [rippling.com/en-CA](https://www.rippling.com/en-CA)
- **Borrow.**
  - (a) **A "student at the center" record card** (marks, attendance, messages, report cards, guardians on one record). It's the static proof of "one database" that the film then shows in motion.
  - (b) A positioning line against bundled tools ("not four apps glued together").
  - (c) A "live or on demand" demo closer.

Housecall Pro (homepage captured, `screenshots/saas/housecall-pro-*`, not torn down):
- Copy: H1 "Everything to run and grow your business" in a distressed display face; email field + "Start free trial", "No credit card required."; "Powered by AI built from 100M+ jobs."
- Visual: a technician holding a phone, with notification cards ("Job booked", "Rerouting complete", "Payment received").
- An industry tile carousel, and chat chips ("I have a question / I'd like a demo / I need help with my account").
- It's close to Jobber, so I picked Toast instead.
- [housecallpro.com](https://www.housecallpro.com)

### Inferences
- The developer and prosumer tools (Linear, Vercel, Raycast, Attio, Cal.com, Loom) lead with self-serve "Sign up / Start free / Download". The owner-operator and finance sellers (Toast, Rippling, Ramp, Gusto, Jobber, Notion's secondary) keep a **demo** route in the nav or chat. SchoolMule's buyer and sales motion is closer to the second group.
- The **phone version is a separate design decision, not a squeeze**:
  - Attio swaps in "Send me a demo".
  - Raycast drops its CTA.
  - Loom drops the Chrome CTA and adds an iOS sheet.
  - Stripe and Toast cut subheads and claims.
  - Gusto swaps to a phone-app screenshot.
  - Toast and Mercury add sticky bottom actions.
- Where a long or "brand" film exists, it's **click-to-play behind a labelled pill or frame** (Loom, Toast, Stripe Sessions). Autoplay is reserved for short, silent UI loops.

### Gaps
- Motion and scroll choreography aren't directly visible in stills. Rotating headlines and widgets (Notion, Cal.com, Attio, Superhuman, Vercel's phone subline), Mercury's scroll-scrub and Toast's scroll-start videos are inferred from multiple captures and `<video>` attributes.
- Several sections didn't paint in the full-page captures (Vercel lower half, Mercury footer, Toast middle). Cookie or region modals covered parts of Ramp, Superhuman and Toast folds.
- The Gusto, Rippling and Jobber mega-menus are click-to-open and weren't captured; only Toast's and Notion's opened on hover.
- Pricing pages for Ramp, Mercury, Notion, Attio, Loom, Raycast, Superhuman, Vercel and Stripe weren't captured, so their models aren't stated beyond "public pricing link in nav". Currency isn't labelled on the Jobber or Cal.com pricing pages.
- No forms were submitted, so post-submit steps (e.g. Jobber's step 2, the Chili Piper slot picker) are unknown.
- The Mercury YC batch is unverified.
- The Ramp en-CA hero differed between loads; I can't tell whether that's an A/B test or a breakpoint variant.

---

## Q2. Which patterns from these sites fit SchoolMule's goal: a phone-reading principal who books a demo, with a 1:41 four-portal film at the centre?

### Takeaway
Use a real-UI hero (live HTML or a short muted loop) with "Book a demo" as the primary CTA and "Watch the 1:41 tour" as a labelled, click-to-play secondary. Then a **portal switcher** (Superhuman's product list or Mercury's tabs), where each portal plays its chapter of the film. Back it with a **"student at the center" record card** (Rippling) to prove the single database. Win the phone with a sticky demo bar, tap-to-call, and a one-field or "send me the tour" path (Toast, Jobber, Attio, Ramp). Earn trust like the owner-operator sellers do: named, photographed school leaders, plain-language security, and prices or "how pricing works" on the page (Jobber, Gusto, Notion).

### Cited findings
- **How the hero is built across the 15 homepages.**

  | Hero type | Sites |
  |---|---|
  | Autoplay muted loop of product or workplace | Ramp, Notion (desktop only; `autoplay=false` on phone), Toast (kitchen footage), Superhuman (per-product, non-looping) |
  | Click-to-play film | Loom (embed with "1 min → 50 sec" badge), Toast ("▶ How Toast is Built For Busy" pill) |
  | Scroll-scrubbed video (inferred) | Mercury (`hero-scrub-lg.mp4`) |
  | Live-HTML or static real UI, no video | Linear, Attio, Cal.com, Gusto, Rippling, Stripe (bento), Jobber (mockups) |
  | Customers' UIs | Vercel |
  | Abstract brand art | Raycast |

  — [ramp](https://ramp.com/en-ca/), [notion](https://www.notion.com), [toast](https://pos.toasttab.com), [superhuman](https://superhuman.com), [loom](https://www.loom.com), [mercury](https://mercury.com), [linear](https://linear.app), [attio](https://attio.com), [cal](https://cal.com), [gusto](https://gusto.com), [rippling](https://www.rippling.com/en-CA), [stripe](https://stripe.com/en-ca), [jobber](https://www.getjobber.com), [vercel](https://vercel.com), [raycast](https://www.raycast.com)
- **"One product, many roles or parts" devices.**
  - Superhuman's hero product list (Mail / Go / Docs) swaps the hero video per product.
  - Mercury's demo has role switching (Admin → Employee, plus an accountant "Advisor Portal").
  - Mercury's homepage has a four-tab showcase with a video per tab.
  - Ramp's "Trusted by finance, loved by employees."
  - Rippling's "people at the center" record and "operating system" positioning.
  - Raycast's persona tabs (Productivity / Engineering / Design / Writing).
  - Toast's Restaurants/Retail toggle and service-model/concept mega-menu.
  - Gusto's "Pay My Team / Pay Myself" and "For accountants".

  — [superhuman](https://superhuman.com), [mercury demo](https://demo.mercury.com/dashboard), [mercury](https://mercury.com), [ramp](https://ramp.com/en-ca/), [rippling](https://www.rippling.com/en-CA), [raycast](https://www.raycast.com), [toast](https://pos.toasttab.com), [gusto pricing](https://gusto.com/product/pricing)
- **Self-serve demos.**
  - Mercury: ungated live demo app, with a role switch and guided tasks.
  - Ramp: a "2-minute" interactive tour, alongside a 30-minute live demo and five walkthrough videos.
  - Gusto: an interactive demo gated by 6 fields ("Take 5 minutes…").
  - Rippling: "Take a product tour" / "Watch tour video".

  — [mercury demo](https://demo.mercury.com/dashboard), [ramp demo](https://ramp.com/see-a-demo), [gusto demo](https://gusto.com/instant-demo), [rippling](https://www.rippling.com/en-CA)
- **"Demo" wording in the nav.** 6 of 15 put "demo" in the nav: Vercel "Get a Demo", Ramp "See a demo", Notion "Request a demo", Gusto "See demo", Toast "Get a Demo", Rippling "See a demo". Stripe, Loom and Superhuman use "Contact sales" instead. Jobber puts a phone number in the nav and the demo in chat and footer — [vercel](https://vercel.com), [ramp](https://ramp.com/en-ca/), [notion](https://www.notion.com), [gusto](https://gusto.com), [toast](https://pos.toasttab.com), [rippling](https://www.rippling.com/en-CA), [jobber](https://www.getjobber.com)
- **Demo-form length.**
  - Ramp: 1 field (work email) to schedule.
  - Toast: about 5 fields.
  - Jobber: 6 fields + 2 consent boxes, multi-step.
  - Gusto: 6 fields before the instant demo.
  - Attio: phone hero has 1 field ("Send me a demo").
  - Rippling: 1 field ("See Rippling").

  — [ramp demo](https://ramp.com/see-a-demo), [toast demo](https://pos.toasttab.com/request-demo), [jobber demo](https://www.getjobber.com/dlp/book-a-demo/), [gusto demo](https://gusto.com/instant-demo), [attio](https://attio.com), [rippling](https://www.rippling.com/en-CA)
- **Phone-specific behaviour.**
  - Attio replaces "Start for free" with "Send me a demo".
  - Raycast removes its download CTA.
  - Loom removes "Install Chrome Extension" and adds a fixed "Download Loom for iOS" sheet.
  - Stripe drops the subhead.
  - Toast drops its 180,000 claim and "Shop now", shows a "SALES" phone number in the header, and has a fixed "Get a Free Demo" bar (DOM).
  - Gusto shows the phone app instead of the desktop dashboard, with a sticky "See a demo / Get in touch" row.
  - Mercury has a sticky "Log in / Open account" bar.
  - Linear crops its hero UI off the right edge.

  — [attio](https://attio.com), [raycast](https://www.raycast.com), [loom](https://www.loom.com), [stripe](https://stripe.com/en-ca), [toast](https://pos.toasttab.com), [gusto](https://gusto.com), [mercury](https://mercury.com), [linear](https://linear.app)
- **Trust for owner-operator buyers.**
  - Jobber: named customer photos with business names in the hero, "4.5 ★ 4,883 Google Play Reviews" under the CTA, and the quote "I can invoice from my cell phone. I'm not tied to my office."
  - Gusto: an awards strip under the hero, and a stats survey footnote ("Survey of 538 Gusto Customers, September 2024").
  - Toast: a customer's handwritten signature, and footnotes disclosing a compensated customer.
  - Rippling: ratings above the H1.
  - Cal.com: rating badges beside the hero widget.

  — [jobber](https://www.getjobber.com), [gusto](https://gusto.com), [toast](https://pos.toasttab.com), [rippling](https://www.rippling.com/en-CA), [cal](https://cal.com)
- **Pricing transparency.** Linear, Cal.com, Jobber, Gusto and Toast publish numbers. Gusto's closer says "As in real numbers on the page. No proposal or quote needed". Toast leads with "Starting at $0/month". Jobber says "Try Jobber for free now. Pick a plan later." — [linear pricing](https://linear.app/pricing), [cal pricing](https://cal.com/pricing), [jobber pricing](https://www.getjobber.com/pricing/), [gusto](https://gusto.com), [toast pricing](https://pos.toasttab.com/pricing)
- **Closers that fork by readiness.**
  - Gusto: four doors (pricing / compare / 5-min demo / talk).
  - Ramp demo page: three doors (live / 2-min tour / videos).
  - Rippling: "Get a demo—live or on demand".
  - Stripe: "Start now / Contact sales" + "See what you'll pay" + "Start building".

  — [gusto](https://gusto.com), [ramp demo](https://ramp.com/see-a-demo), [rippling](https://www.rippling.com/en-CA), [stripe](https://stripe.com/en-ca)
- **Typography and colour.**
  - Serif display: Gusto's headings; Notion uses serif only for quotes.
  - Two-tone lead+grey headings: Stripe, Linear, Attio, Superhuman.
  - All dark: Linear, Raycast, plus Mercury's body.
  - Light or warm: Vercel, Stripe, Ramp, Attio, Notion, Loom, Cal.com, Superhuman, Gusto (coral/cream), Toast (dark video hero, cream body), Jobber (navy hero, cream body), Rippling (plum hero, light body).

  — screenshots per site above.

### Inferences (applied to schoolmule.ca)
1. **Hero.** Headline + one-line subhead.
   - Primary: **"Book a demo"**.
   - Secondary: **"▶ Watch the 1:41 tour"**, labelled with its length (Loom/Toast).
   - Under it: a real SchoolMule screen as live HTML (Linear/Attio) or a short silent loop (Ramp/Notion), *not* the full film autoplaying.
   - On phones, use the phone-app screen of the parent portal (Gusto), and cut the subhead to one line (Stripe/Toast).
2. **Four-portal section.** A Superhuman-style switcher, **Staff · Teacher · Parent · Student**, where each item plays that portal's chapter of the 1:41 film (Mercury's per-tab clips). Pair it with a Rippling-style **"one student, one record"** card showing what each portal reads and writes. This turns "one database" from a claim into a picture.
3. **Phone conversion.**
   - A sticky bottom **"Book a demo"** bar (Toast) and a tap-to-call number (Jobber/Toast).
   - A one-field first step (Ramp/Rippling).
   - An Attio-style **"Send me the tour"** email option for principals who'll watch later at a desk.
4. **Demo page with three doors** (Ramp): book a 20–30 min call / watch the film / click around a demo school. A Mercury-style ungated demo with "View as Principal / Teacher / Parent" is the stretch goal. SchoolMule already has a synthetic Playground school, but exposing it publicly would need a read-only, auto-reset sandbox; that is a product decision, not established here.
5. **Trust for a principal.**
   - Real named principals and teachers with school names and photos (Jobber), only with consent.
   - An Ontario-specific FAQ (Ramp en-CA's Canadian FAQ).
   - A plain-language security page (Notion's card format): where student data is stored, who can see it, whether it's used for AI training. Use only claims SchoolMule can verify.
   - Price or "how pricing works" stated on the page (Gusto/Jobber).
6. **Closer with doors by readiness** (Gusto): See pricing · Watch the tour · Switching from another system? (Toast's "Switch to Toast") · Book a demo.

### Gaps
- None of these sites publish conversion data, so this shows what best-in-class sites *do*, not what *converts* for school principals. Nothing here measures demo-booking rates.
- Whether autoplaying the full 1:41 film would beat click-to-play for this audience can't be judged from these sites. None of them autoplays a long film with sound.
- I didn't verify whether SchoolMule can truthfully make the security and data-residency claims proposed above. They're shown as patterns, not as copy.
