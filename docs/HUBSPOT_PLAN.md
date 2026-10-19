# HubSpot integration: plan and field map

Portfolio build for HubSpot CRM integration and automation work. The website's lead intake (`/api/lead` → n8n) gains HubSpot as the working CRM. Google Sheets stays the permanent record of every lead, because the HubSpot portal is a developer test account (see "Account").

## Account
- **Portal:** developer test account "Trust Cycle Agency CRM", Hub ID `247728856`, created from Neil's standard HubSpot account (Development → Testing → Test Accounts). Comes with 90-day Enterprise trials on every Hub.
- **Expiry:** expires after 90 days with no API calls. Renew by hand in the parent account: Test Accounts → the account → Actions → Renew trials (allowed in the last 30 days before expiry). HubSpot doesn't say what happens to the data on expiry, which is why Sheets stays the record.
- **Auth:** a HubSpot service key (public beta), stored only in n8n as the credential **HubSpot - TCA CRM** (type "HubSpot Service Key"). It works for REST calls only: HubSpot → n8n traffic uses the workflow action "Send a webhook" with a secret header instead.

## Builds
1. Website lead → HubSpot contact + deal (this document's field map)
2. Slack: alerts routed by bucket, with a "Claim" button that sets the deal owner
3. Calendly booking → HubSpot meeting, deal moves to "Call booked"
4. Gmail follow-ups triggered by deal stage, logged to the timeline
5. Stale-deal sweeper + weekly pipeline snapshot to Sheets

## Plan for builds 2 to 5

**Decided 2026-10-19 (Neil):** a new free Slack workspace; Calendly stays on the free plan with the site relaying bookings; Gmail writes drafts that Neil sends; build order 2, 3, 4, 5.

Same loop for every build: Neil creates any account or app (Claude doesn't create accounts or handle keys) → Claude builds it as importable n8n JSON → test on a copy with live side effects off → go live with Neil's yes → one real test, cleanup → docs, security probe entry, commit. Every new webhook checks a secret or signature, and gets an entry in `security/probe.*.json` in the same commit (AGENTS.md rule).

### Build 2: Slack alerts with a "Claim" button (first native HubSpot workflow)
Covers: Slack, HubSpot workflows, CRM events, notifications, conditional logic, two-way sync.
1. **Neil:** create a free Slack workspace "Trust Cycle Agency" with `#leads` and `#hot-leads`, then a Slack app from the manifest Claude provides (bot scopes `chat:write`, `users:read`, `users:read.email`; interactivity on). Bot token and signing secret go into n8n only.
2. **HubSpot native workflow** "TCA: new deal → n8n": trigger = deal created in "TCA new business"; action = Send a webhook (POST, secret in a header) to n8n. A second one fires on deal stage change.
3. **n8n "Slack - deal alerts":** checks the header → reads the deal and contact → Hot goes to `#hot-leads`, everything else to `#leads`, as a Block Kit message with a **Claim** button.
4. **n8n "Slack - claim button":** Slack interactivity URL → checks Slack's signature on the raw body (HMAC-SHA256 of `v0:timestamp:body`, rejects anything older than 5 minutes) → maps the Slack user's email to a HubSpot owner → sets `hubspot_owner_id` on the deal → edits the Slack message to "Claimed by …". Answers Slack within 3 seconds.
- **Signature check:** the Webhook node's raw-body option plus **Crypto node v2**, which reads the signing secret from an encrypted Crypto credential ("Slack Signing Secret"), so the secret is never stored in the workflow. The Slack API credential's own "Signature Secret" field doesn't help here: only n8n's Slack Trigger reads it, and that node handles Events API payloads, not button clicks (it reads `body.event.type`).
- **Done when:** a live lead posts to the right channel, Claim sets the owner in HubSpot, and a forged or replayed click is rejected.

#### Build 2 status (2026-10-19): built and tested, HubSpot side not switched on
- **Slack:** workspace "nk", `#leads` (`C0CAAG03B1A`), `#hot-leads` (`C0CB16L6UD6`), app "TCA Lead Alerts" (`A0CA0K57BQB`, bot "TCA Leads" in both channels).
- **n8n (published):** "Slack - deal alerts" (`kobZZ3EyBkKEbGuE`, `/webhook/hubspot-deal-events`) and "Slack - claim button" (`952GPC9J7cvzYjXM`, `/webhook/slack-claim`). Files: `n8n/slack-deal-alerts.workflow.json`, `n8n/slack-claim-button.workflow.json`.
- **HubSpot (unpublished drafts):** "TCA: new deal to Slack" (Deal created, pipeline TCA new business → 1-minute delay → webhook `?event=created`) and "TCA: deal stage changed to Slack" (Deal stage becomes Contacted, Call booked, Proposal sent, Closed Won or Closed Lost, records can repeat runs → webhook `?event=stage`). Both send `hs_object_id` with the `HS_secret` key in the `x-tca-hubspot-secret` header.
- **Proven:** alert posted for a real deal; HubSpot "Test action" on both workflows reached n8n (200) and posted to Slack; a real Claim click set HubSpot's deal owner and updated the message; forged and replayed Slack requests got 401; wrong HubSpot secrets got 403; `security/probe.n8n.json` 3 of 3.
- **Gotchas found:** n8n's Code sandbox has no `URLSearchParams` (decode the form by hand); a Slack API call answers HTTP 200 even when it fails (check `ok`); HubSpot's test-value box starts with the text "Test value", which is sent unless cleared; a new HubSpot property-change workflow runs each record only once until "Records can repeat runs" is on.
- **Live (2026-10-19):** both HubSpot workflows published. One real quiz sent through the live site (`slack.livetest@example.com`, Brand and identity, $50k+, ASAP): intake execution 61 and HubSpot sync 62 succeeded at 01:04:48 UTC, HubSpot's "new deal" workflow called n8n 67 seconds later (alert execution 63), and the card reached **#hot-leads** as "Hot lead … 11/15 (Hot)" with Claim and Open in HubSpot. The test row was deleted from the Leads sheet. The Slack card, the HubSpot contact and deal, and the Discord notice stay as sample data.
- **To switch Slack alerts off:** unpublish the two HubSpot workflows (Automation → Workflows → the workflow → Unpublish). Leads, Sheets, Discord and the HubSpot sync carry on.

### Build 3: Calendly booking → HubSpot meeting
Covers: Calendly, meetings, deal stage automation.
- **Calendly's free plan has no webhooks** (they need a paid plan); its REST API does work on free with a personal access token. Without paying, the site relays the booking instead: the embed already gets Calendly's `calendly.event_scheduled` message → the site POSTs the invitee URI and lead id to a new `/api/booking` route → the route checks the booking really exists through the Calendly API → n8n logs a HubSpot meeting on the contact and deal, moves the deal to "Call booked", and posts to Slack.
- **Cancellations** can't be pushed without webhooks: build 5's daily job reads cancelled events from the Calendly API and moves the deal back.
- **Site change:** a new API route (zod, rate limit, probe entry) and a production deploy, which needs Neil's yes.
- **Edge:** a booking can arrive before an outboxed lead reaches HubSpot. The route retries, and the contact upsert on email covers it.

### Build 4: Gmail follow-ups by deal stage
Covers: Gmail, workflows on deal events, engagement logging.
- **HubSpot workflow** on stage change → n8n → **Gmail draft** in Neil's inbox, written for that stage (prep email on "Call booked", nudge after 3 days in "Proposal sent"). Neil reviews and sends; nothing goes to a visitor automatically.
- **HubSpot's native inbox connection** logs the sent emails to the contact's timeline (shows the native integration next to the API one).
- **Gotcha:** a Google OAuth app left in "Testing" issues refresh tokens that expire after 7 days. Move the consent screen to Production (personal use, unverified) before relying on it.

### Build 5: Stale-deal sweeper + weekly pipeline snapshot
Covers: Sheets, scheduled automation, reliability.
- **Daily (09:00 Manila):** search open deals in "TCA new business" untouched for 3+ days → create a HubSpot task on the deal → DM the owner in Slack. Also picks up Calendly cancellations (build 3).
- **Weekly (Monday):** append every open deal (date, deal, stage, owner, score, bucket) to a "Pipeline snapshot" tab in the Leads sheet (atomic append, as the intake does).

### After the builds
- A case study page on `/work` that honestly says it's a demo and shows the real flow, plus a 60 to 90 second Loom for each build and the Upwork proposal text.
- **Trial renewal:** the test account was created 2026-10-19, so its 90-day trial ends around 2027-01-17. Renew from 2026-12-18 (Test Accounts → Actions → Renew trials), or the native workflows from builds 2 and 4 stop.

## Build 1 field map

Source: `src/lib/intake.ts` (validation) and the n8n **Normalise and score** node (score, bucket, consent).

### Contact: standard properties
| Lead field | HubSpot property | Rule |
|---|---|---|
| `email` | `email` | Lower-cased. The upsert key, so a returning visitor updates one contact |
| `name` | `firstname` / `lastname` | First word → firstname, the rest → lastname. One word → firstname only |
| `phone` | `phone` | Only when given |
| `company` (brief) | `company` | Only when given |
| `website` (brief) | `website` | Only when given |
| (fixed) | `lifecyclestage` | `lead` on create. Never set backwards: HubSpot only moves lifecycle stage forward |
| (fixed) | `hs_lead_status` | `NEW` on create |

### Contact: custom properties (group "TCA intake")
| Internal name | Type | Values / from |
|---|---|---|
| `tca_lead_id` | Single-line text | The submission id (`id`) |
| `tca_source` | Dropdown | `quiz`, `brief` |
| `tca_services` | Multiple checkboxes | `brand`, `website`, `marketing`, `seo`, `social`, `unsure` (labels from `SERVICES`) |
| `tca_budget` | Dropdown | `under-5k`, `5k-15k`, `15k-50k`, `50k-plus`, `unsure` |
| `tca_timeline` | Dropdown | `asap`, `1-3-months`, `3-plus-months`, `exploring` |
| `tca_goals` | Multi-line text | Brief only |
| `tca_lead_score` | Number | n8n score (0 to 15) |
| `tca_lead_bucket` | Dropdown | `Hot` (11+), `Qualified` (7 to 10), `Nurture` (under 7) |
| `tca_consent` | Dropdown | `email`, `email+sms` |
| `tca_received_at` | Date and time | `receivedAtUtc` |

Multiple-checkbox values go to HubSpot as one string separated by semicolons, no spaces (`brand;website`), not commas. That replaces the stored values. A leading semicolon (`;brand;website`) appends to them instead.

The properties are created by the importable n8n workflow `n8n/hubspot-setup-properties.workflow.json` (safe to re-run: existing ones come back as "already exists"). Ran 2026-10-19: 2 groups and 16 properties, all 201 Created. After an import, the two HTTP nodes show a credential warning until each one is opened once: n8n matches the credential by name but only links it when the node is opened.

### Deal
| Property | Value |
|---|---|
| `dealname` | `{company or name} - {service labels}` |
| `pipeline` | "TCA new business" |
| `dealstage` | `New lead` |
| `tca_lead_id` (custom, **unique values**) | The submission id. The upsert key for deals |
| `tca_budget`, `tca_timeline`, `tca_lead_score`, `tca_lead_bucket`, `tca_source` (custom) | Same as on the contact |
| `amount` | Left empty. A budget band is not a deal value, and the site makes no invented figures |
| Association | Deal → contact (default association) |

### Pipeline "TCA new business" (pipeline ID `2630364862`)
HubSpot stores stages by ID, so n8n writes these IDs, not the names.

| Stage | Probability | Stage ID | Set by |
|---|---|---|---|
| New lead | 10% | `4456833770` | n8n (build 1) |
| Contacted | 20% | `4456833771` | A person, or Gmail follow-up (build 4) |
| Call booked | 40% | `4456833772` | n8n (build 3) |
| Proposal sent | 60% | `4456833773` | A person |
| Closed Won | Won (100%) | `4456833775` | A person |
| Closed Lost | Lost (0%) | `4456833776` | A person |

Created 2026-10-19 in Settings → Data Management → Objects → Deals → Pipelines → Create pipeline → Create from scratch. HubSpot seeds 7 default stages: the first four were renamed, "Contract Sent" was deleted, and the default "Sales Pipeline" was left alone.

## How build 1 runs in n8n
- **`HubSpot - sync lead`** (n8n id `SVxw6TDvbfCAV9fU`, file `n8n/hubspot-sync-lead.workflow.json`): a sub-workflow that takes one normalised lead and does upsert contact (on email) → read lifecycle stage and lead status → set lead status "New" if empty → upsert deal (on `tca_lead_id`) → link deal to contact. Each HTTP node retries 3 times, 2 s apart, and the workflow's error workflow is "Trust Cycle: pipeline errors" (Discord alert).
- **The lead intake workflow** calls it from "Normalise and score" through two added nodes: **Add HubSpot flags** (an Edit Fields node that adds `continuesQuiz`) and **Sync to HubSpot** (Execute Workflow, "wait for sub-workflow" off). Because it doesn't wait, a HubSpot outage can't slow down or fail the lead; it shows up as a failed sub-execution and a Discord alert instead.
- **Lifecycle stage is HubSpot's job.** HubSpot sets `lead` itself when the API creates a contact, then moves the contact to `opportunity` once a deal is linked. n8n only fills lifecycle stage if it is empty, and only sets lead status when it is empty, so a returning visitor keeps what a person set.
- **Deal stage:** a new submission starts at "New lead". A brief that continues a quiz omits `dealstage`, so a stage someone has already changed stays put.

### Test on a copy (2026-10-19)
`Lead intake - HubSpot test copy` (n8n id `8xalPGP1xyEd6Nip`) is the live workflow with Acknowledge, both Sheets nodes, Discord and Resend disabled, the two HubSpot nodes added, and a test lead pinned on the webhook. Three runs against the test portal:

| Run | Input | Result |
|---|---|---|
| 1 | New quiz lead `hubspot.test@example.com` | Contact `572194204379` and deal `355647459044` created in "TCA new business" / New lead, linked. Lifecycle already `lead` (set by HubSpot) |
| 2 | The deal moved to Contacted by hand, then a brief continuing the same quiz (same id, plus company, phone, goals) | Same contact and deal updated, no duplicates. Stage stayed Contacted. Lead status set to New. Score 11 / Hot, deal renamed to the company |
| 3 | Run 2 repeated | Same IDs, lead-status step skipped, nothing changed |

The test contact and deal are still in the test portal as sample data.

### Live (2026-10-19)
"HubSpot - sync lead" published as version "HubSpot sync v1". The two nodes were then added to **Trust Cycle: lead intake** and published as version "HubSpot sync added". One real quiz was sent through the live site (`hubspot.livetest@example.com`, SEO, $15k to $50k, 1 to 3 months): intake execution 44 (webhook) and sync execution 45 both succeeded, and no error alert fired. HubSpot has contact `572163389125` and deal `355450371795` ("HubSpot Live Test - SEO and content", New lead, score 9 / Qualified). The test row was deleted from the Leads sheet. The Discord notice for it is still in the channel.

**To switch HubSpot off:** in **Trust Cycle: lead intake**, disable **Sync to HubSpot** and publish. Sheets and Discord keep working.

## Rules for the n8n side
- **Upsert, never search then create.** HubSpot's search index lags a few seconds behind writes, so search-then-create makes duplicates when two submissions land close together. Contacts upsert on `email`, deals on `tca_lead_id`.
- **A brief that continues a quiz** (`continuesQuiz: true`) reuses the quiz's id, so the same upserts update the existing contact and deal instead of adding new ones.
- **HubSpot must never block the lead.** The sync runs as a separate sub-workflow that the intake doesn't wait for, and a HubSpot failure posts to the error workflow instead of failing the webhook. The site's outbox and Sheets already cover lost-lead risk.
- **Use the v3 API.** n8n's built-in HubSpot contact operations return the old v1 contact format (`vid`, `identity-profiles`). The upserts use an HTTP Request node against the v3 batch upsert endpoints with the same service key credential.
