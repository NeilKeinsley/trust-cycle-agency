# SEO audit and knowledge-base check

Audit date: 2026-09-26. Live site: https://trust-cycle-agency-production.up.railway.app (Railway domain; no custom domain yet).

The site was audited against the SEO setup standard from Neil's two SEO knowledge bases:

- **SEOBase** (`NeilKeinsley/SEOBase`, private) with its reference memories (setup standard, website-build playbook, effectiveness facts, entity optimization, evidence discipline).
- **Web Integrations** (`NeilKeinsley/web-integrations`, private), whose build-gotchas memory covers the same Next.js stack.

Each claim this work relied on was checked against a primary source before it was used (see the fact-check table below).

## Scope

This is a portfolio site for a fictional agency, so the local and off-page parts of the standard (Google Business Profile, reviews, citations, NAP) don't apply. In scope: the technical, on-page and tracking sections of the standard.

## Before and after (measured at origin)

The before snapshot was taken read-only just before any change. The after snapshot came from the deployed site (commit `43600ea`) and covered every sitemap URL: 5 of 5 returned 200.

| Check | Before | After |
|---|---|---|
| Canonical | **5 of 6 pages declared the homepage as canonical** | Every page self-canonical |
| `og:url` | Homepage URL on every page | Per page |
| `og:image` / `twitter:image` | Missing everywhere | 1200x630 generated card on every page (image returns 200) |
| Twitter card | `summary` | `summary_large_image` |
| Titles | `Page \| Trust Cycle Agency` | `Page - Trust Cycle Agency` |
| Structured data | `Organization` only | `Organization` (with `@id`) on every page, plus `WebSite` on the home page linked to it |
| Sitemap | 6 URLs incl. `/login`, with `changefreq` and `priority` | 5 indexable URLs, no ignored fields, no `lastmod` |
| `/login` (UI stub) | Indexable | `noindex, follow`, still crawlable |
| Crawlable links to `/start` | 1 (from `/contact`) | Every page (footer) |
| Headings | One `h1` per page, no skipped levels | Unchanged |
| Internal links | All 200 | All 200 |
| Lighthouse, mobile, home page | n/a | SEO 100, Agentic Browsing 100, Best Practices 100, Accessibility 100 (was 96 before the contrast fix below); 54 passed, 0 failed |

**Root cause of the canonical bug.** The root layout set `alternates.canonical: "/"` and `openGraph.url`. Next.js merges metadata *shallowly*, so every page without its own `alternates` inherited the homepage canonical. That told Google each subpage was a duplicate of the home page. The same mechanism later hid the generated `og:image` on any page that set its own `openGraph`. Both are fixed by one helper, `src/lib/seo.ts` (`pageMetadata`), which every page now uses.

The one Lighthouse failure was a decorative 10px label inside the `aria-hidden` Services scene art, at 3.92:1 contrast. Its extra opacity was removed.

## Knowledge-base fact-check

Tags follow SEOBase's own discipline:
- **Documented**: a primary source (Google or framework docs) states it.
- **Practitioner**: a study or observation.
- **Not re-checked**: carried over, not verified this pass.

| Claim in the knowledge base | Verdict | Source checked |
|---|---|---|
| Google ignores sitemap `changefreq` and `priority`; uses `lastmod` only if verifiably accurate | **Documented, true** | [Google: Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap) |
| Next.js merges metadata shallowly; layout `openGraph` defaults vanish on pages that set their own | **Documented, true**, and reproduced twice on this site | Next 16 docs, `generate-metadata.md` "Merging" |
| Canonical is a hint, not a command | **Documented, true** ("a strong signal") | [Google: Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls) |
| robots.txt `Disallow` is not `noindex` and strands a `noindex` | **Documented, true** | [Google: Block indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing) |
| Google replaces pipe separators ~41% of the time (dashes ~20%) | **Practitioner, accurately quoted** (Zyppy study, 80k titles). Google's own docs list the pipe as acceptable, so this is a risk reduction, not a rule. The study is from 2021. | [Zyppy](https://zyppy.com/seo/google-title-rewrite-study/), [SEJ](https://www.searchenginejournal.com/google-changes-more-than-61-percent-of-title-tags/435618/), [Google: Title links](https://developers.google.com/search/docs/appearance/title-link) |
| Google removed FAQ rich results on 2026-05-07; the markup is inert, not harmful | **True** (deprecation notice; Rich Results Test support removed June, Search Console API August 2026) | [SEJ](https://www.searchenginejournal.com/google-drops-faq-rich-results-from-search/574429/) |
| `llms.txt` doesn't raise AI visibility; no major AI system reads it | **True** (Mueller: "no AI system currently uses llms.txt") | [SER](https://www.seroundtable.com/google-ai-llms-txt-39607.html), [SEJ](https://www.searchenginejournal.com/google-says-llms-txt-is-purely-speculative-for-now/577576/) |
| Lighthouse has an "Agentic Browsing" category, separate from crawler access | **True**: it appears in the 2026 Lighthouse run above | Local Lighthouse |
| Meta description is a click-through lever, not a ranking factor; schema is not a direct ranking factor | Not re-checked this pass | Consistent with Google's snippet docs; no change depended on it |

**Additions from primary sources that the knowledge bases don't cover yet:**
- **Site name.** Google picks the site name shown in results mainly from `WebSite` structured data (`name`, `alternateName`, `url`), and only reads it from the home page ([Google: Site names](https://developers.google.com/search/docs/appearance/site-names)). Added here.
- **A vendor claim to reject.** "FAQPage schema makes a page 3.2x more likely to appear in AI Overviews" circulates in the FAQ-deprecation coverage. It's a vendor statistic with no published method, so it isn't used here.

**Drift between the two knowledge bases.** `seo-effectiveness-facts.md` exists in both memory directories (SEOBase imported it from Web Integrations on 2026-07-19) and the two copies have since drifted apart. Worth consolidating so only one is maintained.

## Deliberately not done

- **FAQPage markup on `/faq`.** It earns no rich result since May 2026. The visible FAQ content stays.
- **`llms.txt`.** It's unused by AI systems (see above).
- **`lastmod`.** Static pages have no real per-page update timestamp, and an inaccurate `lastmod` is worse than none.
- **Organization `logo`, `email`, `address` or `sameAs`.** The agency is fictional and `trustcycle.agency` isn't registered. Adding contact or identity values that don't exist would be fabricated structured data.

## Search Console (done 2026-09-27)

- **URL-prefix property** `https://trust-cycle-agency-production.up.railway.app/`, verified with the **HTML file** method (`public/google9f1b37bb300001af.html`, which must stay deployed). The env-gated `GOOGLE_SITE_VERIFICATION` meta tag is still available as a second method; it's unused.
- **Sitemap** `sitemap.xml` submitted on 2026-09-27. "Couldn't fetch" right after submitting is expected until the first crawl.

## Next steps

1. **About 2026-09-30:** confirm the sitemap status is "Success". Record the coverage baseline (indexed vs excluded pages, with reasons) and check "Google-selected canonical" for `/`, `/work` and one case study in URL Inspection.
2. **If a custom domain is added:** set `NEXT_PUBLIC_SITE_URL`, add a new URL-prefix property for it (verification doesn't transfer), and resubmit the sitemap there.
