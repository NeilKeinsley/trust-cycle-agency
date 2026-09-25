import type { CSSProperties, ReactNode } from "react";

/*
  Studio stack: the hero's image. A pile of the work itself (a brand sheet,
  a campaign chart, a live website, a search result) with a fresh lead on top,
  drawn from tokens so it stays sharp at any size and follows the theme.

  Motion (see "Studio stack" in globals.css):
  - load: each card settles into the pile once (staggered entrance);
  - scroll: as the hero leaves the viewport, the pile pulls apart into an
    exploded view while the cycle ring behind it turns. Scroll-driven CSS
    only; without support, or under reduced motion, the pile simply rests.

  Every card is decorative scene art (aria-hidden). Client names are the
  site's placeholder clients; the lead card mirrors what the real pipeline
  records (services, budget, timeline, bucket) without claiming results.
*/

type Pose = {
  /** Resting place in the pile (percent of the stage). */
  box: { left: string; top: string; width: string; height: string };
  /** Resting offset + tilt. */
  x0: string; y0: string; r0: string;
  /** Exploded offset + tilt, reached as the hero scrolls away. */
  x1: string; y1: string; r1: string;
  delay: number;
};

const CARD =
  "absolute overflow-hidden rounded-[clamp(12px,1.3vw,22px)] border border-on-dark-muted/20 bg-surface-dark shadow-[inset_0_1px_0_color-mix(in_oklab,var(--color-on-dark)_8%,transparent)]";

function StackCard({ pose, children, className = "" }: { pose: Pose; children: ReactNode; className?: string }) {
  const style = {
    ...pose.box,
    "--x0": pose.x0,
    "--y0": pose.y0,
    "--r0": pose.r0,
    "--x1": pose.x1,
    "--y1": pose.y1,
    "--r1": pose.r1,
  } as CSSProperties;
  return (
    <div className="tc-stack-card absolute" style={style}>
      <div
        className="tc-stack-settle h-full w-full"
        style={{ animationDelay: `${pose.delay}ms` }}
      >
        <div className={`${CARD} inset-0 ${className}`}>{children}</div>
      </div>
    </div>
  );
}

/* Tiny building blocks, kept inline so the art reads as one drawing. */
const Bar = ({ w, tone = "muted" }: { w: string; tone?: "muted" | "soft" }) => (
  <span
    className={`block h-[0.45em] rounded-full ${tone === "muted" ? "bg-on-dark-muted/25" : "bg-on-dark-muted/15"}`}
    style={{ width: w }}
  />
);

