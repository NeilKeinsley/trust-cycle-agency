"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "./logo";
import { QuizTrigger } from "./lead-quiz";
import { NAV, LOGIN, CTA } from "@/lib/site";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 border-b transition-all duration-300 ${
        scrolled || menuOpen
          ? "border-line bg-background/95 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-[var(--header-h)] max-w-[112rem] items-center justify-between gap-3 px-4 sm:gap-6 sm:px-8 lg:px-12 2xl:px-16">
        <Link href="/" className="flex items-center text-foreground">
          <Logo />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="link-line text-[0.8125rem] tracking-[0.04em] text-muted hover:text-foreground transition-colors duration-300"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden sm:flex items-center gap-3">
          <Link
            href={LOGIN.href}
            className="link-line text-[0.8125rem] text-muted hover:text-foreground transition-colors duration-300"
          >
            {LOGIN.label}
          </Link>
          <QuizTrigger variant="primary" size="sm">
            {CTA.label}
          </QuizTrigger>
        </div>

        {/* mobile menu toggle */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line md:hidden cursor-pointer"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            stroke="currentColor"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
          >
            {menuOpen ? (
              <path d="M6 6l12 12M18 6L6 18" />
            ) : (
              <path d="M4 8h16M4 16h16" />
            )}
          </svg>
        </button>
      </div>

      {/* mobile nav panel */}
      <div
        className={`md:hidden overflow-hidden border-line transition-all duration-300 [transition-timing-function:var(--ease-spring)] ${
          menuOpen ? "max-h-96 border-t" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col px-5 py-3">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="border-b border-line py-3 text-[0.8125rem] tracking-[0.04em] text-muted last:border-b-0"
            >
              {item.label}
            </a>
          ))}
          <Link
            href={LOGIN.href}
            onClick={() => setMenuOpen(false)}
            className="py-3 text-[0.8125rem] tracking-[0.04em] text-muted"
          >
            {LOGIN.label}
          </Link>
          <div onClick={() => setMenuOpen(false)}>
            <QuizTrigger variant="primary" size="sm" className="my-3 w-full">
              {CTA.label}
            </QuizTrigger>
          </div>
        </nav>
      </div>
    </header>
  );
}
