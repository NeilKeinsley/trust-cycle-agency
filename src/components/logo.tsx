/* TCA monogram (same geometry as src/app/icon.svg) plus the wordmark.
   Tile follows currentColor, letters use tokens, so it reads on light or
   dark surfaces without a separate variant. */
export function Logo({ className = "", onDark = false }: { className?: string; onDark?: boolean }) {
  // On dark surfaces the tile flips to off-white, so the letters need the dark ink.
  const ink = onDark ? "var(--color-surface-dark)" : "var(--color-background)";
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="h-7 w-7 shrink-0">
        <rect width="32" height="32" rx="7" fill="currentColor" />
        <g fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="square">
          <path d="M3.4 10.6h7.2M7 10.6V22" />
          <path d="M20.8 22l3.8-11.4 3.8 11.4M22.3 18.2h4.6" />
        </g>
        <path
          d="M18.9 12.3a4.8 4.8 0 1 0 0 7.8"
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      <span className="text-[1.0625rem] font-medium leading-none tracking-tight">
        Trust Cycle <span className={onDark ? "text-on-dark-muted" : "text-muted"}>Agency</span>
      </span>
    </span>
  );
}
