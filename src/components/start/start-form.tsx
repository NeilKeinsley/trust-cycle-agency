"use client";

/**
 * The /start step-gated brief (Superpower checkout pattern, see
 * reference/superpower-checkout-stepgated.jpeg). Five cards, only one
 * expanded at a time; a live "Your project" summary fills in as the visitor
 * answers. Progress is kept in sessionStorage so a refresh doesn't lose it.
 */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/button";
import { ProjectSummary } from "./project-summary";
import {
  BUDGETS,
  SERVICES,
  TIMELINES,
  briefLeadSchema,
  startStepAboutSchema,
  startStepDetailsSchema,
  startStepProjectSchema,
  startStepReviewSchema,
  startStepServicesSchema,
  type BudgetValue,
  type ServiceValue,
  type TimelineValue,
  START_DRAFT_KEY,
} from "@/lib/intake";

export type Draft = {
  services: ServiceValue[];
  budget: BudgetValue | "";
  timeline: TimelineValue | "";
  goals: string;
  website: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  consent: boolean;
  company_website: string;
};

const STORAGE_KEY = START_DRAFT_KEY;
const STEP_TITLES = ["Services", "Project", "Details", "About you", "Review and send"];

function computeCompleted(draft: Draft): boolean[] {
  return [
    startStepServicesSchema.safeParse({ services: draft.services }).success,
    startStepProjectSchema.safeParse({ budget: draft.budget, timeline: draft.timeline }).success,
    startStepDetailsSchema.safeParse({ goals: draft.goals, website: draft.website }).success,
    startStepAboutSchema.safeParse({
      name: draft.name,
      email: draft.email,
      company: draft.company,
      phone: draft.phone,
    }).success,
    false,
  ];
}

