# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

The site serves two audiences with **equal weight**. Every surface has to convince the first and hold up to scrutiny from the second.

- **In-fiction prospects.** Owners and marketing leads at small-to-mid-size businesses and growing teams who need brand, website, marketing, SEO or social work and are comparing agencies. Their job is to judge quickly whether Trust Cycle can be trusted with the work, and then start a project with as little friction as possible. They arrive on phones and desktops, often mid-task.
- **Portfolio reviewers.** Hiring managers and potential clients evaluating Neil's ability to deliver complete web products. They may test the live site unannounced, on any device, and will try the flows: submitting the quiz, walking the brief, tabbing through, scrolling on a phone.

## Product Purpose

Trust Cycle Agency is a **portfolio piece presented as a full, working agency website** for a fictional, deliberately generic full-service digital agency. The agency itself is invented. The engineering is real.

It succeeds in two ways at once:

- **A prospect** can go from first impression to a submitted project brief in minutes.
- **A reviewer** can see, and exercise, an end-to-end system: engaging intake UX on the front end, a hardened API, and an automated lead pipeline behind it.

## Positioning

The primary claim is **full web development plus the automations behind it**. This is not a static mockup. The intake is a working system:

- a popup quiz and a step-gated `/start` brief post to a validated, rate-limited, spam-protected API;
- the API forwards leads to a self-hosted n8n workflow that scores, stores, notifies and auto-replies (see `docs/BACKEND_PLAN.md`).

Around that core, the site also demonstrates front-end design craft (motion, locked full-screen views, responsive detail) and full-stack delivery: research, planning, deployment on Railway and a real backend. Accessibility is a secondary part of the pitch, but it is a non-negotiable quality baseline.

## Operating Context

- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4 tokens and zod. The site runs on Railway (its own project, with a volume for the lead outbox). n8n runs self-hosted on Railway in a separate shared project and is reached over its public HTTPS URL (`docs/N8N_SETUP.md`).
- **Code:** the repo is `github.com/NeilKeinsley/trust-cycle-agency` (public).
- **Reviewer path:** a reviewer typically lands on `/`, opens the quiz or `/start`, submits test data, and may then look at the n8n workflow, the lead sheet and the code.
- **Design lineage:** layout patterns were studied from superpower.com. Its reference screenshots stay in `reference/` (git-ignored, pattern study only, never copied). The design rules come from the sister project Fine Lines (`D:\Work Files\Webs\fine-lines`).

## Capabilities and Constraints

- **Pages:** `/` (home), `/start` (5-step brief), `/work` and four `/work/[slug]` case studies (illustrative, placeholder clients), `/about`, `/faq`, `/contact`, `/login`, plus `/api/lead` and `/api/lead/replay`.
- **Intake:**
  - The LeadQuiz asks services, then budget, then timeline, then name and email.
  - The `/start` brief persists a draft in sessionStorage. The quiz hands contact details to it through sessionStorage, **never through the URL**.
  - The API applies zod validation, a rate limit (5 per minute), a honeypot, a 1.5 s time-trap and a `submissionId` idempotency key, then does optional n8n forwarding with a shared-secret header.
- **Placeholder features:** `/login` (client portal), the contact form and the footer newsletter are UI-only placeholders that say so honestly.
- **Home interaction model:**
  - Locked full-screen panels.
  - Wheel, arrow keys, Page Up/Down and Space step one view at a time, with the same fixed timing in both directions.
  - A pinned Services stage with `1`–`4` shortcuts.
  - Back-to-top and a skip link.
- **Settled (2026-09-26):** the repo is public, indexing is on (`robots.ts` `PREVIEW` off), and there's no custom domain for now (the site URL resolves from the Railway domain).
- **Open decisions:** a custom domain (it would also unlock the Resend auto-reply), and the Cal.com scheduling handoff.

## Brand Commitments

- **Identity:** the name is **Trust Cycle Agency**; the monogram is **TCA**. The agency stays deliberately generic, like the many full-service agencies it imitates.
- **Voice:** plain, honest, partner-not-vendor. No hype words.
- **Binding rules** (from `AGENTS.md`, inherited from Fine Lines):
  - no em-dashes in visible copy;
  - no invented statistics or claims presented as fact;
  - colours only from tokens;
  - the client marquee is the one sanctioned marquee;
  - every animation has a reduced-motion fallback.
- **Fiction disclosure:** the footer states "Portfolio concept. Trust Cycle Agency is fictional." The intake forms note that they are a demo and ask for test info.

## Evidence on Hand

- **No real clients, case studies, metrics, press or testimonials exist.**
- Client names (Northwind, Halcyon, Brightline, Oakridge, Parallel, Meridian Co.), team members and testimonials are fictional placeholders in `src/lib/fixtures.ts`, written as honestly generic.
- Case-study pages (`/work`) are live but illustrative: placeholder clients, reasoning and signals watched, no results claimed.
- Future work must not fabricate numbers, awards, logos of real companies, or outcomes presented as real.
- The genuine evidence is the working system itself: the intake flows, the API behaviour and (once built) the n8n workflow, lead sheet and error handling.
- Research backing design and backend decisions: `docs/BACKEND_PLAN.md`.

## Product Principles

1. **The intake is the product.** Every surface should lead toward starting a project, or support that decision.
2. **Working systems over mockups.** Anything shown as a capability should be demonstrable end to end, or labelled honestly as a placeholder.
3. **Honest fiction.** Generic agency, fictional names, zero fabricated proof. Credibility comes from how well it works, not from claims.
4. **Two audiences, one experience.** It must be convincing to a prospect and legible to a reviewer, without a separate "portfolio mode" breaking the fiction.
5. **Quality is the baseline, not the pitch.** Accessibility and robustness are held to a standard even though they are not the headline.

## Accessibility & Inclusion

- **Standard:** WCAG 2.2 AA.
- **Keyboard:** everything is operable by keyboard, including the locked views, the Services stage and the quiz modal (focus trap, Escape, focus return). Focus must never land on content that is covered or off-screen.
- **Contrast:** 4.5:1 for body text (checked against the tokens).
- **Motion:** every motion path has a `prefers-reduced-motion` fallback.
- **Layout:** no horizontal scroll at 320px.
- **Pinning:** only on screens at least 768px wide and 600px tall; touch devices keep native scrolling.
