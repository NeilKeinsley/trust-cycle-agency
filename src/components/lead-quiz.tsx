"use client";

/**
 * LeadQuiz: a full-screen, one-question-per-screen intake modal modelled on
 * Superpower's quiz pattern (see reference/superpower-intake-step*.jpeg).
 * `LeadQuizProvider` wraps the app (src/app/layout.tsx) and owns all modal
 * state; `useLeadQuiz().open()` opens it from anywhere; `QuizTrigger` is the
 * button the homepage and header already render (its props contract is
 * unchanged from the stub it replaces).
 */
import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { Button, type ButtonSize, type ButtonVariant } from "@/components/button";
import {
  BUDGETS,
  SERVICES,
  TIMELINES,
  quizLeadSchema,
  START_DRAFT_KEY,
  type BudgetValue,
  type ServiceValue,
  type TimelineValue,
} from "@/lib/intake";
import { CONTACT_EMAIL, SITE_NAME } from "@/lib/site";

const REAL_SERVICES = SERVICES.filter((s) => s.value !== "unsure");

function submitErrorMessage(status: number): string {
  if (status === 429) return "Too many tries in a short time. Wait a minute and send again.";
  if (status === 400) return "Something in the form needs another look.";
  return "Something went wrong on our end. Please try again.";
}

type QuizStep = 1 | 2 | 3 | 4 | 5;

type OpenOptions = { services?: ServiceValue[] };

type LeadQuizContextValue = {
  open: (opts?: OpenOptions) => void;
};

const LeadQuizContext = createContext<LeadQuizContextValue | null>(null);

export function useLeadQuiz(): LeadQuizContextValue {
  const ctx = useContext(LeadQuizContext);
  if (!ctx) {
    throw new Error("useLeadQuiz must be used within a LeadQuizProvider");
  }
  return ctx;
}

export function QuizTrigger({
  services,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  services?: ServiceValue[];
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: React.ReactNode;
}) {
  const { open } = useLeadQuiz();
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => open({ services })}
    >
      {children}
    </Button>
  );
}

function labelFor(list: readonly { value: string; label: string }[], value: string) {
  return list.find((item) => item.value === value)?.label ?? value;
}

const SHORT_SERVICE_LABEL: Record<ServiceValue, string> = {
  brand: "your brand",
  website: "your website",
  marketing: "marketing",
  seo: "SEO",
  social: "social",
  unsure: "your project",
};

