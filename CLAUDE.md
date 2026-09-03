# Selected Frame — Command Space

Internal Next.js hub for Bestseller's Selected Frame / Shop-In-Shop business.
Deployed on Vercel. Data lives in Supabase (Postgres) and Vercel Blob;
project data is read from Asana.

## Stack

Next.js 14 App Router (JS, no TypeScript) · Supabase · Vercel Blob ·
`pdf-lib` for server-side PDFs · no CSS framework.

Only `dev`, `build`, `start` scripts exist — there is no test suite and no
linter. **Verify changes with `npm run build`.** If `node_modules` is missing
(the remote container gets reclaimed), run `npm ci` first.

## Conventions

The whole UI is **inline styles** — no CSS modules, no Tailwind. Every page
defines a local colour object `C` (steel/oak/surface/text/…). Match it.

- Display font: `'Cormorant Garamond', serif` (headings, big numbers)
- Mono: `'DM Mono', monospace` (codes, dates, filenames)
- Body: `'DM Sans'` (set globally in `globals.css`)

Data layers follow one shape (see `src/lib/external-folders/folders.js` as the
reference): row mappers converting snake_case → camelCase, an `unwrap()` that
turns Postgres error `42P01` into an actionable "run the schema" message, and
thin exported functions. API routes wrap those with HTTP concerns and call
`ensureConfiguredOr503()` first.

`src/app/page.js` is large and holds the shell, nav and several pages
(Overview, Projects, Quotation, ROI, Flow, Installed, Standards, Admin).
Bigger features live in their own directory and are imported into it.

## Modules

| Path | What |
|---|---|
| `src/app/project-intake/` | Sales intake form → filecard PDF + Asana task + folder |
| `src/app/opening-reports/` | Post-opening compliance report + Brand Spaces approval |
| `src/app/showroom-ops/` | Seasons, print lines, filename generator, shipping list |
| `src/app/external-project-folders/` | Per-project file workspace (password-gated) |
| `src/app/toolbox/` | Partner email templates (6 languages) |
| `src/app/concept-requests/` | Concept input register — form + triage, mails via Power Automate |
| `src/app/embed/project-intake/` | Chrome-free intake form for iframe embedding |
| `src/data/toolboxTemplates.js` | Email template copy |
| `src/app/standards-content.js` | Standards page content + element catalogue |
| `src/data/news.js` | Front-page News section content — order newest-first, first item is the featured card |

## News section

`src/data/news.js` feeds the Overview page's News section (`NewsSection` in
`src/app/page.js`). Order is newest-first; `NEWS[0]` renders as the big featured
card. Videos use a single `<video src>` with no `<source>` fallback, so only one
universally-supported format works in practice — export as `.mp4` (H.264) and
place it under `public/news/`. Watch the file size: it ships in the git repo and
in every Vercel deploy, so a 4K master should be compressed to a web-optimised
bitrate before committing. A `link` on an item points at an internal page id, so
removing a page from the nav means removing or repointing any news item that
links to it.

## Supabase — schemas are applied by hand

Schema files are **not** auto-migrated. When you add or change one, the user
must paste it into the Supabase SQL Editor. Always say so explicitly.

- `supabase/schema.sql` — External Project Folders (public schema)
- `supabase/opening-report-schema.sql` — Opening Reports (public schema)
- `supabase/showroom-ops-schema.sql` — Showroom Ops (isolated `showroom_ops` schema)
- `supabase/concept-requests-schema.sql` — Concept Requests (public schema)

**Gotchas learned the hard way:**

- A custom schema needs explicit grants — creating it via the SQL Editor does
  not grant `USAGE` to `anon`/`authenticated`/`service_role`, and PostgREST
  then fails with *permission denied for schema*. The grant block is at the
  bottom of `showroom-ops-schema.sql`.
- A custom schema must also be added under **Project Settings → API → Exposed
  schemas**, or every query returns `PGRST106`.
