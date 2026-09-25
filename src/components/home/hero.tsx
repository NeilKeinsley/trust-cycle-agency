"use client";

import { useState } from "react";
import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/button";
import { QuizTrigger } from "@/components/lead-quiz";
import { HeroRail } from "@/components/home/client-strip";
import { SERVICES, type ServiceValue } from "@/lib/intake";

const PICKER_SERVICES = SERVICES.filter((s) => s.value !== "unsure");
const UNSURE = SERVICES.find((s) => s.value === "unsure")!;

const TRUST_NOTES: { label: string; icon: React.ReactNode }[] = [
  {
    label: "Reply within 1 business day",
    icon: (
      <path d="M12 7v5l3.2 2M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />
    ),
  },
  {
    label: "No long lock-in contracts",
    icon: <path d="M8 12h8M12 8v8M5 5l3 3M19 5l-3 3M5 19l3-3M19 19l-3-3" />,
  },
  {
    label: "One team, every channel",
    icon: (
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-9h5.5M12 12V6.5M12 12l-3.8 3.8" />
    ),
  },
];

function ConcentricArcs() {
  return (
    <svg
      viewBox="0 0 420 420"
      aria-hidden="true"
      className="pointer-events-none absolute -right-16 top-1/2 hidden h-[440px] w-[440px] -translate-y-1/2 md:block"
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

export function Hero() {
  const [selected, setSelected] = useState<ServiceValue[]>([]);

  function toggle(value: ServiceValue) {
    setSelected((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  return (
    <div
      data-stop
      className="relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-surface-dark text-on-dark [@media(min-width:768px)_and_(min-height:600px)]:h-[calc(100svh-var(--header-h))] [@media(min-width:768px)_and_(min-height:600px)]:min-h-0"
    >
      <ConcentricArcs />

      <div className="relative flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 sm:py-[clamp(1.5rem,4svh,2.75rem)] lg:px-16">
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-12 lg:content-center lg:gap-x-12 lg:gap-y-[clamp(1rem,3svh,2rem)]">
          <Reveal immediate delay={90} className="lg:col-span-12">
            {/* Capped by viewport height too, so the pinned hero fits short laptop screens. */}
            <h1 className="max-w-6xl text-[length:min(var(--fs-hero),13svh)] leading-[0.98]">
              Marketing that earns trust, then keeps it.
            </h1>
          </Reveal>

          <Reveal immediate delay={160} className="lg:col-span-5 lg:self-end">
            <p className="max-w-lg text-lg text-on-dark-muted lg:text-xl">
              We plan, design and run the brand, website and campaigns that
              turn first-time visitors into long-term customers.
            </p>
          </Reveal>

          <Reveal immediate delay={230} className="lg:col-span-7 lg:justify-self-end">
            <div className="max-w-xl rounded-[var(--radius-card)] border border-on-dark-muted/20 bg-surface-dark/70 p-4 backdrop-blur-md sm:p-5">
              <p className="mb-3 text-sm text-on-dark-muted">
                What do you need help with?
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Services you need help with">
                {PICKER_SERVICES.map((s) => {
                  const active = selected.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(s.value)}
                      className={`rounded-full border px-4 py-2 text-[0.8125rem] transition-all duration-300 [transition-timing-function:var(--ease-spring)] cursor-pointer ${
                        active
                          ? "border-accent bg-accent text-accent-foreground"
                          : "border-on-dark-muted/30 text-on-dark hover:border-on-dark-muted/60"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  aria-pressed={selected.includes(UNSURE.value)}
                  onClick={() => toggle(UNSURE.value)}
                  className={`flex min-h-11 cursor-pointer items-center text-[0.8125rem] underline underline-offset-4 transition-colors duration-300 ${
                    selected.includes(UNSURE.value)
                      ? "text-on-dark-accent decoration-on-dark-accent"
                      : "text-on-dark-muted decoration-on-dark-muted/50 hover:text-on-dark"
                  }`}
                >
                  {UNSURE.label}
                </button>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-4">
                <QuizTrigger services={selected} variant="on-dark" size="md">
                  Start a project
                </QuizTrigger>
                <ButtonLink
                  href="#work"
                  variant="ghost"
                  size="md"
                  className="border-on-dark-muted/30 text-on-dark hover:border-on-dark-muted/60"
                >
                  See our work
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </div>

        <Reveal immediate delay={300}>
          <div className="relative mt-[clamp(1.5rem,4svh,2rem)] flex flex-col gap-4 border-t border-on-dark-muted/15 pt-5 text-sm text-on-dark-muted sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
            {TRUST_NOTES.map((note) => (
              <div key={note.label} className="flex items-center gap-2.5">
                <svg
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-accent"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {note.icon}
                </svg>
                <span>{note.label}</span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Keyboard hint: unobtrusive, desktop only, mirrors what
            section-keys.tsx actually does (Arrow/Page/Space navigate). */}
        <p className="pointer-events-none absolute bottom-8 left-5 hidden text-xs text-on-dark-muted lg:left-16 lg:block">
          &uarr; &darr; to move between sections
        </p>
      </div>

      <HeroRail />
    </div>
  );
}
