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
- **HubSpot (published 2026-10-19; Call booked later left out of the stage trigger, see build 3):** "TCA: new deal to Slack" (Deal created, pipeline TCA new business → 1-minute delay → webhook `?event=created`) and "TCA: deal stage changed to Slack" (Deal stage becomes Contacted, Call booked, Proposal sent, Closed Won or Closed Lost, records can repeat runs → webhook `?event=stage`). Both send `hs_object_id` with the `HS_secret` key in the `x-tca-hubspot-secret` header.
- **Proven:** alert posted for a real deal; HubSpot "Test action" on both workflows reached n8n (200) and posted to Slack; a real Claim click set HubSpot's deal owner and updated the message; forged and replayed Slack requests got 401; wrong HubSpot secrets got 403; `security/probe.n8n.json` 3 of 3.
- **Gotchas found:** n8n's Code sandbox has no `URLSearchParams` (decode the form by hand); a Slack API call answers HTTP 200 even when it fails (check `ok`); HubSpot's test-value box starts with the text "Test value", which is sent unless cleared; a new HubSpot property-change workflow runs each record only once until "Records can repeat runs" is on.
- **Live (2026-10-19):** both HubSpot workflows published. One real quiz sent through the live site (`slack.livetest@example.com`, Brand and identity, $50k+, ASAP): intake execution 61 and HubSpot sync 62 succeeded at 01:04:48 UTC, HubSpot's "new deal" workflow called n8n 67 seconds later (alert execution 63), and the card reached **#hot-leads** as "Hot lead … 11/15 (Hot)" with Claim and Open in HubSpot. The test row was deleted from the Leads sheet. The Slack card, the HubSpot contact and deal, and the Discord notice stay as sample data.
- **To switch Slack alerts off:** unpublish the two HubSpot workflows (Automation → Workflows → the workflow → Unpublish). Leads, Sheets, Discord and the HubSpot sync carry on.

### Build 3: Calendly booking → HubSpot meeting
Covers: Calendly, meetings, deal stage automation.
**Constraint:** Calendly's free plan has no webhooks. The embed's `calendly.event_scheduled` message gives the page only two URIs (the event and the invitee), so the site relays those and n8n reads the real details from Calendly's API with Neil's token. Calendly's help pages disagree on whether that read API works on the free plan (`docs/BACKEND_PLAN.md` says it does), so step 0 is one test call.

**Flow**
1. **Browser** (`calendly-embed.tsx`): the iframe URL gains `utm_content=<lead id>` (a random UUID, not contact data, so the "no contact details in URLs" rule holds). Calendly stores it on the booking. On `calendly.event_scheduled` the page POSTs only the invitee URI to `/api/booking`.
2. **Site route `/api/booking`**: zod (the URI must match `https://api.calendly.com/scheduled_events/<uuid>/invitees/<uuid>`), the lead form's rate limit, a 4 KB body cap. It forwards to n8n `/webhook/calendly-booking` with the site's existing webhook secret and answers 202. The site holds no Calendly token.
3. **n8n "Calendly - booking to HubSpot"**:
   - Read the invitee, then the event, from Calendly's API. This is the real check: a forged URI fails here. It gives the email, name, status, start and end time, join link, and the lead id from `utm_content`.
   - Find the deal by `tca_lead_id`, but **only if that deal's contact email matches the Calendly email**. Otherwise upsert the contact by email and use their newest open TCA deal.
   - Create a HubSpot **meeting** (title, start/end, join link, outcome Scheduled), skipping it if one already exists for this invitee URI. Link it to the contact and deal.
   - Move the deal to **Call booked**, but only from New lead or Contacted (never backwards from Proposal sent). Build 2's stage workflow then posts to Slack by itself.
4. **Cancellations** (no webhooks on free): build 5's daily job reads cancelled events and updates the meeting.

**Security:** `/api/booking` gets a `probe.site.json` entry and `calendly-booking` a `probe.n8n.json` entry. The Calendly token is created with **only `scheduled_events:read`** and stored as an n8n credential. A forged call can at most make n8n look up a URI that Calendly refuses.

**Tests:** n8n first with pinned data, then the site change on staging (push `headless-wp-proof`), then one real booking on production with Neil's yes. Test bookings are real calls in Neil's calendar, so cancel them afterwards.

**Neil's steps:** create the Calendly token (read-only scope) and paste it into an n8n credential.

