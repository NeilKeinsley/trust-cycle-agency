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
