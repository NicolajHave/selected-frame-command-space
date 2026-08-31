# Power Automate Flow — Opening Report → Mail + OneDrive

One Flow, two events. It mails when a report is started, and on approval it
mails again *and* copies the report PDF and photos into the project's OneDrive
folder — the same folder the filecard was filed into at intake.

This needs its **own** Flow, separate from the intake and concept-request
flows. Build time: ~20 minutes. You need Power Automate, Outlook and OneDrive
for Business.

## The contract (what Command Space sends)

`POST` to the Flow's HTTP trigger URL, JSON body:

```json
{
  "event": "approved",
  "emailTo": "nicolaj.ostergaard@bestseller.com",
  "emailSubject": "Opening report approved: Magasin, Lyngby",
  "emailBody": "Opening report approved\n\nMagasin, Lyngby\n…",
  "emailBodyHtml": "<table role=\"presentation\" …>…</table>",
  "projectName": "Magasin, Lyngby",
  "asanaProjectId": "1209245583930344",
  "targetYear": "2026",
  "targetRegion": "NORTHWEST",
  "targetSubfolder": "Magasin, Lyngby",
  "targetPath": "2026/NORTHWEST/Magasin, Lyngby",
  "files": [
    { "name": "Opening Report - Magasin, Lyngby.pdf", "url": "https://…blob…/report.pdf" },
    { "name": "entrance.jpg", "url": "https://…blob…/entrance.jpg" }
  ],
  "reportId": "…", "reportUrlSlug": "…",
  "partnerName": "Magasin", "location": "Lyngby",
  "openingDate": "2026-08-20", "sqm": 64,
  "completedByName": "Glenn Murphy Hedager",
  "approvedByName": "Nicolaj Have Østergaard",
  "approvalNote": "Approved with the fixture deviation noted.",
  "deviations": 2, "photoCount": 6, "status": "approved"
}
```

`event` is `created` or `approved`. On `created` the `files` array is empty
and there is nothing to file — it is a heads-up that a report has been started.

`targetPath`, `targetYear`, `targetRegion`, `targetSubfolder` and `files` use
the **same field names as the intake flow**, so the OneDrive actions can be
copied from it rather than rebuilt.

## Build the Flow

1. **Create** → **Instant cloud flow** → skip the trigger picker → **When an
   HTTP request is received**.
2. **Use sample payload to generate schema** and paste the JSON above.
3. Set **Who can trigger the flow?** to **Anyone**. The default, *Any user in
   my tenant*, expects an Entra ID bearer token and mints a URL with no `sig=`
   — the app cannot obtain one, so every call returns **401**.
4. Add a **Condition**: `event` **is equal to** `approved`.
5. **In the "If no" branch** (a report was started) — add
   **Outlook → Send an email (V2)**:
   - **To**: `emailTo`  ·  **Subject**: `emailSubject`
   - **Body**: expression `triggerBody()?['emailBodyHtml']`
6. **In the "If yes" branch** (approved) — add:
   - **Apply to each** over `files`, and inside it
     **OneDrive for Business → Create file**:
     - **Folder Path**: your Selected Frame root + `/` + `targetPath`
     - **File Name**: `name` from the current item
     - **File Content**: the body of an **HTTP GET** on the item's `url`
       (Blob links are public, so no authentication is needed)
   - then **Outlook → Send an email (V2)**, same three fields as step 5.
7. **Save**, then copy the **HTTP POST URL** from the trigger card. It must end
   in `&sp=…&sv=1.0&sig=…`; if it stops at `?api-version=1`, step 3 was missed.

**Send an email (V2)** has no *Is HTML* toggle — its Body field is already an
HTML field, so an HTML string placed there is sent as HTML.

## Wire it up in Vercel

| Var | Value |
|---|---|
| `POWER_AUTOMATE_OPENING_REPORT_WEBHOOK` | the HTTP POST URL from step 7 |
| `OPENING_REPORT_EMAIL_TO` | optional; defaults to Nicolaj. Semicolons separate recipients |
| `OPENING_REPORT_ADMIN_CODE` | optional; the delete / approve code, defaults to `1234` |

Vercel reads env vars **only at build time**, so redeploy after adding them —
an empty commit to `main` is the safe trigger.

## Notes

- The folder must be **created if it is not there**. `targetPath` is rebuilt
  from the project's due date, region and name; intake used the *desired
  opening date* at the time. Those agree unless a project slipped across a new
  year, which is the one case where the report would otherwise have nowhere to
  land. OneDrive's *Create file* makes missing folders on the way.
- Delivery is **best-effort**. If the Flow is down, the approval still stands
  and the report and photos are still in Command Space and the project's
  External Folder — the app says plainly what did not go out.
- The trigger URL carries its own signature in `sig=`. It is a credential, not
  just an address: anyone holding it can write to that OneDrive and send mail
  from the connected account. It belongs only in the Vercel env var.
