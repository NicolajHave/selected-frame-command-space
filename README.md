# Selected Frame · Command Space — v2.1.1

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What changed in v2.1.1 (hotfix)

The site went down because pdfkit's `fs` dependency clashed with Next.js's webpack bundler. Three fixes:

1. **`next.config.js`** now contains a webpack config that excludes `fs`, `path`, etc. from client-side bundles
2. **`send-quote/route.js`** uses dynamic imports (`await import('pdfkit')`) instead of top-level imports, so pdfkit is only loaded when the route is actually called
3. **pdfkit upgraded** to 0.18.0 (was 0.15.0 — too old, had unrelated stability issues)

Additional improvements:
- **Real Selected Frame logo** embedded in PDFs (`public/images/logo-black.png`)
- **`logo-white.png`** also generated for use on dark UI surfaces
- **`runtime: 'nodejs'`** explicitly set on send-quote route to ensure full Node.js APIs

## How to deploy

You don't need a local Node.js install. Two options:

### Option A — Drag & drop entire repo (recommended, fastest)

1. Unzip this file locally
2. Go to https://github.com/NicolajHave/selected-frame-command-space
3. Click "Add file" → "Upload files"
4. Drag everything inside the unzipped folder (not the folder itself) into the upload area
5. Commit message: `v2.1.1 — Fix Vercel build, real logo, sqm`
6. Vercel auto-deploys

### Option B — Edit files individually via GitHub web UI

For each file, navigate to its path in GitHub and click "Edit" → paste content → "Commit".
Create new files/folders for `src/app/api/send-quote/route.js`.

## Required: Environment Variables in Vercel

| Name | Required |
|---|---|
| `ASANA_TOKEN` | Yes (already set) |
| `RESEND_API_KEY` | Yes (NEW for v2.1) |

## File reference

```
src/app/
├── page.js                              ← Main UI
├── layout.js                            ← Root layout
├── globals.css                          ← Global styles
└── api/
    ├── parse-quotation/route.js         ← Supplier PDF parser
    ├── projects/route.js                ← Asana fetcher
    └── send-quote/route.js              ← Email + PDF (NEW)

public/images/
├── logo-black.png                       ← Real Selected Frame logo (black)
├── logo-white.png                       ← Real Selected Frame logo (white)
└── kh_selected_sis_*.jpg                ← SIS reference photos

package.json                             ← Dependencies (locked)
next.config.js                           ← Webpack config (NEW: fs fallback)
```

## Smoke test after deploy

1. Open the site — should load normally (this is what was broken in v2.1.0)
2. Open Quotation Builder, upload supplier PDF → categories parse correctly
3. Click Send via Email → enter your own email → click Send
4. Verify email arrives with PDF attachment
5. Open PDF: see real Selected Frame logo, "60 sqm", dark total box, validity block

## Email config

- From: `Selected Frame <selectedsis@selectedframe.com>`
- Reply-To: `selectedsis@bestseller.com`
- BCC: `selectedsis@selectedframe.com`

## Known limitations

- PDF uses pdfkit's built-in Helvetica + Times-Roman fonts (renders as Arial-look on Windows)
- Resend free tier: 3,000 emails/month
- No rate limiting on send-quote endpoint (low-risk for internal tool)
- No in-app sent history (BCC kept on file instead)
