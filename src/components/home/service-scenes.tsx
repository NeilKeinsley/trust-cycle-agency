/* Large, detailed "product shot" scenes for the pinned Services stage.
   CSS/SVG only, no images. Every scene fills its wrapper (h-full w-full)
   and is built from percentage, vw/vh and clamp() sizing so it holds its
   composition from a 1920x1000 desktop stage down to a 768x900 tablet one.
   Content is biased toward the right two-thirds of the box so the text
   overlay panel (rendered by the caller on the left third) stays legible.
   Colors come only from design tokens (see AGENTS.md). Idle motion uses
   Tailwind's built-in animate-pulse (blinking cursors) or a CSS transition
   on strokeDashoffset keyed off the `active` prop (chart lines drawing once
   when a scene becomes active); both are switched off under
   `motion-reduce:`.
   Layout: card positions span 3% to 97% of the scene area, which sits
   beside the text column (the stage offsets it at md+). */

export type ServiceSceneKind = "brand" | "website" | "marketing" | "seo";

const CARD =
  "absolute rounded-[clamp(10px,1.2vw,20px)] border border-on-dark-muted/20 bg-on-dark/[0.04]";

function BrandScene() {
  const swatches: { name: string; bg: string; text: string }[] = [
    { name: "accent", bg: "var(--color-accent)", text: "var(--color-accent-foreground)" },
    { name: "accent-soft", bg: "var(--color-accent-soft)", text: "var(--color-surface-dark)" },
    { name: "on-dark", bg: "var(--color-on-dark)", text: "var(--color-surface-dark)" },
    { name: "on-dark-muted", bg: "var(--color-on-dark-muted)", text: "var(--color-surface-dark)" },
    { name: "card", bg: "var(--color-card)", text: "var(--color-surface-dark)" },
  ];

  return (
    <div className="relative h-full w-full">
      {/* Logomark card */}
      <div
        className={`${CARD} flex items-center justify-center`}
        style={{ top: "8%", left: "3%", width: "43%", height: "36%" }}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-[58%] w-[58%]">
          <rect width="32" height="32" rx="7" fill="var(--color-on-dark)" />
          <g fill="none" stroke="var(--color-surface-dark)" strokeWidth="2.5" strokeLinecap="square">
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
          <circle
            cx="27.5"
            cy="6.5"
            r="1.6"
            fill="var(--color-accent)"
            className="motion-safe:animate-pulse motion-reduce:animate-none"
          />
        </svg>
      </div>

      {/* Type specimen card */}
      <div
        className={`${CARD} flex flex-col justify-center gap-[6%] px-[7%]`}
        style={{ top: "8%", left: "50.8%", width: "46.2%", height: "36%" }}
      >
        <span
          className="font-medium leading-none text-on-dark"
          style={{ fontSize: "clamp(2rem,5.2vw,4.2rem)" }}
        >
          Aa
        </span>
        <span className="text-[0.625rem] uppercase tracking-[0.16em] text-on-dark-muted">
          Geist Sans / Geist Mono
        </span>
        <span className="text-on-dark/80" style={{ fontSize: "clamp(0.65rem,1vw,0.9rem)" }}>
          Trust, built one detail at a time.
        </span>
      </div>

      {/* Palette row */}
      <div
        className={`${CARD} flex gap-[clamp(6px,0.8vw,12px)] p-[clamp(6px,0.8vw,12px)]`}
        style={{ top: "47%", left: "3%", width: "94%", height: "16%" }}
      >
        {swatches.map((s) => (
          <div
            key={s.name}
            className="flex min-w-0 flex-1 flex-col justify-end overflow-hidden rounded-[clamp(8px,1vw,14px)] p-[clamp(6px,0.7vw,10px)]"
            style={{ background: s.bg }}
          >
            <span
              className="text-[0.5rem] uppercase tracking-[0.08em] sm:text-[0.5625rem]"
              style={{ color: s.text }}
            >
              {s.name}
            </span>
          </div>
        ))}
      </div>

      {/* Business card, slightly rotated */}
      <div
        className="absolute flex flex-col justify-between rounded-[10px] border border-on-dark-muted/25 bg-on-dark p-[5%] shadow-[0_16px_32px_-18px_var(--line-strong)]"
        style={{ top: "67%", left: "15.7%", width: "52.6%", height: "22%", transform: "rotate(-6deg)" }}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true" className="h-[24%] w-[24%]">
          <rect width="32" height="32" rx="7" fill="var(--color-surface-dark)" />
          <path
            d="M18.9 12.3a4.8 4.8 0 1 0 0 7.8"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
        <div className="space-y-[6%]">
          <div className="h-[10%] w-2/3 rounded-full bg-surface-dark/70" />
          <div className="h-[8%] w-1/2 rounded-full bg-surface-dark/30" />
        </div>
      </div>
    </div>
  );
}

