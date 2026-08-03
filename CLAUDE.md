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
| `src/app/embed/project-intake/` | Chrome-free intake form for iframe embedding |
| `src/data/toolboxTemplates.js` | Email template copy |
| `src/app/standards-content.js` | Standards page content + element catalogue |

## Supabase — schemas are applied by hand

Schema files are **not** auto-migrated. When you add or change one, the user
must paste it into the Supabase SQL Editor. Always say so explicitly.

- `supabase/schema.sql` — External Project Folders (public schema)
- `supabase/opening-report-schema.sql` — Opening Reports (public schema)
- `supabase/showroom-ops-schema.sql` — Showroom Ops (isolated `showroom_ops` schema)

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

**Silent drops are the failure mode to watch.** `buildSummary()` compares the
parsed pillar sum against the PDF's stated grand total and raises an **error**
on divergence. Never downgrade that check — it is the only thing between a
mis-parse and a wrong quote reaching a partner.

To debug a parse, replay the real PDF rather than guessing:
`npm install --no-save pdfjs-dist@3.11.174`, mirror the client extraction in
`src/app/page.js` (group text items by `transform[5]`, ~2pt tolerance) to build
the `lines` array, then call the route's `POST` with
`{ json: async () => ({ lines }) }`.

## Environment variables

| Var | Used for |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | All Supabase access (server-side only) |
| `ASANA_TOKEN` | Reading Current + creating intake tasks |
| `ASANA_PROJECT_INTAKE_PROJECT_ID` | Optional; falls back to the hard-coded gid |
| `EXTERNAL_FOLDER_PASSWORD` | Shared gate for External Folders |
| `POWER_AUTOMATE_PROJECT_INTAKE_WEBHOOK` | Intake → OneDrive + Outlook flow |
| `PROJECT_INTAKE_EMAIL_TO` | Recipient the flow mails |
| `RETENTION_DAYS`, `RETENTION_REMINDER_EMAIL`, `CRON_SECRET` | Folder retention job |
| `EMBED_ALLOWED_ORIGINS` | Restricts who may iframe `/embed/*` (unset = any) |

Integrations are **best-effort**: a failing webhook, Asana call or folder copy
must never fail the user's submission. Report the outcome instead.

## Working agreements

- **Always merge to `main`.** Finish a task by creating the PR *and* merging it
  via the GitHub MCP tools, so `main` matches what is reported as done. Never
  leave work sitting on the branch.
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
