# Headless WordPress + ACF (proof of concept)

Branch `headless-wp-proof`. WordPress is the content admin; this Next.js app stays the website. Case studies, FAQs and testimonials are edited in WordPress with ACF (free) fields and read over the REST API. Nothing else moved: nav, tagline, team, the client rail and all layouts stay in code.

With `WP_API_URL` unset the site behaves exactly as before and WordPress is not needed.

## Run it locally

No Docker or database: WordPress Playground runs WordPress on Node with SQLite.

```
npm run wp     # WordPress on http://127.0.0.1:9400 (admin: http://127.0.0.1:9400/wp-admin)
npm run dev    # the site on http://localhost:3000
```

`.env.local`:

```
WP_API_URL=http://127.0.0.1:9400/wp-json
WP_SHARED_SECRET=local-dev-secret
```

- Use `127.0.0.1`, not `localhost`, for the WordPress admin: its login cookie is bound to the site URL.
- The login is Playground's default local account (`admin` / `password`). It exists only on this machine.
- The local WordPress is throwaway: it is rebuilt and re-seeded from `wordpress/mu-plugins/tca-seed.json` on every start, so edits do not survive a restart. `npm run wp:seed` regenerates the seed from the code fixtures.
- `npm run wp` points WordPress at `http://localhost:3000`. The webhook and the Preview button go there, so test those against `npm run dev`.

## How it fits together

| Piece | Where |
|---|---|
| Content types, ACF fields, seed, webhook, preview links | `wordpress/mu-plugins/tca-headless.php` |
| WordPress install recipe (installs ACF) | `wordpress/blueprint.json` |
| Reading, validating and falling back | `src/lib/cms.ts` |
| Publish-on-save | `src/app/api/revalidate/route.ts` |
| Draft preview | `src/app/api/draft/route.ts`, `src/app/api/draft/exit/route.ts`, `src/components/preview-banner.tsx` |
| On-site editor | `src/app/manage/`, `src/lib/manage.ts` |
| Role, admin dashboard, save-time rules, editing API | `wordpress/mu-plugins/tca-editing.php` |
| Hosted WordPress (untested) | `wordpress/Dockerfile`, `wordpress/railway-entrypoint.sh` |

- **Published content**: `GET /wp-json/wp/v2/{case-studies,faqs,testimonials}`. ACF puts the fields under `acf` because each field group has "Show in REST API" on.
- **Publish-on-save**: saving, trashing or deleting in WordPress POSTs to `/api/revalidate` with the shared secret; the next visit re-reads WordPress. As a safety net for a missed webhook, cached content is also re-read after an hour.
- **Preview**: the WordPress Preview button opens `/api/draft?secret=...&slug=...`, which turns on Next.js Draft Mode. Drafts come from `GET /wp-json/tca/v1/content/{type}`, which requires the secret. Preview shows saved drafts, not unsaved edits.
- **Fallback**: if WordPress is unset, unreachable or returns nothing valid, pages use the last content this server read, and failing that the code fixtures. The site never depends on WordPress being up.
- **Copy rules**: an entry containing an em-dash is skipped and logged (`[cms] skipped ...`). The "no invented statistics" rule cannot be checked by code and stays an editorial responsibility.
- **CSP**: unchanged. WordPress is only called from the server.

## Editing for non-technical people

Two ways in, both writing to the same WordPress (`docs/CMS_CLIENT_GUIDE.md` is the client-facing version):

- **`/manage`** on the site itself: sign in, then add, edit, reorder and remove FAQs. Files: `src/app/manage/`, `src/lib/manage.ts`. The editor signs in with their WordPress username and password; WordPress checks them, the site keeps a signed http-only cookie for 8 hours, and every change is made through WordPress as that user. Sign-in is rate limited (5 a minute per address).
- **WordPress admin** with the "Content manager" role (`wordpress/mu-plugins/tca-editing.php`): the menu shows only Dashboard, the three content types and Profile. The same rules run at save time (required fields, length limits, no long dashes).

