"use client";

import { scrollToStop } from "@/lib/stops";

import { useCallback, useEffect, useRef, useState } from "react";
import { SectionHead } from "@/components/section";
import { QuizTrigger } from "@/components/lead-quiz";
import type { ServiceValue } from "@/lib/intake";
import { ServiceScene, type ServiceSceneKind } from "./service-scenes";

type Pillar = {
  value: ServiceValue;
  title: string;
  /** Short label for the progress tabs, where the full title truncates. */
  short: string;
  description: string;
  bullets: string[];
  scene: ServiceSceneKind;
  ctaLabel: string;
};

const PILLARS: Pillar[] = [
  {
    value: "brand",
    title: "Brand and identity",
    short: "Brand",
    description:
      "A visual identity and voice that hold up across every touchpoint, from a business card to a billboard.",
    bullets: ["Logo and visual identity systems", "Brand guidelines and voice", "Naming and messaging"],
    scene: "brand",
    ctaLabel: "Start a brand project",
  },
  {
    value: "website",
    title: "Website design and build",
    short: "Website",
    description:
      "Fast, clear sites built to convert, on a stack that is easy for your team to maintain after launch.",
    bullets: ["Marketing sites and landing pages", "Ecommerce and product builds", "Ongoing site care"],
    scene: "website",
    ctaLabel: "Start a website project",
  },
  {
    value: "marketing",
    title: "Marketing and ads",
    short: "Marketing",
    description:
      "Campaigns planned around your funnel, not just a channel, with creative that matches your brand.",
    bullets: ["Paid search and social", "Campaign strategy and creative", "Reporting dashboards"],
    scene: "marketing",
    ctaLabel: "Start a marketing project",
  },
  {
    value: "seo",
    title: "SEO and content",
    short: "SEO",
    description:
      "Technical fixes and a content plan that compound, so organic traffic keeps paying off long after launch.",
    bullets: ["Technical SEO audits", "Content strategy and writing", "Local and organic growth"],
    scene: "seo",
    ctaLabel: "Start an SEO project",
  },
];

const TOTAL = PILLARS.length;

function PillarText({ pillar, index }: { pillar: Pillar; index: number }) {
  return (
    <div
      key={pillar.value}
      className="motion-safe:animate-appear motion-reduce:opacity-100"
    >
      <p className="font-mono text-[0.75rem] tracking-[0.12em] uppercase text-accent-soft">
        {`Services 0${index + 1}/0${TOTAL}`}
      </p>
      <h3
        className="mt-3 text-on-dark"
        style={{ fontSize: "var(--fs-h2)", lineHeight: 0.98, letterSpacing: "-0.02em" }}
      >
        {pillar.title}
      </h3>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-on-dark-muted">
        {pillar.description}
      </p>
      <ul className="mt-6 divide-y divide-on-dark-muted/15 border-t border-on-dark-muted/15">
        {pillar.bullets.map((b) => (
          <li key={b} className="py-2.5 text-sm text-on-dark/90">
            {b}
          </li>
        ))}
      </ul>
      <div className="mt-7">
        <QuizTrigger services={[pillar.value]} variant="on-dark" size="md">
          {pillar.ctaLabel}
        </QuizTrigger>
      </div>
    </div>
  );
}

