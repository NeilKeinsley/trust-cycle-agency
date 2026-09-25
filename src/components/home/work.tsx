import type { ReactNode } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/button";
import { Panel, SectionHead } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { QuizTrigger } from "@/components/lead-quiz";
import { Mockup } from "./mockups";
import { CASE_STUDIES } from "@/lib/fixtures";

const PROCESS_STEPS = [
  { label: "Problem", detail: "What's broken or missing" },
  { label: "Approach", detail: "How we tackled it" },
  { label: "Outcome", detail: "What changed" },
];

/* Tile: shared bento surface. The hover/focus lift and shadow are the
   section's "second motion moment" — motion-safe only, mirrored on
   focus-within since every tile now holds a focusable control. Client tiles
   link to their case study through a stretched link on the client name
   (StudyLink), so the whole tile is clickable with one accessible name. */
function Tile({
  tone = "light",
  className = "",
  children,
}: {
  tone?: "light" | "dark" | "accent";
  className?: string;
  children: ReactNode;
}) {
  const toneClasses =
    tone === "dark"
      ? "border border-on-dark-muted/15 bg-surface-dark text-on-dark"
      : tone === "accent"
        ? "bg-accent text-accent-foreground"
        : "border border-line bg-background";

  return (
    <div
      className={`group relative flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-card)] motion-safe:transition-transform motion-safe:duration-300 motion-safe:[transition-timing-function:var(--ease-spring)] motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-[0_16px_32px_-18px_var(--line-strong)] motion-safe:focus-within:-translate-y-0.5 motion-safe:focus-within:shadow-[0_16px_32px_-18px_var(--line-strong)] ${toneClasses} ${className}`}
    >
      {children}
    </div>
  );
}

/* Mockup wrapper: the tile-hover scale (1.02) lives here so it only ever
   touches the mockup, never the surrounding text/layout. */
function TileMockup({ className = "", children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={`min-h-0 motion-safe:transition-transform motion-safe:duration-300 motion-safe:[transition-timing-function:var(--ease-spring)] motion-safe:group-hover:scale-[1.02] motion-safe:group-focus-within:scale-[1.02] ${className}`}
    >
      {children}
    </div>
  );
}

/* Stretched link: the client name is the link text, and its ::after covers
   the tile (Tile is `relative`), so the whole card is the hit area. */
function StudyLink({ slug, children }: { slug: string; children: ReactNode }) {
  return (
    <Link
      href={`/work/${slug}`}
      className="after:absolute after:inset-0 after:rounded-[var(--radius-card)] focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-accent"
    >
      {children}
    </Link>
  );
}

