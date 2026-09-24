import Link from "next/link";
import { CLIENTS, type ClientMark } from "@/lib/fixtures";

/* Small, distinct geometric logomarks per fictional client, drawn from
   tokens only (currentColor / the accent token) — no stock logos exist in
   this project. */
function Mark({ mark }: { mark: ClientMark }) {
  const props = {
    viewBox: "0 0 32 32",
    "aria-hidden": true as const,
    className: "h-5 w-5 shrink-0 text-accent",
  };
  switch (mark) {
    case "circle":
      return (
        <svg {...props}>
          <circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" strokeWidth="2.5" />
        </svg>
      );
    case "triangle":
      return (
        <svg {...props}>
          <path d="M16 5 27 26H5Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      );
    case "bars":
      return (
        <svg {...props}>
          <rect x="5" y="16" width="5" height="11" fill="currentColor" />
          <rect x="13.5" y="9" width="5" height="18" fill="currentColor" opacity="0.7" />
          <rect x="22" y="4" width="5" height="23" fill="currentColor" opacity="0.4" />
        </svg>
      );
    case "diamond":
      return (
        <svg {...props}>
          <path d="M16 4 28 16 16 28 4 16Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      );
    case "hex":
      return (
        <svg {...props}>
          <path d="M16 4 27 10.5V21.5L16 28 5 21.5V10.5Z" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinejoin="round" />
        </svg>
      );
    case "wave":
      return (
        <svg {...props}>
          <path
            d="M4 20c3 0 3-8 6-8s3 8 6 8 3-8 6-8 3 8 6 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

/* The ticker track. Ported from the Fine Lines product-ticker pattern: it
   renders twice for a seamless loop, the duplicate copy is
   aria-hidden/untabbable, and it is a CONTENT rail (client name + the
   service we did), not decorative text. Cells link to #work for mouse users
   but stay out of the tab order: a moving strip can carry a focused cell
   out of view, and "See our work" in the hero reaches the same place. */
function HeroTickerRow() {
  return (
    <div className="tc-ticker-viewport">
      <div className="tc-ticker flex w-max">
        {[0, 1].map((dup) => (
          <ul key={dup} aria-hidden={dup === 1} aria-label={dup === 0 ? "Clients" : undefined} className="flex shrink-0 items-stretch">
            {CLIENTS.map((client) => (
              <li key={`${dup}-${client.name}`} className="border-r border-on-dark-muted/15">
                <Link
                  href="#work"
                  tabIndex={-1}
                  className="group flex h-14 items-center gap-2.5 px-5 transition-colors duration-300 hover:bg-on-dark/5"
                >
                  <Mark mark={client.mark} />
                  <span className="flex flex-col text-left leading-tight whitespace-nowrap">
                    <span className="text-sm font-medium text-on-dark">{client.name}</span>
                    <span className="mt-0.5 font-mono text-[0.75rem] tracking-[0.12em] text-on-dark-muted uppercase">
                      {client.service}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  );
}

/* One row, integrated into the bottom of the hero (see AGENTS.md — the
   client rail is the one sanctioned marquee: real content, pauses on
   hover/focus, reduced-motion swipe fallback via .tc-ticker in
   globals.css). "Trusted by growing teams" sits inline at the left on lg
   instead of as its own centered line above the rail. */
export function HeroRail() {
  return (
    <div className="border-t border-on-dark-muted/15">
      <div className="flex items-center">
        <p className="hidden shrink-0 whitespace-nowrap border-r border-on-dark-muted/15 px-5 font-mono text-[0.75rem] tracking-[0.12em] text-on-dark-muted uppercase lg:block">
          Trusted by growing teams
        </p>
        <div className="min-w-0 flex-1 [mask-image:linear-gradient(to_right,transparent,black_3rem,black_calc(100%-3rem),transparent)]">
          <HeroTickerRow />
        </div>
      </div>
    </div>
  );
}