- Adding a column to a shipped table needs an idempotent
  `ALTER TABLE … ADD COLUMN IF NOT EXISTS` alongside the `CREATE TABLE`, so
  existing deployments pick it up on a re-run.

## Asana

"Projects" in Current are **tasks inside one container project**, gid
`1209245583930344` (overridable via `ASANA_PROJECT_INTAKE_PROJECT_ID`). So a
new intake creates a *task*, not a project — that is what makes it appear in
Current on the next poll (~15 min).

Task names follow `PARTNER, CITY // TYPE`; `/api/projects` splits on `//` for
the display name and type. Use `ASANA_TOKEN` — an older stub referenced
`ASANA_PAT`, which was never set.

**Sales regions** are `BENELUX & ROW`, `DACH`, `NORTHWEST`, `SOUTH`. They live
in three places that must agree: the intake dropdown (`REGIONS` in
`ProjectIntakePage.js`), the Current filter (`REGIONS` in `page.js`), and the
REGION custom field in Asana, which that filter matches against. Rename in one
place only and existing projects silently stop filtering. The strings double as
OneDrive folder names, so spelling and casing are load-bearing.

## PDFs (pdf-lib)

Three server-side generators share one trap: `src/lib/project-intake/filecard-pdf.js`,
`src/lib/quotation-pdf.js` and `src/lib/opening-reports/report-pdf.js`. The
`StandardFonts` encode **WinAnsi / CP1252
only**, and drawing anything outside that set *throws* — a typographic minus
(U+2212) pasted into a project name was enough to kill a whole render. Free-text
fields pick such characters up from Word and Excel routinely, and because the
integrations are best-effort the failure is silent: the rep just never gets a
filecard. Route every `drawText` and `widthOfTextAtSize` through
`safeText()` in `src/lib/pdf-text.js`; never call them directly on
user-supplied text.

pdf-lib embeds **JPEG and PNG only**. A photo off an iPhone is HEIC and a Mac
screenshot is WebP, so a generator that embeds user photos must list what it
could not embed rather than dropping it silently — the file itself is still
filed alongside.

The quotation PDF is rendered server-side (not from the print view) because a
print window produces no file to upload. `POST /api/external-folders/[folderId]/quotation`
generates it, stores it under the folder's `03-quotation` category, and is
gated by the same shared password as the rest of External Folders.

## Quotation parser

`src/app/api/parse-quotation/route.js` takes text lines the browser extracted
with pdf.js and returns three pillars (Inventory / Selected Deliveries /
Specific Project Cost). It handles two supplier formats — `sales-quote`
(item-per-line, no category headers) and `calculation` (explicit headers) —
chosen by `detectFormat()`.

In the sales-quote parser an item is recognised by its **item number at line
start**. Real numbers look like `105-06-001-E/01`, `112_99_040` and `0421`, so
the separator class must allow `/` and `.` — omitting `/` silently dropped two
line items from a real quote (€1,364 understated, and the hanger calculator
under-counted because those fixtures never reached it).

Supplier quotes still call the racks `Jeans (Denim) Rack Single/Double`, while
Standards uses `Single/Double/Triple Shelf Floor Rack`. `displayItemName()` in
`page.js` maps them **for display only** — the parsed item must keep its raw
name, because the hanger rules match on `jeans` and silently stop counting if
the data is renamed.

**Silent drops are the failure mode to watch.** `buildSummary()` compares the
parsed pillar sum against the PDF's stated grand total and raises an **error**
on divergence. Never downgrade that check — it is the only thing between a
mis-parse and a wrong quote reaching a partner.

To debug a parse, replay the real PDF rather than guessing:
`npm install --no-save pdfjs-dist@3.11.174`, mirror the client extraction in
`src/app/page.js` (group text items by `transform[5]`, ~2pt tolerance) to build
the `lines` array, then call the route's `POST` with
`{ json: async () => ({ lines }) }`.

## Showroom Ops — how a season is planned

A season is planned by ticking showrooms in **Sales List**; everything
downstream derives from those ticks. Ordering happens in waves, so dates live
in `season_sprints` rather than on the season.

