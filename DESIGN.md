---
name: Trust Cycle Agency
description: Warm paper, dark ink and one deep teal signal; a studio that leaves its systems visible.
colors:
  trust-teal: "oklch(0.46 0.085 180)"
  teal-wash: "oklch(0.94 0.03 180)"
  teal-ink: "oklch(0.99 0 0)"
  warm-paper: "oklch(0.985 0.004 95)"
  ink: "oklch(0.2 0.01 250)"
  clean-sheet: "oklch(1 0 0)"
  pencil-grey: "oklch(0.52 0.012 250)"
  hairline: "oklch(0.2 0.01 250 / 0.1)"
  hairline-strong: "oklch(0.2 0.01 250 / 0.25)"
  studio-night: "oklch(0.19 0.012 200)"
  night-paper: "oklch(0.97 0.005 95)"
  night-grey: "oklch(0.75 0.01 200)"
typography:
  display:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.75rem, 6.2vw, 7.5rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "clamp(2.25rem, 4.5vw, 5rem)"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: "-0.03em"
  lead:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
    lineHeight: 1.55
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  nav:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    letterSpacing: "0.04em"
  caption:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.4
  body-sm:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
  numeral:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "2.25rem"
    fontWeight: 500
    lineHeight: 1
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    letterSpacing: "0.12em"
  tag:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.625rem"
    fontWeight: 400
    letterSpacing: "0.14em"
rounded:
  field: "14px"
  card: "28px"
  pill: "9999px"
spacing:
  gutter-sm: "1rem"
  gutter-md: "2rem"
  gutter-lg: "3rem"
  gutter-xl: "4rem"
  panel-y: "3rem"
  panel-y-lg: "3.5rem"
  card-pad: "1.5rem"
  card-pad-lg: "2rem"
  grid-gap: "1.5rem"
  header-h: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "2.75rem"
  button-primary-sm:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.pill}"
    padding: "0 1rem"
    height: "2.25rem"
  button-accent:
    backgroundColor: "{colors.trust-teal}"
    textColor: "{colors.teal-ink}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "2.75rem"
  button-ghost:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "2.75rem"
  button-on-dark:
    backgroundColor: "{colors.night-paper}"
    textColor: "{colors.studio-night}"
    rounded: "{rounded.pill}"
    padding: "0 1.5rem"
    height: "2.75rem"
  chip:
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0.625rem 1rem"
  chip-selected:
    backgroundColor: "{colors.trust-teal}"
    textColor: "{colors.teal-ink}"
    rounded: "{rounded.pill}"
    padding: "0.625rem 1rem"
  chip-on-dark:
    textColor: "{colors.night-paper}"
    rounded: "{rounded.pill}"
    padding: "0.5rem 1rem"
  input-field:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    padding: "0.75rem 1rem"
  card:
    backgroundColor: "{colors.clean-sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "2rem"
  card-dark:
    backgroundColor: "{colors.studio-night}"
    textColor: "{colors.night-paper}"
    rounded: "{rounded.card}"
    padding: "2rem"
---

# Design System: Trust Cycle Agency

## Overview

**Creative North Star: "The Working Studio"**

Warm paper, dark ink, systems left visible. The site behaves like a studio that shows its work and how it gets done: honest, hands-on, never glossy. Surfaces are flat sheets separated by hairlines, the type is a single confident sans at medium weight, and the one colour with a voice is a deep teal used as a signal, not a decoration.

Structure is shown rather than hidden. Numbered stages, indexed questions, progress bars, step badges that lock and unlock, a services stage with visible progress tabs: the machinery of the process is part of the look. Depth comes from how panels physically stack over each other as you move through the page, not from ornament.

Density is generous on the home page (full-viewport panels at desktop, one idea per view) and compact and form-like in the intake flows, where cards, pills and fields do the work. Light theme only; the dark Studio Night surface is a fixed ground for the hero, the services stage, the quiz and the closing call to action.

