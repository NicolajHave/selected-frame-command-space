# Selected Frame · Command Space — v2.1.0

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## How to deploy this update

You don't need a local Node.js install to deploy. Two options:

### Option A — Replace files via GitHub web UI (easiest, no local tools)

1. Go to your repo: https://github.com/NicolajHave/selected-frame-command-space
2. For each file in this ZIP, navigate to the same path in GitHub and click "Edit" → paste new content → "Commit changes"
3. For new files (the `send-quote/` folder): click "Add file" → "Create new file" → type the path including folder name, e.g. `src/app/api/send-quote/route.js`
4. Vercel will auto-deploy after each commit

### Option B — Drag & drop entire repo (faster)

1. Go to your repo on GitHub
2. Click "Add file" → "Upload files"
3. Drag the entire contents of this ZIP into the upload area
4. Commit message: "v2.1.0 — Resend email integration"
5. Vercel auto-deploys

## Required: Environment Variables in Vercel

Make sure these are set in Vercel → Settings → Environment Variables:

| Name | Required | Notes |
|---|---|---|
| `ASANA_TOKEN` | Yes | Already set |
| `RESEND_API_KEY` | Yes (NEW) | You said this is set — verify the exact name spelling |

## Required: Replace the logo file

The `public/images/logo-black.png` file in this ZIP is a **placeholder**. The original `Selected_Frame_Logo_FINAL.png` you provided rendered as solid black — likely an upload artifact. You need to:

1. Export the proper Selected Frame logo as PNG with **black artwork on transparent background**
2. Save it as `logo-black.png` (recommended size: 400×100px or similar, with proper transparency)
3. Same for `logo-white.png` (white artwork on transparent background, used in dark UI)
4. Replace these files in `public/images/` and commit

Until you do this, the PDF will show a black square where the logo should be. Everything else works normally.

## What's new in v2.1.0

- **Email backend:** `Send via Email` button now sends real emails via Resend API
- **Server-side PDF generation:** PDF is built from data and attached to emails automatically
- **Email config:**
  - From: `Selected Frame <selectedsis@selectedframe.com>`
  - Reply-To: `selectedsis@bestseller.com`
  - BCC: `selectedsis@selectedframe.com` (you keep a copy)
- **Sales area unit:** changed from `m²` to `sqm` everywhere in PDF output
- **Logo embedding:** PDF now includes `logo-black.png` from `public/images/`

## What's unchanged

- All v2.0 features (parse warnings, dual logo support, project filters, etc.)
- HTML print PDF (the "Export Quotation as PDF →" button) still works the same way
- Asana integration unchanged

## File reference

```
src/app/
├── page.js                              ← Main UI (Quotation Builder, Projects, ROI, etc.)
├── layout.js                            ← Root layout
├── globals.css                          ← Global styles
└── api/
    ├── parse-quotation/route.js         ← PDF parser for supplier quotations
    ├── projects/route.js                ← Asana data fetcher
    └── send-quote/route.js              ← NEW: Resend email + server-side PDF

public/images/                           ← Logos and SIS reference photos
package.json                             ← Dependencies (locked exact versions)
next.config.js                           ← Next.js config
vercel.json                              ← Vercel deployment config
.env.example                             ← Reference for environment variables
.gitignore                               ← Git exclusions
```

## Smoke test after deploy

1. Open Quotation Builder
2. Upload the Stockmann supplier PDF (or any &elements quotation)
3. Verify parse warnings show only expected items (Gender info note, Electrician NOT INCLUDED warning)
4. Verify Total excl. VAT shows correctly (€48.510 for Stockmann)
5. Click "Send via Email ✉" → enter your own email → click Send
6. Confirm email arrives with PDF attachment
7. Check BCC inbox for copy
8. Click Reply on the email → verify it goes to `selectedsis@bestseller.com`

## Known limitations

- **PDF logo:** placeholder until you upload proper transparent PNG (see above)
- **PDF fonts:** uses pdfkit's built-in Helvetica + Times-Roman. On Windows these render as Arial-look. On Mac as Helvetica. Both look professional.
- **Resend free tier:** 3,000 emails/month, 100/day. Plenty for normal use.
- **No rate limiting:** the `/api/send-quote` endpoint has no throttle. Internal tool, low risk, but worth noting.
- **No sent history:** you have BCC for record-keeping, but no in-app log of sent quotes.

## Versioning

`package.json` and sidebar both report `2.1.0`. One source of truth maintained.
