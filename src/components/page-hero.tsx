import type { ReactNode } from "react";
import { Reveal } from "@/components/reveal";

/* Decorative rings shared by inner-page heroes and the login brand panel
   (same motif as the home hero's arcs). */
export function Arcs({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 420 420"
      aria-hidden="true"
      className={`pointer-events-none absolute hidden md:block ${className}`}
    >
      {[190, 150, 110, 70].map((r, i) => (
        <circle
          key={r}
          cx="210"
          cy="210"
          r={r}
          fill="none"
          stroke={i === 1 ? "var(--color-accent)" : "var(--color-on-dark-muted)"}
          strokeOpacity={i === 1 ? 0.6 : 0.18}
          strokeWidth={i === 1 ? 1.5 : 1}
          strokeDasharray={i % 2 === 0 ? "1 10" : undefined}
          strokeLinecap="round"
        />
      ))}
      <circle cx="210" cy="120" r="4" fill="var(--color-accent)" />
      <circle cx="330" cy="230" r="3" fill="var(--color-on-dark-muted)" />
    </svg>
  );
}

/* Full-screen dark intro card for inner pages, matching the home hero so
   every page opens on a brand moment instead of text floating on off-white.
   Full viewport height only where it fits (md+ and at least 700px tall). */
export function PageHero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <div className="p-2 sm:p-3">
      <div className="relative mx-auto flex w-full max-w-[1920px] flex-col justify-end overflow-hidden rounded-[var(--radius-card)] bg-surface-dark px-5 py-12 text-on-dark sm:px-10 sm:py-14 md:[@media(min-height:700px)]:min-h-[calc(100svh-var(--header-h)-1.5rem)] lg:px-16">
        <Arcs className="-right-24 -top-24 h-[34rem] w-[34rem]" />

        <div className="relative lg:grid lg:grid-cols-12 lg:items-end lg:gap-x-12">
          <div className="lg:col-span-8">
            {eyebrow && (
              <Reveal immediate>
                <span className="inline-flex w-fit items-center rounded-full border border-on-dark-muted/30 px-4 py-1.5 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-on-dark-muted">
                  {eyebrow}
                </span>
              </Reveal>
            )}
            <Reveal immediate delay={90}>
              <h1 className={`text-[length:min(var(--fs-hero),13svh)] leading-[0.98] ${eyebrow ? "mt-6" : ""}`}>
                {title}
              </h1>
            </Reveal>
          </div>
          <Reveal immediate delay={160} className="mt-8 lg:col-span-4 lg:mt-0">
            <p className="max-w-md text-lg text-on-dark-muted">{lead}</p>
            {children && <div className="mt-6 flex flex-wrap items-center gap-3">{children}</div>}
          </Reveal>
        </div>
      </div>
    </div>
  );
}