function joinLabels(labels: string[]): string {
  if (labels.length === 0) return "your project";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

const TRUST_NOTES: { label: string; icon: ReactNode }[] = [
  {
    label: "Free 30-minute call",
    icon: <path d="M12 7v5l3.2 2M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
  },
  {
    label: "No obligation",
    icon: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm-4-9 2.5 2.5L16 9" />,
  },
  {
    label: "Reply in 1 business day",
    icon: <path d="M4 6h16v12H4zM4 6l8 7 8-7" />,
  },
];

function QuizArcs() {
  return (
    <svg
      viewBox="0 0 480 480"
      aria-hidden="true"
      className="pointer-events-none absolute left-[-120px] top-1/2 hidden h-[560px] w-[560px] -translate-y-1/2 lg:block"
    >
      {[220, 175, 130, 88, 50].map((r, i) => (
        <circle
          key={r}
          cx="240"
          cy="240"
          r={r}
          fill="none"
          stroke={i === 2 ? "var(--color-accent)" : "var(--color-on-dark-muted)"}
          strokeOpacity={i === 2 ? 0.55 : 0.16}
          strokeWidth={i === 2 ? 1.5 : 1}
          strokeDasharray={i % 2 === 0 ? "1 10" : undefined}
          strokeLinecap="round"
        />
      ))}
      <circle cx="240" cy="130" r="4" fill="var(--color-accent)" />
    </svg>
  );
}

type FieldErrors = Partial<Record<"name" | "email" | "consent", string[]>>;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function LeadQuizProvider({ children }: { children: ReactNode }) {
  const headingId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const advanceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<QuizStep>(1);
  const [selectedServices, setSelectedServices] = useState<ServiceValue[]>([]);
  const [budget, setBudget] = useState<BudgetValue | null>(null);
  const [timeline, setTimeline] = useState<TimelineValue | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  // Time trap: when the modal became interactive, and a stable id for this
  // submission attempt (reused across retries of the same attempt).
  const openedAtRef = useRef<number | null>(null);
  const submissionIdRef = useRef<string | null>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    const trigger = triggerRef.current;
    if (trigger) requestAnimationFrame(() => trigger.focus());
  }, []);

  const open = useCallback((opts?: OpenOptions) => {
    const preselected = (opts?.services ?? []).filter(Boolean);
    triggerRef.current = document.activeElement as HTMLElement | null;
    setSelectedServices(preselected);
    setBudget(null);
    setTimeline(null);
    setName("");
    setEmail("");
    setConsent(false);
    setHoneypot("");
    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(false);
    setStep(preselected.length > 0 ? 2 : 1);
    setIsOpen(true);
    openedAtRef.current = Date.now();
    submissionIdRef.current = crypto.randomUUID();
  }, []);

  const contextValue = useMemo(() => ({ open }), [open]);

  function scheduleAdvance(next: QuizStep) {
    if (advanceTimeout.current) clearTimeout(advanceTimeout.current);
    advanceTimeout.current = setTimeout(() => setStep(next), 200);
  }

  useEffect(() => {
    return () => {
      if (advanceTimeout.current) clearTimeout(advanceTimeout.current);
    };
  }, []);

  function toggleService(value: ServiceValue) {
    setSelectedServices((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  // Removing the last chip on the budget step drops the visitor back to the
  // services step rather than letting them submit with nothing chosen.
  function removeService(value: ServiceValue) {
    const next = selectedServices.filter((v) => v !== value);
    setSelectedServices(next);
    if (step === 2 && next.length === 0) setStep(1);
  }

  function selectBudget(value: BudgetValue) {
    setBudget(value);
    scheduleAdvance(3);
  }

  function selectTimeline(value: TimelineValue) {
    setTimeline(value);
    scheduleAdvance(4);
  }

  function back() {
    setStep((s) => (s > 1 ? ((s - 1) as QuizStep) : s));
  }

  const headline = useMemo(() => {
    const labels = selectedServices.map((v) => SHORT_SERVICE_LABEL[v]);
    return `Let's talk about ${joinLabels(labels)}.`;
  }, [selectedServices]);

  const detailHref = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedServices.length) params.set("services", selectedServices.join(","));
    if (budget) params.set("budget", budget);
    if (timeline) params.set("timeline", timeline);
    const qs = params.toString();
    return qs ? `/start?${qs}` : "/start";
  }, [selectedServices, budget, timeline]);

  // Contact details go to /start through its sessionStorage draft, not the
  // URL, so they never land in server logs, analytics or referrer headers.
  // leadId carries this quiz's submission id so the brief updates the same
  // row in the lead sheet (n8n upserts on id) instead of adding a second one.
  function handOffToBrief() {
    try {
      const raw = sessionStorage.getItem(START_DRAFT_KEY);
      const saved = raw ? JSON.parse(raw) : {};
      sessionStorage.setItem(
        START_DRAFT_KEY,
        JSON.stringify({
          ...saved,
          services: selectedServices,
          budget,
          timeline,
          name,
          email,
          leadId: submissionIdRef.current ?? undefined,
        })
      );
    } catch {
      // Storage unavailable: /start still gets the non-personal answers from the URL.
    }
    close();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!budget || !timeline) return;

    const result = quizLeadSchema.safeParse({
      source: "quiz",
      services: selectedServices,
      budget,
      timeline,
      name,
      email,
      consent,
      company_website: honeypot,
      elapsedMs: openedAtRef.current !== null ? Date.now() - openedAtRef.current : undefined,
      submissionId: submissionIdRef.current ?? undefined,
    });

    if (!result.success) {
      const flat = result.error.flatten().fieldErrors;
      setFieldErrors({ name: flat.name, email: flat.email, consent: flat.consent });
      return;
    }
    setFieldErrors({});
    setSubmitError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      // The API returns { ok: true } even when n8n forwarding failed, so any
      // 2xx here is a genuine success from the visitor's point of view.
      if (res.ok) {
        setSubmitting(false);
        setStep(5);
        return;
      }
      console.error("[lead-quiz] /api/lead responded with", res.status);
      setSubmitError(submitErrorMessage(res.status));
      if (res.status === 400) {
        try {
          const body: { fieldErrors?: FieldErrors } = await res.json();
          if (body.fieldErrors) {
            setFieldErrors({
              name: body.fieldErrors.name,
              email: body.fieldErrors.email,
              consent: body.fieldErrors.consent,
            });
          }
        } catch {
          // Body wasn't JSON — keep the generic message.
        }
      }
      setSubmitting(false);
    } catch (err) {
      console.error("[lead-quiz] submit failed", err);
      setSubmitError("We couldn't reach the server. Check your connection and try again.");
      setSubmitting(false);
    }
  }

  // Scroll lock, compensating for the scrollbar width so the page doesn't shift.
  useEffect(() => {
    if (!isOpen) return;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevBodyPaddingRight = body.style.paddingRight;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    if (scrollbarWidth > 0) body.style.paddingRight = `${scrollbarWidth}px`;
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.paddingRight = prevBodyPaddingRight;
    };
  }, [isOpen]);

  // Escape to close, focus trapped inside the dialog, first focusable
  // element (re)focused whenever the step changes.
  useEffect(() => {
    if (!isOpen) return;
    const container = dialogRef.current;
    if (!container) return;

    function getFocusable() {
      return Array.from(container!.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => el.offsetParent !== null
      );
    }

    const focusable = getFocusable();
    (focusable[0] ?? container).focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab") return;
      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, step, close]);

  return (
    <LeadQuizContext.Provider value={contextValue}>
      {children}

      {isOpen && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-surface-dark text-on-dark">
          <QuizArcs />

          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="fixed right-4 top-4 z-10 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-on-dark-muted/30 text-on-dark transition-colors duration-300 hover:border-on-dark-muted/60 sm:right-6 sm:top-6"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>

          <div className="mx-auto flex min-h-full w-full max-w-[1200px] items-center justify-center px-4 py-20 sm:px-6 lg:justify-end lg:px-16">
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby={headingId}
              tabIndex={-1}
              className="relative w-full max-w-md outline-none lg:max-w-lg"
            >
              {step !== 5 && (
                <div className="mb-8 flex items-center gap-4">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={back}
                      className="flex shrink-0 cursor-pointer items-center gap-1.5 text-[0.8125rem] text-on-dark-muted transition-colors duration-300 hover:text-on-dark"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" stroke="currentColor" strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 18l-6-6 6-6" />
                      </svg>
                      Back
                    </button>
                  )}
                  <div className="flex flex-1 items-center gap-1.5" aria-hidden="true">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                          i <= step ? "bg-accent" : "bg-on-dark-muted/20"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="sr-only" aria-live="polite">
                    Step {step} of 4
                  </span>
                </div>
              )}

              <div key={step} className="quiz-step">
                {step === 1 && (
                  <div>
                    <h2 id={headingId} className="text-3xl font-medium sm:text-4xl">
                      What brings you here?
                    </h2>
                    <p className="mt-2 text-on-dark-muted">Pick everything that applies.</p>
                    <div className="mt-8 flex flex-col gap-3" role="group" aria-label="Services">
                      {REAL_SERVICES.map((s) => {
                        const active = selectedServices.includes(s.value);
                        return (
                          <button
                            key={s.value}
                            type="button"
                            aria-pressed={active}
                            onClick={() => toggleService(s.value)}
                            className={`w-full cursor-pointer rounded-full border px-6 py-4 text-left text-base transition-all duration-300 [transition-timing-function:var(--ease-spring)] ${
                              active
                                ? "border-accent bg-accent text-accent-foreground"
                                : "border-on-dark-muted/25 text-on-dark hover:border-on-dark-muted/50"
                            }`}
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        aria-pressed={selectedServices.includes("unsure")}
                        onClick={() => toggleService("unsure")}
                        className={`inline-flex min-h-11 cursor-pointer items-center text-base underline underline-offset-4 transition-colors duration-300 ${
                          selectedServices.includes("unsure")
                            ? "text-on-dark-accent"
                            : "text-on-dark-muted hover:text-on-dark"
                        }`}
                      >
                        Not sure yet
                      </button>
                    </div>
                    <div className="mt-8">
                      <Button
                        variant="on-dark"
                        size="md"
                        disabled={selectedServices.length === 0}
                        onClick={() => setStep(2)}
                        className="w-full sm:w-auto"
                      >
                        Continue
                      </Button>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    {selectedServices.length > 0 && (
                      <div className="mb-6 flex flex-wrap gap-2">
                        {selectedServices.map((v) => (
                          <span
                            key={v}
                            className="inline-flex items-center gap-1.5 rounded-full border border-on-dark-muted/30 py-1.5 pl-3.5 pr-2 text-[0.8125rem] text-on-dark-muted"
                          >
                            {labelFor(SERVICES, v)}
                            <button
                              type="button"
                              onClick={() => removeService(v)}
                              aria-label={`Remove ${labelFor(SERVICES, v)}`}
                              className="flex h-4 w-4 cursor-pointer items-center justify-center rounded-full text-on-dark-muted transition-colors duration-300 hover:text-on-dark"
                            >
                              <svg viewBox="0 0 24 24" className="h-3 w-3" stroke="currentColor" strokeWidth={2} fill="none" strokeLinecap="round">
                                <path d="M6 6l12 12M18 6L6 18" />
                              </svg>
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                    <h2 id={headingId} className="text-3xl font-medium sm:text-4xl">
                      What&apos;s your budget?
                    </h2>
                    <p className="mt-2 text-on-dark-muted">A rough range is fine, it just helps us prep.</p>
                    <div className="mt-8 flex flex-col gap-3" role="group" aria-label="Budget">
                      {BUDGETS.map((b) => (
                        <button
                          key={b.value}
                          type="button"
                          aria-pressed={budget === b.value}
                          onClick={() => selectBudget(b.value)}
                          className={`w-full cursor-pointer rounded-full border px-6 py-4 text-left text-base transition-all duration-300 [transition-timing-function:var(--ease-spring)] ${
                            budget === b.value
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-on-dark-muted/25 text-on-dark hover:border-on-dark-muted/50"
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 id={headingId} className="text-3xl font-medium sm:text-4xl">
                      When do you want to start?
                    </h2>
                    <p className="mt-2 text-on-dark-muted">We will line up the right team.</p>
                    <div className="mt-8 flex flex-col gap-3" role="group" aria-label="Timeline">
                      {TIMELINES.map((t) => (
                        <button
                          key={t.value}
                          type="button"
                          aria-pressed={timeline === t.value}
                          onClick={() => selectTimeline(t.value)}
                          className={`w-full cursor-pointer rounded-full border px-6 py-4 text-left text-base transition-all duration-300 [transition-timing-function:var(--ease-spring)] ${
                            timeline === t.value
                              ? "border-accent bg-accent text-accent-foreground"
                              : "border-on-dark-muted/25 text-on-dark hover:border-on-dark-muted/50"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h2 id={headingId} className="text-3xl font-medium sm:text-4xl">
                      {headline}
                    </h2>
                    <p className="mt-2 text-on-dark-muted">
                      Leave your details and we will follow up within 1 business day.
                    </p>
                    <form onSubmit={handleSubmit} noValidate className="mt-8 flex flex-col gap-4">
                      <div>
                        <label htmlFor="quiz-name" className="mb-1.5 block text-[0.8125rem] text-on-dark-muted">
                          Name
                        </label>
                        <input
                          id="quiz-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          aria-invalid={fieldErrors.name ? true : undefined}
                          aria-describedby={fieldErrors.name ? "quiz-name-error" : undefined}
                          placeholder="Your name"
                          className="w-full rounded-[var(--radius-field)] border border-on-dark-muted/25 bg-on-dark/[0.04] px-4 py-3 text-base text-on-dark outline-none transition-colors duration-300 placeholder:text-on-dark-muted/60 focus:border-accent"
                        />
                        {fieldErrors.name && (
                          <p id="quiz-name-error" className="mt-1.5 text-[0.8125rem] text-on-dark-accent">
                            {fieldErrors.name[0]}
                          </p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="quiz-email" className="mb-1.5 block text-[0.8125rem] text-on-dark-muted">
                          Work email
                        </label>
                        <input
                          id="quiz-email"
                          name="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          aria-invalid={fieldErrors.email ? true : undefined}
                          aria-describedby={fieldErrors.email ? "quiz-email-error" : undefined}
                          placeholder="you@company.com"
                          className="w-full rounded-[var(--radius-field)] border border-on-dark-muted/25 bg-on-dark/[0.04] px-4 py-3 text-base text-on-dark outline-none transition-colors duration-300 placeholder:text-on-dark-muted/60 focus:border-accent"
                        />
                        {fieldErrors.email && (
                          <p id="quiz-email-error" className="mt-1.5 text-[0.8125rem] text-on-dark-accent">
                            {fieldErrors.email[0]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="flex cursor-pointer items-start gap-3">
                          <input
                            type="checkbox"
                            id="quiz-consent"
                            name="consent"
                            checked={consent}
                            onChange={(e) => setConsent(e.target.checked)}
                            aria-invalid={fieldErrors.consent ? true : undefined}
                            aria-describedby={fieldErrors.consent ? "quiz-consent-error" : undefined}
                            className="mt-0.5 h-4 w-4 shrink-0 rounded border-on-dark-muted/40 accent-accent focus-visible:ring-2 focus-visible:ring-accent"
                          />
                          <span className="text-[0.8125rem] text-on-dark-muted">
                            I agree to receive emails from {SITE_NAME} about this project, sent to the
                            email address above. Use the unsubscribe link in any email to opt out.
                          </span>
                        </label>
                        {fieldErrors.consent && (
                          <p id="quiz-consent-error" className="mt-1.5 text-[0.8125rem] text-on-dark-accent">
                            {fieldErrors.consent[0]}
                          </p>
                        )}
                      </div>

                      {/* Honeypot: hidden from sighted and assistive users, bots often fill it anyway. */}
                      <div
                        aria-hidden="true"
                        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}
                      >
                        <label htmlFor="quiz-company-website">Company Website</label>
                        <input
                          id="quiz-company-website"
                          name="company_website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={honeypot}
                          onChange={(e) => setHoneypot(e.target.value)}
                        />
                      </div>

                      <Button type="submit" variant="on-dark" size="md" disabled={submitting} className="mt-2 w-full">
                        {submitting ? "Sending…" : "Get my free consultation"}
                      </Button>
                      {submitError && (
                        <p role="alert" className="text-[0.8125rem] text-on-dark-accent">
                          {submitError} Or email us at{" "}
                          <a href={`mailto:${CONTACT_EMAIL}`} className="link-line text-on-dark">
                            {CONTACT_EMAIL}
                          </a>
                          .
                        </p>
                      )}
                      <p className="text-xs text-on-dark-muted">
                        We use these details only to reply about your project. This is a portfolio demo, so please use test info.
                      </p>
                    </form>
                  </div>
                )}

                {step === 5 && (
                  <div>
                    <h2 id={headingId} className="text-3xl font-medium sm:text-4xl">
                      You&apos;re in.
                    </h2>
                    <p className="mt-3 max-w-sm text-on-dark-muted">
                      Expect a reply within 1 business day.
                    </p>
                    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
                      <Button variant="on-dark" size="md" onClick={close}>
                        Close
                      </Button>
                      <Link href={detailHref} onClick={handOffToBrief} className="link-line text-sm text-on-dark-muted hover:text-on-dark">
                        Add more detail (2 min)
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {step !== 5 && (
                <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-on-dark-muted/15 pt-6 text-[0.8125rem] text-on-dark-muted">
                  {TRUST_NOTES.map((note) => (
                    <div key={note.label} className="flex items-center gap-2">
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-3.5 w-3.5 shrink-0 text-accent"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        {note.icon}
                      </svg>
                      <span>{note.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </LeadQuizContext.Provider>
  );
}