#### Research check (2026-10-19), against primary sources
| Assumption | Verdict | Source |
|---|---|---|
| Calendly's read API works on the free plan | **Confirmed.** "GET and POST requests … on any subscription plan"; only webhooks and the Scheduling API need a paid plan. The account is on Free (trial ended 2026-10-12) | Calendly help, API overview |
| Invitee has email, name, status, event URI, `tracking.utm_content`, `rescheduled`, `cancellation` | **Confirmed** in Calendly's OpenAPI spec (`Invitee`, `InviteeTracking`) | `developer.calendly.com/openapi/calendly-api.yaml` |
| Event has `start_time`, `end_time`, `status`, `location.join_url` (Google Meet), `event_memberships` | **Confirmed** (`Event`, `GoogleConference`) | same spec |
| Reading an invitee or event needs only `scheduled_events:read` | **Confirmed**. Listing events needs a `user` or `organization` URI; `/users/me` needs `users:read` | same spec |
| A `utm_content` value on the scheduling link is saved on the booking | **Confirmed** (5 UTM fields plus `salesforce_uuid`; values under 255 characters; custom parameters not supported) | Calendly help, "source track your embed with UTM parameters" |
| The embed's `calendly.event_scheduled` message carries the event and invitee URIs | **Not documented by Calendly.** Its embed page lists the event names but no payload; only third-party code and forum posts describe the two URIs | Calendly help, advanced embed; react-calendly |
| n8n has a credential for a Calendly token | **Confirmed:** "Calendly Personal Access Token API" (`calendlyApi`), Bearer header. Its connection test calls `/users/me`, so it fails without `users:read` | n8n source, `CalendlyApi.credentials.ts` |
| HubSpot meeting fields | **Confirmed:** `hs_timestamp` (required), `hs_meeting_title`, `hs_meeting_body`, `hs_meeting_external_url`, `hs_meeting_location`, `hs_meeting_start_time`, `hs_meeting_end_time`, `hs_meeting_outcome` (SCHEDULED, COMPLETED, RESCHEDULED, NO_SHOW, CANCELED), PATCH to update. Meeting → contact association type 200 | HubSpot meetings guide |
| HubSpot meeting scope | **Unclear:** the guide lists only `crm.objects.contacts.read/write` (the service key has both). The first create call proves it | HubSpot meetings guide |
| Reschedules | In Calendly a reschedule cancels the old invitee (`rescheduled: true`) and creates a new one, so it must not be treated as a cancellation | Calendly spec (`rescheduled`, `old_invitee`, `new_invitee`) |

**What changes:** the only undocumented link is the browser message the relay depends on.

#### Chosen design: n8n polls Calendly (Neil, 2026-10-19). This replaces the relay flow above.
- **n8n "Calendly - bookings to HubSpot"**, on a schedule (every 5 minutes):
  - List active upcoming events and recently cancelled ones (`GET /scheduled_events?user=…&status=…&min_start_time=…`), then read each event's invitees.
  - **New active invitee** (no HubSpot meeting holds its URI yet): match the deal by `tracking.utm_content` = `tca_lead_id`, kept only if that deal's contact email matches the invitee email; otherwise upsert the contact by email and use their newest open TCA deal. Create a meeting (outcome SCHEDULED, Meet link, the invitee URI in a custom meeting property for de-duplication), link it to the contact and deal, move the deal to Call booked (only from New lead or Contacted), and post "Call booked: name, date and time" to Slack.
  - **Cancelled invitee** whose meeting is still SCHEDULED: if `rescheduled` is true, set the outcome to RESCHEDULED and leave the deal (the new booking arrives as a new invitee). Otherwise set it to CANCELED, move the deal from Call booked back to Contacted, and post to Slack.
  - Successful runs aren't saved, failed ones are (keeps Postgres small on Railway).