function WebsiteScene() {
  return (
    <div className="relative h-full w-full">
      {/* Browser window, ~70% of the stage */}
      <div
        className={`${CARD} flex flex-col overflow-hidden`}
        style={{ top: "9%", left: "3%", width: "89.2%", height: "78%" }}
      >
        <div className="flex shrink-0 items-center gap-[3%] border-b border-on-dark-muted/15 px-[3%] py-[2.4%]">
          <div className="flex gap-[1.6%]">
            <span className="h-[7px] w-[7px] rounded-full bg-on-dark-muted/40" />
            <span className="h-[7px] w-[7px] rounded-full bg-on-dark-muted/40" />
            <span className="h-[7px] w-[7px] rounded-full bg-on-dark-muted/40" />
          </div>
          <div className="flex h-[1.6em] flex-1 items-center rounded-full bg-on-dark-muted/10 px-[2%]">
            <span className="text-[0.625rem] text-on-dark-muted/70">trustcycle.agency</span>
            <span className="ml-[2px] h-[1em] w-[1.5px] bg-accent motion-safe:animate-pulse motion-reduce:animate-none" />
          </div>
        </div>
        <div className="flex flex-1 flex-col gap-[3%] p-[4%]">
          <div className="flex items-center justify-between">
            <div className="h-[10%] w-[26%] rounded-full bg-on-dark-muted/20" />
            <div className="flex gap-[3%]">
              <div className="h-[8%] w-[10%] rounded-full bg-on-dark-muted/15" />
              <div className="h-[8%] w-[10%] rounded-full bg-on-dark-muted/15" />
              <div className="h-[8%] w-[14%] rounded-full bg-accent/70" />
            </div>
          </div>
          <div className="mt-[2%] flex flex-1 flex-col justify-center gap-[6%] rounded-[4%] bg-on-dark-muted/[0.08] p-[6%]">
            <div className="h-[14%] w-3/4 rounded-full bg-on-dark-muted/30" />
            <div className="h-[14%] w-1/2 rounded-full bg-on-dark-muted/30" />
            <div className="h-[9%] w-[30%] rounded-full bg-accent/80" />
          </div>
          <div className="grid flex-1 grid-cols-3 gap-[3%]">
            <div className="rounded-[8%] bg-on-dark-muted/10" />
            <div className="rounded-[8%] bg-on-dark-muted/10" />
            <div className="rounded-[8%] bg-accent/30" />
          </div>
        </div>
      </div>

      {/* Phone frame, overlapping the browser's bottom-right corner */}
      <div
        className="absolute overflow-hidden rounded-[clamp(18px,2.4vw,32px)] border-[3px] border-on-dark-muted/30 bg-surface-dark shadow-[0_16px_32px_-18px_var(--line-strong)]"
        style={{ top: "50%", left: "73.1%", width: "23.9%", height: "44%" }}
      >
        <div className="flex h-full flex-col gap-[8%] p-[8%]">
          <div className="h-[6%] w-1/3 rounded-full bg-on-dark-muted/25" />
          <div className="h-[16%] w-full rounded-[14%] bg-on-dark-muted/10" />
          <div className="h-[8%] w-2/3 rounded-full bg-on-dark-muted/25" />
          <div className="h-[8%] w-1/2 rounded-full bg-on-dark-muted/15" />
          <div className="mt-auto h-[10%] w-full rounded-full bg-accent/70" />
        </div>
      </div>
    </div>
  );
}

function TrendGlyph() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-[1em] w-[1em]">
      <path d="M8 3l5 5.5H9.5V13h-3V8.5H3z" fill="var(--color-accent)" />
    </svg>
  );
}

