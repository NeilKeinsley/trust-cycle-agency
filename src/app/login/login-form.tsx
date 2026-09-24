"use client";

import { useState } from "react";
import { Button } from "@/components/button";

const fieldClass =
  "w-full rounded-[var(--radius-field)] border border-line bg-transparent px-4 py-3 text-sm outline-none transition-colors duration-300 placeholder:text-muted focus:border-accent";

export function LoginForm() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div>
        <label htmlFor="login-email" className="mb-1.5 block text-[0.8125rem] text-muted">
          Email
        </label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="username"
          required
          className={fieldClass}
          placeholder="you@company.com"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="mb-1.5 block text-[0.8125rem] text-muted">
          Password
        </label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" variant="primary" size="md" className="w-full">
        Log in
      </Button>
      {submitted && (
        <p className="text-center text-sm text-muted">
          Client portal is coming soon.
        </p>
      )}
    </form>
  );
}
