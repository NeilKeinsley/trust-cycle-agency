"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Logo } from "./logo";
import { QuizTrigger } from "./lead-quiz";
import { NAV, LOGIN, CTA } from "@/lib/site";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
    toggleRef.current?.focus();
  }

  // Opening moves focus to the panel's first link; Escape closes and
  // returns focus to the toggle that opened it.
  useEffect(() => {
    if (!menuOpen) return;
    const first = panelRef.current?.querySelector<HTMLElement>("a, button");
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeMenu();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

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
              className="link-line inline-block -my-[6px] py-[6px] text-[0.8125rem] tracking-[0.04em] text-muted hover:text-foreground transition-colors duration-300"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right cluster: theme toggle (all sizes), log in + CTA (sm+), menu
            button (below md), grouped so justify-between keeps three slots. */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden sm:flex items-center gap-3">
            <Link
              href={LOGIN.href}
              className="link-line inline-block -my-[6px] py-[6px] text-[0.8125rem] text-muted hover:text-foreground transition-colors duration-300"
            >
              {LOGIN.label}
            </Link>
            <QuizTrigger variant="primary" size="sm">
              {CTA.label}
            </QuizTrigger>
          </div>

          {/* mobile menu toggle */}
          <button
            ref={toggleRef}
            type="button"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav-panel"
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
      </div>

      {/* mobile nav panel: inert (not focusable, hidden from assistive tech)
          whenever it's closed, regardless of the collapse transition. */}
      <div
        id="mobile-nav-panel"
        ref={panelRef}
        inert={!menuOpen}
        className={`md:hidden overflow-hidden border-line transition-all duration-300 [transition-timing-function:var(--ease-spring)] ${
          menuOpen ? "max-h-96 border-t" : "max-h-0"
        }`}
      >
        <nav className="flex flex-col px-5 py-3">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={closeMenu}
              className="flex min-h-11 items-center border-b border-line text-[0.8125rem] tracking-[0.04em] text-muted last:border-b-0"
            >
              {item.label}
            </a>
          ))}
          <Link
            href={LOGIN.href}
            onClick={closeMenu}
            className="flex min-h-11 items-center text-[0.8125rem] tracking-[0.04em] text-muted"
          >
            {LOGIN.label}
          </Link>
          <div onClick={closeMenu}>
            <QuizTrigger variant="primary" size="sm" className="my-3 w-full">
              {CTA.label}
            </QuizTrigger>
          </div>
        </nav>
      </div>
    </header>
  );
}
