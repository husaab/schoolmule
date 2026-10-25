# Evidence brief: converting B2B website visitors into booked demos (for the schoolmule.ca redesign)

Researched 2026-10-25. Every finding below carries an evidence grade, as defined in the brief:
**[A]** randomized A/B test or controlled experiment with reported sample/significance; **[B]** large-sample observational benchmark or large survey; **[C]** vendor case study / single-company anecdote / test with no sample or significance reported; **[D]** expert opinion. **(T)** = transfer from e-commerce, B2C, nonprofit or lab settings. **(V)** = data published by a vendor that sells the intervention. Where a widely repeated statistic could not be traced to an original source, this is stated in the Gaps of the relevant section.

Overall finding: almost no **[A]**-grade, B2B-specific, demo-booking evidence is public. The strongest B2B material is **[B]** observational: vendor datasets (RevenueHero, Chili Piper, HockeyStack, Navattic, Unbounce) and buyer surveys (Gartner, 6sense, G2, TrustRadius). Most **[A]** evidence comes from other settings: nonprofit sign-ups, telecom e-commerce and lab psychology. Many popular conversion statistics turn out to be misquoted or untraceable when checked (see Gaps).

---

## 1. Demo booking mechanics: inline scheduler vs form-then-schedule vs contact form; form length, phone and qualifying fields

### Takeaway
No published controlled test compares an inline Calendly embed with a form-then-schedule flow or a "contact sales" form. The best available evidence is vendor data. It consistently shows that letting people book instantly on submit converts roughly 60–65% of form-fillers into meetings. Manual follow-up books about 30–40%, but that baseline is unsourced. On fields, a phone-number field is the one with consistent negative evidence, including one [A]-grade transfer test showing −37%. Total field count matters less than which fields are asked.

