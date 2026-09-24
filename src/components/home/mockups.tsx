/* Abstract CSS/SVG "product" mockups. No stock photography exists in this
   project, so every visual here is built from tokens, divs and inline SVG.
   Each mockup fills its wrapper (h-full w-full) so callers control size,
   from a small work-card thumbnail up to the full sticky services panel. */

function Dots() {
  return (
    <div className="flex gap-1.5">
      <span className="h-2 w-2 rounded-full bg-on-dark-muted/40" />
      <span className="h-2 w-2 rounded-full bg-on-dark-muted/40" />
      <span className="h-2 w-2 rounded-full bg-on-dark-muted/40" />
    </div>
  );
}

export function BrowserMockup() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-[var(--radius-card)] border border-on-dark-muted/20 bg-surface-dark">
      <div className="flex shrink-0 items-center gap-2 border-b border-on-dark-muted/15 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3">
        <Dots />
        <div className="h-3.5 flex-1 rounded-full bg-on-dark-muted/10 sm:h-5" />
      </div>
      {/* Proportional flex rows (not fixed px heights) so the mockup always
          fits its wrapper, from a small work-card thumbnail to a full
          panel, with nothing clipped at any viewport. */}
      <div className="flex min-h-0 flex-1 flex-col gap-1.5 p-3 sm:gap-3 sm:p-5">
        <div className="min-h-0 flex-[6] rounded-[calc(var(--radius-card)/2)] bg-on-dark-muted/10" />
        <div className="min-h-[3px] flex-[1] w-2/3 rounded-full bg-on-dark-muted/25" />
        <div className="min-h-[3px] flex-[1] w-1/2 rounded-full bg-on-dark-muted/15" />
        <div className="grid min-h-0 flex-[2.5] grid-cols-3 gap-2">
          <div className="min-h-0 rounded-[calc(var(--radius-card)/3)] bg-on-dark-muted/10" />
          <div className="min-h-0 rounded-[calc(var(--radius-card)/3)] bg-on-dark-muted/10" />
          <div className="min-h-0 rounded-[calc(var(--radius-card)/3)] bg-accent/40" />
        </div>
      </div>
    </div>
  );
}

export function LogoSheetMockup() {
  return (
    <div className="grid h-full w-full min-h-0 grid-cols-3 grid-rows-3 gap-1.5 rounded-[var(--radius-card)] border border-on-dark-muted/20 bg-surface-dark p-2.5 sm:gap-2 sm:p-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <div
          key={i}
          className="flex min-h-0 items-center justify-center rounded-[calc(var(--radius-card)/3)] bg-on-dark-muted/10"
        >
          <svg viewBox="0 0 32 32" aria-hidden="true" className="h-4 w-4 sm:h-6 sm:w-6">
            <circle
              cx="16"
              cy="16"
              r="10"
              fill="none"
              stroke={i === 4 ? "var(--color-accent)" : "var(--color-on-dark-muted)"}
              strokeWidth="2.5"
              strokeDasharray={i % 3 === 0 ? "0" : "10 6"}
              opacity={i === 4 ? 1 : 0.5}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}

export function CampaignMockup() {
  const bars = [40, 65, 50, 80, 60, 95, 70];
  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-2 rounded-[var(--radius-card)] border border-on-dark-muted/20 bg-surface-dark p-3 sm:gap-4 sm:p-5">
      <div className="flex shrink-0 items-center justify-between">
        <div className="h-2.5 w-24 rounded-full bg-on-dark-muted/25 sm:h-3" />
        <div className="h-5 w-16 rounded-full bg-accent/30 sm:h-6" />
      </div>
      <div className="flex min-h-0 flex-1 items-end gap-2">
        {bars.map((h, i) => (
          <div
            key={i}
            className="w-full min-h-0 flex-1 rounded-t-[6px]"
            style={{
              height: `${h}%`,
              background:
                i === 5 ? "var(--color-accent)" : "var(--color-on-dark-muted)",
              opacity: i === 5 ? 0.9 : 0.2,
            }}
          />
        ))}
      </div>
      <div className="flex shrink-0 gap-2">
        <div className="h-2.5 w-1/3 rounded-full bg-on-dark-muted/15 sm:h-3" />
        <div className="h-2.5 w-1/4 rounded-full bg-on-dark-muted/15 sm:h-3" />
      </div>
    </div>
  );
}

export function SearchResultMockup() {
  return (
    <div className="flex h-full w-full min-h-0 flex-col gap-2 rounded-[var(--radius-card)] border border-on-dark-muted/20 bg-surface-dark p-3 sm:gap-4 sm:p-5">
      <div className="flex shrink-0 items-center gap-2 rounded-full border border-on-dark-muted/20 px-3 py-2">
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-on-dark-muted">
          <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <div className="h-2.5 w-1/2 rounded-full bg-on-dark-muted/25" />
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-2 overflow-hidden sm:gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-1.5">
            <div
              className="h-2.5 w-2/5 rounded-full"
              style={{
                background: i === 0 ? "var(--color-accent)" : "var(--color-on-dark-muted)",
                opacity: i === 0 ? 0.9 : 0.4,
              }}
            />
            <div className="h-2 w-1/4 rounded-full bg-on-dark-muted/15" />
            <div className="h-2 w-4/5 rounded-full bg-on-dark-muted/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function Mockup({ kind }: { kind: import("@/lib/fixtures").MockupKind }) {
  switch (kind) {
    case "browser":
      return <BrowserMockup />;
    case "logo":
      return <LogoSheetMockup />;
    case "campaign":
      return <CampaignMockup />;
    case "search":
      return <SearchResultMockup />;
  }
}