function labelFor(list: readonly { value: string; label: string }[], value: string) {
  return list.find((item) => item.value === value)?.label ?? value;
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function StepBadge({ index, locked, done }: { index: number; locked: boolean; done: boolean }) {
  return (
    <span
      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[0.8125rem] font-medium ${
        locked
          ? "bg-line text-muted"
          : done
            ? "bg-accent-soft text-accent"
            : "bg-foreground text-background"
      }`}
    >
      {locked ? <LockIcon /> : done ? "✓" : index}
    </span>
  );
}

export function StartForm({ initialDraft }: { initialDraft: Draft }) {
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [completed, setCompleted] = useState<boolean[]>([false, false, false, false, false]);
  const [expandedStep, setExpandedStep] = useState(1);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  const stepRefs = useRef<Array<HTMLDivElement | null>>([null, null, null, null, null]);
  const didMountScroll = useRef(false);
  // Time trap: when the draft was hydrated (mount), and whether it was
  // restored from a sessionStorage draft rather than started fresh, which
  // exempts it from the elapsed-time check since a restore can submit fast.
  const startedAtRef = useRef<number | null>(null);
  const restoredDraftRef = useRef(false);
  const submissionIdRef = useRef<string | null>(null);

  // Hydrate from sessionStorage (refresh recovery) or fall back to the
  // searchParams-derived draft the server passed in.
  useEffect(() => {
    let next = initialDraft;
    let restored = false;
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === "object" && Array.isArray(saved.services)) {
          next = { ...initialDraft, ...saved };
          restored = true;
        }
      }
    } catch {
      // sessionStorage unavailable (private mode, etc.) — fine, just skip.
    }
    const completedArr = computeCompleted(next);
    const firstIncomplete = completedArr.findIndex((c) => !c);
    startedAtRef.current = Date.now();
    restoredDraftRef.current = restored;
    submissionIdRef.current = crypto.randomUUID();
    // Hydrating from sessionStorage (a client-only external store) after
    // mount, so the server-rendered defaults don't mismatch — this is the
    // one-time sync effect React's own docs describe, not derived state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft(next);
    setCompleted(completedArr);
    setExpandedStep(firstIncomplete === -1 ? 5 : firstIncomplete + 1);
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore — draft persistence is a convenience, not a requirement.
    }
  }, [draft, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!didMountScroll.current) {
      didMountScroll.current = true;
      return;
    }
    const el = stepRefs.current[expandedStep - 1];
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" }));
  }, [expandedStep, hydrated]);

  function clearDraftStorage() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore.
    }
  }

  function toggleService(value: ServiceValue) {
    setDraft((d) => ({
      ...d,
      services: d.services.includes(value)
        ? d.services.filter((v) => v !== value)
        : [...d.services, value],
    }));
  }

  function advance(stepIndex: number, result: { success: boolean; error?: { flatten: () => { fieldErrors: Record<string, string[] | undefined> } } }, fieldNames: string[]) {
    if (!result.success) {
      const flat = result.error?.flatten().fieldErrors ?? {};
      const next: Record<string, string> = {};
      fieldNames.forEach((f) => {
        if (flat[f]?.[0]) next[f] = flat[f]![0];
      });
      setErrors(next);
      setCompleted((c) => {
        const copy = [...c];
        copy[stepIndex - 1] = false;
        return copy;
      });
      return;
    }
    setErrors({});
    setCompleted((c) => {
      const copy = [...c];
      copy[stepIndex - 1] = true;
      return copy;
    });
    setExpandedStep(Math.min(stepIndex + 1, 5));
  }

  function continueServices() {
    advance(1, startStepServicesSchema.safeParse({ services: draft.services }), ["services"]);
  }
  function continueProject() {
    advance(2, startStepProjectSchema.safeParse({ budget: draft.budget, timeline: draft.timeline }), [
      "budget",
      "timeline",
    ]);
  }
  function continueDetails() {
    advance(3, startStepDetailsSchema.safeParse({ goals: draft.goals, website: draft.website }), [
      "goals",
      "website",
    ]);
  }
  function continueAbout() {
    advance(
      4,
      startStepAboutSchema.safeParse({
        name: draft.name,
        email: draft.email,
        company: draft.company,
        phone: draft.phone,
      }),
      ["name", "email", "company", "phone"]
    );
  }

  function editStep(index: number) {
    setExpandedStep(index);
  }

  async function handleSend() {
    const consentCheck = startStepReviewSchema.safeParse({ consent: draft.consent });
    if (!consentCheck.success) {
      setErrors({ consent: consentCheck.error.flatten().fieldErrors.consent?.[0] ?? "Please confirm" });
      return;
    }

    const payload = {
      source: "brief" as const,
      services: draft.services,
      budget: draft.budget as BudgetValue,
      timeline: draft.timeline as TimelineValue,
      goals: draft.goals,
      website: draft.website,
      name: draft.name,
      email: draft.email,
      company: draft.company,
      phone: draft.phone,
      consent: draft.consent,
      company_website: draft.company_website,
      elapsedMs: startedAtRef.current !== null ? Date.now() - startedAtRef.current : undefined,
      submissionId: submissionIdRef.current ?? undefined,
      restored: restoredDraftRef.current || undefined,
    };

    const result = briefLeadSchema.safeParse(payload);
    if (!result.success) {
      console.error("[start] final validation failed", result.error.flatten());
      setErrors({ consent: "Something above needs a second look. Scroll up and check each step." });
      return;
    }

    setErrors({});
    setStatus("submitting");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      if (!res.ok) console.error("[start] /api/lead responded with", res.status);
    } catch (err) {
      // n8n may be offline in demos — the visitor still sees success.
      console.error("[start] submit failed", err);
    } finally {
      setStatus("success");
      clearDraftStorage();
    }
  }

  const answeredCount = completed.slice(0, 4).filter(Boolean).length;

  if (status === "success") {
    return (
      <div className="mx-auto max-w-xl text-center">
        <h1 className="text-3xl font-medium sm:text-4xl">
          Thanks, {draft.name || "there"}. Your brief is in.
        </h1>
        <p className="mt-4 text-muted">Here is what happens next.</p>
        <ol className="mt-8 flex flex-col gap-4 text-left">
          {[
            "We read through your brief and the services you picked.",
            "We reply within 1 business day with next steps or a few questions.",
            "If it looks like a fit, we set up a short call to scope the work.",
          ].map((text, i) => (
            <li key={text} className="flex gap-4 rounded-[var(--radius-card)] border border-line bg-card p-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-[0.8125rem] font-medium text-accent">
                {i + 1}
              </span>
              <span className="text-sm text-foreground/90">{text}</span>
            </li>
          ))}
        </ol>
        <div className="mt-10">
          <Link href="/" className="link-line text-sm text-muted hover:text-foreground">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-10 flex items-center gap-4">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-accent">
          Step {expandedStep} of 5
        </p>
        <div className="flex flex-1 items-center gap-1.5" aria-hidden="true">
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                i <= expandedStep || completed[i - 1] ? "bg-accent" : "bg-line"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr] lg:items-start lg:gap-12">
        <div className="flex flex-col gap-5 pb-24 lg:pb-0">
          {/* Step 1: Services */}
          <div
            ref={(el) => {
              stepRefs.current[0] = el;
            }}
            className={`rounded-[var(--radius-card)] border p-6 sm:p-8 ${
              expandedStep === 1 ? "border-line-strong bg-card" : "border-line bg-card"
            }`}
          >
            <div className="flex items-center gap-4">
              <StepBadge index={1} locked={false} done={completed[0] && expandedStep !== 1} />
              <h2 className="flex-1 text-lg font-medium">{STEP_TITLES[0]}</h2>
              {completed[0] && expandedStep !== 1 && (
                <button type="button" onClick={() => editStep(1)} className="link-line cursor-pointer text-[0.8125rem] text-muted hover:text-foreground">
                  Edit
                </button>
              )}
            </div>

            {expandedStep !== 1 && completed[0] && (
              <p className="mt-3 text-sm text-muted">
                {draft.services.map((v) => labelFor(SERVICES, v)).join(", ")}
              </p>
            )}

            {expandedStep === 1 && (
              <div className="mt-6">
                <p className="mb-4 text-sm text-muted">What do you need help with? Pick everything that applies.</p>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Services">
                  {SERVICES.map((s) => (
                    <label key={s.value} className="relative cursor-pointer">
                      <input
                        type="checkbox"
                        name="services"
                        value={s.value}
                        checked={draft.services.includes(s.value)}
                        onChange={() => toggleService(s.value)}
                        className="peer sr-only"
                      />
                      <span className="inline-flex items-center rounded-full border border-line px-4 py-2.5 text-[0.875rem] text-foreground transition-all duration-300 [transition-timing-function:var(--ease-spring)] peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card hover:border-line-strong">
                        {s.label}
                      </span>
                    </label>
                  ))}
                </div>
                {errors.services && <p className="mt-2 text-[0.8125rem] text-accent">{errors.services}</p>}
                <div className="mt-6">
                  <Button type="button" size="md" onClick={continueServices}>
                    Continue
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Project */}
          <div
            ref={(el) => {
              stepRefs.current[1] = el;
            }}
            className="rounded-[var(--radius-card)] border border-line bg-card p-6 sm:p-8"
          >
            {(() => {
              const locked = !completed[0] && expandedStep !== 2;
              return (
                <>
                  <div className="flex items-center gap-4">
                    <StepBadge index={2} locked={locked} done={completed[1] && expandedStep !== 2} />
                    <h2 className="flex-1 text-lg font-medium">{STEP_TITLES[1]}</h2>
                    {!locked && completed[1] && expandedStep !== 2 && (
                      <button type="button" onClick={() => editStep(2)} className="link-line cursor-pointer text-[0.8125rem] text-muted hover:text-foreground">
                        Edit
                      </button>
                    )}
                  </div>

                  {locked && <p className="mt-3 text-sm text-muted">Complete step 1 to continue.</p>}

                  {!locked && expandedStep !== 2 && completed[1] && (
                    <p className="mt-3 text-sm text-muted">
                      {labelFor(BUDGETS, draft.budget)} &middot; {labelFor(TIMELINES, draft.timeline)}
                    </p>
                  )}

                  {!locked && expandedStep === 2 && (
                    <div className="mt-6 flex flex-col gap-8">
                      <div>
                        <p className="mb-3 text-sm text-muted">What&apos;s your budget?</p>
                        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Budget">
                          {BUDGETS.map((b) => (
                            <label key={b.value} className="relative block cursor-pointer">
                              <input
                                type="radio"
                                name="budget"
                                checked={draft.budget === b.value}
                                onChange={() => setDraft((d) => ({ ...d, budget: b.value }))}
                                className="peer sr-only"
                              />
                              <span className="block w-full rounded-full border border-line px-5 py-3.5 text-base text-foreground transition-all duration-300 [transition-timing-function:var(--ease-spring)] peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card hover:border-line-strong">
                                {b.label}
                              </span>
                            </label>
                          ))}
                        </div>
                        {errors.budget && <p className="mt-2 text-[0.8125rem] text-accent">{errors.budget}</p>}
                      </div>

                      <div>
                        <p className="mb-3 text-sm text-muted">When do you want to start?</p>
                        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Timeline">
                          {TIMELINES.map((t) => (
                            <label key={t.value} className="relative block cursor-pointer">
                              <input
                                type="radio"
                                name="timeline"
                                checked={draft.timeline === t.value}
                                onChange={() => setDraft((d) => ({ ...d, timeline: t.value }))}
                                className="peer sr-only"
                              />
                              <span className="block w-full rounded-full border border-line px-5 py-3.5 text-base text-foreground transition-all duration-300 [transition-timing-function:var(--ease-spring)] peer-checked:border-accent peer-checked:bg-accent peer-checked:text-accent-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-accent peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card hover:border-line-strong">
                                {t.label}
                              </span>
                            </label>
                          ))}
                        </div>
                        {errors.timeline && <p className="mt-2 text-[0.8125rem] text-accent">{errors.timeline}</p>}
                      </div>

                      <div>
                        <Button type="button" size="md" onClick={continueProject}>
                          Continue
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Step 3: Details */}
          <div
            ref={(el) => {
              stepRefs.current[2] = el;
            }}
            className="rounded-[var(--radius-card)] border border-line bg-card p-6 sm:p-8"
          >
            {(() => {
              const locked = !completed[1] && expandedStep !== 3;
              return (
                <>
                  <div className="flex items-center gap-4">
                    <StepBadge index={3} locked={locked} done={completed[2] && expandedStep !== 3} />
                    <h2 className="flex-1 text-lg font-medium">{STEP_TITLES[2]}</h2>
                    {!locked && completed[2] && expandedStep !== 3 && (
                      <button type="button" onClick={() => editStep(3)} className="link-line cursor-pointer text-[0.8125rem] text-muted hover:text-foreground">
                        Edit
                      </button>
                    )}
                  </div>

                  {locked && <p className="mt-3 text-sm text-muted">Complete step 2 to continue.</p>}

                  {!locked && expandedStep !== 3 && completed[2] && (
                    <p className="mt-3 text-sm text-muted">
                      {draft.goals.slice(0, 100)}
                      {draft.goals.length > 100 ? "…" : ""}
                    </p>
                  )}

                  {!locked && expandedStep === 3 && (
                    <div className="mt-6 flex flex-col gap-5">
                      <div>
                        <label htmlFor="start-goals" className="mb-1.5 block text-[0.8125rem] text-muted">
                          What are you trying to achieve?
                        </label>
                        <textarea
                          id="start-goals"
                          name="goals"
                          rows={4}
                          value={draft.goals}
                          onChange={(e) => setDraft((d) => ({ ...d, goals: e.target.value }))}
                          aria-invalid={errors.goals ? true : undefined}
                          aria-describedby={errors.goals ? "start-goals-error" : undefined}
                          placeholder="A couple of sentences is plenty."
                          className="w-full rounded-[var(--radius-field)] border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition-colors duration-300 placeholder:text-muted focus:border-accent"
                        />
                        {errors.goals && (
                          <p id="start-goals-error" className="mt-1.5 text-[0.8125rem] text-accent">
                            {errors.goals}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="start-website" className="mb-1.5 block text-[0.8125rem] text-muted">
                          Current website (optional)
                        </label>
                        <input
                          id="start-website"
                          name="website"
                          type="url"
                          autoComplete="url"
                          
                          value={draft.website}
                          onChange={(e) => setDraft((d) => ({ ...d, website: e.target.value }))}
                          placeholder="https://"
                          className="w-full rounded-[var(--radius-field)] border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition-colors duration-300 placeholder:text-muted focus:border-accent"
                        />
                      </div>
                      <div>
                        <Button type="button" size="md" onClick={continueDetails}>
                          Continue
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Step 4: About you */}
          <div
            ref={(el) => {
              stepRefs.current[3] = el;
            }}
            className="rounded-[var(--radius-card)] border border-line bg-card p-6 sm:p-8"
          >
            {(() => {
              const locked = !completed[2] && expandedStep !== 4;
              return (
                <>
                  <div className="flex items-center gap-4">
                    <StepBadge index={4} locked={locked} done={completed[3] && expandedStep !== 4} />
                    <h2 className="flex-1 text-lg font-medium">{STEP_TITLES[3]}</h2>
                    {!locked && completed[3] && expandedStep !== 4 && (
                      <button type="button" onClick={() => editStep(4)} className="link-line cursor-pointer text-[0.8125rem] text-muted hover:text-foreground">
                        Edit
                      </button>
                    )}
                  </div>

                  {locked && <p className="mt-3 text-sm text-muted">Complete step 3 to continue.</p>}

                  {!locked && expandedStep !== 4 && completed[3] && (
                    <p className="mt-3 text-sm text-muted">
                      {draft.name} &middot; {draft.email}
                    </p>
                  )}

                  {!locked && expandedStep === 4 && (
                    <div className="mt-6 flex flex-col gap-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="start-name" className="mb-1.5 block text-[0.8125rem] text-muted">
                            Name
                          </label>
                          <input
                            id="start-name"
                            name="name"
                            type="text"
                            autoComplete="name"
                            value={draft.name}
                            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                            aria-invalid={errors.name ? true : undefined}
                            aria-describedby={errors.name ? "start-name-error" : undefined}
                            className="w-full rounded-[var(--radius-field)] border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition-colors duration-300 placeholder:text-muted focus:border-accent"
                          />
                          {errors.name && (
                            <p id="start-name-error" className="mt-1.5 text-[0.8125rem] text-accent">
                              {errors.name}
                            </p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="start-email" className="mb-1.5 block text-[0.8125rem] text-muted">
                            Work email
                          </label>
                          <input
                            id="start-email"
                            name="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            value={draft.email}
                            onChange={(e) => setDraft((d) => ({ ...d, email: e.target.value }))}
                            aria-invalid={errors.email ? true : undefined}
                            aria-describedby={errors.email ? "start-email-error" : undefined}
                            className="w-full rounded-[var(--radius-field)] border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition-colors duration-300 placeholder:text-muted focus:border-accent"
                          />
                          {errors.email && (
                            <p id="start-email-error" className="mt-1.5 text-[0.8125rem] text-accent">
                              {errors.email}
                            </p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="start-company" className="mb-1.5 block text-[0.8125rem] text-muted">
                            Company (optional)
                          </label>
                          <input
                            id="start-company"
                            name="company"
                            type="text"
                            autoComplete="organization"
                            value={draft.company}
                            onChange={(e) => setDraft((d) => ({ ...d, company: e.target.value }))}
                            className="w-full rounded-[var(--radius-field)] border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition-colors duration-300 placeholder:text-muted focus:border-accent"
                          />
                        </div>
                        <div>
                          <label htmlFor="start-phone" className="mb-1.5 block text-[0.8125rem] text-muted">
                            Phone (optional)
                          </label>
                          <input
                            id="start-phone"
                            name="phone"
                            type="tel"
                            autoComplete="tel"
                            value={draft.phone}
                            onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
                            className="w-full rounded-[var(--radius-field)] border border-line bg-background px-4 py-3 text-base text-foreground outline-none transition-colors duration-300 placeholder:text-muted focus:border-accent"
                          />
                        </div>
                      </div>
                      <div>
                        <Button type="button" size="md" onClick={continueAbout}>
                          Continue
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          {/* Step 5: Review and send */}
          <div
            ref={(el) => {
              stepRefs.current[4] = el;
            }}
            className="rounded-[var(--radius-card)] border border-line bg-card p-6 sm:p-8"
          >
            {(() => {
              const locked = !completed[3] && expandedStep !== 5;
              return (
                <>
                  <div className="flex items-center gap-4">
                    <StepBadge index={5} locked={locked} done={false} />
                    <h2 className="flex-1 text-lg font-medium">{STEP_TITLES[4]}</h2>
                  </div>

                  {locked && <p className="mt-3 text-sm text-muted">Complete step 4 to continue.</p>}

                  {!locked && expandedStep === 5 && (
                    <div className="mt-6 flex flex-col gap-6">
                      <div className="lg:hidden">
                        <ProjectSummary draft={draft} />
                      </div>

                      <label className="flex cursor-pointer items-start gap-3">
                        <input
                          type="checkbox"
                          id="start-consent"
                          name="consent"
                          checked={draft.consent}
                          onChange={(e) => setDraft((d) => ({ ...d, consent: e.target.checked }))}
                          aria-invalid={errors.consent ? true : undefined}
                          aria-describedby={errors.consent ? "start-consent-error" : undefined}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded border-line text-accent focus-visible:ring-2 focus-visible:ring-accent"
                        />
                        <span className="text-sm text-foreground/90">
                          OK to contact me about this project
                        </span>
                      </label>
                      {errors.consent && (
                        <p id="start-consent-error" className="-mt-4 text-[0.8125rem] text-accent">
                          {errors.consent}
                        </p>
                      )}

                      {/* Honeypot: hidden from sighted and assistive users. */}
                      <div
                        aria-hidden="true"
                        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
                      >
                        <label htmlFor="start-company-website">Company Website</label>
                        <input
                          id="start-company-website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={draft.company_website}
                          onChange={(e) => setDraft((d) => ({ ...d, company_website: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Button type="button" size="md" onClick={handleSend} disabled={status === "submitting"}>
                          {status === "submitting" ? "Sending…" : "Send"}
                        </Button>
                        <p className="mt-3 text-xs text-muted">
                          We use these details only to reply about your project. This is a portfolio demo, so please use test info.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Desktop summary sidebar */}
        <div className="hidden lg:sticky lg:top-24 lg:block">
          <div className="rounded-[var(--radius-card)] border border-line bg-card p-6">
            <p className="mb-5 text-[0.6875rem] uppercase tracking-[0.22em] text-muted">Your project</p>
            <ProjectSummary draft={draft} />
          </div>
        </div>
      </div>

      {/* Mobile summary bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background/95 backdrop-blur-md lg:hidden">
        {mobileSummaryOpen && (
          <div className="max-h-[60vh] overflow-y-auto border-b border-line px-4 py-5">
            <ProjectSummary draft={draft} />
          </div>
        )}
        <button
          type="button"
          onClick={() => setMobileSummaryOpen((v) => !v)}
          aria-expanded={mobileSummaryOpen}
          className="flex w-full cursor-pointer items-center justify-between px-4 py-3.5 text-sm"
        >
          <span className="font-medium">
            Your project &middot; {answeredCount} answer{answeredCount === 1 ? "" : "s"}
          </span>
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 text-muted transition-transform duration-300 ${mobileSummaryOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 15l6-6 6 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
