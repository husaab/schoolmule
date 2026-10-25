# Dossier synthesis: what SchoolMule's own prospect research says about the buyer

Scope and method. This covers the whole local sales knowledge base, not ~60 dossiers. There are **316 unique school dossiers** (194 in `dossiers-sent/`, 58 in `dossiers/` (ready), 50 in `dossiers-parked/`, 14 in `dossiers-disqualified/`). There are also **50 follow-up drafts**, which are re-engagement emails for schools already in `dossiers-sent/`, not new schools. On top of that, `leads.csv` has **336 rows**, 20 of which have no dossier. Fields were pulled with scripts (header lines, "Fit signals", "Pain / hook", "Research trail") and then checked by reading every Pain/hook block. The analysis set is **315 schools**: the MAC national "network HQ" pitch is left out because it isn't a school. Counts that come from keyword matching are approximate (±a few) and are labelled as such. Every path below is relative to this notes file. No personal emails, phone numbers, staff names or student details are reproduced.

Source shorthand used in links: `S` = `../../../../../sales/`.

---

## 1. Counts and distributions (type, size, grades, region, French, fit score, status)

### Takeaway
The pipeline is mostly **Islamic (115) and Montessori (104)**, with 73 secular private schools and a long faith-based tail. It is **56% GTA**, and the schools are small: where enrollment is known, the median is about 130 and 77% fall in 30–200. Almost all of them (83%) run early years (JK/SK or Casa). Enrollment is unknown for 45% of schools, and most known figures are estimates.

### Cited Findings

**Universe and status**
- `leads.csv`: 336 rows. Types are Islamic 136 (+1 "Islamic (network)"), Montessori 103, Private 90 and Waldorf 6. Statuses are **contacted 194, ready 58, enriched/parked 52, disqualified 32**. No row is `replied`, `demo`, `won` or `lost`. — [leads.csv](../../../../../sales/leads/leads.csv)
- Emails were sent between 2026-07-05 and 2026-09-26 (136 in July, 55 in August, 3 in September). By type: 114 Islamic, 60 Montessori, 19 Private, plus the MAC HQ pitch. Follow-up #1 was emailed to 17 schools on 2026-09-26, and another 33 follow-ups were drafted but not sent. — [leads.csv](../../../../../sales/leads/leads.csv); [dossiers-followup-sent/](../../../../../sales/dossiers-followup-sent/); [dossiers-followup/](../../../../../sales/dossiers-followup/)
- The 58 "ready" (drafted, unsent) leads are 39 Montessori, 18 Private and 1 Waldorf, almost all drafted 2026-09-26 during the non-GTA Ontario sweep. — [leads.csv](../../../../../sales/leads/leads.csv)

