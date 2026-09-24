"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/* Fixed round back-to-top button. Appears once the visitor has scrolled
   past about one viewport, scrolls smoothly to the top (instant under
   reduced motion) and moves focus to <main> so keyboard/screen-reader
   users land back at the start of the content, not the top of a stale
   scroll position. Raised clear of the /start mobile summary bar and the
   lead-quiz modal by lifting its bottom offset on /start. */
export function BackToTop() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > window.innerHeight * 0.9);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleClick() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });

    const focusMain = () => {
      const target =
        (document.getElementById("main") as HTMLElement | null) ??
        (document.querySelector("main") as HTMLElement | null);
      target?.focus();
    };

    if (reduced) {
      focusMain();
    } else {
      // Let the smooth scroll get underway before stealing focus, so the
      // browser doesn't jump-cut the scroll animation.
      window.setTimeout(focusMain, 400);
    }
  }

  const isStart = pathname?.startsWith("/start");

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Back to top"
      tabIndex={visible ? 0 : -1}
      className={`tc-back-to-top fixed right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-surface-dark text-on-dark shadow-lg transition-all duration-300 [transition-timing-function:var(--ease-spring)] sm:right-6 ${
        isStart ? "bottom-24 sm:bottom-28" : "bottom-6"
      } ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    </button>
  );
}
