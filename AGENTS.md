<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Trust Cycle Agency — portfolio front-end

A portfolio piece: the front end for "Trust Cycle Agency", a fictional, deliberately generic full-service digital agency (brand, web, growth). Not a real business — the lead-intake flow (`/start`) is the part meant to impress a reviewer. Reference screenshots of the design inspiration (superpower.com) live in `reference/`, are git-ignored, and exist for pattern study only — never copy their copy, images, or font.

## Stack
- Next.js 16 (App Router) + React 19 + TypeScript + Tailwind v4 (`@theme inline` tokens in `src/app/globals.css`)
- `zod` for form/route validation
- No CMS, no auth backend — content is static; `/login` is a UI-only stub

## Design tokens (never hardcode colors — always use these)
Exposed as Tailwind utilities (`bg-background`, `text-muted`, etc.) via `@theme inline` in `src/app/globals.css`:
- `--background`, `--foreground` — warm off-white / near-black base
- `--card` — light surface (default cards)
- `--surface-dark`, `--on-dark`, `--on-dark-muted` — the dark card used for the hero and closing CTA; always dark regardless of theme
- `--on-dark-accent` — light teal for TEXT on those always-dark cards (identical in both themes). Don't use `--accent-soft` for text on dark cards: it's a tint that turns dark teal in the dark theme
- `--muted` — secondary text
- `--line`, `--line-strong` — hairline borders (foreground at low/higher opacity)
- `--accent`, `--accent-soft`, `--accent-foreground` — the deep teal "trust" accent; use sparingly, as a signal not a decoration
- `--radius-card` (28px), `--radius-field` (14px) — pills use full rounding, not a radius token
- `--font-sans` / `--font-mono` — Geist Sans / Geist Mono via `next/font`

Light and dark themes. Dark redefines the same token names in `globals.css`: it follows `prefers-color-scheme` unless the visitor uses the header toggle (`src/components/theme-toggle.tsx`), which writes `data-theme` on `<html>` and `localStorage["tca-theme"]`. An inline script in `layout.tsx` applies the saved choice before paint. Every new UI must pass WCAG AA contrast in BOTH themes: run Lighthouse with dark emulated too.

## Design rules (binding — adapted from Fine Lines' anti-slop standard)
- Colors only from tokens above. Never hardcode a hex/oklch value in a component.
- No decorative text marquees, no gradient text-shimmer, no CTA shimmer sweeps. The client rail (`src/components/home/client-strip.tsx`) is the one sanctioned marquee: it is a CONTENT rail (real client name + service caption per cell, each linking to `#work`), pauses on hover/focus-within, and degrades to a plain swipeable strip under `prefers-reduced-motion` (`.tc-ticker` / `.tc-ticker-viewport` in `globals.css`). Don't add another marquee without that same bar: real content, pause on hover/focus, reduced-motion fallback.
- No em-dashes in visible copy.
- No invented statistics or specifics presented as fact (fake case-study numbers, fabricated client counts, made-up testimonial metrics). Placeholder content must read as honestly generic, not as a real claim.
- Hairline/rounded-card visual language: `border-line` hairlines, `rounded-[var(--radius-card)]` cards, pill buttons/links.
- Every animation (`.reveal`, `.link-line`, `.faq-icon`, hover transitions) has a `prefers-reduced-motion` fallback — see `globals.css`.
- Mobile-first. No horizontal scroll at 375px width. 16px minimum side gutter (`px-4` at minimum on outer containers).
- Only real links — no `href="#"` placeholders. Link to an anchor or route only once the target exists.

## Structure
- `src/lib/site.ts` — single source of truth for site name, tagline, nav, CTA and contact info. Metadata, JSON-LD, header and footer all read from it.
- `src/components/` — shared UI: `reveal.tsx` (scroll-entrance), `button.tsx` (`Button`/`ButtonLink`, variants `primary`/`accent`/`ghost`/`on-dark`), `logo.tsx`, `header.tsx`, `footer.tsx`, `section.tsx` (`Section`/`Eyebrow`/`Panel` — `Panel` is the full-bleed, full-viewport-at-`lg` building block with `tone`/`lock`/`raised`/`compact` props; see its doc comment and the "Locking views" comment block in `globals.css` for the sticky/cover stacking mechanism), `faq.tsx` (`Faq({items})`).
- `src/app/icon.svg`, `src/app/apple-icon.tsx`, `src/app/manifest.ts` — TCA monogram tab/home-screen icons. Keep the three in visual sync if the mark changes.
- SEO: `src/lib/seo.ts` (`pageMetadata()`) sets each page's canonical, og:url, titles and social image; every page must use it (Next.js metadata merges shallowly, so layout-level nested metadata leaks into every page). `src/app/opengraph-image.tsx` + `twitter-image.tsx` generate the shared card. Audit, fact-checked sources and next steps: `docs/SEO.md`.
- `src/app/robots.ts` — has a `PREVIEW` flag. Launched: it is `false` (crawlers allowed, sitemap advertised) since 2026-09-26. Set it back to `true` to hide the site from search engines again.
- `public/google9f1b37bb300001af.html` — Google Search Console ownership token (URL-prefix property, verified 2026-09-27). **Never delete or rename it**: removing it un-verifies the property.
- `next.config.ts` — carries the security header baseline (HSTS, CSP frame-ancestors, etc.). Don't remove it.

## Knowledge bases (use the `seo-web-kb` skill)
SEO and website-build knowledge lives in Neil's two KBs, and this project is recorded in both: **SEOBase** (`D:/Work Files/SEOBase`, hub record `clients/trust-cycle-agency/`) and **Web Integrations** (`D:/Work Files/Webs/Web Integrations`, hub record `clients/trust-cycle-agency/`). For any SEO, build or lead-pipeline work, run the `seo-web-kb` skill: sync, consult, baseline (`seo-snap`), fact-check, fix, verify at origin, then write findings back to the KBs and push. Don't let learnings stay only in this repo.

## Dev
```
npm run dev    # http://localhost:3000
npm run lint
npm run build
```