**School type (315 dossiers, re-classified from each dossier's Type line and body)**

| Segment | Ready | Contacted | Parked | DQ | Total |
|---|---|---|---|---|---|
| Islamic | 0 | 113 | 0 | 2 | **115** |
| Montessori | 39 | 60 | 2 | 3 | **104** |
| Other private (secular) | 14 | 20 | 30 | 9 | **73** |
| Christian (incl. classical Christian, Christian-Montessori prep) | 2 | 0 | 8 | 0 | **10** |
| Waldorf | 1 | 0 | 5 | 0 | **6** |
| Acton microschool | 0 | 0 | 3 | 0 | **3** |
| Catholic | 0 | 0 | 2 | 0 | **2** |
| Jewish | 1 | 0 | 0 | 0 | **1** |
| Baha'i-inspired | 1 | 0 | 0 | 0 | **1** |

— computed from [dossiers/](../../../../../sales/dossiers/), [dossiers-sent/](../../../../../sales/dossiers-sent/), [dossiers-parked/](../../../../../sales/dossiers-parked/), [dossiers-disqualified/](../../../../../sales/dossiers-disqualified/)
- Overlaps: **11 Islamic schools run a Montessori/Casa stream**, for example Afzal Islamic Montessori, Islamic Montessori Academy Ottawa, Al Manarat Heights, Maple Root and Modern Montessori Academy. **5 Montessori schools are faith-affiliated**: 2 Christian (Bishop Hamilton, Lakewood), 1 Jewish (Montessori Jewish Day School), 1 Sikh (Khalsa Montessori) and 1 Hindu-rooted (Vedic Roots). Faith-based schools of any kind come to **~134 of 315 (43%)**. — [al-manarat-heights dossier](../../../../../sales/dossiers-sent/al-manarat-heights-mississauga.md); [bishop-hamilton dossier](../../../../../sales/dossiers/bishop-hamilton-montessori-school-ottawa.md)
- The 20 lead rows without a dossier are all Islamic: 18 disqualified (including Al Haadi, excluded as an existing customer) and 2 parked (AlBaqir Edmonton, on PowerSchool, and NL Islamic School, still an "emerging" homeschool model). — [leads.csv](../../../../../sales/leads/leads.csv)

**Enrollment band (315 schools; dossier "Enrollment" line, with the CSV as fallback; parsed, approximate)**

| Band | All | Islamic | Montessori | Other private |
|---|---|---|---|---|
| <30 | 2 | 1 | 0 | 0 |
| 30–49 | 12 | 8 | 2 | 2 |
| **50–150 (ICP sweet spot)** | **88** | 33 | 29 | 22 |
| 151–200 | 32 | 15 | 8 | 8 |
| 201–300 | 17 | 10 | 5 | 2 |
| 301–500 | 16 | 6 | 3 | 5 |
| 500+ | 5 | 3 | 1 | 1 |
| **Unknown** | **143 (45%)** | 39 | 56 | 33 |

- Only about **38 of the 172 known figures are sourced** (Our Kids profile, the school's own site, news, BoardingSchoolReview). The other ~134 are labelled "est./unconfirmed" or "guess", often worked back from staff counts or class sizes. Median of known figures: ~130 overall (Islamic ~133, Montessori 130, secular ~135). — e.g., [khairul-ummah dossier](../../../../../sales/dossiers-sent/khairul-ummah-school-scarborough.md) ("over 400" stated on the school's own site, confirmed) vs [iqra-academy dossier](../../../../../sales/dossiers-sent/iqra-academy-toronto.md) ("~20–50 est./unconfirmed")
- The size sub-score of the fit rubric was "unknown = 15" for 54 Montessori and 53 Islamic dossiers. — [icp.md](../../../../../sales/context/icp.md); dossier score lines

**Grades served (parsed from Grades lines; approximate)**
- **262 of 315 (83%) serve early years** (JK/SK/K, Casa, toddler or preschool). 108 name JK/SK explicitly, and 141 run Casa/toddler/preschool. — dossier "Grades" fields
- Islamic: 101/115 have early years and **63 name JK/SK explicitly**. Top grade is 7–8 for 51 schools (the classic JK–8), Grade 12 for 34 (K–12, often OSSD credit-granting), ≤6 for 14 (mostly young schools adding a grade each year), and 2 are secondary-only. — e.g., [tarbiyah-elementary-milton dossier](../../../../../sales/dossiers-sent/tarbiyah-elementary-milton.md) ("adding a grade each year toward a full PreK–8")
- Montessori: 96/104 have early years and 91 run Casa/toddler. The elementary span is usually Gr 1–3, 1–6 or 1–8, and a few run adolescent programs (the age-based wording makes exact top grades unreliable). — e.g., [hamilton-montessori dossier](../../../../../sales/dossiers/hamilton-montessori-school-stoney-creek.md) ("Nido at 12 months through to Grade 8")
- Other private: 45/73 have early years, 35 go to Grade 12, and 5 are secondary-only. — dossier "Grades" fields

**City / region (315)**

| Region | Schools | Of which Islamic / Montessori / other private |
|---|---|---|
| GTA (Toronto, Peel, York, Halton, Durham) | **175 (56%)** | 57 / 68 / 44 |
| Ottawa area | 28 | 13 / 5 / 9 |
| Hamilton–Niagara | 22 | 5 / 10 / 4 |
| Southwest ON (London, Windsor, Chatham, Sarnia…) | 22 | 12 / 3 / 3 |
| Central ON (Simcoe, Muskoka, Grey, Dufferin) | 17 | 1 / 8 / 7 |
| Waterloo–Wellington | 15 | 3 / 5 / 4 |
| Eastern ON (Kingston, Peterborough, Cornwall…) | 10 | 1 / 5 / 2 |
| Northern ON | 4 | 1 / 0 / 0 |
| Outside Ontario (all Islamic) | 22 | BC 6, QC 5, MB 4, AB 3, SK 3, NS 1 |

— [leads.csv](../../../../../sales/leads/leads.csv) city/region columns
- Top cities: Toronto 32, Mississauga 25, Ottawa 16, Scarborough 15, Oakville 12, North York 11, Brampton 11, Markham 10, Richmond Hill 8. Counting Scarborough, North York and Etobicoke as Toronto gives ~64. — [leads.csv](../../../../../sales/leads/leads.csv)
- The roadmap says the full-time Islamic day-school market per metro is small: "GTA ~56, Ottawa 13, Hamilton 5, London 3, Waterloo 4". GTA Islamic is marked "exhausted". — [RUNBOOK.md](../../../../../sales/RUNBOOK.md); [expansion-roadmap.md](../../../../../sales/expansion-roadmap.md)

**French / bilingual programs**
- **~30 of 315 (~10%)** mention French instruction, immersion, bilingual EN/FR or daily French: Montessori ~14, Islamic ~8, secular private ~6, Christian 1, Jewish 1. — e.g., [westboro-academy dossier](../../../../../sales/dossiers/westboro-academy-ottawa.md) ("half of every day in French"); [ibn-batouta dossier](../../../../../sales/dossiers-sent/ibn-batouta-ottawa.md) ("only French/English Islamic school")
- **Ottawa is the bilingual cluster**: 8 of the 28 Ottawa-area schools (Glebe Montessori, Joan of Arc, Macdonald-Cartier, St. Laurent, Westboro, Ibn Batouta, Islamic Montessori Academy, Ottawa Montessori School). Five of these are in the unsent ready queue. — [dossiers/](../../../../../sales/dossiers/)
- **5 Quebec francophone Islamic schools** were emailed after the founder confirmed Quebec bulletins and a French setup on 2026-07-21. Two more Quebec schools were disqualified for being over 500 students. — [academie-nour dossier](../../../../../sales/dossiers-sent/academie-nour-montreal.md); [product-brief.md](../../../../../sales/context/product-brief.md)
- Some bilingual programs aren't French: Chinese/English and Japanese/English (AIM Montessori), Spanish (Terra Viva, Discovering Minds), Hebrew (Kehila). Terra Viva was tagged "Bilingual" in the registry and assumed French, but it is Spanish. — [terra-viva dossier](../../../../../sales/dossiers/terra-viva-montessori-bilingual-st-catherines.md)

**Fit-score bands (315 dossiers; `fit_score` from leads.csv)**

| Band | All | Islamic | Montessori | Other private | Others |
|---|---|---|---|---|---|
| Hot 80+ | **78** | 48 | 30 | 0 | 0 |
| 65–79 (sendable) | **156** | 49 | 69 | 33 | 5 |
| 60–64 (parked) | 55 | 9 | 2 | 26 | 18 |
| 40–59 | 11 | 6 | 0 | 5 | 0 |
| 0 (DQ) | 15 | 3 | 3 | 9 | 0 |

- Median fit among non-zero scores is **71** (n=300). Contacted schools break down as Hot 62, 65–79 114, 60–64 9, 40–59 7, and 1 at 0. — [leads.csv](../../../../../sales/leads/leads.csv)
- Parked: 37 of the 50 parked dossiers score exactly **63**. That is type 18 + size 15 (unknown) + pain 15 + reach 15, so "unknown enrollment" is what parks them. 8 score 60 (size 301–500 or a visible platform). — [halton-waldorf dossier](../../../../../sales/dossiers-parked/halton-waldorf-school-burlington.md) ("Enrollment couldn't be confirmed publicly… keeps it just below the draft threshold")

**Disqualifications (32 lead rows)**
- 500+ students: 9. MAC network on MACSIS: 6. Not full-time (Saturday-only, part-time enrichment, hybrid homeschool, drop-in, part-time online): 5. Not a day school (tutoring, ABA therapy, online credit provider): 3. Duplicate or merged campus: 3. Preschool-only: 2. Closed or defunct: 2. Public/board-run: 1. Existing customer (Al Haadi): 1. — [leads.csv](../../../../../sales/leads/leads.csv) notes; [tayyibah dossier](../../../../../sales/dossiers-disqualified/tayyibah-islamic-academy-scarborough.md)

### Inferences
- The real buyer is a **small faith-based or Montessori school in the GTA running early years through Grade 8**. The website's default story should fit that school, with secular independents (special-needs, bilingual, prep) as a secondary audience.
- The Islamic segment is close to saturated in Ontario (113 contacted, GTA marked exhausted). New-logo growth now has to come from Montessori, independents and out-of-province, so those need their own landing pages more than the Islamic segment does.
- Because 45% of enrollments are unknown and most "known" ones are estimates, any website or deck claim like "built for schools of 50–150" is directionally supported but not measured.

### Gaps
- Enrollment is unconfirmed for most schools. Size bands rely on estimates.
- Top-grade parsing for Montessori is unreliable because programs are described by age ("to age twelve").
- There is no data on how many contacted schools opened or clicked anything.

---

## 2. Current tools: what schools run today and what it implies for positioning

### Takeaway
The dominant finding is **"unknown, no SIS visible publicly" (218 of 315, 69%)**. Where tools were observed, they are almost always **free form-and-inbox tools** (Google Forms, Jotform, PDFs, Gmail, WhatsApp): 49 schools, 47 of them Islamic. Only **19 schools (6%) run a named SIS or portal**. Several tools the brief anticipates never appear at all: Educa, Toddle, FACTS, Brightwheel, HiMama, Storypark, Montessori Compass and Blackbaud. The positioning implication is a **"first real system" story, not a "switch from X" story**.

### Cited Findings

**Evidence buckets (one per school, 315)**

| Bucket | Schools | Segments |
|---|---|---|
| A. Named SIS / portal incumbent (confirmed visible) | **19** | Islamic 10, Montessori 4, other private 2, Acton 3 |
| B. Partial / unconfirmed platform | 15 | Islamic 6, other private 6, Montessori 2, Catholic 1 |
| C. Point tools only, no SIS (observed on the school's site) | **25** | all Islamic |
| D. No SIS, with paper, PDF or in-person registration or no website (observed) | **24** live (+1 DQ duplicate) | Islamic 22, other private 2 |
| E. n/a (disqualified) | 13 | — |
| F. Unknown ("no SIS visible" / nothing named) | **218** | Montessori 95, other private 55, Islamic 50, Christian 10, Waldorf 6… |

— classification of each dossier's "Current system" line; e.g., [aim-montessori dossier](../../../../../sales/dossiers/aim-montessori-academy-inglewood.md) ("unknown (no SIS visible)")

**Tool tally, with confidence as the dossiers record it**

| Tool | Schools | Confidence | Notes |
|---|---|---|---|
| Edsembli / Maplewood | 3 | Confirmed: live portal links or vendor stated on site | Al-Ameen (ConnectEd with parent, student and staff portals), Nile Academy (EdSembli + Moodlecloud), Ottawa Islamic School (Edsembli CONNECT; staff login showed a load error) — [al-ameen dossier](../../../../../sales/dossiers-sent/al-ameen-elementary-school-brampton.md), [nile dossier](../../../../../sales/dossiers-sent/nile-academy-blue-haven-campus-toronto.md), [ottawa-islamic dossier](../../../../../sales/dossiers-sent/ottawa-islamic-school-nepean.md) |
| MACSIS (Muslim Association of Canada's in-house SIS) | 3 dossiers + 6 lead-only DQs + network HQ | Confirmed (sis3.macnet.ca portal links) | Org-wide; "principal can't switch" → auto-DQ rule — [RUNBOOK.md](../../../../../sales/RUNBOOK.md), [mac-al-furqan dossier](../../../../../sales/dossiers-sent/mac-al-furqan-school-toronto.md) |
| AD-DIN (Islamic-school SIS) | 1 confirmed + 1 portal link (use unconfirmed) | Confirmed for IIT Academy | "online enrollment with card/PayPal… attendance messaging, gradebook, Ontario-compliant JK–12 report cards" — [iit-academy dossier](../../../../../sales/dossiers-sent/islamic-institute-of-toronto-academy-scarborough.md); [darul-uloom dossier](../../../../../sales/dossiers-sent/darul-uloom-chatham.md) |
| Thinkwave | 1 | Confirmed (school's own page) | ISNA Elementary, alongside Google Classroom and OpenApply — [isna dossier](../../../../../sales/dossiers-sent/isna-elementary-mississauga.md) |
| Edsby | 1 (+Saskatoon checked: none) | Confirmed homepage banner | Regina Islamic — [regina-islamic dossier](../../../../../sales/dossiers-sent/regina-islamic-school.md) |
| PowerSchool | 0 in ICP dossiers; 2 lead-only | Confirmed only for large or parked AB schools | Edmonton Islamic Academy (~2,000 students, DQ) and AlBaqir (parked); several dossiers checked explicitly and found none — [leads.csv](../../../../../sales/leads/leads.csv); [oia-academy dossier](../../../../../sales/dossiers-sent/oia-academy-edmonton.md) |
| OwlWise (Montessori-oriented SIS) | 2 confirmed + 1 profile only | Confirmed (subdomain portals) | Ellesmere Montessori, Beyond Montessori; Muskoka has an unconfirmed profile — [ellesmere dossier](../../../../../sales/dossiers-sent/ellesmere-montessori-school-scarborough.md) |
| Transparent Classroom | 1 | Confirmed visible | Uxbridge Montessori ("soften to side-by-side") — [uxbridge dossier](../../../../../sales/dossiers/uxbridge-montessori-school-uxbridge.md) |
| ManageBac (IB) | 1 confirmed + 1 inferred | Confirmed / inferred | La Citadelle (+ custom portal + pickup system); Wheatley "may use" it — [la-citadelle dossier](../../../../../sales/dossiers-sent/la-citadelle-international-academy-north-york.md) |
| Custom / unbranded parent portals | ~6 | Mixed | As-Sadiq (bespoke, ~740 students), Mariyah (bare sign-in page, "no vendor branding"), Académie Nour (platform unidentified), Ottawa Montessori School, By Design (+Geenius LMS), BC Muslim School ("BCMS App") — [mariyah dossier](../../../../../sales/dossiers-sent/mariyah-islamic-school-scarborough.md) |
| EduPage | 1 | Confirmed but barely deployed | Tayba: "only lightly used for timetable display… default template placeholders" — [tayba dossier](../../../../../sales/dossiers-sent/tayba-elementary-school-waterloo.md) |
| Google Classroom | 3 confirmed + 2 implied/inferred + 1 second-hand | Mixed | Confirmed: Al Manarat, Islamic School of Hamilton, ISNA. Implied: Olive Grove. Inferred: Maple Root. Safa & Marwa "on Google Classroom" (per Tayba dossier) — [islamic-school-of-hamilton dossier](../../../../../sales/dossiers-sent/islamic-school-of-hamilton.md) |
| Google Forms | 7 | Confirmed (form links on the school's site) | Al Manarat, Al-Qasim, Al-Salam, AMES, IOK, Suffah, Ummaty — [al-qasim dossier](../../../../../sales/dossiers-sent/al-qasim-academy-scarborough.md) |
| Jotform | 4 | Confirmed | Abu Huraira (waitlist), Al Manarat, Fitra, Maingate — [abu-huraira dossier](../../../../../sales/dossiers-sent/abu-huraira-academy-north-york.md) |
| Cognito Forms / WordPress forms | 1 / 3 | Confirmed | Iqra Nejashi (Cognito + Joomla), Afzal, Al Huda, Selm — [iqra-nejasni dossier](../../../../../sales/dossiers-sent/iqra-nejasni-islamic-school-toronto.md) |
| Google Drive/Docs, Canva, email newsletter | 2 | Confirmed | Tarbiyah Learning Academy ("Canva for weekly grade updates"), IOK (handbook as a shared Google Doc) — [tarbiyah-ottawa dossier](../../../../../sales/dossiers-sent/tarbiyah-learning-academy-ottawa.md) |
| Seesaw (+Raz-Kids, Zearn) | 2 | Confirmed | American Islamic School (online), North American Islamic Academy (online) — [naia dossier](../../../../../sales/dossiers-sent/north-american-islamic-academy-toronto.md) |
| ClassDojo | 1 | Confirmed | Islamic School of Hamilton (parent comms) |
| SchoolMessenger | 2 | Confirmed | Al-Falah ("SchoolMessenger Presence… website + notifications only"), Olive Grove (app) — [al-falah dossier](../../../../../sales/dossiers-sent/al-falah-islamic-oakville.md) |
| OpenApply (admissions) | 3 | Confirmed | ISNA, Olive Grove, Richland |
| MadinaApps (masjid platform: registration/fees) | 1 | Confirmed | MAM Islamic Elementary — [mam dossier](../../../../../sales/dossiers-sent/mam-islamic-elementary-school-oakville.md) |
| School Appointments Online | 1 | Confirmed | Al-Risala (parent–teacher conferences) |
| PayPal / Interac e-transfer / Zeffy | 3 | Confirmed | Saba's Academy, SNMC Al-Bushra, IIT (via AD-DIN) — [saba dossier](../../../../../sales/dossiers-sent/saba-academy-mississauga.md) |
| WhatsApp / Telegram as a channel | ~7 mention, 2–3 as main comms | Confirmed | Al-Qasim ("Community comms run through WhatsApp/Telegram"), MIA Winnipeg (admissions via email + WhatsApp) |
| Phone-in "Safe Arrival" attendance | 1 (+1 DQ duplicate) | Confirmed | Pickering Islamic Centre — [pickering dossier](../../../../../sales/dossiers-sent/pickering-islamic-centre-school-pickering.md) |
| Website builders | WordPress 4, Google Sites 4, Squarespace 2, Weebly 1, Joomla 1, Wix 0 | Confirmed | e.g., [al-iman dossier](../../../../../sales/dossiers-sent/al-iman-school-brampton.md) ("entire web presence on a free Google Sites page") |
| Excel / spreadsheets | mentioned in 44 dossiers | **Inferred in essentially every case** ("almost certainly", "likely") | No dossier quotes a school saying it uses Excel — e.g., [maple-root dossier](../../../../../sales/dossiers-sent/maple-root-academy-mississauga.md) ("very likely… UNCONFIRMED") |
| "Paper" | mentioned in 55 | Observed only where PDF or in-person registration is visible; otherwise inferred | [salaheddin dossier](../../../../../sales/dossiers-sent/salaheddin-islamic-school-scarborough.md) (book an appointment, bring physical records) |
| Personal or ISP email as the school's published primary contact | **48** (gmail 35, bellnet 5, hotmail 4, yahoo 2, rogers 1, outlook 1) | Confirmed (registry or site) | Montessori 21, Islamic 16, other private 10 — [leads.csv](../../../../../sales/leads/leads.csv) email column (addresses not reproduced) |
| **Never found** | Educa, Toddle, FACTS/RenWeb (one hit was an unrelated US school), Brightwheel, HiMama/Lillio, Storypark, Montessori Compass, Blackbaud, Veracross, Finalsite, Brightspace, SchoolCash, Microsoft 365 | — | Search of every dossier's research sections |

### Inferences
- **Forms, Gmail and WhatsApp patchwork (Islamic):** this is the core wedge. The site should name the real stack ("Google Forms, Jotform, PDFs, WhatsApp groups and a Gmail inbox") and show SchoolMule absorbing it: online registration/waitlist → student record → attendance → report card → parent portal.
- **Unknown or no visible SIS (Montessori, independents):** most likely the same pain, but unverified. The site has to do the discovery: "Still doing report cards in Word and attendance on paper?" Avoid claiming they have no system.
- **Edsembli/Maplewood incumbents (3) and AD-DIN (1):** these are Ontario- or Islamic-specific competitors and need a migration and side-by-side story (data import, "we build it out with you", no enterprise pricing). The volume is small, so this belongs on an FAQ or comparison page, not the hero.
- **Thinkwave, Edsby, PowerSchool:** these are generic or US-built and not Ontario-native. "Ontario report cards out of the box" is the differentiator. Thinkwave is the only confirmed small-school case.
- **OwlWise and Transparent Classroom (Montessori):** these are the Montessori-native incumbents that do show up. Montessori pages will be compared against them, so narrative/observation features must be real before the site claims them (see Q7). "Replaces Educa for Montessori portfolios" has **no evidence**: Educa never appears.
- **MACSIS:** one buyer for many schools. That is an enterprise/network sale, not something to put on the website.
- **ClassDojo, Seesaw, SchoolMessenger, Google Classroom:** position as "keep your classroom tool; SchoolMule is the record of truth behind it", which is what the dossiers already recommend. A "works alongside Google Classroom / Seesaw" line is supported.
- **WordPress, Google Sites and Squarespace websites:** many prospects have weak sites. A clean, credible SchoolMule site is itself a trust signal, and a polished parent-facing portal is part of the value. ("Website builder" is not a supported product claim.)

### Gaps
- 218 schools have no observed system. Pain for the Montessori and secular segments is essentially unmeasured.
- There are no call notes confirming any system, so even the "confirmed" tools are confirmed from public web footprints only.

---

## 3. Pain points and hooks, grouped into themes

### Takeaway
School-specific, observed pain is concentrated in the **Islamic dossiers**. Their research is roughly twice as deep: median research text ~3.4k characters vs ~1.6k for Montessori and secular, and median hook 592 vs ~260 characters. Most Montessori and secular hooks reuse one templated line ("the attendance/records/report-card load… lands on just a few people"). Ranked by evidence, the themes are: no-system patchwork, demand and waitlists, growth and young schools, multi-program complexity, parent-communication gaps, report-card burden and lean staffing.

### Cited Findings

**Theme counts (evidence-grade = specific to the school and observed, not template framing)**

| # | Theme | Evidence-grade count | Mostly |
|---|---|---|---|
| 1 | **No SIS: forms, PDF, inbox patchwork** | 49 (25 point-tools + 24 none/paper) | Islamic 47 |
| 2 | **Demand: waitlists, full grades, paid waitlist, limited spots** | 26 | Islamic 21 |
| 3 | **Growth / young school** (founded 2019+; adding grades, new building or campus, relocation) | 22 founded 2019+ (of 138 with a founding year); 32 explicit expansion signals | Islamic 17 young, 22 expanding |
| 4 | **Multi-program / multi-campus complexity** | multi-campus 27; Hifz/Quran tracks 26; OSSD credit-granting 24 | Islamic + Montessori |
| 5 | **Parent communication gaps** | explicit "no parent portal" 26; comms via email, newsletter, WhatsApp, ClassDojo, SchoolMessenger, Canva or Facebook 40 | Islamic 23 / 32 |
| 6 | **Report-card burden** | report cards mentioned in 206 dossiers (mostly pitch framing); **~12 with school-specific evidence** | Islamic 10 |
| 7 | **Lean staff** | "fewer than 10 teachers" (Ontario open data) cited for 18 schools | all Islamic |
| 8 | **Weak digital front door** | personal or ISP email as primary contact 48; site-hygiene issues (expired SSL, template placeholders, "coming soon", no live site) 17 | mixed / Islamic 13 |
| 9 | **Individualized / IEP-heavy documentation** | 11 special-needs or learning-differences schools | secular private |
| 10 | **Bilingual or narrative reporting** | ~30 French/bilingual; 6 Waldorf "portfolio" hooks; ~78 Montessori hooks invoke narrative assessment (inferred, not observed) | Montessori, Waldorf |
| 11 | **Protecting an academic reputation** (Fraser/EQAO rankings cited) | 17 Islamic, 1 Montessori, 1 other | Islamic |
| 12 | **Incumbent friction** (switch angle) | 19 named incumbents; friction observed in ~3 | Islamic |

— theme counts computed over the research sections of all 315 dossiers; Pain/hook blocks read in full.

**Representative examples (one line each)**
- **Al-Qasim Academy (Scarborough):** a K–8 day school of ~110 plus a large evening seminary runs "entirely off Google Forms" (separate morning and evening registration forms, donation forms) with "WhatsApp/Telegram for parent comms". — [dossier](../../../../../sales/dossiers-sent/al-qasim-academy-scarborough.md)
- **Islamic School of Hamilton:** "over 250 students enrolled and roughly 300 students on the waitlist", managing comms through ClassDojo and learning through Google Classroom, with no SIS. — [dossier](../../../../../sales/dossiers-sent/islamic-school-of-hamilton.md)
- **MAM Islamic Elementary (Oakville):** registration and fees run through a masjid-management app, and the school's own teacher job posting expects each teacher to "prepare students report cards", i.e., report cards are hand-built per teacher. — [dossier](../../../../../sales/dossiers-sent/mam-islamic-elementary-school-oakville.md)
- **Saba's Academy (Mississauga):** paper registration, tuition via PayPal subscriptions and Interac e-transfer, and a static "FINAL REPORT CARDS" web page. — [dossier](../../../../../sales/dossiers-sent/saba-academy-mississauga.md)
- **Tarbiyah Learning Academy (Ottawa):** runs on Google Drive/Docs, builds weekly grade-by-grade updates in Canva, and advertises "Weekly Teacher Updates — Coming September 2026"; "on average more students on the wait list than in classrooms". — [dossier](../../../../../sales/dossiers-sent/tarbiyah-learning-academy-ottawa.md)
- **Al-Salam Islamic School (Brampton):** a brand-new K–2 school taking enrollment through a Google Form, with the parent portal advertised as "Coming Soon". — [dossier](../../../../../sales/dossiers-sent/al-salam-islamic-school-brampton.md)
- **Khairul Ummah (Scarborough):** JK–12 with gender-streamed classes, an OSSD high school and Hifz + Aalimiyyah tracks on ~23 staff, and no SIS named. — [dossier](../../../../../sales/dossiers-sent/khairul-ummah-school-scarborough.md)
- **Maingate Islamic Academy (Mississauga):** mid leadership transition (actively hiring a principal), admissions on Jotform plus emailed documents, and a paper PAD form. — [dossier](../../../../../sales/dossiers-sent/maingate-islamic-academy-mississauga.md)
- **Liberty Prep (Toronto):** sends families "a report card six times a year", a heavy recurring reporting load. — [dossier](../../../../../sales/dossiers-sent/liberty-prep-school-toronto.md)
- **Chisholm Academy (Oakville):** writes an individual education plan for **every** student. — [dossier](../../../../../sales/dossiers-sent/chisholm-academy-oakville.md)
- **London Islamic School:** a dated WordPress site whose "SSL certificate has expired" and downloadable paper registration. — [dossier](../../../../../sales/dossiers-sent/london-islamic-school.md)
- **Templated Montessori hook (typical, unverified):** "Carrying children from infancy through elementary grows the records and report-card load, which tends to land on just a few people." — [brooklin-mill dossier](../../../../../sales/dossiers/brooklin-mill-montessori-school-inc-brooklin.md)

**Real replies, objections and call outcomes**
- **None are recorded anywhere.** No lead has status `replied/demo/won/lost`, activity logs record only "emailed / enriched / drafted", and the follow-up files are outbound drafts. — [leads.csv](../../../../../sales/leads/leads.csv); dossier "Activity log" sections; [do-not-contact.md](../../../../../sales/do-not-contact.md)
- Only **anticipated** objections exist, written into 24 call scripts. Counts: "too small / can't afford / is it worth it" 21, "we already use X (Google Classroom, our portal, Gmail)" 15, "send me an email" 14, "who are you / is this legit" 12, "we manage fine already" 11, "busy / between principals / growing" 2. — e.g., [al-manarat dossier](../../../../../sales/dossiers-sent/al-manarat-heights-mississauga.md) call script; [call-script.md](../../../../../sales/templates/call-script.md)

### Inferences
- The strongest, most repeatable website story is the **Islamic-school operating reality**: registration via forms, waitlists in spreadsheets, Quran/Hifz tracks next to Ontario report cards, and parents on WhatsApp. It is backed by dozens of observed cases.
- **Demand-side pain (waitlists, capacity)** is a distinctive, underused angle. Most SIS sites lead with grades, but these schools are oversubscribed and run admissions by hand. If SchoolMule's enrollment and waitlist features are real, they deserve a prominent block.
- **"New school / set it up right from day one"** is a natural segment message: 17 Islamic schools founded since 2019, plus several Christian and classical startups.
- Montessori and secular pain is mostly **hypothesis**. Website copy for those segments should lead with recognition of their model (continuum, narrative, IEPs, bilingual) rather than asserted pain.

### Gaps
- There are no real objections or reply data. Anticipated objections are the founder's or agent's guesses.
- Report-card pain is mostly framing. Only ~12 dossiers have school-specific evidence of how report cards are produced.

---

## 4. Decision-makers

### Takeaway
The **principal** is the named contact for ~70% of schools. That is partly a registry artifact: the Ontario private-school registry lists a principal for every school. Founder- or owner-run schools are visible in ~8% by title. Named office or registrar staff are rare (~24 schools), and Islamic schools are often governed by a **masjid or association board** (~46% of Islamic dossiers).

### Cited Findings
- Titles on named contacts across 315 schools: **Principal 219** (Islamic 99, Montessori 87, other 29); "Admin/Administrator" 78 (often a role inbox rather than a person); **Director** 34 (including "principal/director" and Quebec "directrice générale"); **Owner/operator** 20; **Head of School** 16; **Founder/co-founder** 13; **Vice-principal** 10 (all Islamic); **office/reception/secretary/office manager** 18; **registrar/admissions** 6 (only 2 titled "registrar"); **board president/trustee** 3 (Islamic, e.g., a masjid trustee who is also principal). — dossier Contacts tables; [leads.csv](../../../../../sales/leads/leads.csv) `role` column (blank for 217 rows)
- **26 schools (~8%)** list one person as founder/owner **and** principal/head/director, e.g., "Founder & Principal", "Head of School & Founder", "Owner/Director", "co-founder & principal". Another 16 dossiers describe founder-led or family-run operations in prose. Expect undercounting because registry rows only say "principal". — e.g., [afzal dossier](../../../../../sales/dossiers-sent/afzal-islamic-montessori-academy-scarborough.md) ("principal… has run the place since founding it in 2004"); [regalo dossier](../../../../../sales/dossiers-sent/regalo-montessori-newmarket.md)
- **53 of 115 Islamic dossiers (46%)** describe a school run by or inside a masjid, Islamic centre or association (MAC, ISNA, WIA, BCMA, AICP, a masjid trustee board). 44 dossiers overall mention non-profit, charity or board governance. — e.g., [makki dossier](../../../../../sales/dossiers-sent/makki-islamic-learning-centre-brampton.md) ("one arm of a busy masjid… trustee-principal… a single student coordinator"); [mac-network-hq](../../../../../sales/dossiers-sent/mac-network-hq.md)
- Staffing signals: "fewer than 10 teachers" for 18 Islamic schools; one ~200-student school runs on "1 principal + 1 admin". — [abu-huraira dossier](../../../../../sales/dossiers-sent/abu-huraira-academy-north-york.md); [al-hidayah dossier](../../../../../sales/dossiers-sent/al-hidayah-academy-toronto.md)
- The ICP names principal/head as primary, office manager/registrar as champion, and owner/founder/board chair in very small or family-run schools. — [icp.md](../../../../../sales/context/icp.md)
- The anticipated objection "between principals / too busy" appears for a school mid leadership change. — [maingate dossier](../../../../../sales/dossiers-sent/maingate-islamic-academy-mississauga.md)

### Inferences
- The site should speak to **the principal as operator**: the person who does registration, attendance, report cards and parent comms. Lines like "Built for the principal who is also the registrar" match the evidence and the brief's "principal is often also the registrar, the IT person…" framing.
- **Board-governed Islamic schools** need forwardable proof: a one-page overview, pricing logic, data privacy and residency, and a reference school. The principal may have to sell it to a masjid board.
- Office managers are rarely visible, so content aimed at a dedicated "school administrator" persona will reach fewer buyers than principal-first copy.

### Gaps
- Role capture is shallow (217 blank `role` cells), and nobody confirmed budget authority.

---

## 5. What these schools' own websites emphasise (language to mirror)

### Takeaway
Islamic schools sell **"Ontario curriculum + Islamic studies/Quran/Arabic"**, values and character, longevity and (for some) Fraser/EQAO results. Montessori schools sell **authentic method and accreditation (AMI, CCMA, Montessori Canada)**, the toddler-to-elementary continuum, nature and "since 19xx" heritage. Secular independents sell **small classes and individual attention**. "Community/family" appears in every segment.

### Cited Findings
- Share of dossiers whose research text records each emphasis. Islamic dossiers are researched more deeply, so they are over-represented:

| Emphasis | All 315 | Islamic /115 | Montessori /104 | Other private /73 |
|---|---|---|---|---|
| Montessori method / AMI / CCMA / Casa / multi-age | 127 | 14 | 104 | 5 |
| Heritage / longevity ("since 19xx", "N years") | 136 (43%) | 67 | 41 | 21 |
| Ontario curriculum / Ministry-inspected / OSSD | 100 (31%) | 69 | 10 | 19 |
| Community / family | 90 (28%) | 42 | 31 | 11 |
| Faith identity / values / character | 85 (27%) | 61 | 5 | 5 |
| Quran / Hifz / Arabic / Islamic studies | 81 | 80 | 0 | 1 |
| Small classes / low ratio | 80 (25%) | 15 | 15 | 44 |
| Bilingual / languages | 57 | 18 | 27 | 10 |
| Individual attention / "every child known" | 49 | 12 | 7 | 26 |
| Arts / music / athletics | 35 | 7 | 12 | 12 |
| Nature / outdoor / forest | 30 | 4 | 16 | 7 |
| Demand (waitlist / full) | 27 | 21 | 5 | 1 |
| IB / gifted / enrichment | 27 | 7 | 7 | 11 |
| Academic results (Fraser, EQAO, rankings) | 21 | 17 | 1 | 1 |
| STEM / STEAM | 16 | 10 | 3 | 2 |
| Special needs / learning differences | 12 | 0 | 0 | 12 |

— keyword tally over the research sections of all dossiers

- Verbatim school language captured in dossiers:
  - "Inspiring faith and excellence in every child." — [fitra dossier](../../../../../sales/dossiers-sent/fitra-school-stittsville.md)
  - "a balanced Islamic and academic education" / "a nurturing Islamic environment" — [nebula dossier](../../../../../sales/dossiers-sent/nebula-academy-calgary.md)
  - "dual-track curriculum blending religious and secular excellence" — [greenhill dossier](../../../../../sales/dossiers-sent/greenhill-islamic-school-hamilton.md)
  - "educate for excellence in moral character, intellectual rigor, and physical well-being" — [selm dossier](../../../../../sales/dossiers-sent/selm-academy-richmond-hill.md)
  - "rooted in Islamic values" / "over two decades" — [amanah dossier](../../../../../sales/dossiers-sent/amanah-academy-scarborough.md)
  - "Serving The Ummah Since 1993." — [madresatul-banaat dossier](../../../../../sales/dossiers-sent/madresatul-banaat-almuslimaat-etobicoke.md)
  - "Ottawa's First Islamic Montessori School" — [islamic-montessori-academy dossier](../../../../../sales/dossiers-sent/islamic-montessori-academy-ottawa.md)
  - "your child is known and loved", "of mind, body, and spirit" — [sudbury-christian dossier](../../../../../sales/dossiers/sudbury-christian-academy-sudbury.md)
  - "every student is truly known" — [nancy-campbell dossier](../../../../../sales/dossiers/nancy-campbell-academy-stratford.md)
  - "We Build the School Around Your Child." — [junior-academy dossier](../../../../../sales/dossiers-sent/the-junior-academy-toronto.md)
  - "where love of learning begins" — [riverforest dossier](../../../../../sales/dossiers/riverforest-montessori-school-owen-sound.md)
  - "learning through exploration, play and inquiry" — [harwood dossier](../../../../../sales/dossiers-sent/harwood-montessori-school-ajax.md)
  - "from infancy through adolescence" — [dundas-valley dossier](../../../../../sales/dossiers/dundas-valley-montessori-school-dundas.md)
  - "mastering puddles is just as important as learning letters" — [terra-viva dossier](../../../../../sales/dossiers/terra-viva-montessori-bilingual-st-catherines.md)
  - "Maximum 16 Students Per Class" — [aurora-prep dossier](../../../../../sales/dossiers-sent/aurora-preparatory-academy-aurora.md)
  - "All Grades Are Full For The 2025/2026 School Year" — [abu-huraira dossier](../../../../../sales/dossiers-sent/abu-huraira-academy-north-york.md)
- The current email voice already mirrors this. It is "respect-first": open with a genuine compliment (longevity, Fraser ranking, waitlist demand, growth), then "frame the manual admin as a LOAD we lift — NEVER as a flaw". Faith schools get salam/inshaAllah/JazakAllah khair. Montessori and secular schools get a warm voice with no faith greetings. — [RUNBOOK.md](../../../../../sales/RUNBOOK.md) §6; [email-templates.md](../../../../../sales/templates/email-templates.md)

### Inferences
- Vocabulary worth echoing: "Ontario curriculum + Islamic studies", "Quran, Hifz, Arabic as real courses", "every child known", "small classes", "from Casa through Grade 8", "community", "since day one" (for young schools), "lift the load".
- Avoid the brief's harsher words ("brutal", "nightmare", "drowning"). They clash with how these schools present themselves and with the respect-first voice already used in outreach.
- Segment pages should **mirror each segment's own identity**: faith and curriculum for Islamic, method and continuum for Montessori, individualization for special-needs and prep schools.

### Gaps
- The emphasis counts reflect what researchers chose to record, not a systematic crawl of each school's homepage.

---

## 6. Website-relevant signals

### Takeaway
Very few prospects show any SIS (34 of 315 show any platform at all). Informal parent communication is common where research went deep. Nearly every prospect runs JK/SK or Casa. Tuition is **low for Islamic schools (~$200–$600/month)** and high for Montessori and secular schools ($9.5k–$45k/year), which matters for pricing presentation. French is a real but secondary need (Ottawa, Quebec).

### Cited Findings
- **No SIS:** 49 schools (16%) have **observed** no-SIS evidence (forms, paper, inbox), 218 (69%) show **no SIS publicly** (unknown), and 34 (11%) show some platform (19 named + 15 partial). — Q2 table
- **Parent communication problems:** 26 dossiers explicitly record "no parent portal" (23 Islamic), 40 record comms via email, newsletters, WhatsApp/Telegram, ClassDojo, SchoolMessenger, Canva or Facebook, and 79 discuss parent portal or comms at all. — e.g., [oia-academy dossier](../../../../../sales/dossiers-sent/oia-academy-edmonton.md) ("emails, newsletters, and parent-teacher conferences"); [iqra-islamic dossier](../../../../../sales/dossiers-sent/iqra-islamic-school-mississauga.md) ("email newsletter and Facebook")
- **Report cards:** discussed in 206 dossiers. ~12 have school-specific evidence (hand-built report cards, a job posting, 6×/year cadence, OST transcripts, EQAO/CAT-3 tracking, French-immersion plus Islamic-subject report cards). — e.g., [ibn-batouta dossier](../../../../../sales/dossiers-sent/ibn-batouta-ottawa.md) ("Ontario French Immersion report cards plus Islamic Studies, Quran, and Arabic… combined-grade classrooms"); [al-ikhlaas dossier](../../../../../sales/dossiers-sent/al-ikhlaas-foundation-school-etobicoke.md) (Ontario Student Transcripts)
- **Tuition/finance:** 64 dossiers mention tuition or fees, and 12 show observed payment tooling (PayPal, e-transfer, paper PAD, Zeffy, MadinaApps, tuition calculator).
  - Islamic examples: $200/mo (Ibrahim), $350/mo (IOK), $450/mo (Abu Huraira, Hamilton Downtown), $550/mo (IIT), ~$595/mo (Maingate), $600/mo (MAC Al-Furqan), $4–5k/yr (MAM), $5,250/yr (Iqra Islamic), $6.5–8.2k (ISNA).
  - Montessori: $9.5–18.5k (Peel), $15–18k (Trinity), $22.5–25k (Westside), $5.2–10.9k (ABC).
  - Secular private: $11k–$45.5k (e.g., Webtree $22–34.8k, Oak Bridge $32–45.5k).
  - Sources: [abu-huraira](../../../../../sales/dossiers-sent/abu-huraira-academy-north-york.md), [mam](../../../../../sales/dossiers-sent/mam-islamic-elementary-school-oakville.md), [westside](../../../../../sales/dossiers-sent/westside-montessori-school-toronto.md), [oak-bridge](../../../../../sales/dossiers/oak-bridge-academy-hespeler-campus-cambridge.md)
- **JK/SK presence:** 262/315 (83%) run early years, and 108 name JK/SK (Islamic 63/115). Montessori schools say "Casa" (91/104), not JK/SK. — Q1
- **Quebec/French:** 5 Quebec francophone Islamic schools emailed, 2 Quebec DQ'd on size, ~30 French/bilingual programs, Ottawa cluster of 8. — Q1
- **Outside Ontario:** 22 schools emailed in BC (6), QC (5), MB (4), AB (3), SK (3) and NS (1). — [leads.csv](../../../../../sales/leads/leads.csv)
- **Online-only or hybrid schools:** 15 (8 secular, 7 Islamic), flagged in dossiers as a weaker fit. — [american-islamic dossier](../../../../../sales/dossiers-sent/american-islamic-school-oakville.md)
- **Demand signal:** 26 with waitlists, full grades or paid waitlists. — Q3

### Inferences
- Islamic tuition of $2.4k–$7k per family per year means **price sensitivity is real**. "Too small / can't afford it" is also the most-anticipated objection. The site should show pricing or a credible "priced for small schools" anchor rather than "contact sales".
- A **JK/SK + Casa** section ("kindergarten and Casa reporting, not just letter grades") speaks to 83% of the pipeline. Use "Casa" on Montessori pages and "JK/SK" on Islamic and independent pages.
- Parent portal demand is visible as aspiration ("Coming Soon" portals, bare portal pages, Canva updates). Screenshots of the parent view are high-value proof.
- French deserves at least an FAQ line ("bilingual and French report cards; Quebec bulletins on request") and possibly a French landing page for Ottawa and Quebec. Founder confirmation is needed on scope.

### Gaps
- No dossier records what schools would pay for software. Tuition is only a proxy.

---

## 7. Discrepancies between the product brief / site and reality (for the founder; not resolved here)

### Takeaway
The biggest gap is that the **live marketing site makes claims the sales brief explicitly forbids**: "50+ schools", "10,000+ students", "99.9% uptime", and testimonials that look like placeholders. The "14-day free trial" CTA leads to a tenant-only signup directory. Prospects are emailed "several Ontario Islamic schools" and then sent to that site. Several product claims in outreach (Montessori narrative assessment, invoicing, province fit) also need verification.

### Cited Findings
1. **Scale of research.** The task framing says "~60+ dossiers". In fact there are 316 school dossiers plus 50 follow-up drafts, and leads.csv has 336 rows. — directory listing of [sales/](../../../../../sales/)
2. **Customer count on the website.** The homepage badge reads "Trusted by 50+ Schools Nationwide". The About page states "50+ Schools Served", "10,000+ Students Managed" and "99.9% Uptime Record", and the homepage stats strip shows "99.9% Uptime" and "100% Faster report card generation". The brief says: "Do NOT use a specific numeric customer count ('50+ schools')… unless Hussein confirms it" and "No '99.9% uptime'-style stats in cold outreach"; the approved wording is "in use at several Ontario Islamic schools" (5+). — [page.tsx](<../../../../src/app/(prelogin)/page.tsx>) (lines ~99–123); [about/page.tsx](<../../../../src/app/(prelogin)/about/page.tsx>) (lines ~64–66); [product-brief.md](../../../../../sales/context/product-brief.md)
3. **Testimonials.** The About page shows two testimonials attributed to principals or administrators at "Maplewood Elementary" and "St. Mary's Academy". Neither school appears in the pipeline or the tenant list, and both look like placeholders. "Maplewood" is also the name of an incumbent SIS (Edsembli/Maplewood). The homepage testimonial is attributed to Al Haadi's principal; verify the quote is real and approved. — [about/page.tsx](<../../../../src/app/(prelogin)/about/page.tsx>) (lines ~68–82); [page.tsx](<../../../../src/app/(prelogin)/page.tsx>) (lines ~545–560)
4. **"14-day free trial, no credit card" (brief: `schoolmule.ca/signup`).** The /signup page is "Find your school… Select your school to create your account", a static directory of existing tenants, so there is no self-serve school trial. The homepage and /demo "Start Free Trial" buttons point there. The trial line also appears in the objection handling of 23 dossiers' call scripts. — [signup/page.tsx](<../../../../src/app/(user)/signup/page.tsx>); [page.tsx](<../../../../src/app/(prelogin)/page.tsx>) (line ~150); [product-brief.md](../../../../../sales/context/product-brief.md); e.g., [al-falah dossier](../../../../../sales/dossiers-sent/al-falah-islamic-oakville.md)
5. **"Live at several (5+) Ontario Islamic schools."** The static signup directory lists 5 tenants: Al Haadi Academy, Jaffari Community Centre, Al-Zahra Institute, Peterborough Montessori and Bliss Carman Public School. That is 3 Islamic-affiliated organizations (which may include supplementary programs), 1 Montessori and 1 public school, so the repo can't confirm "5+ Ontario Islamic schools". The older templates and call script say "an Ontario Islamic school" (singular), and 23 dossier drafts/scripts use the singular while 103 use "several". — [schoolUtils.ts](../../../../src/lib/schoolUtils.ts) (`SIGNUP_SCHOOLS`); [email-templates.md](../../../../../sales/templates/email-templates.md); [call-script.md](../../../../../sales/templates/call-script.md)
6. **Named-customer drift.** One dossier hook calls Abraar, Ottawa Islamic School and "Tarbiyah" existing SchoolMule users. Other dossiers show Abraar on MACSIS, Ottawa Islamic School on Edsembli, and both Tarbiyah schools emailed as prospects. The claim did not reach that email draft. — [islamic-montessori-academy dossier](../../../../../sales/dossiers-sent/islamic-montessori-academy-ottawa.md); [abraar dossier](../../../../../sales/dossiers-sent/abraar-school-ottawa.md); [ottawa-islamic dossier](../../../../../sales/dossiers-sent/ottawa-islamic-school-nepean.md)
7. **Possible tenant in the prospect queue.** "Peterborough Montessori" is a tenant, and "The Children's Montessori School (Peterborough)" sits in the unsent ready queue. Check whether they are the same organization before sending. — [schoolUtils.ts](../../../../src/lib/schoolUtils.ts); [children-s-montessori dossier](../../../../../sales/dossiers/children-s-montessori-school-the-peterborough.md)
8. **Tuition & Finance.** The brief claims "tuition tracking, invoicing, payment status, revenue reports". In the app, Finance → Tuition reads "Invoices and payments by family, from QuickBooks": invoicing lives in QuickBooks Online, and SchoolMule mirrors it. Prospects observed paying via PayPal, e-transfer or MadinaApps wouldn't benefit without QBO. — [finance/tuition/page.tsx](<../../../../src/app/(user)/finance/tuition/page.tsx>) (lines 3–6, ~303); [product-brief.md](../../../../../sales/context/product-brief.md)
9. **Montessori "narrative, skill-based assessment".** This promise appears in ~109 dossier email drafts (and the Montessori follow-ups) ("handles narrative, skill-based assessment, not just letter grades"). A quick code search found JK/SK skill-rating gradebooks but no Montessori- or narrative-specific reporting module. Verify before it becomes a website segment promise. — [email-templates.md](../../../../../sales/templates/email-templates.md); JK/SK workspaces in `src/components/gradebook/workspace/`
10. **JK/SK scale labels.** The brief says "E/P/DV/EM/NI/NA scales". The code shows JK options including BG/DV and SK options including DV/EM. Verify which labels the site should name. — [product-brief.md](../../../../../sales/context/product-brief.md); `src/components/gradebook/workspace/JKGradebookWorkspace.tsx`, `SKGradebookWorkspace.tsx`
11. **Demo length.** The brief offers a "60-minute demo" and every email asks for "15 minutes". — [product-brief.md](../../../../../sales/context/product-brief.md); [RUNBOOK.md](../../../../../sales/RUNBOOK.md) §6
12. **Provincial fit.** The brief is built on Ontario conventions, with Quebec bulletins confirmed on 2026-07-21. The roadmap warns that "report-card conventions differ by province", yet 17 schools in BC, AB, MB, SK and NS were emailed with no documented product-fit confirmation for their provinces. — [expansion-roadmap.md](../../../../../sales/expansion-roadmap.md); [leads.csv](../../../../../sales/leads/leads.csv)
13. **MAC HQ pitch.** The RUNBOOK says it is "drafted but NOT sent — needs the MAC national schools/education contact identified". leads.csv marks it `contacted`, "emailed 2026-07-20". — [RUNBOOK.md](../../../../../sales/RUNBOOK.md) §14; [leads.csv](../../../../../sales/leads/leads.csv)
14. **Off-ICP sends.** These were emailed despite DQ or soft-DQ notes in their own dossiers:
    - As-Sadiq (~740 students)
    - Regina Huda (~733, "off-pipeline: was DQ 500+")
    - Regina Islamic (on Edsby, "off-pipeline: was parked")
    - Three MAC schools on MACSIS (before the MAC auto-DQ rule)
    - Al-Ameen (Edsembli)
    - One Path (part-time, fit 0)
    - Islamic Education Guidance Centre ("likely defunct")

    — [leads.csv](../../../../../sales/leads/leads.csv) `last_action`; respective dossiers
15. **Scoring drift.** The rubric scores "unknown current system" as pain 10. In the Montessori and secular sweeps, 162 dossiers with unknown systems were scored 15. 55 leads at fit 65–69 (52 Montessori: 38 already emailed, 14 ready) cleared the 65 send threshold only because of this. — [icp.md](../../../../../sales/context/icp.md); dossier score lines
16. **No logged outcomes.** About 194 schools were emailed and 17 followed up, but no reply, demo, objection or loss is recorded. Either nothing came back or outcomes aren't being logged. — [leads.csv](../../../../../sales/leads/leads.csv)
17. **CASL.** Templates still mark MAILING_ADDRESS "STILL NEEDED", and the opt-out line was removed by founder decision, which the templates themselves flag as "a CASL deviation for cold email". Whether sent emails carried an address can't be verified from the files. — [email-templates.md](../../../../../sales/templates/email-templates.md)
18. **Data hygiene.** Nebula Academy is tagged Calgary but is in Edmonton. — [nebula dossier](../../../../../sales/dossiers-sent/nebula-academy-calgary.md)

### Inferences
- A prospect who receives "in use at several Ontario Islamic schools" and then lands on "Trusted by 50+ Schools Nationwide", next to generic testimonials, sees an inconsistency at the exact moment trust is being formed. In a community where principals know each other (shared founding families, MAC/ISNA networks), that risk is amplified.
- The redesign should fix claims at the source: one approved proof statement shared by the email templates and the site.

### Gaps
- I did not verify the real tenant count, whether the Al Haadi quote is real, or what the product supports for Montessori narrative reports and non-Ontario report cards. These need the founder.

---

## 8. Implications for the website redesign

### Takeaway
Build the site for **a small, faith-based or Montessori school in Ontario that has no real system yet**. Speak to the principal-operator, mirror their identity, make proof honest and specific, and replace the false trial CTA with the 15-minute walkthrough the outreach already offers.

### Cited Findings
- (Evidence is summarized from Q1–Q7; see the citations there.) Key anchors:
  - 115 Islamic + 104 Montessori of 315 dossiers
  - 49 observed no-SIS vs 19 named incumbents
  - 26 waitlists; 22 schools founded since 2019; 83% with early years
  - Islamic tuition ~$200–$600/month
  - 21 of 24 call scripts anticipate a "too small / can't afford" objection
  - Site shows "50+ schools" and placeholder testimonials; /signup is tenant-only

  — [leads.csv](../../../../../sales/leads/leads.csv); [page.tsx](<../../../../src/app/(prelogin)/page.tsx>); [signup/page.tsx](<../../../../src/app/(user)/signup/page.tsx>)

### Inferences
1. **Hero message = "your first real system"**, not "switch SIS". Name the actual stack these schools run (Google Forms, Jotform, PDFs, Gmail, WhatsApp groups, Canva updates) and show it collapsing into one record → attendance → report card → parent portal. The evidence: 49 observed patchwork schools vs 19 incumbents.
2. **Segment pages, in this order:**
   - **For Islamic schools:** Ontario curriculum + Quran/Hifz/Arabic/Islamic Studies as real courses; JK/SK + T1/T2; waitlists; board-friendly overview.
   - **For Montessori schools:** the Casa-to-elementary continuum and observation-based reporting, *only after the narrative capability is verified*.
   - **For small independent schools:** IEP-heavy special-needs schools, bilingual schools, prep schools.

   Faith schools are 43% of the pipeline, and the Islamic segment carries almost all of the observed pain.
3. **"Start right from day one" story for new and growing schools:** setup done with you, records that scale grade by grade, parent portal from the first cohort. It speaks to 22+ young schools and 32 expansion signals, and matches the email promise "I'd tailor it… and help build everything out".
4. **Admissions, waitlist and enrollment block**, if the product supports it. Demand-side pain (waitlists, "all grades full", paid waitlists, two campuses) is distinctive, and competitors' sites rarely lead with it.
5. **Parent-portal proof:** real parent-view screenshots that replace newsletters, Canva graphics and WhatsApp. It answers 26 "no portal" and 40 informal-channel schools, and the "Coming Soon" portals show the aspiration.
6. **Honest, consistent proof:** remove or verify "50+ schools", "10,000+ students", "99.9%" and the placeholder testimonials. Lead with a named Al Haadi case study (with permission), sample Ontario report-card PDFs (JK/SK skill-based, T1/T2, Islamic-studies subjects, bilingual if supported) and a short founder story. Use the same proof wording in emails and on the site.
7. **Pricing transparency** for low-tuition schools: a visible price or a clear "priced for schools of 30–200" anchor plus "no setup fee". This pre-empts the top anticipated objection and fits Islamic schools charging ~$200–$600/month in tuition.
8. **Fix the CTA:** replace "Start Free Trial" (which leads to the tenant directory) with "Book a 15-minute walkthrough", matching every outreach email. Only reinstate a trial when one exists.
9. **Trust and legitimacy:** an Ontario-based founder, a real person and contact, Canadian data handling and privacy, and "works alongside Google Classroom / Seesaw". 12 call scripts anticipate "who are you / is this legit", and many decision-makers answer to a board.
10. **Mirror school language and respect:** "every child known", "small classes", "Ontario curriculum + Islamic studies", "from Casa through Grade 8", "lift the load". Avoid "brutal" and "nightmare" framing that implies the school is failing.
11. **French/bilingual:** an FAQ line, and possibly a French page, for the Ottawa cluster (8) and Quebec (5 emailed), once the founder confirms what's supported.
12. **Switch-story page (secondary):** a side-by-side for Edsembli/Maplewood, Thinkwave, AD-DIN, OwlWise, Transparent Classroom and Edsby users, covering migration help, Ontario-native report cards and small-school pricing. Keep it off the homepage given the low incumbent count.

### Gaps
- There is no reply or conversion data to say which message actually works. The redesign is grounded in prospect research, not in observed buyer responses. Logging outcomes in leads.csv would close this gap.
