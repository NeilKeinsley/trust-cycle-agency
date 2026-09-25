import { Panel } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/button";
import { QuizTrigger } from "@/components/lead-quiz";

const NEXT_STEPS = [
  { n: "1", label: "Tell us about the project" },
  { n: "2", label: "We reply within 1 business day" },
  { n: "3", label: "A free 30-minute call" },
];

/**
 * Full-screen dark closing panel. On the homepage it pairs with FaqTeaser
 * as a locking view (`locked`): FaqTeaser pins under the header and this
 * panel slides up over it (see page.tsx / globals.css .tc-lock-base). On
 * the stub pages it just renders as a plain full-screen dark panel, since
 * there is no sticky sibling above it there.
 */
export function ClosingCta({ locked = false }: { locked?: boolean }) {
  return (
    <Panel tone="dark" lock={locked ? "cover" : undefined} className={locked ? "" : "rounded-t-[var(--radius-card)]"}>
      <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-7 text-center">
        <svg
          viewBox="0 0 420 420"
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-[720px] w-[720px] -translate-x-1/2 -translate-y-1/2 opacity-40 sm:block"
        >
          {[190, 140, 90].map((r, i) => (
            <circle
              key={r}
              cx="210"
              cy="210"
              r={r}
              fill="none"
              stroke={i === 1 ? "var(--color-accent)" : "var(--color-on-dark-muted)"}
              strokeOpacity={i === 1 ? 0.5 : 0.15}
              strokeWidth={1}
            />
          ))}
        </svg>

        <Reveal>
          <h2 className="relative text-[length:clamp(2.75rem,6vw,5rem)] leading-[1.02]">
            Ready when you are.
          </h2>
        </Reveal>
        <Reveal delay={60}>
          <p className="relative text-xl text-on-dark-muted">
            Tell us about your project and we will follow up with next steps.
          </p>
        </Reveal>
        <Reveal delay={120}>
          <div className="relative flex flex-wrap items-center justify-center gap-4">
            <QuizTrigger variant="on-dark" size="md">
              Start a project
            </QuizTrigger>
            <ButtonLink
              href="/contact"
              variant="ghost"
              size="md"
              className="border-on-dark-muted/30 text-on-dark hover:border-on-dark-muted/60"
            >
              Talk to us
            </ButtonLink>
          </div>
        </Reveal>

        <Reveal delay={180} className="relative mt-6 w-full">
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[var(--radius-card)] border border-on-dark-muted/15 bg-on-dark-muted/15 sm:grid-cols-3">
            {NEXT_STEPS.map((step) => (
              <div
                key={step.n}
                className="flex items-center justify-center gap-3 bg-surface-dark px-5 py-5 sm:flex-col sm:gap-2 sm:py-7 sm:text-center"
              >
                <span className="font-mono text-sm text-on-dark-accent">{step.n}</span>
                <span className="text-sm text-on-dark-muted">{step.label}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </Panel>
  );
}
