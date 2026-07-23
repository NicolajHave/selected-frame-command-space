# Power Automate Flow — Project Intake → OneDrive + Mail (V2b)

One Flow does both Microsoft-side jobs after an intake is submitted:
copy the filecard PDF + attachments into OneDrive, and send the intake
mail from your own Outlook account (no Resend / no domain setup).

Build time: ~15 minutes. You need: Power Automate (standard licence),
OneDrive for Business, Outlook.

## The contract (what Command Space sends)

`POST` to the Flow's HTTP trigger URL, JSON body:

```json
{
  "projectName": "Magasin, Lyngby",
  "targetSubfolder": "Magasin, Lyngby",
  "files": [
    { "name": "Filecard - Magasin, Lyngby.pdf", "url": "https://...blob.../filecard.pdf" },
    { "name": "floorplan.pdf", "url": "https://...blob.../floorplan.pdf" }
  ],
  "emailTo": "selectedsis@bestseller.com",
  "emailSubject": "New Selected Frame project intake: Magasin, Lyngby",
  "emailBody": "# Selected Frame — Project Intake Filecard\n...",
  "pdfUrl": "https://...blob.../filecard.pdf",
  "asanaUrl": "https://app.asana.com/...",
  "submittedBy": "Nicolaj Østergaard",
  "region": "NORTH",
  "softShop": false
}
```

`emailTo` is filled from the Vercel env var `PROJECT_INTAKE_EMAIL_TO`
(set it in Vercel → Project → Settings → Environment Variables).

## Build the Flow

1. **Create** — Power Automate → Create → **Instant cloud flow** →
   skip the trigger picker → search for trigger
   **"When an HTTP request is received"** (Request connector).
2. **Trigger setup** — set *Who can trigger the flow* to **Anyone**.
   Paste the JSON above into **"Use sample payload to generate schema"**.
3. **Step 2: Apply to each** — add action **Control → Apply to each**,
   select output **`files`**. Inside the loop:
   - **HTTP** action (or *OneDrive → Upload file from URL* if available
     in your tenant): Method **GET**, URI **`items('Apply_to_each')?['url']`**.
   - **OneDrive for Business → Create file**:
     - Folder path: `/Selected Frame Projects/` + dynamic **`targetSubfolder`**
       (Create file auto-creates missing folders)
     - File name: dynamic **`name`** (from `files` item)
     - File content: **Body** of the HTTP action.
4. **Step 3: Get the PDF for the mail** — outside the loop, add one more
   **HTTP GET** with URI = dynamic **`pdfUrl`**.
5. **Step 4: Outlook → Send an email (V2)**:
   - To: dynamic **`emailTo`**
   - Subject: dynamic **`emailSubject`**
   - Body: dynamic **`emailBody`** (switch the editor to plain text `</>`)
   - Attachments: Name = `Filecard.pdf`, Content = **Body** of step 3's HTTP.
6. **Save.** Copy the **HTTP POST URL** the trigger now shows.
7. In Vercel → Project → Settings → Environment Variables, add
   `POWER_AUTOMATE_PROJECT_INTAKE_WEBHOOK` = that URL → redeploy.

## Test

Submit a test intake in Command Space. Within ~1 minute:
- OneDrive: `/Selected Frame Projects/<projectName>/` contains the
  filecard PDF + every attachment.
- The intake mail (from your Outlook) lands at `emailTo` with the PDF attached.
- Flow run history (Power Automate → My flows → run history) shows green.

## Notes

- The Flow URL contains its own access signature — treat it like a
  password. It lives only in the Vercel env var.
- If the Flow fails, the intake itself still succeeds — the webhook is
  best-effort and its result is logged in the submit response.
- Changing `emailTo` requires no Flow edit — it's the Vercel env var.
