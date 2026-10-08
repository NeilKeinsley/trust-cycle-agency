"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/button";
import type { FaqBoard, ManagedFaq } from "@/lib/manage";
import { deleteFaq, moveFaq, saveFaq, signIn, type FormState } from "./actions";

const fieldClass =
  "w-full rounded-[var(--radius-field)] border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors duration-300 placeholder:text-muted focus:border-accent aria-[invalid=true]:border-accent";
const labelClass = "mb-1.5 block text-[0.8125rem] text-muted";

const idle: FormState = {};

function Status({ state }: { state: FormState }) {
  return (
    <p aria-live="polite" className={`min-h-5 text-sm ${state.ok ? "text-accent" : "text-foreground"}`}>
      {state.message}
    </p>
  );
}

/** A labelled field with a live character count against the same limit WordPress enforces. */
function Field({
  id,
  name,
  label,
  limit,
  rows,
  initial,
  error,
}: {
  id: string;
  name: "q" | "a";
  label: string;
  limit: number;
  rows?: number;
  initial: string;
  error?: string;
}) {
  const [value, setValue] = useState(initial);
  const over = value.length > limit;
  const shared = {
    id,
    name,
    value,
    required: true,
    "aria-invalid": Boolean(error) || over,
    "aria-describedby": `${id}-hint`,
    className: fieldClass,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value),
  };

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      {rows ? <textarea rows={rows} {...shared} /> : <input type="text" {...shared} />}
      <p id={`${id}-hint`} className="mt-1.5 flex justify-between gap-4 text-[0.8125rem] text-muted">
        <span className="text-foreground">{error ?? (over ? "Too long. Please shorten it." : "")}</span>
        <span className={over ? "text-foreground" : ""}>
          {value.length} / {limit}
        </span>
      </p>
    </div>
  );
}

export function SignInForm() {
  const [state, action, pending] = useActionState(signIn, idle);
  // Controlled, so a wrong password doesn't also wipe the username.
  const [username, setUsername] = useState("");

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="manage-user" className={labelClass}>
          Username
        </label>
        <input
          id="manage-user"
          name="username"
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="manage-pass" className={labelClass}>
          Password
        </label>
        <input
          id="manage-pass"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass}
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Signing in" : "Sign in"}
      </Button>
      <Status state={state} />
    </form>
  );
}

export function NewFaqForm({ limits }: { limits: FaqBoard["limits"] }) {
  const [state, action, pending] = useActionState(saveFaq, idle);
  // A fresh key after each successful add clears the fields for the next one.
  const [round, setRound] = useState(0);
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) setRound(round + 1);
  }

  return (
    <form action={action} className="space-y-4">
      <div key={round} className="space-y-4">
        <Field id="new-q" name="q" label="Question" limit={limits.q} initial="" error={state.errors?.q} />
        <Field id="new-a" name="a" label="Answer" limit={limits.a} rows={4} initial="" error={state.errors?.a} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" variant="accent" disabled={pending}>
          {pending ? "Adding" : "Add to the website"}
        </Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function FaqCard({
  faq,
  position,
  total,
  limits,
}: {
  faq: ManagedFaq;
  position: number;
  total: number;
  limits: FaqBoard["limits"];
}) {
  const [saved, save, saving] = useActionState(saveFaq, idle);
  const [moved, move, moving] = useActionState(moveFaq, idle);
  const [removed, remove, removing] = useActionState(deleteFaq, idle);
  const [confirming, setConfirming] = useState(false);
  const busy = saving || moving || removing;
  const latest = [removed, moved, saved].find((s) => s.message) ?? idle;

  return (
    <li className="rounded-[var(--radius-card)] border border-line bg-card p-5 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-sm text-accent">
          {String(position + 1).padStart(2, "0")}
          {faq.status !== "publish" && <span className="ml-3 text-muted">Draft, not on the website</span>}
        </p>
        <form action={move} className="flex gap-2">
          <input type="hidden" name="id" value={faq.id} />
          <Button type="submit" name="direction" value="up" variant="ghost" size="sm" disabled={busy || position === 0}>
            Move up
          </Button>
          <Button
            type="submit"
            name="direction"
            value="down"
            variant="ghost"
            size="sm"
            disabled={busy || position === total - 1}
          >
            Move down
          </Button>
        </form>
      </div>

      <form action={save} className="space-y-4">
        <input type="hidden" name="id" value={faq.id} />
        <Field
          id={`q-${faq.id}`}
          name="q"
          label="Question"
          limit={limits.q}
          initial={faq.q}
          error={saved.errors?.q}
        />
        <Field
          id={`a-${faq.id}`}
          name="a"
          label="Answer"
          limit={limits.a}
          rows={4}
          initial={faq.a}
          error={saved.errors?.a}
        />
        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="sm" disabled={busy}>
            {saving ? "Saving" : "Save changes"}
          </Button>
          <Status state={latest} />
        </div>
      </form>

      <form action={remove} className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
        <input type="hidden" name="id" value={faq.id} />
        {confirming ? (
          <>
            <span className="text-sm">Remove this question from the website?</span>
            <Button type="submit" size="sm" disabled={busy}>
              {removing ? "Removing" : "Yes, remove it"}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              Keep it
            </Button>
          </>
        ) : (
          <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(true)}>
            Remove
          </Button>
        )}
      </form>
    </li>
  );
}
