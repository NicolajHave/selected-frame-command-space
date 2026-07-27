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
  "pdfFileName": "Filecard - Magasin, Lyngby.pdf",
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
   select output **`files`**. Inside the loop, add TWO actions:

   **3a. HTTP action** (downloads the file from its Blob URL):
   - **Method:** `GET`
   - **URI:** this must be an EXPRESSION, not typed text (typing it plain
     gives "Enter a valid URI"). Click the URI field → **fx (Expression)**
     tab → paste `items('Apply_to_each')?['url']` → Add. It becomes a
     coloured token.
   - Leave Headers / Queries / Body empty; Authentication `None`.

   **3b. OneDrive for Business → Create file** (saves it):
   - **Folder Path:** type `/Selected Frame Projects/` then insert the
     dynamic value **`targetSubfolder`** right after it. (If the field only
     shows a folder picker, click the small edit/`T` icon to switch to a
     custom value.) Create file auto-creates missing folders.

     *To use an existing folder instead:* the connector takes paths relative
     to your OneDrive root, so translate the SharePoint URL by dropping
     everything up to and including `/Documents/` and decoding `%20` to
     spaces. E.g. `.../personal/<you>/Documents/BRAND%20SPACE/01_INCOMING%20FILECARDS`
     becomes `/BRAND SPACE/01_INCOMING FILECARDS/` — then append the dynamic
     `targetSubfolder` for a per-project subfolder, or leave it off to drop
     every file flat into that one folder.
   - **File Name:** dynamic **`name`** (or expression
     `items('Apply_to_each')?['name']`).
   - **File Content:** dynamic **Body** (the output of the HTTP action, 3a).
4. **Step 3: Get the PDF for the mail** — **outside / below** the Apply to
   each loop, add one more **HTTP** action: Method `GET`, URI = dynamic
   **`pdfUrl`** (this one is a plain dynamic value, not an expression).
   It will be named `HTTP 2`.
5. **Step 4: Outlook → Send an email (V2)**, also outside the loop:
   - To: dynamic **`emailTo`**
   - Subject: dynamic **`emailSubject`**
   - Body: dynamic **`emailBody`** (switch the editor to plain text `</>`)
   - Attachments: under **Advanced parameters → Show all**. Name = dynamic
     **`pdfFileName`** (e.g. `Filecard - Magasin, Lyngby.pdf`),
     Content = **Body of `HTTP 2`**.

   ⚠️ Pick the Body from **HTTP 2**, not from the HTTP inside the loop.
   Referencing the loop's output here makes Power Automate wrap this action
   in its own Apply to each — which sends one email per file.
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