**Customer number is the join key, never the name.** The sales list calls a
showroom *Düsseldorf* where the shipping list calls it *Kaarst*. Name is only a
fallback, normalised so `Montreal 1` and `Montreal1` resolve to one location.

**The MEN and WOMEN sales workbooks do not share a layout.** `CUSTOMER_No.`
sits in column 12 in one and 11 in the other, the header row is at a different
height, and the WOMEN file spells it `SHOWRROM`. Map by header name, never by
position. Zip splits into zip + city only when unambiguous — German
`41564 Kaarst Holzbüttgen` splits, UK `E1 6PX` and Swedish `412 63` must not.

**`Oslo 1/2/3` is one location holding three collection sets.** The registry
keeps one row called *Oslo*; the count lives on `season_showrooms.men_sets` /
`women_sets` because it changes per season. It is what makes a sign that goes
to everyone arrive in Oslo three times — production quantity for
`LOCAL_SHOWROOMS` lines is derived from these, never typed. Collection-meeting
scopes are a single venue and keep an editorial amount.

**`showroom_materials` holds standing customisations** (Helsinki's 850×2000
lightposter). They belong to the showroom, not the season, and are derived on
read so an edit reaches every season at once. Gender `BOTH` means **one item
for the location** — emitting it per gender doubles the quantity and had the
buyer shipping twice.

The Material Catalog carries the recurring boards so a line only needs its
motif; `src/lib/showroom-ops/standard-materials.js` defines them and the
Registry Admin button inserts only the ones missing.

Schema revisions land often here, so reads degrade rather than fail:
`isMissingSchema()` lets a season load without sprints and a tick save without
set counts. After running the SQL, `NOTIFY pgrst, 'reload schema';` — a stale
PostgREST cache reports the column as missing.

## Footprint (square metres per FY)

The Selected FY runs **1 August → 31 July**. `src/lib/fiscal-year.js` is the
pure module for it, and labels a year by the calendar year it *started* in
(`FY 26/27`). A project counts in the FY of its **completion date once
finished, its due date otherwise**, so delivered work stays in the year it
actually landed in — which is why the view keeps delivered and planned totals
apart.

Square metres live in Asana as the **`SQM` number custom field** (gid
`1217571452526962`, overridable via `ASANA_SQM_FIELD_ID`), not in Supabase:
every project in Current is an Asana task, whereas External Folders exist only
for *some* projects, so a Supabase column would leave silent gaps in the
report. `createIntakeTask()` attaches it on creation and, if Asana rejects the
field, retries once without it — the task keys the External Folder and puts the
project in Current, so it must never be lost over a custom-field problem.
Projects with no value are surfaced as "missing" rather than counted as zero.

## Writing into External Folders

**Deleting a folder deletes the Blob objects first, then the row.** The file
rows hold the only pointers to those blobs and the FK cascade drops them along
with the folder, so the reverse order orphans the storage with no way to find
it again. `DELETE /api/external-folders/[folderId]` also refuses unless
`confirmName` matches the project name exactly.

**Draft Studio files into `02-floorplans` as `<project> - Draft N`.**
`nextDraftNumber()` takes `max(existing) + 1`, never `count + 1` — deleting a
draft must not hand its number to a different document, since drafts get shared
with partners. Only filenames matching the pattern we write are counted.

## Blob uploads

Every upload path (External Folders, Opening Reports, Concept Requests) signs a
token in an `/upload-url` route, and Blob refuses any content type the token
does not list in `allowedContentTypes` — a rejection that surfaces only when a
user tries, never at build time. Adding a file type means editing that list,
not just the `accept` attribute on the input.

Never guess a content type client-side: a document dragged in from Explorer can
arrive with an empty `file.type`, and defaulting it to an image type gets it
rejected under a second, more confusing error. Fall back on the extension.

## Concept Requests

