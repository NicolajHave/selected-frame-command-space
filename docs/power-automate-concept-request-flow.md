# Power Automate Flow — Concept Requests → Mail

Sends the notification mail when someone submits a concept request in
Command Space. Mail-only: no OneDrive step, no attachments to copy —
photos are linked from Vercel Blob in the body.

This needs its **own** Flow. The intake Flow also creates OneDrive
folders, which is the wrong shape here, and reusing its trigger URL would
mix the two payloads.

Build time: ~10 minutes. You need: Power Automate (standard licence) and
Outlook.

## The contract (what Command Space sends)

`POST` to the Flow's HTTP trigger URL, JSON body:

```json
{
  "emailTo": "nicolaj.ostergaard@bestseller.com;ulrik.riisom@bestseller.com",
  "emailSubject": "Selected Frame concept — Change: Hanger bar sits too high in 700 units",
  "emailBody": "Change — existing element\n\nHanger bar sits too high...",
  "emailBodyHtml": "<table role=\"presentation\" …>…</table>",
  "requestId": "9f0c…",
  "type": "CHANGE",
  "typeLabel": "Change — existing element",
  "title": "Hanger bar sits too high in 700 units",
  "description": "The bar on Wall Unit 700 Sidehang is out of reach…",
  "problem": "Staff use a step stool daily, which slows replenishment…",
  "elementCode": "105-99-012",
  "elementName": "Wall Unit 700 — Sidehang",
  "urgency": "UPCOMING_PROJECT",
  "urgencyLabel": "Needed for an upcoming project",
  "projectRef": "Magasin, Aarhus",
  "submitterName": "Bettina",
  "submitterEmail": "b@example.com",
  "region": "NORTHWEST",
  "partner": "Magasin",
  "photos": [{ "name": "wall-unit.jpg", "url": "https://…blob…/wall-unit.jpg" }],
  "submittedAt": "2026-08-27T09:00:00.000Z"
}
```

The body is a **stable contract** — renaming a field breaks the Flow, so
treat it as an API. `emailBody` is a ready-made plain-text mail: if you
just want it to work, send that and ignore the individual fields. They
are there for the day you want a nicer HTML layout.

## Build the Flow

1. Power Automate → **Create** → **Instant cloud flow** → skip the
   trigger picker → choose **When an HTTP request is received**.
2. Click **Use sample payload to generate schema** and paste the JSON
   above. This is what fills the dynamic-content picker.
3. Add an action: **Outlook → Send an email (V2)**.
   - **To**: dynamic content `emailTo`
   - **Subject**: dynamic content `emailSubject`
   - **Body**: the expression `triggerBody()?['emailBodyHtml']`

   **Send an email (V2)** has no *Is HTML* toggle — that belonged to the
   older *Send an email* action. In V2 the Body field is already an HTML
   field, so an HTML string placed there is sent as HTML. If the rich-text
   editor gets in the way, click the **`</>`** (code view) button on the
   body toolbar and put the expression in there.

   `emailBodyHtml` is the laid-out mail. `emailBody` carries the same content
   as plain text and is still sent, so a Flow pointed at it keeps working —
   useful as a fallback if the HTML one ever comes through empty.

   `emailBodyHtml` was added after the first build, so it does **not** appear
   in the dynamic-content picker until the sample payload is re-pasted. The
   expression above sidesteps that: **Body** field → **Expression** tab →
   paste it.

   **An empty mail body means the expression resolved to nothing** — almost
   always because the running app version predates the field. Check the
   Flow's run history: open the latest run, expand the trigger, and look for
   `emailBodyHtml` in the raw body. If it is absent, the deploy is the
   problem, not the Flow.
4. On the trigger card, set **Who can trigger the flow?** to **Anyone**.
   This is the step that decides whether the whole thing works: the default,
   *Any user in my tenant*, authenticates with an Entra ID bearer token and
   mints a URL with **no `sig=`** — Command Space has no way to obtain such a
   token, so every call comes back **401**. *Anyone* issues a URL carrying its
   own signature, which is what the app can call. "Anyone" means anyone
   holding the URL, and the signature is 43 random characters.
5. **Save.** The trigger URL only appears after the first save.
6. Copy the **HTTP POST URL** from the trigger card. It must end in
   `&sp=…&sv=1.0&sig=…`; if it stops at `?api-version=1`, step 4 was missed.
   Changing that setting mints a new URL, so re-copy after any change.

## Wire it up in Vercel

Add to Vercel → Project → Settings → Environment Variables:

| Var | Value |
|---|---|
| `POWER_AUTOMATE_CONCEPT_REQUEST_WEBHOOK` | the HTTP POST URL from step 6 |
| `CONCEPT_REQUEST_EMAIL_TO` | optional; defaults to Nicolaj + Ulrik, semicolon-separated |

Vercel reads env vars **only at build time**, so redeploy after adding
them — an empty commit to `main` is the safe trigger.

## Notes

- The trigger URL carries its own access signature in the `sig=` query
  parameter. It is a **credential, not just an address**: anyone holding
  it can send mail from the connected Outlook account. It belongs only in
  the Vercel env var. The only reliable way to invalidate one is to
  recreate the trigger, which mints a new URL.
- Delivery is **best-effort**. If the Flow is down or the var is unset,
  the request is still saved and shows up in the register — the form
  says so rather than pretending the mail went out.
- The dynamic-content picker is frozen at the schema generated in step 2,
  so a field added later needs `triggerBody()?['field']` until you
  regenerate the schema.
- Semicolons separate recipients in Outlook's **To** field, which is why
  the default recipient string uses them.
