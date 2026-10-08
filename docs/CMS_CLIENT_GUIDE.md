# Presenting the CMS to a client

How to show, explain and hand over the content system on the `headless-wp-proof` branch. Everything marked "tested" was run on 2026-10-08, locally and on the hosted pair (WordPress and a staging copy of the site on Railway). Technical setup is in `docs/HEADLESS_WP.md`.

## The one-sentence pitch

"You can change the words on your website yourself, in a simple form, and the change is live in seconds. You cannot break the design, because the design is not in the part you edit."

Say the second half out loud. It is the real selling point, and it is also the main limit: the client edits content, never layout.

## How it works, in plain words

There are two separate things, and that separation is the whole idea.

- **The website** is the shop window. Visitors only ever see this. Its design is fixed.
- **WordPress** is the back office. It is where the words are kept and edited. Visitors never see it.

When someone presses Publish in the back office, WordPress tells the website "something changed". The website fetches the new words and rebuilds just the pages that use them. That takes a few seconds and needs no developer.

If the back office is ever closed (WordPress is down), the shop window stays open: the website keeps showing the last words it was given.

An illustrated version of this guide for non-technical readers is in `docs/CMS_Guide.pdf`.

## How the client edits

The client signs in to WordPress with a "Content manager" account. That account sees only Dashboard, Case studies, FAQs, Testimonials, Team and Profile; plugins, themes, users and settings are hidden and blocked.

| They want to | They do |
|---|---|
| Change something | Open the item, edit the labelled fields, press Update |
| Add something | Press "Add", fill the fields, press Publish |
| Work on it privately first | Save Draft, then Preview to see it on the real site with a banner |
| Publish later | Set a date before pressing Publish (tested: went live and the site refreshed by itself) |
| Reorder a list | Change the Order number; lower numbers come first |
| Remove something | Move to Trash; it stays there 30 days |
| Undo an edit | Browse revisions, then Restore This Revision (tested; available from the second saved edit, and the version before the first ever edit is not kept) |

An earlier version of this proof also had an editor page on the website itself (`/manage`). It was removed on 2026-10-08: WordPress admin does everything it did and more, and a second login is a second thing to secure.

## What the client can edit today (tested)

| Content | Where it shows | Fields |
|---|---|---|
| FAQs | `/faq`, and the first six on the homepage | Question (160 characters), answer (1,200 characters, line breaks kept) |
| Testimonials | Homepage | Name, quote, role, company |
| Team | Homepage | Name, role, specialty, current focus |
| Case studies | `/work`, each case study page, homepage tiles, sitemap | Client name, services, illustration (pick from four), homepage line, summary, sector, engagement, situation, three approach steps, what shipped, what changed, what we watched |

What happens when they get it wrong:

| They do this | The system does this |
|---|---|
| Leave a required field empty | Refuses to publish and says which field |
| Type a long dash | Refuses to publish with a plain message (house style). Save Draft does not check it; the site still keeps such an entry off the page |
| Go over a length limit | The field stops accepting text |
| Paste emoji, accents, Arabic, Japanese | Saved and shown unchanged |
| Add more than 100 items | All still appear (tested with 116 FAQs on hosted) |
| Take the content system offline | The public site stays up on the last content it read |

## What the client cannot edit

- Layout, colours, fonts, page structure, navigation, footer, the tagline and contact details.
- Section headings and the hero, services, process, engagement and About copy (still in code; see the next table).
- Illustrations: they choose one of four built-in ones; a new one is a developer job.
- The number of homepage work tiles: four fixed studies. A fifth study gets its own page and a `/work` listing, not a homepage tile.
- Images of any kind. Nothing in this build uploads media yet.

## What else on this site could become editable

Surveyed on 2026-10-08. "Small" means the same pattern as Team: a content type, a few fields, one component reading it.

| Content | Where it lives now | Effort | Note |
|---|---|---|---|
| Engagement tiers ("Work with us the way that fits") | `engagements.tsx` | Small | A list of three cards |
| About page values | `about/page.tsx` | Small | A list of cards |
| Process steps | `process.tsx` | Small | Four steps; the layout assumes four |
| Closing call-to-action steps | `closing-cta.tsx` | Small | A short list |
| Client logo rail | `fixtures.ts` | Small | Name, two captions and a mark picked from six built-in shapes |
| Section headings and intros | Each section component | Medium | One "Site text" entry with a field per heading |
| Tagline, contact email, navigation labels | `site.ts` | Medium | Also feeds SEO metadata, so changes need care |
| Hero headline and trust notes | `hero.tsx` | Medium | The hero runs in the browser, so its text has to be passed in from the server |
| Services story (four pillars) | `services-story.tsx` | Large | Text is tied to animated scenes; restructuring needed |

