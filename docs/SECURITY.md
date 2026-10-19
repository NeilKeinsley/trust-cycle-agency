# Security: what protects this site, and how it is tested

Audited 2026-10-09 with the `web-security-check` system (Web Integrations knowledge base, `skills\web-security-check`). This file is the project's record: the threat model, each control and where it lives, the risks accepted on purpose, and how to re-run every test. Findings, proof and dates are in the Web Integrations hub (`clients\trust-cycle-agency\`).

This is an automated and checklist-based review against the OWASP Top 10:2025. It is not a penetration test.

## What is being protected, and from whom

| Asset | Where it lives | Main threats |
|---|---|---|
| Leads' contact details | In transit through `/api/lead` to n8n, then the Google Sheet, HubSpot, Slack, Discord and Gmail drafts; briefly on the outbox volume when n8n is down | Form flooding, injected content reaching the sheet, Slack, Discord or an email header, a leaked webhook secret, an over-scoped integration key |
| The public pages (and their standing in search) | Static pages built from WordPress content | Script injected through content, a hijacked dependency, defacement through the CMS |
| WordPress admin | `wordpress-cms` service | Password guessing, a stolen editor or administrator session, plugin upload as a path to the server |
| n8n | Separate Railway project | An unpatched n8n (it has had critical flaws), the public editor |
| Shared secrets | Railway variables only | Ending up in a URL, a log, the repo or the browser bundle |

Trust boundaries: browser → site (nothing from the browser is trusted) · site ↔ WordPress (the site treats WordPress content as untrusted input and validates every entry) · site → n8n (shared secret, and n8n treats the lead as untrusted text).

## Controls

### The Next.js site
| Control | Where |
|---|---|
| HTTPS only, HSTS one year | Railway edge; `next.config.ts` |
| Content-Security-Policy pinned to this origin (only foreign origin: `frame-src https://calendly.com`), no framing, no plugins, forms post only here | `next.config.ts` |
| `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-Frame-Options: DENY`, `Cross-Origin-Opener-Policy: same-origin`, no `X-Powered-By` | `next.config.ts` |
| Lead form: zod validation, 32 KB body cap read as a stream, 5 requests a minute per client address, honeypot, time trap, header values capped at 500 characters | `src/app/api/lead/route.ts`, `src/lib/intake.ts`, `src/lib/rate-limit.ts` |
| The rate limit keys on the address Railway's edge reports; forged `X-Forwarded-For` and similar headers do not reset it (re-tested 2026-10-09) | `src/lib/rate-limit.ts` |
| Outbox capped at 500 files; file names are validated UUIDs only | `src/lib/lead-outbox.ts` |
| Secret-protected routes compare in constant time, fail closed when the secret is unset, and cap attempts at 30 a minute per address | `src/lib/webhook-auth.ts`; `/api/revalidate`, `/api/lead/replay`, `/api/draft` |
| Preview links carry a signed token for one path that expires within the hour, never the shared secret | `src/lib/webhook-auth.ts` (`previewTokenValid`), `wordpress/mu-plugins/tca-headless.php` (`tca_preview_token`) |
| Preview redirect accepts same-site paths only | `src/app/api/draft/route.ts` |
| WordPress content is validated entry by entry; a bad entry is skipped, not shown. Blog bodies are typed blocks, never HTML. Links are limited to `https:`, `http:`, `mailto:` and same-site paths. Pictures only from the connected WordPress's uploads folder, served through the image optimiser | `src/lib/cms.ts`, `src/components/blog/post-body.tsx`, `next.config.ts` (`images.remotePatterns`) |
| Structured data is written with `<` escaped, so content can't close the script tag | `src/lib/json-ld.ts` (every JSON-LD block uses `jsonLd()`) |
| Calendly: plain iframe, no third-party script; messages are accepted from `https://calendly.com` only; prefill never goes in a URL | `src/components/calendly-embed.tsx` |
| `/.well-known/security.txt` | `src/app/.well-known/security.txt/route.ts` |
| No secrets in the repo or its history; GitHub secret scanning, push protection and Dependabot on | checked by `sec-repo` |