Additions, changes and feedback on the concept, in `concept_requests`. Triage
runs NEW → UNDER_REVIEW → ACCEPTED / DECLINED / PARKED → IMPLEMENTED; the
decision note is what makes the register worth keeping.

A fourth type, `COST`, was retired from the form — cost optimisation is decided
internally rather than collected. The label is kept in the display maps so any
row already stored under it still reads properly.

A request points at an element from the Standards catalogue by code, and
`element_name` is **denormalised onto the row** so a later catalogue rename
leaves old requests readable.

**Photos upload to Blob before the row is created.** One POST then both stores
the request and fires one webhook carrying the links. The alternative — create,
upload, patch, notify — leaves a request whose mail lists no photos if it fails
halfway. Deleting a request drops its blobs before the row, as everywhere else.

## OneDrive paths are shared, not duplicated

`src/lib/onedrive-path.js` builds `<year>/<REGION>/<project>` and is used by
both Project Intake and Opening Reports. They must produce the *same* folder
for the same project — the point of filing an opening report is that it lands
beside the filecard, and a stray difference in how a slash or a trailing dot is
handled would silently create a second folder nobody goes looking in.

The year is the one thing they cannot always agree on: intake uses the desired
opening date, a report the project's due date. Those differ only when a project
slips across a new year, so the Flow must create the folder if it is missing.

## Opening Reports

A report is started by **choosing its project** — open or completed. The Asana
gid is the join key: it keys the External Folder too, which is what lets an
approved report file itself where the filecard already is. Name and region are
denormalised onto the row, because a report records what was true on opening
day and must stay readable if the task is later renamed.

Deleting a report and approving one both sit behind a shared code
(`OPENING_REPORT_ADMIN_CODE`, default `1234`), checked **server-side** so the
button cannot be clicked past in devtools.

Approval is where the record is made: a PDF is generated, filed to the
project's External Folder and handed to Power Automate for OneDrive. The
approval commits first and everything after it is best-effort — the UI names
what did not land rather than implying it all worked.

**The folder's categories are a fixed list** (`CATEGORIES` in
`external-project-folders/ui.js`). Filing under an invented one renders as an
unknown group, so the report goes to `07-handover` and its photos to
`06-photos`.

Writes that touch a recently added column **degrade instead of failing**: the
schema file is applied by hand, so a release reaches the app before the SQL
reaches Supabase, and a rep standing in a shop on opening day must not be
blocked by a pending migration. The report is taken without the project link
and the response says which SQL to run. The check is deliberately narrower than
the showroom-ops helper of the same name — a missing *table* still fails loudly
rather than writing half a report.

## Environment variables

| Var | Used for |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | All Supabase access (server-side only) |
| `ASANA_TOKEN` | Reading Current + creating intake tasks |
| `ASANA_PROJECT_INTAKE_PROJECT_ID` | Optional; falls back to the hard-coded gid |
| `EXTERNAL_FOLDER_PASSWORD` | Shared gate for External Folders |
| `POWER_AUTOMATE_PROJECT_INTAKE_WEBHOOK` | Intake → OneDrive + Outlook flow |
| `PROJECT_INTAKE_EMAIL_TO` | Recipient the flow mails |
| `POWER_AUTOMATE_CONCEPT_REQUEST_WEBHOOK` | Concept Requests → Outlook flow |
| `CONCEPT_REQUEST_EMAIL_TO` | Optional; defaults to Nicolaj + Ulrik, semicolon-separated |
| `POWER_AUTOMATE_OPENING_REPORT_WEBHOOK` | Opening Reports → Outlook + OneDrive flow |
| `OPENING_REPORT_EMAIL_TO` | Optional; defaults to Nicolaj, semicolon-separated |
| `OPENING_REPORT_ADMIN_CODE` | Optional; the delete / approve code, defaults to `1234` |
| `RETENTION_DAYS`, `RETENTION_REMINDER_EMAIL`, `CRON_SECRET` | Folder retention job |
| `EMBED_ALLOWED_ORIGINS` | Restricts who may iframe `/embed/*` (unset = any) |

