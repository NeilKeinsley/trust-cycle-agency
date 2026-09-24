"use client";

import { useState } from "react";
import { Button } from "@/components/button";

const fieldClass =
  "w-full rounded-[var(--radius-field)] border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors duration-300 placeholder:text-muted focus:border-accent";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-[var(--radius-card)] border border-line bg-card p-7">
        <p className="text-lg">Thanks, we&apos;ll be in touch.</p>
        <p className="mt-2 text-sm text-muted">
          This is a UI stub, so nothing was sent yet. In production this form
          reaches our team directly.
        </p>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <div>
        <label htmlFor="name" className="mb-1.5 block text-[0.8125rem] text-muted">
          Name
        </label>
        <input id="name" name="name" type="text" autoComplete="name" required className={fieldClass} placeholder="Your name" />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-[0.8125rem] text-muted">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={fieldClass} placeholder="you@company.com" />
      </div>
      <div>
        <label htmlFor="message" className="mb-1.5 block text-[0.8125rem] text-muted">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className={`${fieldClass} resize-none`}
          placeholder="Tell us a bit about your project"
        />
      </div>
      <Button type="submit" variant="primary" size="md" className="w-full sm:w-auto">
        Send message
      </Button>
    </form>
  );
}
