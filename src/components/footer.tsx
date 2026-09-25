"use client";

import Link from "next/link";
import { useState } from "react";
import { Reveal } from "./reveal";
import { Logo } from "./logo";
import { SITE_TAGLINE, CONTACT_EMAIL } from "@/lib/site";

/* Only links that resolve somewhere real. Dead placeholder links read as
   generation residue — add rows here only when the page behind them exists. */
const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Services",
    links: [
      { label: "Brand", href: "/#services-brand" },
      { label: "Web", href: "/#services-website" },
      { label: "Growth", href: "/#services-marketing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "FAQs", href: "/faq" },
      { label: "Contact", href: "/contact" },
      // A real link: every other "Start a project" CTA is a button that opens
      // the quiz, which crawlers can't follow.
      { label: "Start a project", href: "/start" },
    ],
  },
  {
    title: "Account",
    links: [{ label: "Log in", href: "/login" }],
  },
];

export function Footer() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <footer id="footer" className="border-t border-line">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
        <Reveal>
          <div>
            <Logo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted">
              {SITE_TAGLINE}
            </p>
            <form
              className="mt-6 flex max-w-xs items-center border-b border-line-strong focus-within:border-accent transition-colors duration-300"
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
              }}
            >
              <input
                id="footer-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="Email for updates"
                aria-label="Email for updates"
                className="w-full rounded-sm bg-transparent py-2 text-sm outline-none placeholder:text-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="p-2 text-muted hover:text-accent hover:translate-x-1 transition-all duration-300 cursor-pointer"
              >
                &rarr;
              </button>
            </form>
            {subscribed && (
              <p className="mt-2 text-xs text-muted">
                Thanks. Nothing was stored yet, but it will be at launch.
              </p>
            )}
          </div>
        </Reveal>
        <nav aria-label="Footer" className="contents">
          <h2 className="sr-only">Site links</h2>
          {COLS.map((col, i) => (
            <Reveal key={col.title} delay={120 + i * 100}>
              <div>
                <h3 className="mb-4 text-[0.75rem] tracking-[0.1em] uppercase text-muted">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="link-line inline-block -my-[5px] py-[5px] text-sm text-foreground/80 hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </nav>
      </div>
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-2 px-4 py-5 text-[0.75rem] tracking-[0.08em] uppercase text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            &copy; {new Date().getFullYear()} Trust Cycle Agency &middot;{" "}
            <span className="text-accent">Created by Neil</span>
          </p>
          <p className="normal-case tracking-normal">
            Portfolio concept. Trust Cycle Agency is fictional.
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="link-line inline-block -my-[5px] py-[5px] normal-case tracking-normal"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
    </footer>
  );
}