Integrations are **best-effort**: a failing webhook, Asana call or folder copy
must never fail the user's submission. Report the outcome instead.

## Working agreements

- **Always merge to `main`.** Finish a task by creating the PR *and* merging it
  via the GitHub MCP tools, so `main` matches what is reported as done. Never
  leave work sitting on the branch.
- The work branch is long-lived and every PR is **squash**-merged, which
  rewrites history — so the branch is behind `main` the moment a PR lands and
  the next PR from it fails with "Pull Request has merge conflicts" even when
  nothing really conflicts. Reset onto main and replay instead of merging:
  `git fetch origin main && git checkout -B <branch> origin/main`, then
  cherry-pick the new commits and force-with-lease push.
- Verify with `npm run build` before committing. For pure logic (filename
  generation, PDF building, sanitisation) also run it directly with `node` —
  a green build does not prove the logic is right.
- The user deploys via Vercel on merge and does not run npm locally. Don't add
  a dependency when a CDN script fits the existing pattern (SheetJS and pdf.js
  are both loaded that way).
- Vercel reads env vars **only at build time**, so setting one changes nothing
  until a rebuild. To force one, push an empty commit to `main` — that is the
  safe trigger. Do not reach for the Vercel deploy tool available here: it
  uploads a file tree as a *new* project rather than rebuilding this one, which
  would produce a duplicate without the env vars or the git connection.
- Copy is British English. The brand is written **Selected** — never SELECTED.
- Write in Danish when the user does.

## Mail — Power Automate is the only working path

`src/lib/external-folders/email.js` and the intake email helper are **stubs**
that return `provider_not_configured`. Nothing in the app sends mail directly;
every mail that actually arrives goes out through a Power Automate flow calling
Outlook. Adding mail to a feature means a new flow and a new webhook env var —
not a call to those helpers.

Each flow gets its **own** trigger URL. The intake flow also creates OneDrive
folders, so reusing it for a mail-only feature sends the wrong payload shape.
`docs/power-automate-concept-request-flow.md` is the mail-only build guide.

`docs/power-automate-opening-report-flow.md` is the third, and the pattern to
copy when one feature needs mail at more than one moment: it sends an `event`
field (`created` / `approved`) and the Flow branches on it, rather than making
the user build and maintain two flows.

A new HTTP trigger defaults to **Who can trigger the flow? → Any user in my
tenant**, which authenticates with an Entra ID bearer token and mints a URL
with **no `sig=`**. The app cannot obtain such a token, so every call returns
**401**. The setting must be **Anyone**, whose URL carries its own signature.
A trigger URL ending at `?api-version=1` is the tell.

## Power Automate (intake → OneDrive + mail)

`docs/power-automate-intake-flow.md` has the full build guide. The webhook body
is a **stable contract** — `projectName`, `targetSubfolder`, `targetYear`,
`targetRegion`, `targetPath`, `pdfFileName`,
`files[{name,url}]`, `emailTo`, `emailSubject`, `emailBody`. Renaming a field
breaks the user's flow, so treat it as an API. `targetPath` is
`<year>/<REGION>/<project>`, with the year taken from the desired opening date,
so a 2027 opening files under 2027 without anyone having to remember.

The flow must **not** create the Asana task — `/api/project-intake/submit`
already does (step 3), and its gid keys the External Folder. Duplicating it in
the flow yields two tasks per intake. The task URL is handed to the flow as
`asanaUrl` for linking in the mail.

Note: the flow's dynamic-content picker is frozen at the schema generated when
the sample payload was pasted, so a newly added field needs
`triggerBody()?['field']` until the schema is regenerated.

The trigger's HTTP POST URL carries its own access signature in the `sig=`
query parameter — it is a credential, not just an address. It belongs only in
the Vercel env var. Anyone holding it can drop files in the OneDrive folder and
send mail from the connected Outlook account; the only reliable way to
invalidate one is to recreate the trigger, which mints a new URL.
