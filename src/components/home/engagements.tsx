import { Panel, SectionHead } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { QuizTrigger } from "@/components/lead-quiz";

const TIERS = [
  {
    name: "Project",
    blurb: "A defined scope with a clear start and finish.",
    bestFor: "A defined launch or rebrand, start to finish",
    bullets: [
      "Brand, website or campaign build",
      "Fixed milestones and deliverables",
      "Handoff with documentation",
    ],
    closingLine: "Fixed scope and timeline, agreed up front.",
    highlighted: false,
  },
  {
    name: "Retainer",
    blurb: "Ongoing marketing, content or site support.",
    bestFor: "Ongoing monthly work with a steady team",
    bullets: [
      "Monthly scope, reviewed together",
      "A dedicated point of contact",
      "Regular reporting and check-ins",
    ],
    closingLine: "A monthly rhythm with regular check-ins.",
    highlighted: true,
  },
  {
    name: "Partner",
    blurb: "Brand, web and growth under one roof.",
    bestFor: "An embedded team across channels, planned quarterly",
    bullets: [
      "Full-funnel strategy and execution",
      "Priority access to the whole team",
      "Quarterly planning sessions",
    ],
    closingLine: "Planned quarterly with an embedded team.",
    highlighted: false,
  },
];

export function Engagements() {
  return (
    <Panel tone="light" padClassName="py-10 lg:py-10">
      <Reveal>
        <SectionHead
          title="Work with us the way that fits."
          lead="Three ways to start, from a single project to an ongoing partnership."
        />
      </Reveal>

      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        {TIERS.map((tier, i) => (
          <Reveal key={tier.name} delay={120 + i * 100} className="h-full">
            <div
              className={`flex h-full min-h-[24rem] flex-col rounded-[var(--radius-card)] border p-8 lg:p-10 ${
                tier.highlighted
                  ? "border-accent bg-accent-soft/40"
                  : "border-line bg-card"
              }`}
            >
              <h3 className="text-2xl sm:text-3xl">{tier.name}</h3>
              <p className="mt-2 text-sm text-muted">{tier.blurb}</p>
              <p className="mt-3 text-[0.8125rem] text-muted">
                <span className="text-foreground">Best for:</span> {tier.bestFor}
              </p>
              <ul className="mt-5 space-y-3">
                {tier.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/80">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-auto space-y-1 pt-8">
                <p className="text-sm text-foreground/80">{tier.closingLine}</p>
                <p className="text-sm text-muted">Custom quote</p>
              </div>
              <QuizTrigger
                variant={tier.highlighted ? "accent" : "ghost"}
                size="md"
                className="mt-4 w-full"
              >
                Start a project
              </QuizTrigger>
            </div>
          </Reveal>
        ))}
      </div>
    </Panel>
  );
}