function ChartCard() {
  const bars = [38, 52, 44, 63, 58, 84, 71];
  return (
    <div className="flex h-full flex-col p-[7%]">
      <div className="flex items-center justify-between">
        <span className="text-[clamp(0.55rem,0.75vw,0.75rem)] text-on-dark-muted">Campaign, weekly</span>
        <span className="h-[0.55em] w-[18%] rounded-full bg-accent/70" />
      </div>
      <div className="mt-[8%] flex flex-1 items-end gap-[5%] border-b border-on-dark-muted/15">
        {bars.map((h, i) => (
          <span
            key={i}
            className={`flex-1 rounded-t-[4px] ${i === 5 ? "bg-accent" : "bg-on-dark-muted/20"}`}
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

function BrandCard() {
  return (
    <div className="flex h-full flex-col justify-between p-[8%]">
      <div className="flex items-center gap-[7%]">
        {/* A placeholder client's mark: a ring and a signal dot. */}
        <svg viewBox="0 0 40 40" className="h-auto w-[26%]" aria-hidden="true">
          <circle cx="20" cy="20" r="15" fill="none" stroke="var(--color-on-dark)" strokeWidth="3.5" />
          <circle cx="30" cy="10" r="4.5" fill="var(--color-accent)" />
        </svg>
        <div className="min-w-0">
          <p className="text-[clamp(0.7rem,1vw,1rem)] leading-tight text-on-dark">Northwind</p>
          <p className="mt-[0.2em] text-[clamp(0.55rem,0.72vw,0.72rem)] text-on-dark-muted">Brand system</p>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-[clamp(1.6rem,3vw,3rem)] leading-none tracking-[-0.04em] text-on-dark">Aa</span>
        <div className="flex gap-[6%]" style={{ width: "46%" }}>
          {["var(--color-accent)", "var(--color-on-dark-accent)", "var(--color-on-dark)", "var(--color-on-dark-muted)"].map((c) => (
            <span key={c} className="aspect-square flex-1 rounded-full border border-on-dark-muted/20" style={{ background: c }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WebsiteCard() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-[3%] border-b border-on-dark-muted/15 px-[4%] py-[2.6%]">
        <span className="flex gap-[0.35em]">
          <span className="h-[0.45em] w-[0.45em] rounded-full bg-on-dark-muted/40" />
          <span className="h-[0.45em] w-[0.45em] rounded-full bg-on-dark-muted/40" />
          <span className="h-[0.45em] w-[0.45em] rounded-full bg-on-dark-muted/40" />
        </span>
        <span className="flex-1 truncate rounded-full bg-on-dark-muted/10 px-[3%] py-[0.3em] text-[clamp(0.55rem,0.72vw,0.72rem)] text-on-dark-muted">
          northwind.example
        </span>
      </div>
      <div className="flex flex-1 flex-col justify-between p-[6%]">
        <div>
          <p className="max-w-[80%] text-[clamp(0.85rem,1.45vw,1.45rem)] leading-[1.05] tracking-[-0.03em] text-on-dark">
            Distribution that shows up on time.
          </p>
          <div className="mt-[5%] space-y-[0.5em]">
            <Bar w="72%" />
            <Bar w="54%" tone="soft" />
          </div>
        </div>
        <div className="flex items-center gap-[4%]">
          <span className="rounded-full bg-accent px-[5%] py-[0.45em] text-[clamp(0.55rem,0.72vw,0.72rem)] text-accent-foreground">
            Get a quote
          </span>
          <span className="text-[clamp(0.55rem,0.72vw,0.72rem)] text-on-dark-muted">See services</span>
        </div>
      </div>
    </div>
  );
}

function SearchCard() {
  return (
    <div className="flex h-full flex-col gap-[7%] p-[7%]">
      <div className="flex items-center gap-[4%] rounded-full border border-on-dark-muted/20 px-[5%] py-[0.45em]">
        <svg viewBox="0 0 16 16" className="h-[0.85em] w-[0.85em] shrink-0 text-on-dark-muted" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <circle cx="7" cy="7" r="4.5" />
          <path d="m10.5 10.5 3 3" />
        </svg>
        <span className="truncate text-[clamp(0.55rem,0.75vw,0.75rem)] text-on-dark-muted">wholesale delivery near me</span>
      </div>
      <div>
        <p className="truncate text-[clamp(0.5rem,0.68vw,0.68rem)] text-on-dark-accent">northwind.example › services</p>
        <p className="mt-[0.3em] text-[clamp(0.65rem,0.95vw,0.95rem)] leading-tight text-on-dark">Next-day regional delivery</p>
        <div className="mt-[0.6em] space-y-[0.45em]">
          <Bar w="92%" tone="soft" />
          <Bar w="70%" tone="soft" />
        </div>
      </div>
    </div>
  );
}

function LeadCard() {
  return (
    <div className="flex h-full flex-col justify-between p-[7%]">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-[0.5em] text-[clamp(0.55rem,0.75vw,0.75rem)] text-on-dark-muted">
          <span className="h-[0.55em] w-[0.55em] rounded-full bg-accent" />
          New lead
        </span>
        <span className="text-[clamp(0.55rem,0.72vw,0.72rem)] text-on-dark-muted">just now</span>
      </div>
      <p className="text-[clamp(0.8rem,1.2vw,1.2rem)] leading-tight tracking-[-0.02em] text-on-dark">Alex M. · Northwind</p>
      <div className="flex flex-wrap gap-[0.35em]">
        {["Brand", "Website"].map((s) => (
          <span key={s} className="rounded-full border border-on-dark-muted/25 px-[0.7em] py-[0.2em] text-[clamp(0.55rem,0.72vw,0.72rem)] text-on-dark">
            {s}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between gap-[0.5em] border-t border-on-dark-muted/15 pt-[5%]">
        <span className="min-w-0 truncate text-[clamp(0.55rem,0.72vw,0.72rem)] text-on-dark-muted">$15k to $50k · 1 to 3 months</span>
        <span className="shrink-0 rounded-full bg-accent px-[0.7em] py-[0.2em] text-[clamp(0.55rem,0.72vw,0.72rem)] text-accent-foreground">Qualified</span>
      </div>
    </div>
  );
}

/* Back to front. Exploded vectors point each card away from the pile's
   centre, so the pull-apart reads as one object opening up. */
const POSES: Record<"chart" | "brand" | "search" | "website" | "lead", Pose> = {
  chart: { box: { left: "46%", top: "2%", width: "52%", height: "36%" }, x0: "0%", y0: "0%", r0: "5deg", x1: "16%", y1: "-26%", r1: "9deg", delay: 120 },
  brand: { box: { left: "0%", top: "5%", width: "47%", height: "35%" }, x0: "0%", y0: "0%", r0: "-6deg", x1: "-18%", y1: "-20%", r1: "-10deg", delay: 180 },
  search: { box: { left: "52%", top: "61%", width: "47%", height: "29%" }, x0: "0%", y0: "0%", r0: "4deg", x1: "18%", y1: "24%", r1: "7deg", delay: 240 },
  website: { box: { left: "15%", top: "33%", width: "64%", height: "40%" }, x0: "0%", y0: "0%", r0: "-1.5deg", x1: "0%", y1: "-6%", r1: "0deg", delay: 300 },
  lead: { box: { left: "2%", top: "64%", width: "46%", height: "32%" }, x0: "0%", y0: "0%", r0: "-3deg", x1: "-14%", y1: "30%", r1: "-6deg", delay: 380 },
};

export function StudioStack({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`tc-stack relative z-[1] select-none ${className}`}>
      {/* The cycle ring (the brand motif) turns slowly as the pile opens. */}
      <svg viewBox="0 0 420 420" className="tc-stack-ring pointer-events-none absolute left-1/2 top-1/2 h-[118%] w-auto -translate-x-1/2 -translate-y-1/2">
        {[190, 150, 110].map((r, i) => (
          <circle
            key={r}
            cx="210"
            cy="210"
            r={r}
            fill="none"
            stroke={i === 1 ? "var(--color-accent)" : "var(--color-on-dark-muted)"}
            strokeOpacity={i === 1 ? 0.5 : 0.16}
            strokeWidth={i === 1 ? 1.5 : 1}
            strokeDasharray={i === 0 ? "1 10" : undefined}
            strokeLinecap="round"
          />
        ))}
        <circle cx="210" cy="60" r="4" fill="var(--color-accent)" />
      </svg>

      <StackCard pose={POSES.chart}>
        <ChartCard />
      </StackCard>
      <StackCard pose={POSES.brand}>
        <BrandCard />
      </StackCard>
      <StackCard pose={POSES.search}>
        <SearchCard />
      </StackCard>
      <StackCard pose={POSES.website}>
        <WebsiteCard />
      </StackCard>
      <StackCard pose={POSES.lead} className="border-accent/40">
        <LeadCard />
      </StackCard>
    </div>
  );
}
