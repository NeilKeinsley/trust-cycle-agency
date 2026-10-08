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

## Hosting WordPress on Railway (written, never deployed)

`wordpress/Dockerfile` and `wordpress/railway-entrypoint.sh` were written from the WordPress image and Railway docs on a machine without Docker. Nothing here has been built or run: the first deploy is the test.

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
| `WP_ADMIN_USER`, `WP_ADMIN_PASSWORD`, `WP_ADMIN_EMAIL` | The administrator created on first boot |
| `TCA_FRONTEND_URL` | The public URL of the Next.js site |
| `TCA_SHARED_SECRET` | A long random string, the same as `WP_SHARED_SECRET` on the site |

Do not set `TCA_DEMO_EDITOR_PASSWORD` on a hosted WordPress. Create real editors in Users, with the Content manager role.

State on 2026-10-08, in the Railway project "Trust Cycle Agency": a MySQL database is created and online; a service named `selfless-trust` is created from this repo (branch `headless-wp-proof`, root `/wordpress`) but has never been deployed and has no public domain. Seven variables are staged on it and not yet applied (the database references, `WP_SITE_URL`, `WP_ADMIN_USER`, `WP_ADMIN_EMAIL`). Still missing: `TCA_SHARED_SECRET`, `WP_ADMIN_PASSWORD`, `TCA_FRONTEND_URL`, the volume, the domain, and the first deploy. The MySQL variable names in the table were checked against the live service.

Things to check on the first deploy, because they are known trouble spots or assumptions:

- Apache starting at all. Railway users report "More than one MPM loaded" with this image; the entrypoint removes the extra modules.
- The MySQL variable names above, against what the Railway MySQL service actually exposes.
- That the first-boot install ran (the admin can log in) and the three content types appear with seeded content.
- That the webhook reaches the site: edit an FAQ in WordPress and reload `/faq`.

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

Not done: deploying WordPress anywhere, Lighthouse runs, a persistent local database, and a security review of `/manage`.