## What could be added, and what it takes

Field types below are in ACF free unless marked PRO. PRO is $49 a year for one site and adds Repeater, Gallery, Flexible Content, Clone, Options pages and ACF Blocks.

| Client asks for | How | Effort |
|---|---|---|
| Photos (team, case study covers) | Image field, media uploads for the role, image handling on the site, persistent storage on the host | Medium |
| Bold, links and lists inside text | Wysiwyg field, plus safe HTML rendering on the site | Medium |
| Embedded video | oEmbed field, a click-to-load player, and one more allowed origin in the site's security policy | Medium |
| "Add another row" lists instead of fixed boxes | Repeater field (PRO) | Small once PRO is bought |
| A new section such as News or a blog | New content type, new page templates, sitemap and SEO wiring | Large: this is design and build work |
| Search-result title and description per item | Two extra text fields | Small |
| More editors, or a read-only reviewer | WordPress users and roles | None: built in |
| Rearranging a page | Not offered. That is a redesign | Out of scope by design |

## Demo script (about ten minutes)

1. Open the live FAQ page and WordPress admin side by side. Sign in as the client's own Content manager account and point out how little is there.
2. Add an FAQ and press Publish. Reload the FAQ page: it is there. Nothing was "deployed".
3. Change its Order number. Reload: the position changed, and the homepage shows the first six.
4. Make a mistake on purpose: paste a long dash and press Publish. Show the message. This is where clients relax.
5. Edit a team member's role. Reload the homepage.
6. Edit a case study, press Save Draft, then Preview: the draft shows on the real site with a banner. Then Publish.
7. Move the test FAQ to Trash, and show that it is still recoverable.
8. Hand them the keyboard. The acceptance test is the client adding one item of each type unaided.

## Letting a client try it

The CMS runs on a separate staging pair (WordPress plus a copy of the site), not on the public portfolio site. Nothing links to it and crawlers are blocked, so it is seen only when you open it or send the link.

| What | Link |
|---|---|
| Staging website (what visitors would see) | `https://website-cms-staging-production.up.railway.app` |
| WordPress login (where they edit) | `https://wordpress-cms.up.railway.app/wp-admin` |

1. Create a Content manager account for the client in WordPress (Users, Add New).
2. Send them the two links above and their login.
3. They edit; the staging site updates in seconds.
4. Afterwards, delete their account, then press **Reset demo content** on your administrator dashboard. It moves everything in the four content types to Trash (recoverable for 30 days) and restores the original entries. Only administrators see it. Tested locally and on hosted on 2026-10-08.

## Honest answers to the questions clients ask

- **"Can I break the site?"** Not the design. You can publish a typo, and you can delete an item (recoverable from Trash for 30 days).
- **"What if WordPress goes down?"** The public site keeps serving. You just cannot edit until it is back. Tested.
- **"Can I add a page?"** No. New sections are a small project, quoted separately.
- **"Is it instant?"** A save shows on the next page load. If a notification is ever missed, the site catches up within an hour.
- **"Who else can maintain this?"** WordPress is common knowledge. The website itself needs a Next.js developer. This is the main trade-off against a plain WordPress site, and the client should hear it before signing.

## Handover checklist

- One named account per person, with the "Content manager" role. No shared logins, and the client never gets Administrator.
- A recording of the demo script on their own content.
- The tables above, as a short reference.
- Who to call, and what a change request costs, for anything in the "cannot edit" list.
- Agreed care plan: WordPress and plugin updates, backups of the database, uptime checks.

## Not yet true (do not promise)

- A production-ready hosted setup: the Railway pair works and was tested, but it has no media storage, no backups configured and no uptime monitoring.
- Two-factor sign-in and an audit log of who changed what.
- Images, rich text, and a persistent local database.
- Protection against two editors overwriting each other. WordPress shows its own "someone else is editing" lock on the edit screen; that was not tested here.