function MarketingScene({ active }: { active: boolean }) {
  const points = [
    [0, 62],
    [16, 48],
    [32, 55],
    [48, 32],
    [64, 40],
    [80, 18],
    [100, 24],
  ];
  const path = `M${points.map(([x, y]) => `${x},${y}`).join(" L")}`;
  const bars = [38, 58, 46, 72, 54, 86, 64];

  return (
    <div className="relative h-full w-full">
      {/* KPI cards */}
      {["Reach", "Engagement", "Conversions"].map((label, i) => (
        <div
          key={label}
          className={`${CARD} flex flex-col justify-between p-[5%]`}
          style={{ top: "8%", left: `${3 + i * 31.9}%`, width: "27.1%", height: "20%" }}
        >
          <span className="text-[0.625rem] uppercase tracking-[0.12em] text-on-dark-muted">{label}</span>
          <div className="flex items-end justify-between">
            <div className="h-[6px] w-[60%] overflow-hidden rounded-full bg-on-dark-muted/15">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${40 + i * 20}%` }}
              />
            </div>
            <span className="flex items-center gap-[2px] text-[0.6875rem] text-accent">
              <TrendGlyph />
            </span>
          </div>
        </div>
      ))}

      {/* Chart card */}
      <div
        className={`${CARD} p-[4%]`}
        style={{ top: "31%", left: "3%", width: "92.4%", height: "34%" }}
      >
        <svg viewBox="0 0 100 70" preserveAspectRatio="none" aria-hidden="true" className="h-full w-full">
          {[18, 35, 52].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="var(--color-on-dark-muted)" strokeOpacity="0.12" strokeWidth="0.5" />
          ))}
          {bars.map((h, i) => (
            <rect
              key={i}
              x={i * 14 + 2}
              y={66 - h * 0.55}
              width="8"
              height={h * 0.55}
              rx="1.5"
              fill="var(--color-on-dark-muted)"
              opacity="0.18"
            />
          ))}
          <path
            d={path}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: active ? 0 : 1,
              transition: "stroke-dashoffset 1.4s var(--ease-spring)",
            }}
            className="motion-reduce:transition-none"
          />
        </svg>
      </div>

      {/* Ad-creative cards */}
      {[0, 1].map((i) => (
        <div
          key={i}
          className={`${CARD} flex flex-col gap-[8%] p-[6%]`}
          style={{ top: "68%", left: `${3 + i * 47.8}%`, width: "43%", height: "20%" }}
        >
          <div className="h-[42%] w-full rounded-[10%]" style={{ background: i === 0 ? "var(--color-accent-soft)" : "var(--color-on-dark-muted)", opacity: i === 0 ? 1 : 0.2 }} />
          <div className="h-[10%] w-3/4 rounded-full bg-on-dark-muted/25" />
          <div className="h-[10%] w-1/2 rounded-full bg-on-dark-muted/15" />
        </div>
      ))}
    </div>
  );
}

function SeoScene({ active }: { active: boolean }) {
  const results = [
    { title: "trustcycleagency.com", highlighted: true },
    { title: "a competitor's result", highlighted: false },
    { title: "another listing", highlighted: false },
  ];
  const sparkPoints = [
    [0, 42],
    [20, 38],
    [40, 30],
    [60, 26],
    [80, 14],
    [100, 8],
  ];
  const sparkPath = `M${sparkPoints.map(([x, y]) => `${x},${y}`).join(" L")}`;

  return (
    <div className="relative h-full w-full">
      {/* Search bar */}
      <div
        className={`${CARD} flex items-center gap-[3%] px-[4%]`}
        style={{ top: "8%", left: "3%", width: "92.4%", height: "10%" }}
      >
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-[40%] w-[5%] shrink-0 text-on-dark-muted">
          <circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
        <span className="text-[0.75rem] text-on-dark-muted/80">what your customers search for</span>
        <span className="h-[1em] w-[1.5px] bg-accent motion-safe:animate-pulse motion-reduce:animate-none" />
      </div>

      {/* Results list */}
      <div
        className={`${CARD} flex flex-col justify-center gap-[6%] px-[4%]`}
        style={{ top: "20%", left: "3%", width: "92.4%", height: "38%" }}
      >
        {results.map((r) => (
          <div
            key={r.title}
            className={`rounded-[10%] border px-[4%] py-[6%] ${
              r.highlighted ? "border-accent" : "border-transparent"
            }`}
          >
            <div
              className="h-[7px] rounded-full"
              style={{
                width: r.highlighted ? "42%" : "34%",
                background: r.highlighted ? "var(--color-accent)" : "var(--color-on-dark-muted)",
                opacity: r.highlighted ? 0.9 : 0.4,
              }}
            />
            <div className="mt-[8%] h-[5px] w-1/4 rounded-full bg-on-dark-muted/20" />
            <div className="mt-[6%] h-[5px] w-4/5 rounded-full bg-on-dark-muted/10" />
          </div>
        ))}
      </div>

      {/* Ranking-trend sparkline card */}
      <div
        className={`${CARD} flex flex-col gap-[6%] p-[6%]`}
        style={{ top: "60%", left: "3%", width: "43%", height: "26%" }}
      >
        <span className="text-[0.625rem] uppercase tracking-[0.12em] text-on-dark-muted">Ranking trend</span>
        <svg viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true" className="h-full w-full">
          <path
            d={sparkPath}
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            style={{
              strokeDasharray: 1,
              strokeDashoffset: active ? 0 : 1,
              transition: "stroke-dashoffset 1.2s var(--ease-spring) 0.1s",
            }}
            className="motion-reduce:transition-none"
          />
        </svg>
      </div>

      {/* Article-outline card */}
      <div
        className={`${CARD} flex flex-col gap-[8%] p-[6%]`}
        style={{ top: "60%", left: "52.4%", width: "43%", height: "26%" }}
      >
        <div className="h-[10%] w-3/4 rounded-full bg-on-dark-muted/30" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-[6%]">
            <span className="h-[4px] w-[4px] shrink-0 rounded-full bg-accent" />
            <div className="h-[5px] flex-1 rounded-full bg-on-dark-muted/15" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ServiceScene({
  kind,
  active = true,
}: {
  kind: ServiceSceneKind;
  active?: boolean;
}) {
  return (
    <div aria-hidden="true" className="relative h-full w-full overflow-hidden bg-surface-dark">
      {kind === "brand" && <BrandScene />}
      {kind === "website" && <WebsiteScene />}
      {kind === "marketing" && <MarketingScene active={active} />}
      {kind === "seo" && <SeoScene active={active} />}
    </div>
  );
}
