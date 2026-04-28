# Selected Frame · Command Space — v2.1.2

Internal Brand Spaces tool for Selected Frame concept.
Live: https://selected-frame-command-space.vercel.app

## What changed in v2.1.2 (hotfix)

**Critical fix:** PDFs failed to send via email with error `ENOENT: Helvetica.afm not found`. This is a known pdfkit + Vercel issue — the font metric files in `node_modules/pdfkit/js/data/` were not bundled with the serverless function deployment.

**Fix:** `next.config.js` now uses `experimental.outputFileTracingIncludes` to explicitly tell Vercel to include those files in the `/api/send-quote` deployment.

**Also fixed:** Logo crop marks restored — they're part of the brand identity, not a glitch in the original PDF.

## How to deploy

1. Unzip locally
2. Go to https://github.com/NicolajHave/selected-frame-command-space
3. Click "Add file" → "Upload files"
4. Drag everything inside the unzipped folder (not the folder itself) into the upload area
5. Commit message: `v2.1.2 — Fix pdfkit font loading on Vercel`
6. Vercel auto-deploys

## Smoke test priorities

After deploy, the critical test is:

1. Open Quotation Builder, upload supplier PDF
2. Click Send via Email → enter your own email → click Send
3. **Should now succeed** (was failing with ENOENT before)
4. Verify email arrives, PDF attached, logo with crop marks visible

## Required env vars

- `ASANA_TOKEN` (already set)
- `RESEND_API_KEY` (already set)

## Email config

- From: `Selected Frame <selectedsis@selectedframe.com>` (Resend-verified domain)
- Reply-To: `selectedsis@bestseller.com` (so replies go to your real inbox)
- BCC: `selectedsis@selectedframe.com`

## Known limitations

- pdfkit uses built-in Helvetica + Times-Roman (renders as Arial-look on Windows)
- Resend free tier: 3,000 emails/month
- No rate limiting on send-quote endpoint