**Key Characteristics:**
- Warm off-white paper and near-black ink, with one deep teal signal.
- Flat, hairline-bordered surfaces; depth by stacking, not by shadow.
- Three radii only: generous cards, softer fields, full pills.
- Geist Sans at weight 500 for every heading; Geist Mono for numbers and data.
- Process machinery (numbers, progress, locked states) left visible on purpose.
- Motion is spring-eased and always has a reduced-motion fallback.

## Colors

A near-neutral warm palette of paper and ink, one fixed dark ground, and a single deep teal that carries every signal.

### Primary
- **Trust Teal** (`trust-teal`): the signal. Selected chips and quiz options, focus rings, text selection, the FAQ indices, client marks in the rail, the active services progress tab, and the one stage or tile in a composition that should draw the eye (the Build process card, the bento CTA tile). Darkened specifically so it passes 4.5:1 as small text on Warm Paper.
- **Teal Wash** (`teal-wash`): the quiet tint of the accent. Completed step badges, numbered intro list markers, the Plan stage of the process progression. A background, never a text colour on light surfaces.
- **Teal Ink** (`teal-ink`): text and icons sitting on a Trust Teal fill.

### Neutral
- **Warm Paper** (`warm-paper`): the page ground and the default Panel tone; also the fill of form fields inside cards.
- **Ink** (`ink`): all primary text on light surfaces and the fill of the primary button.
- **Clean Sheet** (`clean-sheet`): the pure white card surface; the `card` Panel tone and the intake step cards. Separates from Warm Paper by a hair, the hairline does the rest.
- **Pencil Grey** (`pencil-grey`): secondary text, leads, nav links at rest, placeholders.
- **Hairline** (`hairline`): the default border on cards, fields, chips, list dividers and the scrolled header.
- **Hairline Strong** (`hairline-strong`): hover borders, the expanded step card, and the colour both system shadows are built from.
- **Studio Night** (`studio-night`): the fixed dark ground. Hero, services stage, lead quiz modal, closing CTA, the Grow stage and dark bento tiles. It never inverts with theme.
- **Night Paper** (`night-paper`): primary text on Studio Night and the fill of the on-dark button.
- **Night Grey** (`night-grey`): secondary text on Studio Night. At 15 to 30% opacity it is also the hairline colour on dark surfaces.

### Named Rules
**The Signal Rule.** Trust Teal marks selection, focus and the single point of emphasis in a composition. At most one teal-filled surface per view; everything else is paper, ink or night.

**The Fixed Night Rule.** Studio Night is a ground, not a theme. Anything placed on it uses Night Paper, Night Grey and Night Grey hairlines only, never the light-surface tokens.

**The Token-Only Rule.** Every colour, including shadows, SVG strokes and illustration fills, comes from a token (`var(--color-*)` or a Tailwind token utility with opacity). No hex, rgb or oklch literal appears in a component.

## Typography

**Display Font:** Geist Sans (with system-ui, sans-serif), via `next/font`
**Label/Mono Font:** Geist Mono (with ui-monospace, monospace), via `next/font`

**Character:** One neutral, precise grotesque carries everything from the hero to form labels, tightened for headings; its mono sibling is reserved for the numbers and data that show the system at work.

