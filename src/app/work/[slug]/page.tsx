import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { CASE_STUDIES, caseStudyBySlug } from "@/lib/fixtures";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { QuizTrigger } from "@/components/lead-quiz";
import { Mockup } from "@/components/home/mockups";
import { ClosingCta } from "@/components/home/closing-cta";

// Only the studies in fixtures exist; anything else 404s instead of rendering.
export const dynamicParams = false;

export function generateStaticParams() {
  return CASE_STUDIES.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const study = caseStudyBySlug((await params).slug);
  if (!study) return {};
  return pageMetadata({
    title: `${study.client} case study`,
    description: study.summary,
    path: `/work/${study.slug}`,
  });
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const study = caseStudyBySlug((await params).slug);
  if (!study) notFound();

  const index = CASE_STUDIES.indexOf(study);
  const next = CASE_STUDIES[(index + 1) % CASE_STUDIES.length];
  const breadcrumbs = breadcrumbJsonLd([
    ["Home", "/"],
    ["Case studies", "/work"],
    [study.client, `/work/${study.slug}`],
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
      <PageHero
        eyebrow={`Case study ${String(index + 1).padStart(2, "0")}/${String(CASE_STUDIES.length).padStart(2, "0")} · ${study.tags.join(" + ")}`}
        title={study.client}
        lead={study.summary}
      >
        <QuizTrigger variant="on-dark">Start a project</QuizTrigger>
      </PageHero>

      <Section>
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li>
              <Link href="/" className="link-line hover:text-foreground">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link href="/work" className="link-line hover:text-foreground">Case studies</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-foreground">{study.client}</li>
          </ol>
        </nav>

        <div className="lg:grid lg:grid-cols-12 lg:gap-12">
          {/* Facts: sticky beside the story on large screens. */}
          <aside className="lg:col-span-4">
            <div className="rounded-[var(--radius-card)] border border-line bg-card p-6 lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
              <h2 className="text-lg font-medium">At a glance</h2>
              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-muted">Sector</dt>
                  <dd className="mt-1">{study.sector}</dd>
                </div>
                <div>
                  <dt className="text-muted">Engagement</dt>
                  <dd className="mt-1">{study.engagement}</dd>
                </div>
                <div>
                  <dt className="text-muted">Services</dt>
                  <dd className="mt-2 flex flex-wrap gap-1.5">
                    {study.tags.map((tag) => (
                      <span key={tag} className="rounded-full bg-accent-soft px-2.5 py-1 text-[0.75rem] tracking-[0.04em] text-accent">
                        {tag}
                      </span>
                    ))}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">What we shipped</dt>
                  <dd className="mt-2">
                    <ul className="space-y-2">
                      {study.shipped.map((item) => (
                        <li key={item} className="flex gap-2">
                          <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              </dl>
              <p className="mt-6 border-t border-line pt-4 text-[0.8125rem] text-muted">
                Illustrative case study. Trust Cycle Agency is a portfolio concept, so the client is a
                placeholder and no results are claimed.
              </p>
            </div>
          </aside>

          <article className="mt-12 lg:col-span-7 lg:col-start-6 lg:mt-0">
            <Reveal>
              <div className="aspect-[16/10] w-full">
                <Mockup kind={study.mockup} />
              </div>
            </Reveal>

            <section className="mt-14">
              <h2 className="text-3xl leading-tight sm:text-4xl">The situation</h2>
              {study.situation.map((p) => (
                <p key={p.slice(0, 24)} className="mt-4 max-w-[65ch] text-lg leading-relaxed text-foreground/85">
                  {p}
                </p>
              ))}
            </section>

            <section className="mt-14">
              <h2 className="text-3xl leading-tight sm:text-4xl">What we did</h2>
              <ol className="mt-6 space-y-8">
                {study.approach.map((step, i) => (
                  <li key={step.title} className="grid grid-cols-[2.5rem_1fr] gap-x-4">
                    <span className="font-mono text-sm text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <h3 className="text-lg font-medium">{step.title}</h3>
                      <p className="mt-2 max-w-[65ch] leading-relaxed text-muted">{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mt-14">
              <h2 className="text-3xl leading-tight sm:text-4xl">What changed</h2>
              <p className="mt-4 max-w-[65ch] text-lg leading-relaxed text-foreground/85">{study.changed}</p>
            </section>

            <section className="mt-14 rounded-[var(--radius-card)] bg-surface-dark p-6 text-on-dark sm:p-8">
              <h2 className="text-xl">What we watched</h2>
              <p className="mt-2 max-w-[55ch] text-sm text-on-dark-muted">
                The signals we tracked to judge the work, rather than a scorecard of results.
              </p>
              <ul className="mt-5 space-y-3">
                {study.watched.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2.5 h-px w-4 shrink-0 bg-accent-soft" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <Link
              href={`/work/${next.slug}`}
              className="group mt-14 flex items-center justify-between gap-6 rounded-[var(--radius-card)] border border-line p-6 transition-colors hover:border-line-strong"
            >
              <span>
                <span className="block text-sm text-muted">Next case study</span>
                <span className="mt-1 block text-xl">{next.client}</span>
                <span className="mt-1 block text-sm text-muted">{next.tags.join(" + ")}</span>
              </span>
              <span aria-hidden="true" className="text-2xl motion-safe:transition-transform motion-safe:group-hover:translate-x-1">
                →
              </span>
            </Link>
          </article>
        </div>
      </Section>

      <ClosingCta />
    </>
  );
}