### WordPress (content admin only)
| Control | Where |
|---|---|
| No plugin or theme installs, updates or code editing from the dashboard; code changes only by redeploying the image. Automatic WordPress security updates stay on | `tca-security.php` (`DISALLOW_FILE_MODS`, `DISALLOW_FILE_EDIT`) |
| Sign-in throttled: 5 failures per address per 15 minutes, then refused even with the right password (HTTP 429). One error message for every failure | `tca-security.php` |
| Two-factor plugin installed; each user switches it on under Users > Profile | `wordpress/Dockerfile`, `railway-entrypoint.sh` |
| Visitors can reach only the five content types and the secret-protected `tca/v1` routes over the REST API. The route index, users, media, comments, search and oEmbed need a signed-in editor | `tca-security.php` |
| No cross-origin API access offered to browsers | `tca-security.php` |
| XML-RPC, application passwords, comments, pingbacks, user sitemap and self-registration off | `tca-security.php`; `xmlrpc.php` also refused by Apache |
| Account names not discoverable: `/?author=N`, REST users, sitemap, oEmbed | `tca-headless.php` (redirect at priority 0), `tca-security.php` |
| Response headers on every file (HSTS, nosniff, Referrer-Policy, Permissions-Policy, framing by itself only); no PHP or Apache version banners | `wordpress/apache-security.conf`, Dockerfile (`expose_php = Off`) |
| `xmlrpc.php`, `install.php`, `readme.html`, `license.txt`, hidden and backup files refused | `wordpress/apache-security.conf` |
| Nothing in the uploads folder runs as code; no directory listings | `wordpress/apache-security.conf` |
| Editors can upload JPG, PNG and WebP only, 5 MB each | `tca-blog.php` |
| Content manager role sees only the site's content types | `tca-editing.php` |
| WP-CLI pinned to a release and verified by SHA-512 at build; core and plugin files checked against WordPress.org's checksums at every start (result in the deploy log) | `wordpress/Dockerfile`, `railway-entrypoint.sh` |

### n8n (see `docs/N8N_SETUP.md`)
Webhook requires the shared-secret header · sheet cells written RAW (no formula injection) · Discord mentions suppressed · error workflow alerts on failure · owner 2FA on · the version is not disclosed to visitors.

HubSpot and Slack (build 2, `docs/HUBSPOT_PLAN.md`), each webhook with its own secret, so no single leak opens the others:

| Endpoint | Who calls it | Check | Wrong secret gets |
|---|---|---|---|
| `/webhook/hubspot-deal-events` | HubSpot workflows ("Send a webhook") | `x-tca-hubspot-secret` header; the value lives in HubSpot's secret store (`HS_secret`) and the n8n credential "Hubspot Secret", never in a workflow | 403 |
| `/webhook/slack-claim` | Slack's Claim button | Slack's HMAC-SHA256 signature over the raw body, 5-minute replay window, compared in constant time (Slack's guidance; 2026-10-20). The signing secret is in the encrypted Crypto credential "Slack Signing Secret" (Crypto node v2), never in a workflow | 401 |
| `/webhook/hubspot-gmail-draft` | HubSpot "… to Gmail draft" workflows | Same `x-tca-hubspot-secret` header | 403 |

The Slack bot token is limited to `chat:write`, `users:read`, `users:read.email`, and its n8n credential may only call `slack.com`. Slack message text built from visitor input is escaped (`&`, `<`, `>`); deal names go in Block Kit `plain_text` headers. The first signing secret was pasted into a workflow field and saved, so it sits in that workflow's history: it was regenerated in Slack straight away, which made that copy useless.

Discord: the lead notice shows the visitor's name, email and phone as inline code, so a name written as a markdown link can't show up as a disguised link (2026-10-20).

Gmail drafts (build 4): the credential "Gmail - TCA drafts" is an OAuth client in Google Cloud project `strategic-hull-494501-q9` with **only `gmail.compose`** (n8n's default list includes `https://mail.google.com/`, full access, so the custom scope matters). Google classes `gmail.compose` as Restricted: it can manage drafts **and send**, but it can't read the inbox. Proven 2026-10-20: with this credential, listing inbox messages gets 403 `PERMISSION_DENIED`, listing drafts works. n8n only ever calls `drafts.create`; nothing is sent automatically. The consent screen is published (In production), so the token doesn't expire after 7 days; Google required the `/privacy` page for that. An unverified app with a Restricted scope has a 100-user lifetime cap: fine for one owner account. Visitor fields are checked before they reach a mail header (strict email pattern, CR/LF stripped, subject RFC 2047-encoded), so a crafted name or email can't add headers such as `Bcc`. Every draft ends with the opt-out line the consent copy and `/privacy` promise.

Calendly (build 3): the poller reads only the "Intro call" event type, so bookings for any other event type on the same Calendly account never become HubSpot contacts or Slack posts (2026-10-20). The Calendly token has `scheduled_events:read` and `users:read` only.

HubSpot: one service key ("n8n - TCA lead pipeline"), stored only in n8n. HubSpot → n8n calls never carry it. Since 2026-10-20 it holds only what the builds use: `crm.objects.contacts.read/write`, `crm.objects.deals.read/write`, `crm.objects.owners.read`, `crm.schemas.contacts.read/write`, `crm.schemas.deals.read/write` (the schema scopes for the setup workflow), `oauth`. Notes, tasks and meetings work under the contacts scopes. Tickets, companies, forms and lists were removed; every read and write the builds make was re-run with the trimmed key and passed.

HubSpot API version: every call uses the date-based **2026-09** API (`/crm/objects/2026-09/…`, `/crm/owners/2026-09`, `/crm/properties/2026-09/…`) since 2026-10-20. The v4 association calls lost support in March 2027 and v3 in September 2027 (HubSpot's migration page for this key). The 2026-09 meeting create **requires `hubspot_owner_id` and `hs_meeting_start_time`** (v3 didn't): the booking workflow sends the deal's owner, else the account owner.

n8n server (2026-10-20, Railway variables, owner's go-ahead): version **2.43.8** (no published advisories); `N8N_CONTENT_SECURITY_POLICY=default` **enforces** n8n's own nonce policy and `N8N_CONTENT_SECURITY_POLICY_REPORT_ONLY={}` drops the report-only copy (n8n's source: with neither set it enforces nothing, which is what the earlier scans saw); `N8N_BLOCK_ENV_ACCESS_IN_NODE=true` set explicitly (n8n 2.x already blocks unless it is `false`; proven: a Code node reading an env var gets "access to env vars denied"). Editor checked after the change: canvas and code editor work, no policy violations in the console.

**Hostile end-to-end test (2026-10-20, production):** one real quiz whose name was `=HYPERLINK("https://evil.example","Hostile") [Open HubSpot](https://evil.example) <b>Test</b> @everyone`. Sheet: stored as text (`'=HYPERLINK…`), no formula. Discord: posted as inline code. Slack: header plain text, HTML escaped in the contact field. Gmail: draft created, headers clean. HubSpot: name stored as text. Test row deleted.

## Risks accepted on purpose

| Risk | Why | Revisit when |
|---|---|---|
| CSP allows `'unsafe-inline'` scripts (owner's decision, re-confirmed 2026-10-20: keep the site static) | Closing it needs a per-request nonce, which makes every page render on demand. The static alternative, Next's experimental SRI, was tested 2026-10-20 and does not work here: it hashes the 6 script files but the 34 inline page-data scripts were refused and the page never hydrated. The pages are static, load nothing from other hosts, and every place content reaches the HTML is escaped or validated (tested with hostile content) | The site gains accounts, payments or user-generated content |
| WordPress admin allows inline and eval scripts | Core still prints inline scripts in wp-admin (core ticket #39941; the 5.7 nonce hooks were applied to the front end and login screen in 2023, not the admin). The admin policy (`wordpress/apache-security.conf`) does allow only this site's scripts, and refuses `<base>` and plugin objects: tested 2026-10-20 locally, then deployed (owner's yes) and verified on the hosted WordPress: the header appears once on sign-in, admin, REST and uploads; dashboard, ACF form, block editor, media library and uploader, and the Two Factor setup (its QR code renders from its own plugin folder) all work with no violations; an injected foreign script, `<base>` and plugin object were each refused and reported by the browser. WordPress scan: 0 high, 0 medium (was 1 medium) | WordPress ships nonce support in the admin |
| WordPress and its plugins take the newest release at each redeploy rather than a pinned version | For a CMS, getting security fixes quickly matters more than byte-identical builds. Files are checked against WordPress.org at start-up | A bad release ever ships |
| Dev-only npm advisories (in the ESLint tooling) | They run on a developer machine during linting, not in the deployed app; the only "fix" npm offers is a breaking downgrade | A non-breaking fix is published |
| No WAF or DDoS shield beyond Railway's edge | No custom domain to put Cloudflare in front of. The app-level rate limit and static pages cover ordinary abuse | A custom domain is attached |
| The n8n editor is reachable from the internet | It serves several projects and is protected by a login with 2FA | n8n is moved behind a private network or an IP allow-list |
| n8n sends no HSTS header (`sec-snap` now checks the preload list and passes it; other scanners still report a medium) | It has no effect here: the whole `.app` top-level domain, including `*.up.railway.app`, is on every major browser's HSTS preload list (hstspreload.org: "preloaded", 2026-10-20), so browsers never use plain HTTP for it, and the edge answers HTTP with a 301 to HTTPS. n8n has no setting for the header and Railway's edge doesn't add one | n8n moves to a custom domain outside `.app`: then add HSTS at the proxy |
| n8n sends no Permissions-Policy header | n8n has no setting for it; the editor uses no camera, microphone or location. It does send `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` and same-origin COOP/CORP (checked 2026-10-20) | n8n adds the setting |
| n8n's enforced CSP keeps `'unsafe-eval'` | It is the policy n8n's maintainers ship (`DEFAULT_CONTENT_SECURITY_POLICY` in n8n's source, 2.43.8); removing it is untested and could break the shared editor. Scripts are otherwise limited to a per-request nonce (`'strict-dynamic'`) | n8n ships a policy without it |
| n8n runs its Code-node task runner in internal mode | n8n's start-up log marks internal mode as deprecated and recommends an external runner for isolation; only the owner can create or edit Code nodes, and env access is blocked | n8n removes internal mode, or other people get editor access: move to an external runner |
| The n8n public API is switched on | No API keys exist (checked 2026-10-20), so nothing can use it | An API key is created: give it the narrowest scopes and an expiry |
| The Calendly poller can make a duplicate meeting if a manual run starts in the same second as a scheduled one | Scheduled runs are 5 minutes apart and take seconds, so they can't overlap; the risk is only a person pressing "Execute" on the published workflow | Never run it by hand while published (noted in `docs/HUBSPOT_PLAN.md`) |

## Open items (need the owner)

- Switch on two-factor for the WordPress administrator (Users > Profile, after the deploy).
- WordPress database and uploads have no backup.
- `main` has no branch rule: a force-push would deploy straight to production.
- Keep n8n on the current release (its image is `n8nio/n8n` latest: a redeploy updates it) and redeploy the WordPress image monthly so both pick up security fixes.
- HubSpot API: the builds use the 2026-09 version; HubSpot supports each date version for 18 months, so plan the next move before it ends (HubSpot's Development → Migrations page lists what each key still calls).

**State after 2026-10-20: no open findings.** What remains is the "Risks accepted on purpose" table above: hardening trade-offs with a written reason each, none an exploitable flaw. The only one that could be removed is the site's inline-script CSP, by moving to a nonce policy (pages would render per request); that reverses the 2026-10-09 decision to keep the site static, so it is the owner's call.

Closed 2026-10-20 (were open after the morning sweep): n8n CSP now enforced (the 2026-10-09 acceptance "n8n's default, needs a proxy" was wrong; the setting is an n8n variable); env access blocked explicitly; n8n 2.42.4 → 2.43.8; HubSpot key trimmed to 10 scopes; HubSpot calls moved off the v3/v4 APIs.

## How to re-test

Scripts: `D:\Work Files\Webs\Web Integrations\skills\web-security-check\scripts`. Configs and the project's own test live in `security/`. Full method: the `web-security-check` skill.

```bash
S="D:/Work Files/Webs/Web Integrations/skills/web-security-check/scripts"

# Code, dependencies, secrets (tracked files and all history), GitHub protections
node "$S/sec-repo.mjs" .

# Read-only outside-in scan: run for the site, staging, WordPress and n8n
node "$S/sec-snap.mjs" https://<origin>

# Abuse tests of the forms, secret routes, redirects and login (bounded; about 6 minutes)
node "$S/sec-probe.mjs" security/probe.site.json --base https://<site or http://localhost:3001>
node "$S/sec-probe.mjs" security/probe.wordpress.json

# A compromised CMS: stop the local WordPress, run a local production build
# (npm run build, then start it on port 3001 with WP_API_URL at 127.0.0.1:9400), then
node security/hostile-cms.mjs

# Bounded load test (staging or a local build)
node "$S/sec-load.mjs" https://<staging> --authorized --paths / /blog /work --slow 30
```

Add every new form, route, webhook or login to `security/probe.*.json` in the commit that adds it.


## For future clients: nonce-based CSP
This site stays static (tier A). For a client with accounts, payments, sensitive data or user content shown to others (tier B), use a nonce policy: a `proxy.ts` that makes a random nonce per request and puts it in `script-src 'self' 'nonce-…' 'strict-dynamic'`; Next.js applies it to its own scripts. Cost, from the Next.js guide in `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`: every page renders per request (no static pages, ISR or edge caching), slower and costlier. Experimental SRI is not a substitute on the App Router (tested above). Full recipe and test steps: the Web Integrations security standard ("Nonce-based CSP for future clients").