### Hierarchy
- **Display** (500, `--fs-hero`, 0.98): the hero headline only. On the pinned hero it is also capped by viewport height (13svh) so it fits short laptops.
- **Headline** (500, `--fs-h2`, 1.02): section H2s via SectionHead, max width around 56rem. The closing CTA uses a close sibling of this scale.
- **Title** (500, 1.5rem, tight tracking): H3s on process cards, bento tiles and step cards (step cards drop to 1.125rem).
- **Lead** (400, 1.125rem, Pencil Grey or Night Grey): the paragraph beside a section headline, capped at 34ch.
- **Body** (400, 1rem, 1.5): running text and form input text (inputs stay at 1rem to avoid mobile zoom). Card body copy steps down to 0.875rem with relaxed leading.
- **Nav** (400, 0.8125rem, 0.04em): header and mobile nav links.
- **Caption** (400, 0.8125rem / `text-[0.8125rem]`): form field labels, helper and error text, small button size (`sm`), meta rows in the intake summary and trust notes. Same step as Nav, no letter-spacing.
- **Body-sm** (400, 0.875rem / `text-sm`): secondary paragraph copy, engagement blurbs, process bullets, chip text, summary values. This is the ramp's most-reused step outside Body itself.
- **Numeral** (Mono 500, 2.25rem, 1): the 01 to 04 process stage numbers; the same face at 0.875rem in Trust Teal indexes FAQ items.
- **Label** (Mono 400, 0.75rem / `text-[0.75rem]`, 0.12em, uppercase): the Eyebrow component, page-hero and services-stage eyebrows, footer column headings, and the project-summary micro text. This is also the site's 12px readability floor.
- **Tag** (Mono 400, 0.625rem, 0.14em, uppercase): data captions such as the service line under each client in the rail and the services progress tab names.

### Named Rules
**The Medium Weight Rule.** Headings are weight 500 with -0.03em tracking. Nothing on the site is bold or semibold; hierarchy comes from size and tracking.

**The Mono-Is-Data Rule.** Geist Mono sets numbers, indices and data captions. It never sets a headline, a paragraph or a button.

**The 12px Floor Rule.** 0.75rem (12px) is the smallest size any readable text on the site is set at; nothing goes smaller. The only exception is decorative illustration labels marked `aria-hidden` inside `service-scenes.tsx` and `mockups.tsx` (down to 0.5rem), which are inert scene dressing, not content, and are exempt from the type ramp entirely.

**Code-to-role mapping.** `text-[0.75rem]` -> Label, `text-[0.8125rem]` -> Nav/Caption, `text-sm` -> Body-sm, `text-base`/no class -> Body, `text-[0.625rem]` -> Tag. The former one-off leads (15px) now use Body-sm and the Services pillar title uses the Headline clamp (`--fs-h2`). Two deliberate exceptions remain, documented here: the featured testimonial quote (`text-[1.875rem]`, a pull-quote display size tuned so the Testimonials panel fits one viewport) and the logo wordmark (`text-[1.0625rem]`, fixed with the monogram).

## Layout

A single fluid container (max 112rem) with stepped side gutters: 1rem on mobile, 2rem from `sm`, 3rem from `lg`, 4rem from `2xl`. The root font size itself is fluid (16px up to about 1366px wide, growing to about 19px at 2560px), so every rem-based measure scales with the screen instead of floating small on large monitors.

The home page is a sequence of full-bleed Panels. At `lg` each panel fills the viewport under the 4rem header and centres its content vertically; panels alternate Warm Paper, Clean Sheet and Studio Night tones so the page never reads as one sheet. Panel vertical padding is 3rem, 3.5rem at `lg`.

