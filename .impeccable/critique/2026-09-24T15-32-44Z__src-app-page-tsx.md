---
target: homepage
total_score: 23
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 1
target_identity: "file:D:\\Work Files\\Webs\\NK Agency\\src\\app\\page.tsx"
target_fingerprint: "sha256:0ffe14c707f7c75bb3435469112416ec213be89ce4e1282d7c230c37415d11a2"
target_path: "D:\\Work Files\\Webs\\NK Agency\\src\\app\\page.tsx"
timestamp: 2026-09-24T15-32-44Z
slug: src-app-page-tsx
closed: true
---
Method: dual-agent (A: design-review agent · B: detector+browser agent), synthesized by lead; A's P0 re-verified by lead and not reproduced.

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Quiz and brief show progress and step state well. A's "blank panel after ArrowDown" was not reproduced on re-test (content fully visible, header intact), so this is not scored as a gap |
| 2 | Match System / Real World | 3 | Plain, partner-voiced copy; no jargon |
| 3 | User Control and Freedom | 3 | Quiz has Back, Escape and progress; brief lets you edit any completed step |
| 4 | Consistency and Standards | 3 | One-view-per-gesture stepping verified symmetric (13 stops, ~600 ms each way); A's single wheel-skip observation not reproduced |
| 5 | Error Prevention | 3 | Continue disabled until a choice; zod per step; honeypot and time-trap |
| 6 | Recognition Rather Than Recall | 3 | All options and tabs are text-labelled |
| 7 | Flexibility and Efficiency | n/a | Persuade surface; no expert workflow (the keyboard stepping and 1-4 jumps are a bonus, not scored) |
| 8 | Aesthetic and Minimalist Design | 3 | Clean sections, but an eyebrow label sits over every heading (8x) and cards nest in cards (14x) |
| 9 | Error Recovery | 2 | A network error, 429 or 400 on submit still advances to the success screen; the visitor is told it worked when it did not |
| 10 | Help and Documentation | n/a | Marketing surface; FAQ teaser and page stand in |
| **Total** | | **23/32** | **Good (72%)** |

## Design Specificity Verdict

LLM assessment: Authored, not off-the-shelf. The dark full-bleed hero with the arc motif and captioned client rail, the pinned four-pillar Services stage with 1-4 jumps, the light-to-dark tone progression on Process and Team cards, and the locked panel stack are choices a neighbouring template would not ship. Interchangeable parts: the Project / Retainer / Partner tier block, the Discover / Plan / Build / Grow process, and the testimonial copy are near-universal agency structures. The distinctiveness lives in interaction, not in content.

Deterministic scan: CLI `detect` on src/app and src/components found 2 findings, both `bounce-easing` on `var(--ease-spring)` (globals.css:120, :161): false positives, the curve cubic-bezier(0.23,1,0.32,1) never overshoots. In-page detector (5 views) reported ~103-109 matches on home and 3 on /start. Real and worth acting on: `undersized-ui-text` (9-10px labels: rail service captions, scene labels, tab labels), `tiny-text` (11px body x2), `kicker-above-heading` (8x) and `hero-eyebrow-chip` on /start, `nested-cards` (14x), `line-length` (~102 chars on a few lines), one `cramped-padding` (0px vertical padding on a button). False positives or intentional: `marquee` (the one sanctioned content rail), `oversused-font` (single-family Geist system is deliberate), `ai-color-palette` (flags the Trust Teal token on Studio Night; it is the brand accent, though the cyan read on some small icons is worth a look). The detector agrees with the documenter, which independently flagged the eyebrow labels and 9px captions as drift.

Visual overlays: injected successfully in a [Human]-labelled tab during the run; the live server was stopped afterwards, so overlays are no longer live.

## Overall Impression

A confident, genuinely authored front end whose best idea (locked, keyboard-steppable views and the Services stage) is also its most engineered. The biggest opportunity is not structural: it is legibility and honesty at the small scale. Tiny mono labels everywhere, a label above every heading, and a success screen that can lie on failure are what a careful reviewer will notice after the first impression.

