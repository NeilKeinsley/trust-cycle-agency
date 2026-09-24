# Backend plan: lead pipeline (phase 2)

The front end already captures leads through two entry points: the LeadQuiz modal (`source: "quiz"`) and the `/start` brief (`source: "brief"`). Both POST to `src/app/api/lead/route.ts`. This plan turns that route's forwarding step into a real, free, self-hosted automation pipeline built on n8n. The pipeline is the portfolio's showcase piece.

The research behind this plan was done in September 2026. Sources are linked inline. Sources marked *(vendor)* sell the thing they describe, so trust their direction more than their exact numbers.

## Why this pipeline is the part worth building

- **Speed to lead is the business case.** Only about 23% of companies reply within 5 minutes, and the average B2B first response takes about 47 hours ([Convoso](https://www.convoso.com/blog/what-is-speed-to-lead/), [Verse.ai](https://verse.ai/blog/speed-to-lead-statistics)).
- **Fast replies win.** Replies under 5 minutes are associated with roughly 2.6x the close rate of replies after 24 hours ([Kixie](https://www.kixie.com/sales-blog/speed-to-lead-response-time-statistics-that-drive-conversions/) *(vendor)*). The exact figures vary by source, but the direction is consistent.
- **What we demonstrate:** an instant acknowledgement plus an instant, scored notification to the team.

## Architecture

```
Browser (quiz / brief)
   │  POST /api/lead   (same origin, so no CORS)
   ▼
Next.js route handler
   • zod validation, rate limit, honeypot + time-trap
   • normalise, attach id (submissionId) + receivedAt
   • 1. write to durable fallback store     ◄── never lose a lead
   • 2. forward to n8n with x-webhook-secret + Idempotency-Key (5 s timeout)
   • always answers the visitor { ok: true }
   ▼
n8n (self-hosted, regular mode)
   Webhook (Header Auth) ─► Respond 200 immediately
      └► Normalise ─► Dedupe (id, then email in last 30 days)
            ├─ duplicate ─► update row, stop
            └─ new ─► Score ─► Google Sheets (append)
                        ├─► Discord/Slack notify (message varies by score)
                        └─► Resend auto-reply to the lead
   Error Workflow ─► Discord/Slack "pipeline failed: <node> <message>"
```

The call is server-to-server, so the browser never sees the n8n URL or the secret, and CORS is not involved.

## Hosting (free)

| Option | Current reality | Use |
|---|---|---|
| **Oracle Cloud Always Free** | 2× E2.1.Micro VMs (1 GB RAM each), free indefinitely ([Oracle docs](https://docs.oracle.com/en-us/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)) | **Primary.** Always on, so a reviewer can test it unannounced. |
| Local PC + Cloudflare Tunnel | Free, but only up while the PC is on | Development only |
| Render free | Sleeps after 15 min idle, about 1 min cold start ([Encore](https://encore.dev/articles/render-vs-railway)) | Fallback only (the cold start ruins the "instant reply" demo) |
| Railway | No longer free ([FreeTiers](https://www.freetiers.com/directory/railway)) | Not used |

- **Setup:** Docker Compose with a single `n8nio/n8n` container in **regular mode**. Queue mode needs Redis plus workers, which is overkill here and eats the 1 GB of RAM. HTTPS goes through a Cloudflare Tunnel or Cloudflare DNS with Let's Encrypt.
- **Licence:** n8n Community Edition is under the Sustainable Use License, which is free for this use ([n8n docs](https://docs.n8n.io/sustainable-use-license/)).
- **Risk:** Oracle account approval can be slow or flaky. Budget time for it, and keep Render as the documented fallback.

## n8n workflow, node by node

1. **Webhook** (POST, *Header Auth* credential for `x-webhook-secret`, a random secret of at least 32 characters). Set the response mode to *Respond to Webhook node*.
2. **Respond to Webhook**: return 200 `{ received: true }` straight away. The rest runs after, so the Next.js 5s timeout is never at risk.
3. **Normalise** (Code node): trim fields, lowercase the email, and map the enum slugs to labels.
4. **Dedupe**: look up `id` in the Sheet, then look up the email among rows from the last 30 days. If either matches, update the existing row and stop, so no repeat notification or email is sent.
5. **Score** with a transparent rubric that's easy to explain in the write-up:

   | Signal | Points |
   |---|---|
   | Budget: under-5k 1, 5k-15k 2, 15k-50k 4, 50k-plus 5, unsure 2 | 1-5 |
   | Timeline: asap 5, 1-3 months 4, 3+ months 2, exploring 1 | 1-5 |
   | Services: +1 each, max 3 ("unsure" counts 0) | 0-3 |
   | Source: brief +2, quiz +0 (a brief shows more intent) | 0-2 |

   Buckets (out of 15): **Hot** at 11 and above, **Qualified** at 7-10, **Nurture** at 6 and below.
6. **Google Sheets: append row.** The columns follow the payload contract below, plus `score` and `bucket`.
   - **Why Sheets:** it has no practical row cap at this volume and never sleeps, and it doubles as the portfolio screenshot.
   - **Why not the alternatives:** Airtable free caps at 1,000 records per base ([Adalo](https://www.adalo.com/posts/airtable-pricing/)). Supabase free projects pause after 7 days of inactivity ([Softr](https://www.softr.io/blog/supabase-vs-airtable)).
7. **Notify** via a Discord webhook (or Slack): name, services, budget, timeline and bucket. Hot leads get a louder format.
8. **Auto-reply** via Resend's free tier (3,000 emails/month, 100/day: [Resend](https://resend.com/docs/knowledge-base/account-quotas-and-limits)). It's more predictable than Gmail SMTP, whose limits are reputation-based and unpublished.
   - Set up SPF, DKIM and DMARC on the sending domain from day one.
   - Expect some early emails to land in spam until the domain builds a sending reputation. The UI copy must not promise instant email delivery.
9. **Error Workflow** (Settings → Error Workflow): posts the failing node name and message to the same channel. Screenshot this for the portfolio; showing that failures are handled is stronger than a happy-path-only demo.
10. *Optional, last:* an AI summary node that writes a one-paragraph brief for the notification. Build it as a separate branch that can be switched off, so a paid or rate-limited API can never break the core pipeline.

## Payload contract (Next.js → n8n)

Sent as JSON with the headers `x-webhook-secret` and `Idempotency-Key: <id>`.

```jsonc
{
  "id": "uuid",               // submissionId from the browser (stable across retries)
  "receivedAt": "ISO-8601",
  "source": "quiz" | "brief",
  "services": ["brand" | "website" | "marketing" | "seo" | "social" | "unsure"],
  "budget": "under-5k" | "5k-15k" | "15k-50k" | "50k-plus" | "unsure",
  "timeline": "asap" | "1-3-months" | "3-plus-months" | "exploring",
  "name": "string",
  "email": "lowercased, trimmed",
  "company": "string?", "phone": "string?", "website": "string?",
  "goals": "string?", "consent": "boolean?",     // brief only
  "userAgent": "string", "referrer": "string", "elapsedMs": 0
}
```

The honeypot field is never forwarded. Submissions that trip the honeypot or the time-trap (`elapsedMs < 1500` on a fresh form) are dropped in the route and never reach n8n.

## Changes still needed on the Next.js side

- [x] zod validation, rate limit, honeypot (phase 1)
- [x] time-trap, `submissionId` idempotency key, `Idempotency-Key` header, email normalisation, and a notice at collection under both forms
- [ ] **Durable fallback before forwarding.** Append each validated lead to a local NDJSON file (self-hosted) or a second Sheet via the API (serverless). Add a small "replay unforwarded" script, so an n8n outage never loses a lead.
- [ ] **Rate limiter:** the current limiter lives in memory and resets on redeploy. That's fine on a single instance. If the site ever runs on multiple instances, move the limiter to Upstash Redis (free tier).
- [ ] **Scheduling handoff:** embed Cal.com on the success screens. Its free tier has no event-type limit, while Calendly's free plan allows one ([TaskROI](https://taskroi.com/blog/calcom-vs-calendly/)).
- [ ] **"About this build" note** linking the n8n workflow screenshot, with an honest demo caveat.

## Privacy and data handling

- **Consent:** a contact form that uses data only to reply doesn't need a separate consent checkbox under GDPR, but it does need a clear notice at the point of collection ([TermsFeed](https://www.termsfeed.com/blog/contact-forms-consent/)). Both forms now carry that notice. The `/start` consent checkbox stays because it demonstrates good practice.
- **No marketing:** never send marketing to collected addresses.
- **Purge:** a monthly n8n cron clears Sheet rows older than 90 days. This is a demo, but real people may type real details.

## Build order

1. Oracle VM, Docker and n8n running, reachable over HTTPS.
2. Webhook → respond → normalise → dedupe → score → Sheets. Test it from `/api/lead` with the secret.
3. Discord notification and Resend auto-reply (with SPF and DKIM).
4. Error Workflow.
5. Next.js durable fallback and replay script.
6. Cal.com on the success screens.
7. Portfolio assets: workflow screenshot, a sample scored row, a small Sheets chart of volume by bucket.
8. Optional AI summary branch.

## Environment

```
N8N_WEBHOOK_URL=https://n8n.<your-domain>/webhook/lead
N8N_WEBHOOK_SECRET=<32+ random chars>
```

On the n8n side, use the same secret in the Header Auth credential, plus Google Sheets OAuth, the Discord webhook URL and a Resend API key. All of these are stored as n8n credentials and never committed.
