# Report-card marketing images

These images are the backend's real report-card and progress-report templates, rendered with **synthetic data** for the fictional school *Brightwater Academy*. No database, no network and no real student, parent or staff names were used.

| File | What it shows |
|---|---|
| `report-card-grade5.jpg` | Grades 1–8 report card, page 1: header, student info, work-habits legend, achievement legend |
| `report-card-grade5-p2.jpg` | The same report card, page 2: the Language Arts and Math cards, with marks, ratings and teacher comments |
| `kindergarten-report.jpg` | SK (Senior Kindergarten) skill-based report card, page 1 |
| `progress-report-grade5.jpg` | Grades 1–8 progress report, page 1 |

All four are 1700 × 2402 px JPEGs at quality 82. Each is one page of an **A4** PDF, rasterized at about 205 dpi.

## Where they come from (schoolmule-backend)

| Image | Template (HTML builder) | Production caller |
|---|---|---|
| report-card-grade5 | `templates/reportCardTemplate.js` → `getReportCardHTML()` | `controllers/reportCard.controller.js` (the generic path, not the Al Haadi Term 2 branch) |
| progress-report-grade5 | `templates/progressReportTemplate.js` → `getProgressReportHTML()` | `controllers/progressReports.controller.js` → `generateSingleProgressReport()` |
| kindergarten-report | `templates/alHaadiReportCardSKTemplate.js` → `getAlHaadiReportCardSKHTML()` | `controllers/sk.controller.js` → `generateSingleSKReportCard()` (every SK student, at any school, goes through this path) |

The PDFs are printed with the backend's own `utils/pdfGenerator.js` → `createPDFBuffer()`. It runs with production's defaults: A4, 40px margins, `printBackground`, and the backend's Puppeteer. Page 1 is then rasterized with poppler's `pdftoppm`.

## Synthetic data

- **School:** Brightwater Academy, 250 Brightwater Avenue, Toronto, ON, (416) 555-0142. The number is in the reserved fictional 555-01xx range. The logo is a plain teal "B" tile, made as an SVG data URI, the same mark the demo film uses. There is no principal signature and no school stamp, so the template leaves that footer out.
- **Grade 5 student:** Adam Haddad, homeroom teacher Layla Saleh, OEN `123-456-789`, 2 days absent, First Term 2026–2027.
  - Marks: Language Arts 86.4, Math 91.2, Science 88.0, Social Studies 82.5, French 78.6, Arabic 84.3, Islamic Studies 93.1, Art 89.0, Physical Education 92.5. Grades 4–8 show percentages; grades 1–3 would show letter grades.
  - Each subject has a short, natural teacher comment.
  - Progress report subject teachers (all synthetic): Huda Mansour, Rana Aziz, Claire Martin, Yusuf Rahimi, Omar Nasser and Bilal Ahmed, plus Layla Saleh.
- **SK student:** Sara Haddad, teacher Amina Farouk and assistant Dalal Youssef, OEN `987-654-321`, 1 day absent.
  - Only Term 1 is rated. The Term 2 column is blank, as it is on a real first-term card.
  - The subjects and standards are the report-card framework in `database/sk_seed_alhaadi.sql`. Each school configures its own framework in `sk_subjects` / `sk_standards`. Page 1 shows only the Mathematics standards.

## Rating scales shown

- **Report card, Work Habits & Behaviour:** N = Needs Improvement, S = Satisfactory, G = Good, E = Excellent.
- **Report card, Achievement:**

  | Level | Letters and percentages |
  |---|---|
  | Level 4 | A+ 90–100, A 85–89, A- 80–84 |
  | Level 3 | B+ 77–79, B 73–76, B- 70–72 |
  | Level 2 | C+ 67–69, C 63–66, C- 60–62 |
  | Level 1 | D+ 57–59, D 53–56, D- 50–52 |

  Below 50 prints as R. Enrolled with no evidence prints as I.
- **Progress report:** E Excellent, G Good, S Satisfactory, N Needs Improvement. There is also a Core Standards line: Exceeding, Meeting, Working towards or Not Meeting Common Core Standards.
- **SK report card:** E Exemplary, P Proficient, DV Developing, EM Emerging, NI Needs Improvement, N/A Not Assessed.

## Deliberate deviations from a raw render

- The SK template hardcodes one real school's website and principal name. The script swaps them for "www.brightwater.example" and "Principal: Ms. Nadia Karim", the demo admin. It fails loudly if those strings ever change.
- On the SK card the corner logo is left off. The template pins the logo top-right over the title and the "Days Absent" cell, so any opaque logo hides them.

## Re-render

```bash
node docs/research/landing-revamp/tools/render-report-cards.js [outDir]
```

The script `require()`s the templates and `pdfGenerator` straight from `schoolmule-backend`, which it only reads. It needs `pdftoppm` and `pdfinfo` from Homebrew poppler. The default `outDir` is this folder. Intermediate HTML and PDF files go to `build/`, next to the script.

The script is kept at `docs/research/landing-revamp/tools/render-report-cards.js`; it reads the sibling `schoolmule-backend` checkout and never touches a database.
