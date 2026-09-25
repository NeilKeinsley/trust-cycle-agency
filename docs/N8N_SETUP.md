# n8n lead pipeline: setup on Railway

n8n runs in its own shared Railway project, **"n8n"**, so other projects can use it too. It comes from the "n8n (w/ postgres)" template: the official `n8nio/n8n` image in regular mode, plus Postgres for workflows, credentials and executions. The site lives in a separate Railway project, **"Trust Cycle Agency"**.

- **Public editor:** https://n8n-production-93bcc.up.railway.app
- **How the site reaches it:** over n8n's **public HTTPS URL**. Railway's private network (`*.railway.internal`) only works between services in the same project. Every call is server-to-server and protected by the shared secret header.

The workflow design and the scoring rubric are in `BACKEND_PLAN.md`. The importable workflows are in `n8n/`.

## 1. Create the n8n owner account (you)

Open the editor URL and create the owner account with a strong password. Store it in your password manager. There is no default account; whoever opens the URL first becomes the owner, **so do this right away**.

## 2. Create a shared secret (you)

Generate a random secret locally, for example with PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 40 | % {[char]$_})
```

It gets used in two places below, and it must be identical in both:
- the n8n credential in step 3;
- the Railway site variable in step 6.

## 3. Credentials in n8n (you)

In n8n, go to **Credentials → Add credential** and create these:

| Credential | Type | Values |
|---|---|---|
| `Trust Cycle webhook secret` | Header Auth | Name `x-webhook-secret`, Value = the secret from step 2. **Name is the HTTP header name**, not a label. Anything else makes n8n reject every lead with 403. |
| `Google Sheets` | Google Service Account API | `client_email` and `private_key` from the service account's JSON key (see step 4). Paste the key with real line breaks, not the JSON's literal `
`, and without the surrounding quotes, or n8n fails with "secretOrPrivateKey must be an asymmetric key". |
| `Resend API key` | Header Auth | Name `Authorization`, Value `Bearer re_...` (optional, see step 5) |

Discord doesn't need a credential. Paste its webhook URL into the two Discord nodes: in Discord, go to **Server Settings → Integrations → Webhooks → New Webhook → Copy URL**.

## 4. Google Sheet (you)

Use a Google **Service Account**, not OAuth, so there's no consent screen, no test users and no token expiry.

1. In Google Cloud (project `strategic-hull-494501-q9`), enable the **Google Sheets API** and the **Google Drive API**.
2. Go to **IAM & Admin → Service Accounts → Create** (for example `n8n-leads`), then **Keys → Add key → JSON**. Keep the file private.
3. Share the sheet with the service account's email as **Editor**.
4. The imported **Save to Leads sheet** node already uses **Authentication → Service Account**; just select the credential.

Create a sheet with a tab named **Leads**, and put these column headers in row 1:

```
id | receivedAt | source | name | email | company | phone | website | services | budget | timeline | goals | score | bucket
```

The workflow matches rows on `id` (the submission ID), so if the same submission is sent twice, it updates the row instead of duplicating it.

## 5. Import and wire the workflows

1. In n8n, go to **Workflows → Import from File**. Import `n8n/lead-intake-errors.workflow.json` first, then `n8n/lead-intake.workflow.json`.
2. In **Trust Cycle: lead intake**, open each node that shows a warning:
   - **Lead webhook:** select the `Trust Cycle webhook secret` credential.
   - **Save to Leads sheet:** select the Google Sheets credential and paste your sheet URL.
   - **Notify Discord:** paste the Discord webhook URL.
   - **Auto-reply (Resend):** this node is imported **disabled**. Resend's test sender (`onboarding@resend.dev`) only delivers to your own Resend account address. It can't email real visitors until you verify a sending domain (with SPF and DKIM). Enable the node only after that.
3. In **Trust Cycle: pipeline errors**, paste the Discord webhook URL.
4. In the lead workflow, open **Settings → Error workflow** and choose **Trust Cycle: pipeline errors**.
5. **Save** both workflows, then **Publish** the lead workflow (n8n 2.x replaced the Active toggle with Publish). An error workflow only fires once it is published too.

The production webhook is then `https://n8n-production-93bcc.up.railway.app/webhook/lead`.

## 6. Point the site at n8n (Railway variables on the site service)

| Variable | Value |
|---|---|
| `N8N_WEBHOOK_URL` | `https://n8n-production-93bcc.up.railway.app/webhook/lead` |
| `N8N_WEBHOOK_SECRET` | the secret from step 2 |

Railway redeploys the site automatically when variables change.

## 7. Test

Submit the quiz on the live site using test details. Then check:
- the site's API response contains `"forwarded": true` (browser DevTools → Network → `/api/lead`);
- a new row appears in the Leads sheet with a score and bucket;
- a Discord message appears;
- n8n's **Executions** tab shows a successful run.

## Costs and caveats

- **Cost:** n8n and Postgres run on Railway usage billing (always on). Watch the project's **Usage** page for the first week.
- **Updates:** the template pins `n8nio/n8n` (latest). Redeploying pulls newer versions, so check n8n's release notes before redeploying.
- **Backups:** Postgres holds your credentials and executions. Enable Railway volume backups if the demo matters.
- **Fallback:** `/api/lead` already answers visitors with success even when n8n is down. A durable fallback store for leads that fail to forward is still on the backend plan's to-do list.
