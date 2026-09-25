import { Eyebrow } from "@/components/section";
import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { StartForm, type Draft } from "@/components/start/start-form";
import {
  BUDGETS,
  SERVICES,
  TIMELINES,
  type BudgetValue,
  type ServiceValue,
  type TimelineValue,
} from "@/lib/intake";

export const metadata: Metadata = pageMetadata({
  title: "Start a project",
  description:
    "Tell us about your project and we will get back to you within 1 business day.",
  path: "/start",
});

const SERVICE_VALUES = new Set<string>(SERVICES.map((s) => s.value));
const BUDGET_VALUES = new Set<string>(BUDGETS.map((b) => b.value));
const TIMELINE_VALUES = new Set<string>(TIMELINES.map((t) => t.value));

function firstParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  const services = firstParam(sp.services)
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is ServiceValue => SERVICE_VALUES.has(s));

  const budgetRaw = firstParam(sp.budget);
  const budget: BudgetValue | "" = BUDGET_VALUES.has(budgetRaw) ? (budgetRaw as BudgetValue) : "";

  const timelineRaw = firstParam(sp.timeline);
  const timeline: TimelineValue | "" = TIMELINE_VALUES.has(timelineRaw)
    ? (timelineRaw as TimelineValue)
    : "";

  const initialDraft: Draft = {
    services,
    budget,
    timeline,
    goals: "",
    website: "",
    name: "",
    email: "",
    company: "",
    phone: "",
    consent: false,
    company_website: "",
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6 lg:py-24">
      <div className="mb-12 max-w-2xl">
        <Eyebrow>Start a project</Eyebrow>
        <h1 className="mt-3 text-4xl font-medium sm:text-5xl">Tell us about your project.</h1>
        <p className="mt-4 text-muted">
          Five short steps. Skip around, edit anything, and send whenever you are ready.
        </p>
      </div>
      <StartForm initialDraft={initialDraft} />
    </div>
  );
}
