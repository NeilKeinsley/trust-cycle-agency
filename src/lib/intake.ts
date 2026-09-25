import { z } from "zod";

/**
 * Shared intake vocabulary. The hero chips, the LeadQuiz modal, the /start
 * brief and /api/lead all read these lists, so a label changes in one place.
 * `value` is the stable slug sent to the API (and later to n8n).
 */
export const SERVICES = [
  { value: "brand", label: "Brand and identity" },
  { value: "website", label: "Website design and build" },
  { value: "marketing", label: "Marketing and ads" },
  { value: "seo", label: "SEO and content" },
  { value: "social", label: "Social media" },
  { value: "unsure", label: "Not sure yet" },
] as const;

export const BUDGETS = [
  { value: "under-5k", label: "Under $5k" },
  { value: "5k-15k", label: "$5k to $15k" },
  { value: "15k-50k", label: "$15k to $50k" },
  { value: "50k-plus", label: "$50k+" },
  { value: "unsure", label: "Help me figure it out" },
] as const;

export const TIMELINES = [
  { value: "asap", label: "As soon as possible" },
  { value: "1-3-months", label: "In 1 to 3 months" },
  { value: "3-plus-months", label: "3+ months out" },
  { value: "exploring", label: "Just exploring" },
] as const;

/** sessionStorage key for the /start draft. The quiz writes contact details
 * here (never into the URL) when handing off to the longer brief. */
export const START_DRAFT_KEY = "tca-start-draft-v1";

export type ServiceValue = (typeof SERVICES)[number]["value"];
export type BudgetValue = (typeof BUDGETS)[number]["value"];
export type TimelineValue = (typeof TIMELINES)[number]["value"];

/**
 * Validation. Two entry points write to the same backend (`/api/lead`):
 * the LeadQuiz modal ("quiz", a fast few-tap capture) and the /start brief
 * ("brief", a longer step-gated form). `leadSchema` is the discriminated
 * union the route validates against; the per-step schemas below let /start
 * validate one card at a time as the visitor advances.
 */
const serviceValues = SERVICES.map((s) => s.value) as [ServiceValue, ...ServiceValue[]];
const budgetValues = BUDGETS.map((b) => b.value) as [BudgetValue, ...BudgetValue[]];
const timelineValues = TIMELINES.map((t) => t.value) as [TimelineValue, ...TimelineValue[]];

export const serviceEnum = z.enum(serviceValues);
export const budgetEnum = z.enum(budgetValues);
export const timelineEnum = z.enum(timelineValues);

const nameField = z
  .string()
  .trim()
  .min(1, "Enter your name")
  .max(120, "Keep it under 120 characters");

const emailField = z
  .string()
  .trim()
  .min(1, "Enter your email")
  .max(200, "Keep it under 200 characters")
  .email("Enter a valid email address");

/** Never rejected on its own — a filled honeypot is checked in the route handler, not the schema. */
const honeypotField = z.string().max(200).optional();

export const servicesField = z
  .array(serviceEnum)
  .min(1, "Choose at least one service");

export const goalsField = z
  .string()
  .trim()
  .min(20, "A couple sentences helps us prep (20 characters minimum)")
  .max(2000, "Keep it under 2000 characters");

export const websiteField = z
  .string()
  .trim()
  .max(300, "Keep it under 300 characters")
  .optional()
  .or(z.literal(""));

export const companyField = z
  .string()
  .trim()
  .max(200, "Keep it under 200 characters")
  .optional()
  .or(z.literal(""));

export const phoneField = z
  .string()
  .trim()
  .max(40, "Keep it under 40 characters")
  .optional()
  .or(z.literal(""));

export const consentField = z
  .boolean()
  .refine((v) => v === true, "Tick the box to agree to emails and texts about this project");

/** Elapsed time between the form becoming interactive and submit, in ms.
 * Paired with the honeypot as a time-trap: real visitors can't finish in
 * under ~1.5s, bots filling the form programmatically often do. */
const elapsedMsField = z.number().int().nonnegative().optional();

/** Idempotency key created when the form opens/mounts and reused across
 * retries of the same submission attempt (double-click, network retry). */
const submissionIdField = z.string().uuid().optional();

/** LeadQuiz modal submission (steps: services -> budget -> timeline -> contact). */
export const quizLeadSchema = z.object({
  source: z.literal("quiz"),
  services: servicesField,
  budget: budgetEnum,
  timeline: timelineEnum,
  name: nameField,
  email: emailField,
  company_website: honeypotField,
  elapsedMs: elapsedMsField,
  submissionId: submissionIdField,
});

/** /start step-gated brief submission. */
export const briefLeadSchema = z.object({
  source: z.literal("brief"),
  services: servicesField,
  budget: budgetEnum,
  timeline: timelineEnum,
  goals: goalsField,
  website: websiteField,
  name: nameField,
  email: emailField,
  company: companyField,
  phone: phoneField,
  consent: consentField,
  company_website: honeypotField,
  elapsedMs: elapsedMsField,
  submissionId: submissionIdField,
  /** True when this submission was hydrated from a sessionStorage draft
   * rather than typed live, so the time trap (elapsedMs) is skipped. */
  restored: z.boolean().optional(),
  /** True when this brief continues a quiz and reuses its submission id, so
   * n8n updates the quiz's row instead of appending a new one. */
  continuesQuiz: z.boolean().optional(),
});

/** What /api/lead validates every POST body against. */
export const leadSchema = z.discriminatedUnion("source", [
  quizLeadSchema,
  briefLeadSchema,
]);

export type QuizLead = z.infer<typeof quizLeadSchema>;
export type BriefLead = z.infer<typeof briefLeadSchema>;
export type Lead = z.infer<typeof leadSchema>;

/** Per-step schemas for /start — validate one card at a time as it advances. */
export const startStepServicesSchema = z.object({ services: servicesField });
export const startStepProjectSchema = z.object({
  budget: budgetEnum,
  timeline: timelineEnum,
});
export const startStepDetailsSchema = z.object({
  goals: goalsField,
  website: websiteField,
});
export const startStepAboutSchema = z.object({
  name: nameField,
  email: emailField,
  company: companyField,
  phone: phoneField,
});
export const startStepReviewSchema = z.object({ consent: consentField });