## What's Working

- The Services stage: pinned scene, labelled tablist with aria state, 1-4 and arrow-key support, reduced-motion fallback. Interaction design that shows real engineering.
- The intake plumbing: focus trap, Escape, scroll lock with scrollbar compensation, PII handed off via sessionStorage never the URL, time-trap and idempotency. Exactly the "working systems over mockups" principle.
- Tone-progression cards (Process, Team) turn a repeated grid into a rhythm instead of four identical boxes.

## Priority Issues

- [P1] Text below a readable floor. What: rail service captions (9px), scene and tab labels (10px), 11px body in two places, tracked uppercase mono eyebrows. Why: fails comfortable reading for prospects on phones and undercuts the WCAG 2.2 AA quality claim for reviewers. Fix: set a 12px minimum for any label a user must read, 14px for body, and reduce letter-spacing on uppercase labels. Command: /impeccable typeset
- [P2] Success screen shown on failed submit. What: quiz and brief catch network errors, 400 and 429 and still show "You're in." Why: a rate-limited or offline submit tells the visitor it worked; a reviewer testing the "hardened API" will catch it. Fix: keep the graceful path for n8n being down (the API already returns ok), but on a non-2xx or network error show an inline notice with the entered data preserved and a mailto fallback. Command: /impeccable harden
- [P2] Template-y scaffolding repeated everywhere. What: an eyebrow kicker above every section heading (8x) and card-in-card nesting (14x). Why: the repetition is the fingerprint of a generated layout and flattens hierarchy. Fix: keep the kicker only where it carries information (e.g. "Services 01/04"), drop the rest; flatten inner cards to hairline dividers. Command: /impeccable distill
- [P2] Six equal options at the first decision. What: the hero picker and quiz step 1 each present 6 unranked pills. Why: above the working-memory comfort limit at the lowest-trust moment. Fix: de-emphasise "Not sure yet" as a text-style option below the five services, and order by demand. Command: /impeccable clarify
- [P3] Engagement tiers do not argue for themselves. What: all three end in "Custom quote" and the same CTA; only a border marks the highlighted tier. Fix: one honest differentiator each (typical length, cadence, who it suits), no invented prices. Command: /impeccable clarify

Disputed (not counted): Assessment A reported a P0 where ArrowDown or one wheel gesture from the hero leaves a blank viewport. Re-tested with a real key press at 1366x768: lands on Process with all content visible, 0/5 reveals hidden, header present; symmetric 13-stop runs in both directions also never blanked. Most likely the in-app browser's capture artifact seen earlier this session. Worth a manual check on real hardware.

## Persona Red Flags

- Jordan (first-timer): meets six equal service pills before any guidance; the tiny uppercase eyebrow labels are hard to read and add noise without meaning.
- Riley (stress tester): submits the quiz six times quickly, hits the 5-per-minute limit, and is still told "You're in." That is a promise-versus-reality gap.
- Casey (mobile): 9-10px captions in the hero rail and Services slides are unreadable one-handed at arm's length; primary CTAs are well placed.
- Portfolio reviewer (project-specific): will test the flagship stepping first (passes on re-test) and then the API edge cases, where the false success is the one thing that contradicts the pitch.
- Small-business owner (project-specific): native scroll on mobile works; the main friction is the six-way first choice and the uniform pricing tiers.

## Minor Observations

- The "↑ ↓ to move between sections" hint shows only at lg and up.
- A few lines run ~100 characters wide; cap long copy near 70ch.
- One button has 0px vertical padding (detector cramped-padding); check the rail/tab buttons.
- Four monogram-only team portraits start to read as repetition by the third.

## Questions to Consider

- If the kicker label vanished from every heading, would anyone miss it?
- Should a failed submit be a moment to show off the system (a clear, recoverable state) rather than hide it?
- What if "Not sure yet" became the friendliest option instead of the sixth pill?
