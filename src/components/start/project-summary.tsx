import { BUDGETS, SERVICES, TIMELINES } from "@/lib/intake";
import type { Draft } from "./start-form";

function labelFor(list: readonly { value: string; label: string }[], value: string) {
  return list.find((item) => item.value === value)?.label ?? value;
}

const EMPTY = <span className="text-muted">Not chosen yet</span>;

/**
 * Live summary of the brief so far. Shared by the desktop sticky sidebar and
 * the mobile bottom-sheet in start-form.tsx.
 */
export function ProjectSummary({ draft }: { draft: Draft }) {
  const hasContact = Boolean(draft.name || draft.email);
  const goalsExcerpt = draft.goals.trim();

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-[0.8125rem] text-muted">Services</p>
        {draft.services.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {draft.services.map((v) => (
              <span
                key={v}
                className="rounded-full border border-line px-3 py-1 text-[0.75rem] text-foreground"
              >
                {labelFor(SERVICES, v)}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-1 text-sm">{EMPTY}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[0.8125rem] text-muted">Budget</p>
          <p className="mt-1 text-sm text-foreground">
            {draft.budget ? labelFor(BUDGETS, draft.budget) : EMPTY}
          </p>
        </div>
        <div>
          <p className="text-[0.8125rem] text-muted">Timeline</p>
          <p className="mt-1 text-sm text-foreground">
            {draft.timeline ? labelFor(TIMELINES, draft.timeline) : EMPTY}
          </p>
        </div>
      </div>

      <div>
        <p className="text-[0.8125rem] text-muted">Goals</p>
        <p className="mt-1 text-sm text-foreground/90">
          {goalsExcerpt
            ? `${goalsExcerpt.slice(0, 140)}${goalsExcerpt.length > 140 ? "…" : ""}`
            : EMPTY}
        </p>
      </div>

      <div>
        <p className="text-[0.8125rem] text-muted">Contact</p>
        {hasContact ? (
          <p className="mt-1 text-sm text-foreground">
            {draft.name || "Name not added"}
            <br />
            <span className="text-muted">{draft.email || "Email not added"}</span>
          </p>
        ) : (
          <p className="mt-1 text-sm">{EMPTY}</p>
        )}
      </div>
    </div>
  );
}
