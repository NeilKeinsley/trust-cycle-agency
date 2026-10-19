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

HubSpot: one service key ("n8n - TCA lead pipeline"), stored only in n8n. HubSpot → n8n calls never carry it.

**Hostile end-to-end test (2026-10-20, production):** one real quiz whose name was `=HYPERLINK("https://evil.example","Hostile") [Open HubSpot](https://evil.example) <b>Test</b> @everyone`. Sheet: stored as text (`'=HYPERLINK…`), no formula. Discord: posted as inline code. Slack: header plain text, HTML escaped in the contact field. Gmail: draft created, headers clean. HubSpot: name stored as text. Test row deleted.

## Risks accepted on purpose

| Risk | Why | Revisit when |
|---|---|---|
| CSP allows `'unsafe-inline'` scripts | Closing it needs a per-request nonce, which makes every page render on demand. The pages are static, load nothing from other hosts, and every place content reaches the HTML is escaped or validated (tested with hostile content) | The site gains accounts, payments or user-generated content |
| WordPress admin has no script-level CSP | wp-admin is built on inline scripts. It does forbid framing by other sites | WordPress ships a nonce-based admin |
| WordPress and its plugins take the newest release at each redeploy rather than a pinned version | For a CMS, getting security fixes quickly matters more than byte-identical builds. Files are checked against WordPress.org at start-up | A bad release ever ships |
| Dev-only npm advisories (in the ESLint tooling) | They run on a developer machine during linting, not in the deployed app; the only "fix" npm offers is a breaking downgrade | A non-breaking fix is published |
| No WAF or DDoS shield beyond Railway's edge | No custom domain to put Cloudflare in front of. The app-level rate limit and static pages cover ordinary abuse | A custom domain is attached |
| The n8n editor is reachable from the internet | It serves several projects and is protected by a login with 2FA | n8n is moved behind a private network or an IP allow-list |
| n8n sends no HSTS header | n8n has no setting for it (checked against its security env-var docs, 2026-10-20) and Railway's edge doesn't add one. Railway redirects plain HTTP to HTTPS | A custom domain or proxy that can add the header |
| The n8n public API is switched on | No API keys exist (checked 2026-10-20), so nothing can use it | An API key is created: give it the narrowest scopes and an expiry |
| The Calendly poller can make a duplicate meeting if a manual run starts in the same second as a scheduled one | Scheduled runs are 5 minutes apart and take seconds, so they can't overlap; the risk is only a person pressing "Execute" on the published workflow | Never run it by hand while published (noted in `docs/HUBSPOT_PLAN.md`) |

## Open items (need the owner)

- Switch on two-factor for the WordPress administrator (Users > Profile, after the deploy).
- WordPress database and uploads have no backup.
- `main` has no branch rule: a force-push would deploy straight to production.
- Keep n8n on the current release and redeploy the WordPress image monthly so both pick up security fixes. On 2026-10-20 n8n was 2.42.4 (no published advisories) and the latest stable 2.43.8.
- n8n's Content-Security-Policy is sent report-only, so it enforces nothing. n8n's default policy is enforced (nonce-based), so a Railway variable is overriding it: remove `N8N_CONTENT_SECURITY_POLICY_REPORT_ONLY` (or clear it) and check the editor still loads.
- Set `N8N_BLOCK_ENV_ACCESS_IN_NODE=true` on n8n: no workflow reads environment variables (checked 2026-10-20), and it stops a Code node from reading the database password or encryption key.
- Trim the HubSpot service key to what the builds use: keep contacts, deals and owners read/write, and the contacts/deals schema scopes for the setup workflow. Remove tickets (4 scopes), companies (3), `forms` and `crm.lists.write`.

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