Section heads split into a 12-column grid at `lg` (headline in 7 columns, lead and action in 5, lead aligned to the headline's baseline) and stack below. Card grids go 1, then 2 at `sm`, then 4 at `lg`, with 1.5rem gaps. The work section is a bento: 4 columns and fixed row heights at `lg`, collapsing to a 2-column then single-column stack.

Pinning (the lock stack and the services stage) only engages at 768px wide and 600px tall or more. Below that the page is plain document flow and touch devices keep native scrolling. No horizontal scroll at 320px.

## Elevation & Depth

Flat at rest, depth by stacking. Surfaces sit flat on the page, separated by hairlines and tone changes. Real depth appears in two places only: when a locked panel slides up over the one before it, and when an interactive surface responds to hover or focus. Both shadows are built from the Hairline Strong token, so they read as a soft pencil shadow rather than a black drop.

### Shadow Vocabulary
- **Cover shadow** (`box-shadow: 0 -18px 36px -20px var(--line-strong)`): the top edge of every locked panel after the first, together with rounded top corners, so each view visibly slides over the last.
- **Lift shadow** (`box-shadow: 0 16px 32px -18px var(--line-strong)`): bento tiles on hover and focus-within, paired with a 2px rise. Motion-safe only.

### Named Rules
**The Stacking Rule.** Surfaces are flat at rest. Depth comes from panels stacking over each other (the cover shadow) and from state (the lift shadow). No ambient card shadows, no black shadows.

## Shapes

Three radii and nothing between them. Cards and panel tops take a generous 28px corner (`card`), form fields a softer 14px (`field`), and every button, chip, option, badge, progress bar and icon button is a full pill or circle. Borders are 1px hairlines; there are no thick strokes or offset outlines. When a locked panel covers another, its top corners round to the card radius so the stacking edge is visible.

### Named Rules
**The Three Radii Rule.** Card (28px), field (14px), pill (full). A new surface picks one of these; it does not invent a fourth.

## Components

### Buttons
Calm, pill-shaped and quick to respond.
- **Shape:** full pill. Two sizes: `md` (2.75rem tall, 1.5rem side padding, 0.875rem text) and `sm` (2.25rem tall, 1rem side padding, 0.8125rem text). Weight 500.
- **Primary:** Ink fill, Warm Paper text. The default call to action in the header and on light panels.
- **Accent:** Trust Teal fill, Teal Ink text. Reserved for the moment that most needs the signal.
- **Ghost:** transparent with a Hairline border, Ink text; border strengthens to Hairline Strong on hover. On dark grounds the border and text swap to Night Grey hairline and Night Paper.
- **On-dark:** Night Paper fill, Studio Night text; the primary call to action on every Studio Night surface.
- **Hover / Focus:** 300ms spring-eased transition; filled variants drop to 90% opacity and all variants rise 2px. Focus shows a 2px Trust Teal ring offset 2px from the background. Disabled is 50% opacity.

### Chips (pill selectors)
The main input device of the intake: choices are pills, not dropdowns.
- **Style:** full pill, 1px Hairline border, Ink text, 0.8125 to 0.875rem. On Studio Night the border is Night Grey at 25 to 30% with Night Paper text.
- **State:** selected fills Trust Teal with a Trust Teal border and Teal Ink text; hover strengthens the border. Multi-select uses `aria-pressed` buttons; single-choice uses native radios styled as pills with a focus ring on the visible pill.
- **Stacked options:** in the quiz and the brief's budget and timeline steps, pills go full-width and larger (1rem to 1.5rem padding, 1rem text) to act as a vertical option list.

### Cards / Containers
- **Corner Style:** card radius (28px).
- **Background:** Clean Sheet by default; Warm Paper for bento tiles on a Clean Sheet panel; Studio Night for dark tiles.
- **Shadow Strategy:** none at rest; see the Stacking Rule.
- **Border:** Hairline on light cards, Night Grey at 15% on dark ones. Filled Teal Wash and Trust Teal cards carry no border.
- **Internal Padding:** 1.5rem, 2rem from `sm`; process cards 1.75rem to 2rem.

### Inputs / Fields
- **Style:** field radius (14px), 1px Hairline border, Warm Paper fill inside Clean Sheet cards, 0.75rem by 1rem padding, 1rem text, Pencil Grey placeholder. On Studio Night: Night Grey hairline at 25%, a 4% Night Paper wash, Night Grey placeholder.
- **Focus:** the border turns Trust Teal over 300ms.

### Navigation
- **Header:** sticky, 4rem tall, transparent at the top of the page; after 8px of scroll it gains a 95% Warm Paper fill, backdrop blur and a Hairline bottom border. Links are Nav type in Pencil Grey, turning Ink on hover with an underline that draws left to right. A small primary button opens the quiz.
- **Mobile:** a circular hairline toggle opens a panel of hairline-divided links and a full-width small primary button.

### Monogram
The TCA mark is a 7px-rounded tile in `currentColor` with the T and A cut in the ground colour and the C stroked in Trust Teal, followed by the wordmark with "Agency" in the muted tone. It adapts to light or dark grounds without a separate asset and must stay in sync with the favicon and app icons.

### Locked Panel Stack
Every home panel after the hero pins in place while the next slides up over it. Each card's pin point is measured so a short card pins under the header and a tall one scrolls to its bottom edge first; nothing is ever unreachable. Covering cards round their top corners and cast the cover shadow; the covered card eases down to 97% scale and 92% brightness as it leaves (scroll-driven, where supported). Wheel, arrow keys, Page Up/Down and Space step one view at a time.

### Services Stage
A full-bleed Studio Night stage pinned for four viewport-heights, one per service pillar. Text sits in a solid left column over a scene area on the right; scenes crossfade with a slight scale over 700ms. Four progress tabs run along the bottom of the scene: a 3px pill bar (Trust Teal when active, Night Grey at 40% otherwise) above a Label caption. Tabs are a real tablist with arrow-key support and 1 to 4 shortcuts. Below the pin threshold it becomes one full-screen slide per pillar.

### Dark Hero with Client Rail
A full-bleed Studio Night hero that fills the viewport, with faint concentric arcs (one ring in Trust Teal) at the right, a pill selector card in a translucent blurred container, and trust notes with thin line icons. Its bottom edge is a single-row client rail divided by Night Grey hairlines: each cell is a small geometric client mark in Trust Teal, the client name and a Label caption. The rail scrolls on a 40s linear loop, pauses on hover and focus, fades at both edges, and becomes a plain swipeable strip under reduced motion.

### Tone-Progression Cards
A sequence of four cards that walks the palette from light to dark: Clean Sheet with a hairline, Teal Wash, Trust Teal, Studio Night. Each card's muted text and divider colour switch to match its ground. Use it only for a genuine ordered sequence, where the darkening carries the sense of progress.

### Lead Quiz
A full-screen Studio Night modal: close button as a circular hairline pill, a row of pill progress bars, stacked full-width option pills, and dark-ground fields. Steps crossfade with an 8px rise over 350ms. Focus is trapped, Escape closes, and focus returns to the trigger.

### Intake Step Cards
The `/start` brief is a column of Clean Sheet cards, one per step. Each carries a circular step badge: Ink fill with the number when current, Teal Wash with Trust Teal when done, Hairline fill with a lock icon when locked. The expanded card strengthens its border to Hairline Strong; completed cards collapse and offer an Edit link.

## Do's and Don'ts

### Do:
- **Do** take every colour from the tokens, including shadows (`var(--line-strong)`) and SVG strokes (`var(--color-accent)`).
- **Do** keep small text at 4.5:1 contrast or better (WCAG 2.2 AA); Trust Teal was darkened to `oklch(0.46 0.085 180)` for exactly this reason. Check any new token pairing before shipping it.
- **Do** give every animation a `prefers-reduced-motion` fallback: reveals appear instantly, transitions drop to none, the rail becomes a swipeable strip.
- **Do** ease motion with the spring curve (`cubic-bezier(0.23, 1, 0.32, 1)`) at 300ms for state changes and 700ms for entrances.
- **Do** set every heading at weight 500 with -0.03em tracking.
- **Do** use pill chips for choices in intake flows, with Trust Teal as the selected state.
- **Do** keep outer containers at a 1rem side gutter minimum and free of horizontal scroll at 320px.

### Don't:
- **Don't** hardcode a hex, rgb or oklch value in a component.
- **Don't** use em-dashes in visible copy.
- **Don't** present invented statistics, client counts, outcomes or testimonial metrics as fact; placeholder content reads as honestly generic.
- **Don't** add a second marquee. The client rail is the one sanctioned marquee because it carries real content, pauses on hover and focus, and falls back under reduced motion.
- **Don't** add gradient text, shimmer sweeps or decorative scrolling text.
- **Don't** put ambient or black shadows on cards at rest; depth comes from stacking and state.
- **Don't** introduce a radius outside card, field and pill.
- **Don't** use bold or semibold weights.
