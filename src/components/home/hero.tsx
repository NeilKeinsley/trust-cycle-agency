"use client";

import { useState } from "react";
import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/button";
import { QuizTrigger } from "@/components/lead-quiz";
import { HeroRail } from "@/components/home/client-strip";
import { StudioStack } from "@/components/home/studio-stack";
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
      className="tc-hero relative flex min-h-[100svh] w-full flex-col overflow-hidden bg-surface-dark text-on-dark [@media(min-width:768px)_and_(min-height:600px)]:h-[calc(100svh-var(--header-h))] [@media(min-width:768px)_and_(min-height:600px)]:min-h-0"
    >
      <div className="relative flex flex-1 flex-col justify-center px-5 py-8 sm:px-10 sm:py-[clamp(1.5rem,4svh,2.75rem)] lg:px-16">
        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-12 lg:items-center lg:gap-x-12">
          {/* Words and the picker: left column at lg, first on phones. */}
          <div className="flex flex-col gap-5 lg:col-span-7 lg:gap-[clamp(1rem,2.6svh,1.75rem)]">
            <Reveal immediate delay={90}>
              {/* Capped by viewport height too, so the hero fits short laptop
                  screens; smaller at lg, where it shares the row with the image. */}
              <h1 className="max-w-6xl text-[length:min(var(--fs-hero),13svh)] leading-[0.98] lg:text-[length:min(5.2vw,10.5svh)]">
                Marketing that earns trust, then keeps it.
              </h1>
            </Reveal>

            <Reveal immediate delay={160}>
              <p className="max-w-lg text-lg text-on-dark-muted">
                We plan, design and run the brand, website and campaigns that
                turn first-time visitors into long-term customers.
              </p>
            </Reveal>

            <Reveal immediate delay={230}>
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

          {/* The image: right column at lg; after the picker on phones.
              Hidden on mid-size tablets, where the pinned hero has a fixed
              height with no room for it. */}
          <StudioStack className="mx-auto mt-4 hidden aspect-[5/4] w-full max-w-md max-md:block lg:col-span-5 lg:mt-0 lg:block lg:aspect-auto lg:h-[min(34rem,58svh)] lg:max-w-none" />
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