export function ServicesStory() {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const spacerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const regionRef = useRef<HTMLDivElement | null>(null);
  const stickyRef = useRef<HTMLDivElement | null>(null);
  const [desktopStage, setDesktopStage] = useState(false);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const targets = spacerRefs.current.filter((el): el is HTMLDivElement => !!el);
    if (!targets.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number((entry.target as HTMLElement).dataset.index);
            if (!Number.isNaN(idx)) setActive(idx);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );

    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Track whether we're in the pinned desktop stage layout (md+ and tall
  // enough viewport). Wheel/keyboard handlers below only attach in this
  // mode, so mobile never pays for extra listeners.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (min-height: 600px)");
    const update = () => setDesktopStage(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const goTo = useCallback((index: number) => {
    const el = spacerRefs.current[index];
    if (!el) return;
    scrollToStop(el);
  }, []);

  const isStagePinned = useCallback(() => {
    const sticky = stickyRef.current;
    const region = regionRef.current;
    if (!sticky || !region) return false;
    const headerOffset = parseFloat(getComputedStyle(sticky).top) || 0;
    const stickyRect = sticky.getBoundingClientRect();
    const regionRect = region.getBoundingClientRect();
    return stickyRect.top <= headerOffset + 1 && regionRect.bottom >= window.innerHeight - 1;
  }, []);

  // Wheel stepping lives in the site-wide SectionNav (section-keys.tsx) so
  // one gesture moves one view everywhere, with the same speed up and down.

  // Keyboard shortcuts: 1-4 jump straight to a pillar while the stage is
  // pinned. (ArrowUp/ArrowDown stepping through [data-stop] elements is
  // handled globally elsewhere.)
  useEffect(() => {
    if (!desktopStage) return;

    const onKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (!["1", "2", "3", "4"].includes(e.key)) return;
      const target = e.target as HTMLElement | null;
      if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable)) return;
      if (!isStagePinned()) return;
      e.preventDefault();
      goTo(Number(e.key) - 1);
    };

    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, [desktopStage, goTo, isStagePinned]);

  const onTabKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      const next = e.key === "ArrowRight" ? (index + 1) % TOTAL : (index - 1 + TOTAL) % TOTAL;
      goTo(next);
      tabRefs.current[next]?.focus();
    },
    [goTo]
  );

  return (
    <section id="services" className="relative bg-background">
      <div className="mx-auto max-w-[112rem] px-4 pb-10 pt-16 sm:px-8 lg:px-12 lg:pt-20 2xl:px-16">
        <SectionHead
          title="Four pillars, one team."
          lead="Brand, web, marketing and SEO, handled by one team instead of four vendors."
        />
      </div>

      {/* Desktop / tablet: a pinned, full-bleed stage. Shown only at md+ AND
          when the viewport is tall enough (>=600px) to fit it comfortably;
          otherwise the slide fallback below takes over. */}
      <div ref={regionRef} className="relative hidden md:[@media(min-height:600px)]:block">
        <div
          ref={stickyRef}
          className="sticky top-[var(--header-h,64px)] h-[calc(100svh-var(--header-h,64px))] w-full overflow-hidden bg-surface-dark text-on-dark"
        >
          {/* Scene layer */}
          {PILLARS.map((pillar, i) => (
            <div
              key={pillar.value}
              className="absolute inset-0 transition-[opacity,transform] duration-700 md:bottom-16 md:left-[min(44%,600px)] motion-reduce:transition-none motion-reduce:duration-0 [transition-timing-function:var(--ease-spring)]"
              style={{
                opacity: active === i ? 1 : 0,
                transform: active === i ? "scale(1)" : "scale(1.03)",
                pointerEvents: active === i ? "auto" : "none",
              }}
              aria-hidden={active !== i}
            >
              <ServiceScene kind={pillar.scene} active={active === i} />
            </div>
          ))}

          {/* Text overlay: left third, solid scrim, bottom-aligned content */}
          <div className="absolute inset-y-0 left-0 z-10 flex w-full max-w-[600px] flex-col justify-end border-r border-on-dark-muted/10 bg-surface-dark px-8 py-12 md:w-[44%] lg:px-12">
            <div id="services-pillar-panel" role="tabpanel" aria-labelledby={`services-pillar-tab-${active}`}>
              <PillarText pillar={PILLARS[active]} index={active} />
            </div>
            <p aria-live="polite" className="sr-only">
              {PILLARS[active].title}
            </p>
            <p aria-hidden="true" className="mt-6 hidden text-xs text-on-dark-muted lg:block">
              Scroll or use ↑ ↓ · 1 to 4 jumps
            </p>
          </div>

          {/* Progress: 4 tabs along the bottom of the scene area, so nothing sits on top of the scene */}
          <div
            role="tablist"
            aria-label="Service pillars"
            className="absolute bottom-0 right-0 z-10 flex h-16 items-start gap-3 pl-6 pr-20 md:left-[min(44%,600px)] lg:gap-6 lg:pl-10 lg:pr-24"
          >
            {PILLARS.map((pillar, i) => (
              <button
                key={pillar.value}
                type="button"
                role="tab"
                id={`services-pillar-tab-${i}`}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                tabIndex={active === i ? 0 : -1}
                onClick={() => goTo(i)}
                onKeyDown={(e) => onTabKeyDown(e, i)}
                aria-selected={active === i}
                aria-current={active === i ? "true" : undefined}
                aria-controls="services-pillar-panel"
                aria-label={`Go to ${pillar.title}`}
                className="group flex min-w-0 flex-1 cursor-pointer flex-col-reverse items-start gap-2 rounded-sm py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span
                  className="block max-w-full truncate text-[0.75rem] uppercase tracking-[0.12em] transition-colors duration-300"
                  style={{ color: active === i ? "var(--color-on-dark)" : "var(--color-on-dark-muted)" }}
                >
                  {pillar.short}
                </span>
                <span
                  className="block h-[3px] w-full rounded-full transition-all duration-500 [transition-timing-function:var(--ease-spring)] motion-reduce:transition-none"
                  style={{
                    background: active === i ? "var(--color-accent)" : "var(--color-on-dark-muted)",
                    opacity: active === i ? 1 : 0.4,
                  }}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Invisible locking spacers: one 100svh section per pillar, driving
            both the IntersectionObserver above and page scroll-snap. Each
            carries data-stop so the global ArrowUp/ArrowDown handler walks
            them in DOM order. */}
        {/* Pulled up under the stage so spacer i starts exactly i screens into
            the section: each full scroll step (and snap point) is one pillar. */}
        <div className="mt-[calc(var(--header-h,64px)-100svh)]">
        {PILLARS.map((pillar, i) => (
          <div
            key={pillar.value}
            ref={(el) => {
              spacerRefs.current[i] = el;
            }}
            id={`services-${pillar.value}`}
            data-index={i}
            data-stop=""
            className="h-[100svh] snap-start"
            aria-hidden="true"
          />
        ))}
        </div>
      </div>

      {/* Mobile, and any short viewport under 600px tall: one full-screen
          slide per pillar, no pinning. */}
      <div className="block md:[@media(min-height:600px)]:hidden">
        {PILLARS.map((pillar, i) => (
          <div
            key={pillar.value}
            data-anchor={`services-${pillar.value}`}
            className="flex min-h-[100svh] snap-start flex-col bg-surface-dark text-on-dark landscape:min-h-[calc(100svh-var(--header-h,64px))] landscape:flex-row"
          >
            <div className="relative h-[55svh] w-full shrink-0 overflow-hidden landscape:h-auto landscape:w-1/2">
              <ServiceScene kind={pillar.scene} active />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2 px-4 py-10 sm:px-6 landscape:py-6">
              <p className="font-mono text-[0.75rem] tracking-[0.12em] uppercase text-accent-soft">
                {`Services 0${i + 1}/0${TOTAL}`}
              </p>
              <h3
                className="mt-1 text-on-dark"
                style={{ fontSize: "clamp(2rem,8vw,3rem)", lineHeight: 1.02 }}
              >
                {pillar.title}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-on-dark-muted">
                {pillar.description}
              </p>
              <ul className="mt-5 divide-y divide-on-dark-muted/15 border-t border-on-dark-muted/15">
                {pillar.bullets.map((b) => (
                  <li key={b} className="py-2.5 text-sm text-on-dark/90">
                    {b}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <QuizTrigger services={[pillar.value]} variant="on-dark" size="md">
                  {pillar.ctaLabel}
                </QuizTrigger>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
