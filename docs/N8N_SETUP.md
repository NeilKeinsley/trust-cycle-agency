# n8n lead pipeline: setup on Railway

n8n runs in the same Railway project as the site, using the "n8n (w/ postgres)" template: the official `n8nio/n8n` image in regular mode, plus Postgres for workflows, credentials and executions.

- **Public editor:** https://n8n-production-93bcc.up.railway.app
- **Private address the site uses:** `http://n8n.railway.internal:5678`. This goes over Railway's private network, so the site calls n8n directly instead of through the public internet. If the private call fails for any reason, you can use the public URL instead.

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
| `Trust Cycle webhook secret` | Header Auth | Name `x-webhook-secret`, Value = the secret from step 2 |
| `Google Sheets` | Google Sheets OAuth2 | Sign in with Google (n8n shows the redirect URL to register) |
| `Resend API key` | Header Auth | Name `Authorization`, Value `Bearer re_...` (optional, see step 5) |

Discord doesn't need a credential. Paste its webhook URL into the two Discord nodes: in Discord, go to **Server Settings → Integrations → Webhooks → New Webhook → Copy URL**.

## 4. Google Sheet (you)

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
5. **Save** both workflows, then toggle **Active** on the lead workflow.

The production webhook is then:
- public: `https://n8n-production-93bcc.up.railway.app/webhook/lead`
- private: `http://n8n.railway.internal:5678/webhook/lead`

## 6. Point the site at n8n (Railway variables on the site service)

| Variable | Value |
|---|---|
| `N8N_WEBHOOK_URL` | `http://n8n.railway.internal:5678/webhook/lead` |
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
