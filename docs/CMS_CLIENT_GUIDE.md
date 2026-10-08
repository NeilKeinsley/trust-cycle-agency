# Presenting the CMS to a client

How to show, explain and hand over the content system on the `headless-wp-proof` branch. Everything marked "tested" was run locally on 2026-10-08; anything else says so. Technical setup is in `docs/HEADLESS_WP.md`.

## The one-sentence pitch

"You can change the words on your website yourself, in a simple form, and the change is live in seconds. You cannot break the design, because the design is not in the part you edit."

Say the second half out loud. It is the real selling point, and it is also the main limit: the client edits content, never layout.

## Two ways in, same content

| | The site's own page (`/manage`) | WordPress admin (`/wp-admin`) |
|---|---|---|
| Who it is for | Someone who should never see WordPress | Someone comfortable with a normal admin screen |
| What it edits today | FAQs only | Case studies, FAQs, testimonials |
| Sign-in | Their WordPress username and password | The same account |
| Add, edit, remove, reorder | Yes, with Move up / Move down | Yes, with an Order number |
| Drafts and preview | No: every save is live | Yes: Save Draft, Preview, Publish |
| Schedule for later | No | Yes, tested: a scheduled FAQ went live about a minute after its time and the site refreshed by itself. WordPress only runs scheduled jobs when something visits it, so a quiet install needs a regular ping |
| Undo | No | Trash keeps removed items 30 days. Revisions, tested: "Browse revisions" appears from the second saved edit, shows the field text, and "Restore This Revision" put the old answer back on the site. The version from before the first ever edit is not kept |

Both write to the same WordPress, with the same rules, so they never disagree.

## What the client can edit today (tested)

| Content | Where it shows | Fields |
|---|---|---|
| FAQs | `/faq`, and the first six on the homepage | Question (160 characters), answer (1,200 characters, line breaks kept) |
| Testimonials | Homepage | Name, quote, role, company |
| Case studies | `/work`, each case study page, homepage tiles, sitemap | Client name, services, illustration (pick from four), homepage line, summary, sector, engagement, situation, three approach steps, what shipped, what changed, what we watched |

What happens when they get it wrong:

| They do this | The system does this |
|---|---|
| Leave a required field empty | Refuses to save and says which field |
| Type a long dash | Refuses to save with a plain message (house style) |
| Go over the length limit | Live counter warns, then refuses to save |
| Paste HTML or a script | Tags are removed; only the text is kept |
| Paste emoji, accents, Arabic, Japanese | Saved and shown unchanged |
| Add more than 100 items | All still appear (tested with 105 FAQs) |
| Two people save the same item at once | Both saves succeed and the last one wins, with no warning |
| Take the content system offline | The public site stays up on the last content it read |

## What the client cannot edit

- Layout, colours, fonts, page structure, navigation, footer, the tagline and contact details.
- The team section and the client logo rail (still in code).
- Illustrations: they choose one of four built-in ones; a new one is a developer job.
- The number of homepage work tiles: four fixed studies. A fifth study gets its own page and a `/work` listing, not a homepage tile.
- Images of any kind. Nothing in this build uploads media yet.

## What could be added, and what it takes

Field types below are in ACF free unless marked PRO. PRO is $49 a year for one site and adds Repeater, Gallery, Flexible Content, Clone, Options pages and ACF Blocks.

| Client asks for | How | Effort |
|---|---|---|
| Edit testimonials or case studies on `/manage` too | Same pattern as the FAQ editor | Small per type |
| Photos (team, case study covers) | Image field, media uploads for the role, image handling on the site, persistent storage on the host | Medium |
| Bold, links and lists inside text | Wysiwyg field, plus safe HTML rendering on the site | Medium |
| Embedded video | oEmbed field, a click-to-load player, and one more allowed origin in the site's security policy | Medium |
| Edit the tagline, contact details, homepage headline | A single "Site settings" entry (free), or an Options page (PRO) | Small to medium |
| "Add another row" lists instead of fixed boxes | Repeater field (PRO) | Small once PRO is bought |
| A new section such as News or a blog | New content type, new page templates, sitemap and SEO wiring | Large: this is design and build work |
| Search-result title and description per item | Two extra text fields | Small |
| More editors, or a read-only reviewer | WordPress users and roles | None: built in |
| Rearranging a page | Not offered. That is a redesign | Out of scope by design |

## Demo script (about ten minutes)

1. Open the live FAQ page and `/manage` side by side. Sign in as the client's own account.
2. Add a question. Reload the FAQ page: it is there. Point out that nothing was "published" or "deployed".
3. Move it up twice. Reload: the order changed, and the homepage shows the first six.
4. Make a mistake on purpose: paste a long dash or go over the limit. Show the message. This is where clients relax.
5. Remove the question, with the confirmation step.
6. Open WordPress admin with the same account. Show how little is there: Dashboard, three content types, Profile.
7. Edit a case study, press Preview, show the draft on the real site with the banner, then Publish.
8. Hand them the keyboard. The acceptance test is the client adding one item of each type unaided.

## Honest answers to the questions clients ask

- **"Can I break the site?"** Not the design. You can publish a typo, and you can delete an item (recoverable from Trash for 30 days).
- **"What if WordPress goes down?"** The public site keeps serving. You just cannot edit until it is back. Tested.
- **"Can I add a page?"** No. New sections are a small project, quoted separately.
- **"Is it instant?"** Saves from `/manage` and from WordPress show on the next page load. If a notification is ever missed, the site catches up within an hour.
- **"Who else can maintain this?"** WordPress is common knowledge. The website itself needs a Next.js developer. This is the main trade-off against a plain WordPress site, and the client should hear it before signing.

## Handover checklist

- One named account per person, with the "Content manager" role. No shared logins, and the client never gets Administrator.
- A recording of the demo script on their own content.
- The limits table above, as a one-page reference.
- Who to call, and what a change request costs, for anything in the "cannot edit" list.
- Agreed care plan: WordPress and plugin updates, backups of the database, uptime checks.

## Not yet true (do not promise)

- A finished hosted setup: WordPress runs on Railway and serves content, but the shared secret is not set there yet, so the publish webhook, preview and `/manage` have only been tested locally.
- Two-factor sign-in, password reset from `/manage`, and an audit log of who changed what.
- Images, rich text, and a persistent local database.
- A security review of `/manage`. It is a proof: sign-in is rate limited and every change is re-checked by WordPress, but it has not been audited.