### Cited Findings
**Instant scheduling / booking rates**
- [B](V) Chili Piper analysed "nearly 3 million form fills" and reported a 65.09% average form-fill-to-booked-meeting rate for its customers (instant scheduling), against an "overall average of 30–40%" (the comparator is not sourced). Published Jan 2024. The page returned HTTP 403 when fetched, so these figures come from the search-index snippet. — [Chili Piper Help Center, "The Sauce: What's a good demo conversion rate" (Jan 2024)](https://help.chilipiper.com/hc/en-us/articles/33750048681875--Jan-2024-The-Sauce-What-s-a-good-demo-conversion-rate)
- [B](V) RevenueHero 2025 Inbound Conversion Benchmark: 1M+ inbound form submissions over 12 months from its B2B SaaS customers. Median *qualified*-to-booked rate is 62%; bottom quartile 53%, top quartile 72%, top 10% 78%+, best 88%. It cites an "older benchmark of 35%" for manual review queues and delayed follow-up but gives no source for it. SMB-segment median is 63.2%. Unfunded/seed companies: 63.6%. — [RevenueHero, The Inbound Conversion Benchmark 2025](https://revenuehero.io/2025-inbound-benchmark)
- [B](V) RevenueHero Q1 2026: 428,000+ demo requests across 13 weeks; average qualification rate 77.3%; average form-to-demo conversion peaked at 64.4% in week 4. — [RevenueHero, Breaking Inbound #17: Q1 2026 Inbound Report Card](https://www.revenuehero.io/breaking-inbound/breaking-inbound-17)
- [C](V) Customer stories reporting instant-booking lifts: SaaSOptics' book rate on demo requests went from 40% to 90%; Navattic's form-to-demo rate went from 70% to as high as 85%; Apollo reported +50% inbound meetings booked. All are selected testimonials. — [Chili Piper SaaSOptics story](https://www.chilipiper.com/customer-story/saasoptics); [Chili Piper Navattic story](https://www.chilipiper.com/customer-story/navattic-demo-conversions-chili-piper); [Chili Piper Apollo story](https://www.chilipiper.com/customers/apollo)
- [D](V) RevenueHero's "1,000+ A/B tests" post says modals and embedded scheduling "drove higher completion rates". It publishes no lift sizes, samples or significance, and the author co-founded a scheduling vendor. — [RevenueHero, What we learned from 1,000 B2B website CTA tests](https://revenuehero.io/blog/what-we-learned-from-1-000-b2b-website-cta-tests)

**Show / no-show rates**
- [C](V) The direction is consistent: same-day or near-term bookings no-show less. A vendor blog attributes a 6.9% no-show rate for same-day bookings and 24.5% for bookings 7+ days out to "Chili Piper 2025 data", but no original Chili Piper report could be found. — [Naoma, demo no-shows (Feb 2026)](https://naoma.ai/blog/article-01-demo-no-shows)
- [C] Focus Digital analysed 6,428 booked B2B meetings and says a same-day slot outperforms one booked eight days out by 70%. It notes that published estimates for two-week-out meetings range from 42% to 67% and advises teams to measure their own. — [Focus Digital, no-show rate by booking channel](https://focus-digital.co/average-no-show-rate-for-booked-sales-meetings-by-booking-channel/)

**Form length and field types**
- [B] HubSpot (Dan Zarrella) analysed 40,000+ customer landing pages. Conversion fell only slightly as the number of single-line text fields rose, but multiple textarea fields had a much stronger negative effect. Pages that asked for age, a phone number or permission to call, or a street-level address had lower conversion rates. The original posts give **no numeric rates**, no statistical tests and no date for the data (circa 2010–11, page "updated 06/06/25"). — [HubSpot, Which types of form fields lower landing page conversions](https://blog.hubspot.com/blog/tabid/6307/bid/6746/which-types-of-form-fields-lower-landing-page-conversions.aspx); [HubSpot, 3 form fields that kill landing page conversion rates](https://blog.hubspot.com/blog/tabid/6307/bid/6748/3-form-fields-that-kill-landing-page-conversion-rates.aspx)
- [A](T: nonprofit course sign-up) NextAfter Experiment #7567 (Care Net, Sep–Oct 2017). Adding an *optional* phone-number field cut conversion from 99.6% to 62.9% (−36.9%), with n = 1,454 and reported confidence of 100%. — [NextAfter, How adding a phone number field to an acquisition form impacts conversion](https://www.nextafter.com/?p=14159)
- [B](V) Among RevenueHero's top performers, a 2-field form reached 77%+ and a 13-field form 76%+ qualified-to-booked; RevenueHero calls the field-count link "weak". **Caveat:** this rate is measured *after* submission, so it says nothing about how many visitors abandon a longer form. — [RevenueHero 2025 benchmark](https://revenuehero.io/2025-inbound-benchmark)
- [B](V) Disqualification: top-quartile RevenueHero customers disqualify 37.7% of form fills against 18.7% for the bottom quartile. DQ rates by segment: SMB 21.8%, mid-market 28.1%, enterprise 71.2%. — [RevenueHero 2025 benchmark](https://revenuehero.io/2025-inbound-benchmark)
- [B](T: e-commerce) Baymard (2024): the average checkout has 11.3 form fields (11.8 in 2021, 12.7 in 2019), while most sites need only 8. Baymard argues that field count affects usability far more than step count. — [Baymard, Checkout flow average form fields](https://baymard.com/blog/checkout-flow-average-form-fields)
- [C] Venture Harbour (self-reported, own site, tool now discontinued): conversions rose more than 300% in the first week after switching to multi-step forms. Almost five years later it reported 0.96% → 8.1% ("743%"). Many other changes happened over that period, so the result is not isolated. — [Venture Harbour, CRO case studies](https://ventureharbour.com/cro-case-studies/)

### Inferences
- For SchoolMule, an embedded Calendly that lets a principal pick a slot immediately is consistent with the best B2B evidence, which says instant scheduling roughly doubles booking compared with "we'll get back to you" ([B](V), with an unverified baseline). Calendly's built-in name and email fields are close to the minimum.
- Leave out a phone field, or at minimum make it optional and explain why it is asked. The only [A]-grade evidence (−37%) and HubSpot's [B] correlation both point the same way.
- Little qualification is needed. RevenueHero's SMB disqualification rate is about 22%, and a founder-led sales motion gains little from routing. One optional context field, such as school size, is the most the evidence supports.
- Offer near-term slots, same day or within 1–3 days, because no-shows rise with lead time ([C], directionally consistent).

### Gaps
- No public A/B test was found comparing an inline scheduler, form-then-scheduler and a plain contact form on the same traffic. The only "evidence" is vendor argument and testimonials ([Cal.com](https://cal.com/blog/best-embed-scheduling-widget), [Youform](https://youform.com/scheduling-forms/)). SchoolMule would need to test this itself, for example by tracking Calendly's `calendly.event_scheduled` embed event as the goal ([Mida–Calendly integration](https://mida.so/integration/calendly)).
- Default, Calendly and RevenueHero publish no show-rate data that could be traced. The "6.9% vs 24.5%" no-show figures attributed to Chili Piper could not be found in any Chili Piper publication.
- **Untraceable or misquoted:** (a) SmartBug's figures ("19% → 13% with a phone number", "18% → 15% with age") are attributed to HubSpot's analysis, but the HubSpot originals contain no numbers ([SmartBug](https://smartbugmedia.com/blog/landing-page-best-practices-how-many-form-fields)). (b) "Each extra field costs about 5%/11%" is attributed to Unbounce, but no Unbounce source was found. (c) "37% abandon forms that ask for a phone number" and Luke Wroblewski's "optional phone doubled conversion" appear only in secondary blogs ([ShortStack](https://www.shortstack.com/blog/6-ways-to-reduce-form-abandonment-infographic/), [Formkeep](https://blog.formkeep.com/designing-forms-that-convert/)). (d) The "Expedia removed one field and made $12M" anecdote could not be traced to a primary source. (e) Formstack publishes field-bottleneck tooling but no public benchmark on phone fields.

---

## 2. CTA design and copy: "Book a demo" vs alternatives, first-person copy, single vs multiple CTAs, sticky mobile CTA, nav CTA

### Takeaway
No public, significance-reported test compares "Book" with "Get", "Request" or "Schedule" a demo. What exists is descriptive (which labels top performers use) or anecdotal. The famous "first-person CTA +90%" result could not be traced to its original. The usual justification for one-CTA pages, choice overload, has a near-zero average effect in a meta-analysis. The defensible principles are weaker: put the main CTA where attention is, which NN/g's attention data supports, and make the label specific about what happens next.

### Cited Findings
- [B](V, descriptive) CTA labels used by RevenueHero's top-performing demo pages: "Book a Demo" 29%, "Get a Demo" 21%, "Schedule a Demo" 12%, "Request a Demo" 12%. This shows what high performers use, **not** a causal test. — [RevenueHero 2025 benchmark](https://revenuehero.io/2025-inbound-benchmark)
- [B](V, descriptive) Navattic scraped about 5,000 B2B websites: 29.2% more used a "Take a Tour" CTA in 2024 than in 2023. Its 2026 edition says 18% of B2B SaaS sites now include a "Take a Tour" variant. — [Navattic, State of the Interactive Product Demo 2025](https://navattic.com/report/state-of-the-interactive-product-demo-2025); [Navattic 2026 report](https://navattic.com/report/state-of-the-interactive-product-demo-2026)
- [C] Michael Aagaard / ContentVerve (Unbounce blog, 3 Sep 2012). Changing the verb "Order" to "Get" on a B2B office-rental portal: +38.26% conversions. Adding "Find gym" to "Get membership" on a gym PPC page: +68%. No sample sizes or significance are reported. — [Unbounce, How to write a call-to-action that converts](https://unbounce.com/conversion-rate-optimization/how-to-write-a-call-to-action/)
- [C](V) Navattic customer FORM ran two ABM PPC landing pages: cost per lead fell "nearly 50%" with "Take a Tour" compared with "Request a Demo". No sample or significance; vendor-published. — [Navattic, A/B testing examples from top B2B SaaS companies](https://www.navattic.com/blog/saas-ab-testing-examples)
- [D](V) RevenueHero says problem-specific CTAs ("See how we help reduce churn") beat a generic "Book a demo", and specific CTAs ("Start your 14-day trial") beat vague ones ("Let's chat"). No numbers are published. — [RevenueHero 1,000 CTA tests](https://revenuehero.io/blog/what-we-learned-from-1-000-b2b-website-cta-tests)
- [A](T: consumer choice experiments) Scheibehenne, Greifeneder & Todd (2010) meta-analysed 63 conditions from 50 experiments (N = 5,036). The mean choice-overload effect was "virtually zero", with high variance between studies; people with existing preferences were less affected. — [Scheibehenne et al. 2010, Journal of Consumer Research (PDF)](https://abcwest.cogs.indiana.edu/pmwiki/pdf/scheibehenne.options.2010.pdf); [RePEc record](https://ideas.repec.org/a/oup/jconrs/v37y2010i3p409-425.html)
- [B] NN/g (2018, 120 participants, 130,000+ fixations, 1920×1080 desktop): 57% of page-viewing time was above the fold and 74% within the first two screenfuls. NN/g recommends keeping major CTAs above the fold. — [NN/g, Scrolling and Attention](https://www.nngroup.com/articles/scrolling-and-attention/)
- [unknown grade, paywalled] GoodUI's "Sticky Call-to-Action" pattern (#41) is based on 29 logged A/B tests, mostly e-commerce and mobile; Thomasnet, Kenhub and a college (sjvc.edu, 1,437 visitors) are among the lead-gen ones. All results, and the meta-analysis effect and p-value, are paywalled, so they cannot be graded here. — [GoodUI Pattern #41](https://goodui.org/patterns/41)
- [C](T: e-commerce) A Convertica case study reports a sticky CTA raised mobile order completion by 252.9%, with no significant change on desktop. — [Convertica sticky CTA case study](https://convertica.org/ecommerce-case-study-sticky-cta/)

### Inferences
- "Book a demo" is the most common label among high-converting B2B demo pages ([B] descriptive), and it accurately describes what an embedded Calendly does. There is no evidence that "Get" or "Request" would do better. A more specific label, such as "Book a 30-minute demo" or "Pick a time", matches the D-grade "specificity" advice.
- Keep the primary CTA in the first screen. On phones that means near the top of the hero, and a sticky bottom bar is reasonable, though the evidence for it is e-commerce [C] or paywalled.
- Do not justify "one CTA only" with choice-overload research, which has a ~0 average effect. A secondary low-commitment CTA ("Watch the 2-minute tour") is not ruled out by the evidence. Test it if traffic allows.

### Gaps
- **First-person CTA ("Start my free trial" +90%):** no original write-up could be located. The Unbounce/Aagaard 2012 article does not contain it, and every other citation is a listicle or a tool page without a source ([KlientBoost frames it as "true or false?"](https://wp.klientboost.com/cro/call-to-action/)). Treat it as **untraced**.
- **"Landing pages with multiple offers get 266% fewer leads":** untraceable. It is attributed variously to CXL, Wishpond, TechJury and Unbounce, and a decrease above 100% is not possible as literally stated ([Colorlib roundup](https://colorlib.com/wp/landing-page-statistics/)).
- No evidence was found on nav-bar CTA buttons specifically, or on "Talk to sales" vs "Book a demo".
- **GoCardless "watch a demo now" vs "request a demo" (+114%):** surfaced in search but could not be found at any original source. Untraced.

---

## 3. Hero and video: explainer/autoplay video above the fold, video length, interactive demos

### Takeaway
The best large-sample evidence ([B], Unbounce, about 35,000 pages) finds that video on a landing page does **not** consistently raise conversion. It tends to lower it on click-through pages, on both mobile and desktop. The widely quoted "+80%/+86% with video" goes back to one old single-company case. If a video is used, keep it to 1–2 minutes: Wistia engagement drops past 5 minutes. Interactive demos look strong in vendor data, but 88% of their sessions are on desktop, which matters for a phone-heavy audience.

### Cited Findings
- [B] Unbounce (Floss Taylor, 26 Aug 2021) analysed about 35,000 Unbounce customer landing pages per time frame, three time frames from late 2020 to early 2021, with IQR outlier trimming and cohorts under 100 pages excluded. Results:
  - Form pages: "very little difference" between pages with and without video. Background video was "slightly better"; embedded video was not.
  - Click-through pages: the negative effect of video was "even more striking".
  - Device: video had a negative impact on both mobile and desktop.
  - Industry: real estate was strongly negative. Education and SaaS were not reported separately.
  — [Unbounce, Video on landing pages](https://unbounce.com/landing-page-optimization/video-on-landing-pages); [MarketingProfs summary](https://www.marketingprofs.com/charts/2021/45869/does-including-video-on-site-landing-pages-boost-conversions)
- [B] Wistia (article dated 1 Jul 2025, citing a State of Video dataset of 13M+ videos): videos under 1 minute average 52% engagement (product videos 50%, testimonials 46%). Engagement declines past 5 minutes. — [Wistia, Optimal video length](https://wistia.com/blog/optimal-video-length)
- [C] A null result: RezScore ran six homepage A/B tests, including two cuts of a product video (about 27,000 impressions per arm), and found no reliable lift. — [RezScore, six homepage A/B tests](https://blog.rezscore.com/dev/dev-six-homepage-ab-tests-almost-nothing-moved/)
- [C](V) Vidalytics reports +49% conversion from its own "Smart Autoplay" on a video sales page, judged by a Bayesian calculator at 98% probability to be best. A mobile-autoplay variant with pausing disabled *lost*. — [Vidalytics case study](https://www.vidalytics.com/case-studies/autoplay-increases-conversions-split-test)
- [B](V) Navattic State of the Interactive Product Demo 2025 (28,000+ demos built in 2024, a survey of 280 users, and a scrape of about 5,000 sites):

  | Navattic metric | Top 1% | Top 10% | Top 25% |
  |---|---|---|---|
  | Engagement (past step 1) | 84.4% | 70.6% | 50.1% |
  | Completion | 61.6% | 43.5% | 28.9% |
  | CTR (external CTA click) | 54.0% | 28.4% | 12.8% |

  - About 70% of top-1% demos are ungated; ungated demos get 10% higher engagement.
  - 5–12 steps is the most common length.
  - **88% of demo sessions are on desktop.** Desktop CTR is 52% higher than mobile, and desktop users view 35% more steps.
  - There is no standard viewer-to-demo-request rate. Pipeline claims come from surveys and testimonials.

  — [Navattic 2025 report](https://navattic.com/report/state-of-the-interactive-product-demo-2025)
- [B](V) Arcade 2025 benchmarks: 37,000 Arcades across 9,000+ teams. Median in-demo CTR is 8%, the top 25% reach 25% and the top 1% reach 67%. A separate figure gives a 23% average CTR across 20k+ published Arcades (2024). — [Arcade, Top 1% interactive demo benchmarks](https://arcade.software/post/interactive-demo-benchmarks); [Arcade interactive demo statistics](https://www.arcade.software/post/interactive-demo-statistics)
- [C](V) Trainual reports +450% free-trial sign-ups after adding an interactive demo and product videos, measured over "a few weeks" with no controls. — [Navattic A/B testing examples](https://www.navattic.com/blog/saas-ab-testing-examples)

### Inferences
- No B-grade evidence supports an autoplay hero video as a conversion driver, and the largest dataset leans negative. A safer choice is a static or lightly animated product hero that does not delay LCP, with a click-to-play short video (≤2 min) placed below or beside the main CTA. SchoolMule's existing 101-second demo film already fits Wistia's short-video band. Its placement and autoplay setting should be A/B tested rather than assumed.
- Interactive-demo CTRs are measured *inside* the demo, not visit-to-booking, and the sessions are overwhelmingly desktop. For principals browsing on phones, an interactive tour is a secondary asset at most.

### Gaps
- **"Video on a landing page increases conversion by 80%" (or 86%):** traced to EyeView Digital, reportedly a single learning-management-system case; the original study could not be found. Unbounce's own research contradicts it ([Martech.zone](https://martech.zone/landing-page-conversion-rates/), [Tech.co](https://tech.co/news/much-impact-videos-landing-page-conversion-rates-2015-10)). Do not cite.
- The full 2025 Vidyard benchmark could not be retrieved, and no Vidyard landing-page conversion data was found.
- No randomized B2B test of autoplay-muted hero video vs static hero was found.
- Storylane does not appear to publish a benchmark report.
- **"Only 0.9% watched the homepage video" (HubSpot Academy):** appeared in a search summary only. Unverified.

---

## 4. Social proof: testimonials, logos, numbers, case studies; what to use when a company has little social proof yet

### Takeaway
Social proof is near-universal on top-performing B2B demo pages: 76% show logos, 57% written testimonials ([B], descriptive). Controlled B2B tests of logos and testimonials exist on GoodUI but are paywalled and underpowered. Lab psychology ([A], transfer) supports real human faces and concrete imagery as trust cues, and NN/g eyetracking shows generic stock people are ignored. The data also suggests that review profiles which look too perfect lower credibility (Spiegel, CPG transfer). For an early-stage company, the evidence-backed substitutes are real photos of real people (founder, actual users), specific verifiable detail, and peer or educator voices, which K-12 buyers say they trust most.

### Cited Findings
- [B](V, descriptive) On top-performing RevenueHero demo pages: customer logos 76%, written testimonials 57%, G2/Capterra badges 36%. This is correlational. — [RevenueHero 2025 benchmark](https://revenuehero.io/2025-inbound-benchmark)
- [B] HockeyStack (31M+ visitors, 80 B2B SaaS companies): visitors who read case studies before submitting were 18% more likely to become an opportunity. Non-bouncing case-study readers were 8% *less* likely to submit the demo form, which is a likely selection effect. — [HockeyStack Labs, State of pricing, demo & case study pages](https://hockeystack.com/lab-blog-posts/state-of-pricing-demo-case-study-pages)
- [C] 37signals Highrise (Aug 2011): the shorter "Person Page" with a big photo of a smiling customer produced 47% more *paid* sign-ups than the "Long Form" page. Which person was pictured "didn't quite matter". No sample or significance reported. — [Signal v. Noise, Behind the scenes: A/B testing part 3](https://signalvnoise.com/posts/2991-behind-the-scenes-ab-testing-part-3-final)
- [A](T: lab) Newman, Garry, Bernstein, Kantner & Lindsay (2012, *Psychonomic Bulletin & Review*, 4 experiments): non-probative photos increased the likelihood that people judged a claim true. The effect was a general "truth bias", and Fenn et al. 2013 found it persisted. — [ANU research portal: Nonprobative photographs (or words) inflate truthiness](https://researchportalplus.anu.edu.au/en/publications/nonprobative-photographs-or-words-inflate-truthiness/); [Full text PDF](https://www.lifespancognition.com/s/newman-etal-truthiness-pbr12-fulltext.pdf)
- [A](T: lab, e-commerce sites) Cyr, Head, Larios & Pan (2009, *MIS Quarterly* 33(3), Best MISQ paper 2009) ran a controlled experiment plus eyetracking with three conditions: faces, human images without faces, and no humans. Human images with faces raised image appeal and perceived social presence, which in turn raised trust. There was **no direct** image-to-trust path. Effects differed across Canada, Germany and Japan. — [AIS eLibrary, MISQ 33(3)](https://aisel.aisnet.org/misq/vol33/iss3/8); [Penn State record](https://pure.psu.edu/en/publications/exploring-human-images-in-website-design-a-multi-method-approach/)
- [B](lab eyetracking; sample not reported) NN/g (2010): users "ignore stock photos of generic people" but attend to real people. On FreshBooks' staff page, users spent 10% more time on portraits than on bios even though the bios took 316% more space. — [NN/g, Photos as Web Content](https://www.nngroup.com/articles/photos-as-web-content/)
- [B](T: consumer packaged goods) Spiegel Research Center with PowerReviews: purchase likelihood peaks at 4.2–4.5 average stars and falls as ratings approach 5.0, which the authors attribute to "too good to be true". — [Spiegel Research Center PDF](https://spiegel.medill.northwestern.edu/wp-content/uploads/sites/2/2021/04/Spiegel-research-reveals-4.5-stars-are-better-than-5-The-Medill-IMC-Spiegel-Research-Center.pdf)
- [B] Education buyers: in a survey of 2,277 US education decision-makers (Tech & Learning/SmartBrief, Aug 2026), the most trusted discovery channels were teachers and peers (72%), education publications (69%) and vendor outreach (56%). District case studies were rated "most helpful" by 52%, and 71% prefer peer-led webinars. — [Tech & Learning, The State of School Purchasing Report 2026](https://www.techlearning.com/business/the-state-of-school-purchasing-report-2026)
- [B] TrustRadius 2026 (1,862 buyers, 444 vendors, Jan 2026; via secondary summary): 74% of buyers use reviews to inform purchases. — [MarketScale summary of TrustRadius 2026](https://www.marketscale.com/industries/software-and-technology/94-of-b2b-buyers-fact-check-ai-research-and-peer-reviews-still-close-the-deal)
- [unknown grade, paywalled] GoodUI "Company Logos" pattern (#117): 5 tests, including Kenhub university logos (36,420 visitors) and Expert Institute (5,706 visitors). Results are paywalled, and the pattern is at only "32.2% of 90% power target", so it is underpowered. — [GoodUI Pattern #117](https://goodui.org/patterns/117)

### Inferences
- With one or two real schools (e.g., Al Haadi), a single specific, attributed testimonial is likely worth more than a generic logo wall. Give it a real name, role, school and photo, plus a concrete outcome. This combines the Cyr, Newman and NN/g findings that faces and specificity help with Spiegel's finding that "too perfect" hurts. A logo strip of one or two logos may read as thin. That is an untested inference.
- A founder photo with a short "who builds this" note uses the "real people, not stock" finding. Never use stock photos of "principals".
- Educator buyers trust peers most ([B]). A short quote or clip from an actual principal or teacher, or a "built with teachers at X" line, fits that channel.

### Gaps
- No public, significance-reported B2B test isolates testimonials with photo, name and role against anonymous ones.
- No evidence was found on how *small* customer counts (1–3 logos) are perceived.
- No B2B test of guarantees was found. Evidence on fake or generic testimonials is indirect: Spiegel's CPG data, plus NN/g on stock photos.
- **"Highrise +102.5%"**, repeated in CRO roundups (e.g., [Neil Patel](https://neilpatel.com/blog/100-conversion-optimization-case-studies/)), is not in the 37signals original, which reports +47% paid sign-ups. This is a listicle misquote.

---

## 5. Pricing transparency: does showing price raise or lower demo requests and lead quality?

### Takeaway
Buyers overwhelmingly say they want pricing on the website. That holds in B2B tech generally (TrustRadius: top wish-list item four years running; 81% want to find pricing themselves) and in K-12 specifically ("Contacting a vendor for a mysterious quote is a waste of time"). The one large observational B2B dataset (HockeyStack) finds that hiding pricing produces *more* pricing-page form fills but a *lower* rate of those leads becoming pipeline (10.3% vs 17.5%). No randomized test was found.

### Cited Findings
- [B] HockeyStack Labs (31M+ visitors, 80 B2B SaaS companies with both pricing and demo pages; $5M–$1B ARR; data windows from 1 to 18 months, uneven; not a controlled experiment):
  - Pricing-page conversion: 2.8% with transparent pricing vs 4.6% without.
  - Submission-to-pipeline: 17.50% with transparent pricing vs 10.31% without (1.7×).
  - Demo-form effect: stated as "9.5%" but described inconsistently, as both more and less likely.
  - Transparent-pricing sites: pages per session 4.26 vs 2.57; time on site 3:25 vs 2:31.
  - Pricing pages draw about 13× the unique visitors of demo pages.
  — [HockeyStack Labs](https://hockeystack.com/lab-blog-posts/state-of-pricing-demo-case-study-pages)
- [B] TrustRadius 2026 report (1,862 buyers, Jan 2026): transparent pricing has been buyers' top wish-list item from vendors in every year it has been tracked (2023–2026). Reported via secondary summary. — [MarketScale summary](https://www.marketscale.com/industries/software-and-technology/94-of-b2b-buyers-fact-check-ai-research-and-peer-reviews-still-close-the-deal)
- [B] TrustRadius (2022): "81% of buyers want to find pricing information on their own". Unsatisfied buyers "bounce", remove products from their shortlist and form bad relationships with the brand. The page returned 403 on fetch, so the figure comes from the search-index snippet. — [TrustRadius, Tech buyers demand honest and up-front pricing info](https://www.trustradius.com/blog/tech-buyers-demand-honest-and-up-front-pricing-info)
- [C/D] EdWeek Research Center open-ended survey of "a couple hundred" K-12 leaders (Feb 2025). Leaders asked for "an online catalog/ordering process so we can easily get quotes", said "Contacting a vendor for a mysterious quote is a waste of time", and asked vendors to "Be clear in promises, pricing, and timelines." The responses are qualitative quotes. — [EdWeek, The WirED Marketer (25 Feb 2025)](https://www.edweek.org/advertise/the-wired-marketer-advice-from-k-12-leaders-to-vendors-they-dont-mince-words-2-25-25/2025/03)
- [B] Tech & Learning 2026 (n = 2,277 education decision-makers): "Subscription costs" is the top deal-breaker, cited by 63%. — [Tech & Learning State of School Purchasing 2026](https://www.techlearning.com/business/the-state-of-school-purchasing-report-2026)
- [B] G2 2025 Buyer Behavior Report (1,169 B2B decision-makers, Apr 2025): 39% prefer pay-as-you-go pricing, and two-thirds prefer to contact sales only after researching on their own. — [G2 2025 Buyer Behavior Report](https://learn.g2.com/2025-g2-buyer-behavior-report); [G2 press release via Silicon UK](https://www.silicon.co.uk/press-release/g2-report-ai-now-means-always-included-disrupting-all-stages-of-the-b2b-software-buying-journey)
- [C] A single operator removed its pricing page for 30 days and reported worse demo-sourced deals and about a 22% revenue decline. Anecdotal. — [Happierleads newsletter](https://happierleads.com/newsletter/i-deleted-our-pricing-page-for-30-days)

### Inferences
- For price-sensitive, budget-constrained private schools (cost is the top deal-breaker at 63%), showing at least a starting price or a per-student price range is likely to filter out poor-fit demos and raise the share of booked demos that become customers. Raw demo volume may fall. The HockeyStack direction is observational and uncontrolled.
- Measure demo-to-customer rate, not just bookings, if testing pricing visibility.

### Gaps
- No randomized B2B test of showing vs hiding pricing was found.
- The Capterra and Software Advice SMB surveys on vendor-website pricing could not be located. Only Capterra methodology pages surfaced.
- The TrustRadius 2026 headline is known only via a secondary summary.

---

## 6. Trust signals: security badges, privacy statements, guarantees

### Takeaway
Nearly all controlled evidence on trust badges comes from e-commerce checkout. It shows that familiar brands are trusted most and that badges matter at the point of payment or data entry. One [A]-grade nonprofit test found that a privacy reassurance under a sign-up form *raised* conversion by roughly 50% relative. K-12 leaders increasingly scrutinize vendors' cybersecurity, which makes a visible student-data and privacy commitment relevant for a school SIS.

### Cited Findings
- [A](T: nonprofit email sign-up) NextAfter Experiment #4354 (Harvest Ministries, Jun 2016). The privacy line "We take privacy seriously and hate spam, so we'll carefully protect your e-mail address" under the form converted 27.1% with the statement vs 18.1% without. Removing it was −33.3%. n = 682, 99.1% confidence. — [NextAfter, How the presence of a privacy statement affects email acquisition](https://www.nextafter.com/?p=12850)
- [B](T: e-commerce) CXL Institute trust-seal research. Part 1, a preference survey: familiar seals (Visa, Mastercard, PayPal, Norton, Google) are trusted most. Part 2: eyetracking with 340 participants on a checkout page found PayPal drew the most attention and McAfee performed worst; Google, Norton and PayPal were most often recalled as adding security. — [CXL, Which site seals create the most trust?](https://cxl.com/research-study/trust-seals/); [CXL, Checkout optimization: how do trust seals affect security perception?](https://cxl.com/research-study/checkout-optimization/)
- [B] EdWeek Research Center (310 school leaders, Jan–Feb 2025; via GovTech): 74% expect the information they collect about vendors' cybersecurity protections to increase. Reported via secondary article. — [GovTech, K-12 leaders to scrutinize ed tech vendor security practices](https://www.govtech.com/education/k-12/k-12-leaders-to-scrutinize-ed-tech-vendor-security-practices)

### Inferences
- A short, specific privacy line next to the booking widget is low-cost and has [A]-grade transfer support. Something like "Your details go only to [founder name]. No mailing list" would fit.
- For a school SIS, a plain-language student-data/privacy page and a statement of where data is hosted, including any Canadian residency, is more relevant than generic "secure" badges. B2B badge evidence is absent; e-commerce evidence says only familiar marks carry weight. This is an inference.

### Gaps
- No B2B or SaaS controlled evidence was found on security badges (SOC 2, ISO) affecting demo conversion.
- No evidence was found on guarantees in B2B SaaS.
- A claimed ContentVerve test in which "100% privacy, we will never spam you" *decreased* sign-ups could not be located, so it is untraced. The one traceable test found (NextAfter) points the opposite way.

---

## 7. Page speed and mobile

### Takeaway
Evidence that speed affects lead conversion is unusually strong for this field. Portent ([B], B2B lead-gen) and Vodafone ([A]-ish split test, telecom) point the same way, and Deloitte/Google and Akamai ([B], mostly e-commerce) add support. Mobile is most of the traffic for SaaS and education landing pages (about 79–85%). Mobile converts close to desktop for SaaS but below it for education, and interactive demos are used overwhelmingly on desktop.

### Cited Findings
- [B] Portent (Apr 2022): just over 100M page views across 20 sites, 14 of them B2B lead generation; load speeds from 5.6M sessions. For B2B lead-gen pages:
  - Average conversion rate was almost 40% at 1 s, 34% at 2 s and 29% at 3 s.
  - A 1 s page converted 3× a 5 s page and 5× a 10 s page.

  Caveats: no load metric defined (FCP/LCP), no significance testing, only 20 sites, and an arithmetic error in the e-commerce example. — [Portent, Site speed is (still) impacting your conversion rate](https://www.portent.com/blog/analytics/research-site-speed-hurting-everyone.htm)
- [A](T: telecom e-commerce; split test with about 100K clicks/day per arm, no p-value reported) Vodafone (web.dev, Mar 2021) split traffic between visually identical pages. A 31% better LCP gave +8% sales, +15% lead-to-visit rate and +11% cart-to-visit rate. — [web.dev, Vodafone case study](https://web.dev/case-studies/vodafone)
- [B](T: mostly retail/travel; Google-commissioned) Deloitte "Milliseconds Make Millions" analysed four weeks of mobile data across retail, travel, luxury and lead-gen brands in Europe and the US. A 0.1 s mobile speed gain was associated with +8.4% retail conversions and +10.1% travel conversions, and an 8.3% bounce-rate improvement on lead-gen information pages. The study is observational, and the gain required 0.1 s improvement on four metrics across every page of the journey. — [web.dev, Milliseconds make millions](https://web.dev/case-studies/milliseconds-make-millions); [Deloitte Ireland report page](https://deloitte.com/ie/en/services/consulting/research/milliseconds-make-millions.html)
- [B](T: e-commerce) Akamai/SOASTA (Apr 2017, about 10 billion retail visits): a 100 ms delay "can hurt conversion rates by 7 percent", and a 2 s delay increased bounce by 103%. Device breakdowns differ in secondary coverage. — [Akamai press release](https://www.akamai.com/fr/newsroom/press-release/akamai-releases-spring-2017-state-of-online-retail-performance-report)
- [B](T: modelled) Google/SOASTA (2017) used a neural-net model. As mobile load goes from 1 s to 7 s, bounce probability rises 113%; from 1 s to 10 s, it rises 123%. — [AMP blog, New industry benchmarks for mobile page speed](https://blog.amp.dev/2017/02/28/new-industry-benchmarks-for-mobile-page-speed/); [Think with Google PDF](https://thinkwithgoogle.com/_qs/documents/57/mobile-page-speed-new-industry-benchmarks.pdf)
- [B] Unbounce 2024 Conversion Benchmark Report (57M+ conversions; data Jul 2023–Jul 2024):
  - SaaS: mobile converts 6.4% vs desktop 6.2%, and mobile is 79% of visits.
  - Education: mobile 10.2% vs desktop 12% (desktop 17.6% better), with mobile about 85% of traffic. These device figures do not reconcile with the 8.4% education median; the page does not explain the basis.
  - All industries: mobile drives nearly 5× desktop traffic but converts at a lower rate.
  — [Unbounce SaaS benchmarks](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/); [Unbounce Education benchmarks](https://unbounce.com/conversion-benchmark-report/education-conversion-rate/); [Unbounce 2024 press release](https://www.newswire.ca/news-releases/unbounce-s-2024-conversion-benchmark-report-proves-that-attention-spans-are-declining-and-so-are-conversion-rates-831617439.html)
- [B](V) Navattic: 88% of interactive-demo sessions are on desktop, and desktop CTR is 52% higher than mobile. — [Navattic 2025 report](https://navattic.com/report/state-of-the-interactive-product-demo-2025)

### Inferences
- Treat page speed as a conversion feature: target LCP under about 2.5 s on mid-range phones. The heaviest assets on schoolmule.ca are likely the hero demo video and the Calendly iframe. Lazy-load the Calendly embed until it nears the viewport, or load it on click, and don't autoplay a large video above the fold on mobile. This follows from the speed data plus the null/negative video data.
- Because most traffic is mobile and the education vertical shows a desktop advantage, the Calendly flow must be checked end-to-end on a phone. Pages should be designed mobile-first, which Unbounce recommends in both the SaaS and education pages.

### Gaps
- No B2B-specific Core Web Vitals → demo-booking study was found. The Vodafone result is e-commerce/lead and Portent's is lead-gen, but undated by metric.
- **"Bounce probability +32% as load goes from 1 s to 3 s"** is widely attributed to Google/SOASTA 2017 but does not appear in Google's own published benchmark pages, which give only 113% and 123%. Untraced.

---

## 8. Page length, structure, scanning, above-the-fold attention

### Takeaway
Attention concentrates at the top: 57% of viewing time is above the fold and 74% within two screens (NN/g 2018, desktop). Reading is F-shaped when text is unformatted. Short, plain-language copy is strongly associated with higher conversion in Unbounce's data: SaaS pages convert best at 250–725 words and 5th–7th-grade reading level, and education's median target is 363 words. Long-vs-short single-company tests point both ways, so "short and scannable, with depth below" is the defensible synthesis.

### Cited Findings
- [B] NN/g "Scrolling and Attention" (Fessenden, Apr 2018; 120 participants, 130,000+ fixations, 1920×1080):
  - 57% of viewing time above the fold, down from 80% in 2010.
  - 74% in the first two screenfuls; 81% in three.
  - More than 65% of above-fold time is in the top half of the viewport.
  - Recommendations: high-priority content and major CTAs at the top; avoid "false floors".

  Mobile was not separately reported. — [NN/g, Scrolling and Attention](https://www.nngroup.com/articles/scrolling-and-attention/)
- [B] NN/g F-pattern: found in 2006 and re-validated in 2017 (47 participants, desktop and mobile). It is the default pattern for unformatted text. Recommendations: front-load the key points, use informative headings that start with the key words, bold key phrases, and use bullets. — [NN/g, F-Shaped Pattern of Reading on the Web](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/)
- [B] Unbounce 2024, SaaS: copy at a 5th–7th grade reading level converts at 12.9% vs 2.1% for professional-level copy. Pages with 250–725 words convert best (median 3.8%). The best pages use 50–140 "difficult" (3+ syllable) words. — [Unbounce SaaS benchmarks](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)
- [B] Unbounce 2024, Education: copy at 12th-grade level or lower converts "54% to over 2× better" than college/professional level. The median target word count is 363, the lowest of any industry, with no more than about 116 difficult words. — [Unbounce Education benchmarks](https://unbounce.com/conversion-benchmark-report/education-conversion-rate/)
- [B] Unbounce 2024, all industries: 5th–7th grade copy converts at 11.1% vs 7.1% for 8th–9th grade (56% better). — [Unbounce SaaS page / 2024 report](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)
- [C] 37signals (2011): the short "Person Page" beat the long-form page by 47% paid sign-ups, and adding more information to the bottom of the Person Page made it perform 22% worse. — [Signal v. Noise](https://signalvnoise.com/posts/2991-behind-the-scenes-ab-testing-part-3-final)
- [C] Groove: a longer page explaining benefits, with a real customer testimonial, converted at 4.7% vs 2.3% for the short playful original. — [Navattic A/B testing examples, citing Taplytics](https://www.navattic.com/blog/saas-ab-testing-examples)
- [C] Conversion Rate Experts reports growing Crazy Egg's conversion rate by 363% through a long series of changes, including a much longer homepage. The changes were not isolated. — [Conversion Rate Experts, Crazy Egg case study](https://conversion-rate-experts.com/crazy-egg-case-study/)

### Inferences
- Put the value proposition, the proof point and the "Book a demo" CTA in the first mobile screen. Write at about grade 6–8, and keep the core page in the low hundreds of words, with detail in expandable or secondary sections. This combines NN/g with Unbounce SaaS and education data.
- Use scannable headings that begin with the payoff word. Principals skim (F-pattern).

### Gaps
- Unbounce's word-count and reading-level findings are correlational. The full report is gated, so the methodology of the sub-analyses is not visible.
- No mobile-specific above-the-fold attention data from NN/g could be confirmed; secondary sources disagree on whether 57% applies to mobile.
- The commonly cited CRE/Crazy Egg "long page +30%" figure could not be confirmed. Sources give 13%, 64% and 363% for different changes.

---

## 9. Persona, role or industry-specific landing pages; personalization

### Takeaway
All available evidence on persona or segment pages is vendor-reported, with large lifts (+105% to +260%, "5×") and no samples or significance. HubSpot's "personalized CTAs perform 202% better" is observational and its original could not be located. The concept is plausible but has no [A]/[B] support in B2B.

### Cited Findings
- [C](V) Mutiny results, published by Clearbit: persona targeting +105% conversion, company-size targeting +260%, customer-status targeting +127%. No samples, durations or significance. — [Clearbit, Website personalization strategies](https://clearbit.com/resources/books/drive-website-conversions/personalization-strategies-Livestorm-Dropbox-DocSend)
- [C](V) Progress Sitefinity: an industry-personalized case-studies page produced about 5× more conversions from targeted healthcare and financial-services segments. Self-reported. — [Progress blog](https://progress.com/blogs/engage-and-convert-your-most-valuable-visitors-from-the-first-click-by-personalizing-landing-pages)
- [B?](secondary only) HubSpot is said to have analysed 330,000+ CTAs over six months, finding personalized "smart" CTAs had a 202% higher view-to-submission rate than default CTAs. The comparison is observational, not randomized, and the original HubSpot post was not located in this research. — [MarketTailor discussion](https://markettailor.io/blog/personalized-ctas-data-driven)
- [B] Unbounce 2024 Education: median conversion differs strongly by channel (email 14.1%, paid search 7.3%, paid social 5.1%). This shows that traffic intent and targeting shape conversion, but channel is confounded with audience. — [Unbounce Education benchmarks](https://unbounce.com/conversion-benchmark-report/education-conversion-rate/)

### Inferences
- For SchoolMule, "persona" pages probably matter less than message match to the single audience: private-school principals. The more defensible move is matching the landing page to the specific outreach, for example linking cold emails to a page that echoes the email's school type or pain point. This rests on D-grade and vendor C-grade evidence only.

### Gaps
- No randomized B2B test of role- or industry-specific pages vs a generic page with reported samples was found.
- The original HubSpot 202% source was not found.

---

## 10. B2B buyer behaviour: self-directed research, stakeholders, rep-free preference, what buyers want from vendor sites

### Takeaway
Buyers do most of their evaluation before talking to a vendor. In 6sense 2025, first contact comes 61% of the way through the journey and 79% of first contacts are initiated by the buyer. In Gartner 2025, 61% prefer a rep-free experience overall but still want seller input on fit. The winning vendor is usually already on the day-one shortlist (95%). The website therefore has to answer fit, price and proof questions on its own, and stay consistent with what sales later says. Gartner found 69% of buyers saw inconsistencies between vendor websites and sellers. Most of these surveys skew enterprise; 6sense's minimum purchase was $25K.

### Cited Findings
- [B] Gartner sales survey (632 B2B buyers, Aug–Sep 2024; published 25 Jun 2025):
  - 61% prefer an overall rep-free buying experience, but buyers still want seller input for tasks such as judging fit.
  - 73% avoid suppliers who send irrelevant outreach.
  - 69% saw inconsistencies between a supplier's website and what its sellers said.
  — [Gartner press release, 61% of B2B buyers prefer a rep-free buying experience](https://gartner.com/en/newsroom/press-releases/2025-06-25-gartner-sales-survey-finds-61-percent-of-b2b-buyers-prefer-a-rep-free-buying-experience)
- [B] 6sense 2025 B2B Buyer Experience Report (about 4,000 respondents plus a 766-response companion; minimum purchase $25K; median purchase $200–300K):
  - First contact at 61% of the journey (69% in 2023–24); 79% of first contacts are buyer-initiated.
  - The winner was on the day-one shortlist 95% of the time; the winner was the first vendor contacted 77% of the time.
  - 5.1 vendors evaluated; cycle length 10.1 months.
  — [6sense 2025 Buyer Experience Report](https://6sense.com/report/buyer-experience/); [CustomerThink summary](https://customerthink.com/research-round-up-6sense-study-provides-critical-insights-on-b2b-buyer-behavior/)
- [B] G2 2025 Buyer Behavior Report (1,169 decision-makers, Apr 2025): two-thirds of buyers prefer to contact sales only after their own research. SaaStr's summary adds that "62% don't want to talk to sales until evaluation/decision stage"; that figure is secondary and not found on G2's pages. — [G2 2025 report page](https://learn.g2.com/2025-g2-buyer-behavior-report); [SaaStr summary](https://www.saastr.com/%F0%9F%9A%80-top-5-saastr-learnings-from-g2s-2025-buyer-behavior-report-you-gotta-be-ai/)
- [B](pre-2020; secondary only) Gartner's older buying-journey research: buyers spend about 17% of buying time meeting potential suppliers (about 5–6% with any one rep when comparing several) and about 27% researching independently online. These are widely quoted, but no primary Gartner document was retrieved. — [iStart (2018) summarising Gartner](https://istart.com.au/news-items/right-info-right-channel-happy-b2b-customer/); [Growth Method summary](https://www.growthmethod.com/gartner-b2b-buying-journey/)
- [B] Buying-group size: 6sense says the buying group "hasn't grown", with prior years averaging 10+ members in an enterprise sample. "6–10 decision-makers" is attributed to Gartner via secondary sources only. — [6sense 2025](https://6sense.com/report/buyer-experience/); [Foleon (secondary)](https://www.foleon.com/blog/b2b-buyer-process)
- [B] Tech & Learning 2026 (education, n = 2,277): influence by role is building-level administrators 61%, instructional staff 59%, instructional directors 54%, tech directors 52%, superintendents 46%, school board members 24%, parents 15%. 67% evaluate continuously through the year; 54% make final decisions on a rolling basis, while 33% prefer the spring/summer window. — [Tech & Learning State of School Purchasing 2026](https://www.techlearning.com/business/the-state-of-school-purchasing-report-2026)

### Inferences
- Principals will arrive having already compared options, often on a phone. The page must answer "is this for a school like mine, what does it cost, who else uses it, and is student data safe" without a call. The demo booking is then a confirmation step rather than a discovery step.
- Building-level administrators are the most influential role (61%) and decisions happen year-round. A principal-first page with always-open booking matches that. Small private schools likely have a much smaller buying group (principal plus owner or board) than enterprise surveys describe; this is inference, since no data on small private schools was found.

### Gaps
- No buyer-behaviour survey specific to small or independent private schools was found. Gartner, 6sense and G2 skew to enterprise or mid-market tech purchases.
- The primary Gartner documents for 17%/27% were not retrieved.

---

## 11. Education-sector specifics

### Takeaway
Unbounce's education median landing-page conversion rate is 8.4% (2024), but "primary education and tutoring" pages convert at only 4.9% and SaaS pages at 3.8%. These are the closest comparators for schoolmule.ca: a B2B SaaS selling to primary/secondary schools. Education traffic is about 85% mobile, and education pages convert best with short (about 363 words), plain copy. K-12 leaders ask vendors for transparent pricing and trust peers most.

### Cited Findings
- [B] Unbounce 2024 Education benchmarks (part of 57M+ conversions; data Jul 2023–Jul 2024):
  - Medians: education overall 8.4% (all-industry 6.6%); online courses 18.3%; general courses 13%; higher education 6.3%; primary education and tutoring 4.9%.
  - By channel: email 14.1%, paid search 7.3%, paid social 5.1%.
  - Mobile about 85% of traffic, with desktop converting 17.6% better.
  - Median target word count 363.
  — [Unbounce Education benchmarks](https://unbounce.com/conversion-benchmark-report/education-conversion-rate/)
- [B] An older Unbounce education page cites a 4.5% median, from a different report year. Do not mix the two. — [Unbounce industry page: Education](https://unbounce.com/industry/education/)
- [B] Unbounce 2024 SaaS benchmarks: 3.8% median; email 16.9%; Google search ads 5.1%. — [Unbounce SaaS benchmarks](https://unbounce.com/conversion-benchmark-report/saas-conversion-rate/)
- [C/D] EdWeek Research Center qualitative survey (Feb 2025) asking K-12 leaders for advice to vendors: transparent pricing and online quotes; "Contacting a vendor for a mysterious quote is a waste of time"; relationships and customer service. — [EdWeek WirED Marketer](https://www.edweek.org/advertise/the-wired-marketer-advice-from-k-12-leaders-to-vendors-they-dont-mince-words-2-25-25/2025/03)
- [B] Tech & Learning 2026 (n = 2,277): peers are the most trusted channel (72%); district case studies are helpful (52%); subscription cost is the top deal-breaker (63%). — [Tech & Learning 2026](https://www.techlearning.com/business/the-state-of-school-purchasing-report-2026)
- [B] EdWeek Research Center (310 school leaders, early 2025; via GovTech): 74% expect vendor cybersecurity scrutiny to increase. — [GovTech](https://www.govtech.com/education/k-12/k-12-leaders-to-scrutinize-ed-tech-vendor-security-practices)

### Inferences
- A realistic visit-to-demo benchmark for schoolmule.ca is roughly 3.8–4.9%, using Unbounce's SaaS and primary-education medians as comparators. The site's traffic is mostly direct, outreach and email rather than paid, and email-sourced visits convert far higher (14–17% medians). The landing page linked from cold emails is therefore the highest-leverage surface. This is inference.
- Most evidence describes US public districts. Canadian independent schools of 30–200 students are a transfer, with fewer buyers and faster decisions likely but unmeasured.

### Gaps
- EdWeek Market Brief's survey on where district decision-makers get product information is paywalled ([EdWeek Market Brief](https://marketbrief.edweek.org/exclusive-data/conference/)). No data was found on how K-12 or private-school buyers use vendor websites specifically.
- No conversion benchmark exists for B2B SaaS selling *to* schools, as opposed to education landing pages generally, many of which are B2C course sign-ups.