`npm run wp` creates a local test editor, username `client`; its password is the `TCA_DEMO_EDITOR_PASSWORD` value in the `wp` script in `package.json`. Local only.

`npm run cms:limits` runs 27 edge-case checks against the two local servers (sign-in, validation, HTML stripping, Unicode, 105 entries, ordering, simultaneous saves, removal) and cleans up after itself. All 27 passed on 2026-10-08.

## Hosting WordPress on Railway (deployed 2026-10-08)

`wordpress/Dockerfile` and `wordpress/railway-entrypoint.sh` run on Railway at `https://selfless-trust-production-3e09.up.railway.app` (service `selfless-trust` in the project "Trust Cycle Agency", with a MySQL service beside it). The steps below are how it was set up.

1. New Railway project (or a service in the site's project): add a MySQL database.
2. Add a service from this GitHub repo and branch, with Root Directory `wordpress`.
3. Attach one volume at `/var/www/html/wp-content/uploads`.
4. Generate a public domain, then set the variables below and redeploy.
5. On the site service set `WP_API_URL=https://<wordpress-domain>/wp-json` and `WP_SHARED_SECRET` to the same secret.

| Variable (WordPress service) | Value |
|---|---|
| `WORDPRESS_DB_HOST` | `${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}` |
| `WORDPRESS_DB_USER`, `WORDPRESS_DB_PASSWORD`, `WORDPRESS_DB_NAME` | `${{MySQL.MYSQLUSER}}`, `${{MySQL.MYSQLPASSWORD}}`, `${{MySQL.MYSQLDATABASE}}` |
| `WP_SITE_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |
| `WP_ADMIN_USER`, `WP_ADMIN_EMAIL` | The administrator created on first boot |
| `WP_ADMIN_PASSWORD` (optional) | Its password. Unset: a random one is generated and printed once in the first deploy log |
| `TCA_FRONTEND_URL` | The public URL of the Next.js site |
| `TCA_SHARED_SECRET` | A long random string, the same as `WP_SHARED_SECRET` on the site. Unset: the public content API still works, but the publish webhook, preview and `/manage` are off |

Do not set `TCA_DEMO_EDITOR_PASSWORD` on a hosted WordPress. Create real editors in Users, with the Content manager role.

State on 2026-10-08: deployed from branch `headless-wp-proof`, root `/wordpress`, domain target port 80. WordPress installed itself on first boot, seeded 4 case studies, 10 FAQs and 3 testimonials, and kept them across redeploys. `TCA_SHARED_SECRET`, `TCA_FRONTEND_URL` and `WP_ADMIN_PASSWORD` are not set, and there is no volume (nothing uploads media yet). The admin user is `tca-admin`; set `WP_ADMIN_PASSWORD` and redeploy to choose its password.

Verified from outside on 2026-10-08:

- The public content API returns ACF fields for all three types, and a production build of the site with `WP_API_URL` pointed at it completed with no fallback warnings.
- The install screen reports "Already Installed"; the drafts and sign-in endpoints answer 401 without the secret; the user list is 404; theme pages redirect to the login screen.
- Two bugs found by the first deploys and fixed: Apache followed Railway's injected `PORT` while the domain targeted 80 (502), and the database wait used `wp db check`, which needs a mysql client the image does not have.
- A staging copy of the site runs beside it: service `incredible-clarity`, same branch, `https://incredible-clarity-production-86a3.up.railway.app`, with `SITE_STAGING=1` (robots.txt answers `Disallow: /`), `WP_API_URL` and `WP_SHARED_SECRET` set by reference to the WordPress service, and WordPress's `TCA_FRONTEND_URL` pointing back at it. All pages answer 200 and `/faq` shows the 10 hosted FAQs; the refresh and preview routes answer 401 without the secret.
- Hosted tests run on 2026-10-08 with the owner signed in to WordPress admin: an FAQ published in hosted WordPress appeared on staging `/faq` with no redeploy (publish webhook); a draft case study was 404 publicly and opened through Preview on the staging site with the banner; Publish refused a long dash with the plain message.
- Found on hosted: Save Draft does not run the field rules, so a draft can hold a long dash. Publish refuses it, and the site skips such an entry anyway.
- Hosted limit tests, run on 2026-10-08 through the WordPress REST API from the owner's signed-in admin session, with results read off the staging site:
  - 116 published FAQs in WordPress: staging showed all 113 valid ones, so paging past WordPress's 100-per-request cap works on hosted.
  - Entries with an empty answer or a long dash (the REST API accepts both) were kept off the page by the site.
  - An answer over 1,200 characters was refused by WordPress (400).
  - HTML and script tags posted by an administrator are stored as typed and shown as inert text; nothing executed and no raw tag reached the page.
  - Accents, Japanese, Arabic and emoji rendered; duplicates were allowed; the homepage still showed only the first six.
  - A scheduled FAQ went live and staging refreshed by itself within about 15 seconds of its time.
  - Trashing the 105 test entries brought staging back to 11 items, again with no redeploy.
  - Revision restore: after two edits in WordPress admin, restoring the original revision put the original answer back, and staging followed without a redeploy.
  - Lighthouse mobile on staging `/faq`: 100 accessibility, 96 best practices, SEO 66 (expected: staging blocks crawlers on purpose).
- Not tested on the hosted pair: `/manage` (needs the owner to sign in on the staging site) and the 27-check script itself (it signs in with a password, so it needs a test editor account the owner creates).

Running cost is Railway usage: $10 per GB of RAM and $20 per vCPU a month, $0.15 per GB of volume, against the plan's included credit ($5 on Hobby). A small WordPress plus MySQL has been quoted at roughly $5 to $10 a month on Railway's own template page; not verified against a bill.

## Limits of this proof

- ACF free has no repeater. A case study's approach is three fixed title/detail pairs, and lists are one item per line in a text box.
- The homepage bento is composed around four specific studies (`northwind`, `brightline`, `oakridge`, `halcyon`). Their copy comes from WordPress; a fifth study appears on `/work` and gets its own page, but not a homepage tile.
- Illustrations are coded SVGs chosen from a dropdown. A new one needs a developer.
- On-demand refresh reaches only the server instance that receives the webhook. Fine for one instance; several would need a shared cache handler.
- A production build reuses fetches cached by an earlier build (`.next/cache`). A host that keeps that cache between builds can deploy content up to an hour stale.

## Verified locally (2026-10-08)

- Edit in WordPress, the change is on the site without a redeploy (dev: WordPress's own webhook; production build: `POST /api/revalidate`).
- New study saved as a draft: 404 publicly, visible through the Preview link with the banner, and Exit preview clears it.
- Published new study: gets a page, is listed on `/work` and in the sitemap, with no rebuild.
- An FAQ with an em-dash is kept off the site and logged.
- WordPress stopped: every page still serves, including after a forced refresh.
- Build with WordPress stopped and no build cache: succeeds on the fixtures.
- Pages stay static (`○`/`●` in the build output); `npm run lint` and `tsc --noEmit` pass; preview banner contrast is 15.4:1 light and 10.7:1 dark.

Also verified on 2026-10-08: the `/manage` editor in the browser (wrong password, sign-in, add, validation message, edit, reorder, two-step remove, each change live on `/faq` without a manual refresh, no horizontal scroll at 375px), the Content manager role in WordPress admin (restricted menu, dashboard panel, long-dash rejection, plugins page blocked), and `npm run cms:limits`.

Also verified locally on 2026-10-08: scheduled publishing (a scheduled FAQ went live and the site refreshed by itself about a minute after its time), revision restore (field text is in revisions from the second saved edit, and restoring one reached the site), and Lighthouse mobile on the production build: `/faq` 100 accessibility, 100 SEO, 96 best practices; `/manage` in dark mode 100 accessibility, 96 best practices, SEO 66 because the page is deliberately noindex. The one best-practices failure is a Content Security Policy entry in the browser Issues panel; not checked whether `main` has it too.

Not done: the hosted items listed above, a persistent local database, and a security review of `/manage`.
