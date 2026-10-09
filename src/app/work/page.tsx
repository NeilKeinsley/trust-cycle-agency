import type { Metadata } from "next";
import Link from "next/link";
import { draftMode } from "next/headers";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { getCaseStudies } from "@/lib/cms";
import { PageHero } from "@/components/page-hero";
import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { QuizTrigger } from "@/components/lead-quiz";
import { Mockup } from "@/components/home/mockups";
import { ClosingCta } from "@/components/home/closing-cta";
import { PreviewBanner } from "@/components/preview-banner";
import { jsonLd } from "@/lib/json-ld";

export const metadata: Metadata = pageMetadata({
  title: "Case studies",
  description:
    "How Trust Cycle Agency approaches brand, web and growth work: four illustrative case studies, from the problem to the signals we watched.",
  path: "/work",
});

const breadcrumbs = breadcrumbJsonLd([
  ["Home", "/"],
  ["Case studies", "/work"],
]);

export default async function WorkPage() {
  const { isEnabled: draft } = await draftMode();
  const studies = await getCaseStudies({ draft });

  return (
    <>
      {draft && <PreviewBanner />}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(breadcrumbs) }}
      />
      <PageHero
        title="How the work gets done."
        lead="Four engagements, told from the problem to the signals we watched. The clients are placeholders; the reasoning is the real part."
      >
        <QuizTrigger variant="on-dark">Start a project</QuizTrigger>
      </PageHero>

      <Section>
        <ul className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {studies.map((study, i) => (
            <li key={study.slug}>
              <Reveal delay={i * 80} className="h-full">
                <Link
                  href={`/work/${study.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-line bg-card transition-colors hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
                >
                  <div className="aspect-[16/9] p-3 motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.01]">
                    <Mockup kind={study.mockup} />
                  </div>
                  <div className="flex flex-1 flex-col p-6 pt-3">
                    <p className="text-sm text-muted">
                      {study.sector} · {study.tags.join(" + ")}
                    </p>
                    <h2 className="mt-2 text-2xl sm:text-3xl">{study.client}</h2>
                    <p className="mt-3 max-w-[55ch] leading-relaxed text-muted">{study.summary}</p>
                    <span className="mt-6 text-sm text-foreground">
                      <span className="link-line">Read the case study</span>
                      <span aria-hidden="true"> →</span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="mt-10 max-w-[65ch] text-sm text-muted">
          Trust Cycle Agency is a portfolio concept. These studies are illustrative: client names are
          placeholders and no results, figures or quotes are claimed.
        </p>
      </Section>

      <ClosingCta />
    </>
  );
}
