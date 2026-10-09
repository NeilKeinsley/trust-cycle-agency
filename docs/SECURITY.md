# Security: what protects this site, and how it is tested

Audited 2026-10-09 with the `web-security-check` system (Web Integrations knowledge base, `skills\web-security-check`). This file is the project's record: the threat model, each control and where it lives, the risks accepted on purpose, and how to re-run every test. Findings, proof and dates are in the Web Integrations hub (`clients\trust-cycle-agency\`).

This is an automated and checklist-based review against the OWASP Top 10:2025. It is not a penetration test.

## What is being protected, and from whom

| Asset | Where it lives | Main threats |
|---|---|---|
| Leads' contact details | In transit through `/api/lead` to n8n, then the Google Sheet; briefly on the outbox volume when n8n is down | Form flooding, injected content reaching the sheet or Discord, a leaked webhook secret |
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

## Risks accepted on purpose

| Risk | Why | Revisit when |
|---|---|---|
| CSP allows `'unsafe-inline'` scripts | Closing it needs a per-request nonce, which makes every page render on demand. The pages are static, load nothing from other hosts, and every place content reaches the HTML is escaped or validated (tested with hostile content) | The site gains accounts, payments or user-generated content |
| WordPress admin has no script-level CSP | wp-admin is built on inline scripts. It does forbid framing by other sites | WordPress ships a nonce-based admin |
| WordPress and its plugins take the newest release at each redeploy rather than a pinned version | For a CMS, getting security fixes quickly matters more than byte-identical builds. Files are checked against WordPress.org at start-up | A bad release ever ships |
| Dev-only npm advisories (in the ESLint tooling) | They run on a developer machine during linting, not in the deployed app; the only "fix" npm offers is a breaking downgrade | A non-breaking fix is published |
| No WAF or DDoS shield beyond Railway's edge | No custom domain to put Cloudflare in front of. The app-level rate limit and static pages cover ordinary abuse | A custom domain is attached |
| The n8n editor is reachable from the internet | It serves several projects and is protected by a login with 2FA | n8n is moved behind a private network or an IP allow-list |

## Open items (need the owner)

- Switch on two-factor for the WordPress administrator (Users > Profile, after the deploy).
- WordPress database and uploads have no backup.
- `main` has no branch rule: a force-push would deploy straight to production.
- Keep n8n on the current release and redeploy the WordPress image monthly so both pick up security fixes.

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