- **Build 2 change:** remove Call booked from the stage-changed trigger, so Slack gets one richer message instead of two.
- **Site change:** only `calendly.ts` / `calendly-embed.tsx` add `utm_content=<lead id>` to the scheduler URL. No new route. Ships with the outbox-retry work.
- **No new public endpoint**, so no new probe entry. The Calendly token stays in n8n.
- **Token verified (2026-10-19):** one token, "n8n - TCA booking check (read only)", scopes `scheduled_events:read` and `users:read` only, stored in the n8n credential "Calendly - TCA read" (type Calendly Personal Access Token API). `/users/me` and `/scheduled_events?user=…` both answered 200 on the free plan. User `https://api.calendly.com/users/87acb485-26ba-4e58-9c6a-d1324d735782`, organization `https://api.calendly.com/organizations/19271054-078f-4637-9c11-ca0b70ce2bc4`, Calendly timezone Asia/Shanghai (UTC+8, same offset as the sheet's Asia/Manila). One past booking exists: "Intro call", 2026-09-29, cancelled (a ready sample for the cancellation path).

#### Build 3 status (2026-10-19): LIVE
- **HubSpot:** meeting property `tca_calendly_invitee` (group TCA intake), created by the setup workflow (it now covers contacts, deals and meetings).
- **n8n (all published):** "Calendly - poll bookings" (`6xJKCDh1ECktdBlj`), "Calendly - booking to HubSpot" (`jVSrhZCskUA1QzvI`), "Calendly - cancellation to HubSpot" (`TJITbs8CB2JfwxAu`). Files: `n8n/calendly-poll-bookings.workflow.json` (sub-workflow IDs as `PASTE_…` placeholders), `n8n/calendly-booking-to-hubspot.workflow.json`, `n8n/calendly-cancellation-to-hubspot.workflow.json`.
- **Tests** (deal "HubSpot Live Test - SEO and content", `355450371795`):

| Test | Result |
|---|---|
| Poller against real Calendly (window widened to 2026-09-01) | Read the 29 Sept "Intro call" (cancelled, invitee = Neil's own email, no lead id, https Meet link); HubSpot search found no meeting; Decide: nothing to do |
| T1 new booking, correct lead id | Meeting `408404463319` created (so the service key can create meetings), matched by lead id, linked, deal New lead → Call booked, Slack "Call booked" card in #leads |
| T2 reschedule of T1 | Meeting → RESCHEDULED; deal and Slack untouched |
| T3 new booking carrying another contact's lead id | Lead id ignored; matched to the person's own deal ("newest open deal"); meeting `408399089338`; stage left at Call booked |
| T4 real cancellation of T3 | Meeting → CANCELED, deal Call booked → Contacted, Slack "Call cancelled" card |
| T5 poller sees both again | Search finds both meetings (RESCHEDULED, CANCELED); Decide: nothing to do (no duplicates) |

- Test pins removed afterwards. Build 2's stage alert also posted "moved to Call booked" and "moved to Contacted" during T1 and T4: the duplicate the go-live change removes.
- **Site change done (commits `2316b0b` outbox retry + claim fix, `8594fef` build 3), on staging since 2026-10-19:** the scheduler URL carries `utm_content=<lead id>`. Checked on a local production build with the live Calendly link: after a quiz, the iframe URL held `utm_content` equal to the id the quiz sent to `/api/lead`. Staging has no `NEXT_PUBLIC_CALENDLY_URL` and isn't wired to n8n, so it can't show the scheduler; it only confirms the new code deploys.
- **Live (2026-10-19, Neil's yes):** `main` fast-forwarded to `c70c252` (production serves the `utm_content` change); the three workflows published; Call booked removed from build 2's stage trigger (it now fires on Contacted, Proposal sent, Closed Won, Closed Lost).
- **Real booking on production:** Neil booked from the site after a quiz (deal "NK - SEO and content", `355658528489`). The scheduled poller created meeting `408411301610` (Scheduled, 2026-10-21 02:00 UTC), moved the deal Contacted → Call booked and posted the "Call booked" card. Neil then cancelled in Calendly: the next scheduled poll set the meeting to CANCELED, moved the deal back to Contacted and posted the cancel card (plus build 2's "moved to Contacted", expected since Contacted stays in its trigger).
- **Gotcha: never run the poller by hand while it is published.** A manual run started in the same second as a scheduled one; both found no meeting yet and created two (`408411370196` deleted). Scheduled runs alone are 5 minutes apart and take seconds, so they can't overlap.
- **Gotcha: Calendly blocks automated bookings** ("This booking cannot be completed", for security reasons), so the real booking test has to be clicked by a person.
- **Prefill fix:** Calendly's app starts listening about 2 s after the iframe's load event, so the load-time `calendly.prefill` sends were lost and the name and email boxes came up empty. `calendly-embed.tsx` now sends the prefill again on Calendly's first message; checked on a local production build (name and email arrive filled in).

**Decided 2026-10-19 (Neil):**
- Match by lead id, checked against the Calendly email.
- On cancel: mark the meeting Cancelled, post to Slack, **and** move the deal from Call booked back to Contacted (build 5).
- The uncommitted outbox-retry work (`src/lib/lead-outbox.ts`, `src/app/api/lead/replay/route.ts`, `src/instrumentation.ts`, the `docs/N8N_SETUP.md` paragraph) ships with build 3, after a review and test of its own.
- The Slack "Call booked" alert shows the booked date and time.

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

### Meeting: custom property (group "TCA intake", build 3)
| Internal name | Type | Value |
|---|---|---|
| `tca_calendly_invitee` | Single-line text | Calendly invitee URI of the booking that created the meeting; the poller's de-duplication key |

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