function Tags({ tags, tone = "light" }: { tags: string[]; tone?: "light" | "dark" }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className={`rounded-full px-2.5 py-1 text-[0.75rem] tracking-[0.04em] ${
            tone === "dark" ? "bg-on-dark-muted/15 text-on-dark" : "bg-accent-soft text-accent"
          }`}
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

export function Work() {
  const byClient = (name: string) => CASE_STUDIES.find((c) => c.client === name)!;
  const northwind = byClient("Northwind");
  const brightline = byClient("Brightline");
  const oakridge = byClient("Oakridge");
  const halcyon = byClient("Halcyon");

  return (
    <Panel id="work" tone="card" center={false} padClassName="py-10 lg:py-12">
      <Reveal>
        <SectionHead
          title="A few recent engagements."
          lead="A sample of the brand, web and campaign work we have shipped for clients like these."
          action={
            <ButtonLink href="/work" variant="ghost" size="sm">
              All case studies
            </ButtonLink>
          }
        />
      </Reveal>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-3 lg:grid-rows-[9rem_9rem_5.25rem]">
        {/* Northwind — 2x2 feature */}
        <Reveal delay={140} className="lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <Tile className="h-full">
            <div className="flex h-full flex-col gap-3 p-4 lg:flex-row lg:items-stretch lg:gap-5 lg:p-5">
              <TileMockup className="aspect-[16/10] shrink-0 sm:aspect-[16/9] lg:aspect-auto lg:h-full lg:w-1/2">
                <Mockup kind={northwind.mockup} />
              </TileMockup>
              <div className="flex min-h-0 flex-1 flex-col justify-center lg:w-1/2">
                <Tags tags={northwind.tags} />
                <h3 className="mt-3 text-xl sm:text-2xl">
                  <StudyLink slug={northwind.slug}>{northwind.client}</StudyLink>
                </h3>
                <p className="mt-2 text-sm lg:line-clamp-4 leading-relaxed text-muted">
                  {northwind.outcome}
                </p>
              </div>
            </div>
          </Tile>
        </Reveal>

        {/* Oakridge — 1x1 */}
        <Reveal
          delay={220}
          className="lg:col-span-1 lg:col-start-3 lg:row-span-1 lg:row-start-1"
        >
          <Tile className="h-full">
            <div className="flex h-full flex-col gap-2 p-3 lg:p-3.5">
              <TileMockup className="min-h-0 flex-1">
                <Mockup kind={oakridge.mockup} />
              </TileMockup>
              <p className="shrink-0 text-xs text-muted">
                <span className="text-foreground">
                  <StudyLink slug={oakridge.slug}>{oakridge.client}</StudyLink>
                </span> · {oakridge.tags[0]}
              </p>
            </div>
          </Tile>
        </Reveal>

        {/* Halcyon — 1x1 */}
        <Reveal
          delay={280}
          className="lg:col-span-1 lg:col-start-4 lg:row-span-1 lg:row-start-1"
        >
          <Tile className="h-full">
            <div className="flex h-full flex-col gap-2 p-3 lg:p-3.5">
              <TileMockup className="min-h-0 flex-1">
                <Mockup kind={halcyon.mockup} />
              </TileMockup>
              <p className="shrink-0 text-xs text-muted">
                <span className="text-foreground">
                  <StudyLink slug={halcyon.slug}>{halcyon.client}</StudyLink>
                </span> · {halcyon.tags[0]}
              </p>
            </div>
          </Tile>
        </Reveal>

        {/* Brightline — 2x1 */}
        <Reveal
          delay={340}
          className="lg:col-span-2 lg:col-start-3 lg:row-span-1 lg:row-start-2"
        >
          <Tile className="h-full">
            <div className="flex h-full flex-row items-stretch gap-4 p-3 lg:p-4">
              <TileMockup className="aspect-square h-full shrink-0">
                <Mockup kind={brightline.mockup} />
              </TileMockup>
              <div className="flex min-h-0 flex-1 flex-col justify-center">
                <Tags tags={brightline.tags} />
                <h3 className="mt-2 text-base sm:text-lg">
                  <StudyLink slug={brightline.slug}>{brightline.client}</StudyLink>
                </h3>
                <p className="mt-1 text-xs lg:line-clamp-2 leading-relaxed text-muted">
                  {brightline.outcome}
                </p>
              </div>
            </div>
          </Tile>
        </Reveal>

        {/* Process — 2x1, walkthrough teaser */}
        <Reveal
          delay={400}
          className="lg:col-span-2 lg:col-start-1 lg:row-span-1 lg:row-start-3"
        >
          <Tile tone="dark" className="h-full">
            <div className="flex h-full flex-col justify-center gap-2 p-3 lg:p-4">
              <p className="text-[0.75rem] tracking-[0.04em] text-on-dark-muted">
                Process, not just pixels
              </p>
              <div className="flex items-start gap-3">
                {PROCESS_STEPS.map((step, i) => (
                  <div key={step.label} className="flex flex-1 items-start gap-2">
                    {i > 0 && (
                      <span className="mt-1 hidden h-px w-3 shrink-0 bg-on-dark-muted/25 sm:block" />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-on-dark">{step.label}</p>
                      <p className="mt-0.5 truncate text-[0.75rem] text-on-dark-muted">
                        {step.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Tile>
        </Reveal>

        {/* CTA — 2x1 */}
        <Reveal
          delay={460}
          className="lg:col-span-2 lg:col-start-3 lg:row-span-1 lg:row-start-3"
        >
          <Tile tone="accent" className="h-full">
            <div className="flex h-full flex-col justify-center gap-3 p-3 sm:flex-row sm:items-center sm:justify-between lg:p-4">
              <div>
                <h3 className="text-lg sm:text-xl">Your project here.</h3>
                <p className="mt-1 text-sm text-accent-foreground/85">
                  Tell us what you are building and we will take it from there.
                </p>
              </div>
              <QuizTrigger variant="on-dark" size="md" className="shrink-0">
                Start a project
              </QuizTrigger>
            </div>
          </Tile>
        </Reveal>
      </div>
    </Panel>
  );
}
