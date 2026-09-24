import { Panel, SectionHead } from "@/components/section";
import { Reveal } from "@/components/reveal";

function DiscoverIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M15.5 15.5L21 21" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PlanIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <rect x="3.5" y="3.5" width="17" height="17" rx="3" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7.5 9.5l1.8 1.8L12.5 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 9h2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M7.5 15.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function BuildIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path d="M12 3.5l8.5 4.5-8.5 4.5-8.5-4.5 8.5-4.5z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.5 12.5L12 17l8.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3.5 16.5L12 21l8.5-4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
    </svg>
  );
}

function GrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <path d="M3.5 17L9 11l4 3.5 7.5-8.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 6h5.5v5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const STEPS = [
  {
    n: "01",
    title: "Discover",
    body: "We learn your business, your customers and what has and hasn't worked before.",
    bullets: ["Stakeholder interviews", "Audit of current brand and site", "Goals and success measures"],
    icon: DiscoverIcon,
    card: "border border-line bg-card text-foreground",
    bullet: "border-line",
    muted: "text-muted",
  },
  {
    n: "02",
    title: "Plan",
    body: "A scoped plan with clear priorities, so every deliverable ties back to a goal.",
    bullets: ["Scope and timeline", "Content and sitemap direction", "Roles on both sides"],
    icon: PlanIcon,
    card: "bg-accent-soft text-foreground",
    bullet: "border-foreground/15",
    muted: "text-muted",
  },
  {
    n: "03",
    title: "Build",
    body: "Brand, site and campaigns come together with regular check-ins, not a black box.",
    bullets: ["Design and build in the open", "Weekly check-ins", "Review rounds built into the schedule"],
    icon: BuildIcon,
    card: "bg-accent text-accent-foreground",
    bullet: "border-accent-foreground/20",
    muted: "text-accent-foreground/80",
  },
  {
    n: "04",
    title: "Grow",
    body: "We measure what matters and keep iterating once the work is live.",
    bullets: ["Launch and handoff", "Ongoing reporting", "Iteration based on real results"],
    icon: GrowIcon,
    card: "bg-surface-dark text-on-dark",
    bullet: "border-on-dark-muted/20",
    muted: "text-on-dark-muted",
  },
];

export function Process() {
  return (
    <Panel id="process" tone="card" raised>
      <Reveal>
        <SectionHead
          eyebrow="How we work"
          title="A steady process, not a scramble."
          lead="Four stages, repeated for every project, so you always know what happens next."
        />
      </Reveal>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <Reveal key={step.n} delay={120 + i * 90} className="relative h-full">
              <div
                className={`flex h-full min-h-[22rem] flex-col rounded-[var(--radius-card)] p-7 lg:p-8 ${step.card}`}
              >
                <div className="flex items-start justify-between">
                  <span aria-hidden="true" className="font-mono text-4xl font-medium leading-none">
                    {step.n}
                  </span>
                  <Icon />
                </div>
                <h3 className="mt-6 text-2xl">{step.title}</h3>
                <p className={`mt-3 text-sm leading-relaxed ${step.muted}`}>{step.body}</p>
                <ul className="mt-auto space-y-0 pt-6">
                  {step.bullets.map((b) => (
                    <li
                      key={b}
                      className={`border-t py-2.5 text-[0.8125rem] leading-snug first:border-t-0 first:pt-0 ${step.bullet} ${step.muted}`}
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
              {i < STEPS.length - 1 && (
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="absolute top-1/2 -right-3.5 z-10 hidden h-7 w-7 -translate-y-1/2 text-line-strong lg:block"
                >
                  <path d="M5 12h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  <path d="M13 6.5L19 12l-6 5.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </Reveal>
          );
        })}
      </div>
    </Panel>
  );
}
