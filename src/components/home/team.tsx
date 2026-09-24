import { Panel, SectionHead } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { TEAM, initials } from "@/lib/fixtures";

/* Tone progression (same idea as the Work section's "Process" tile): each
   card gets a different token-driven surface instead of one repeated
   pale-teal block, so the row reads as a set rather than four copies of the
   same card. Text colors are picked per tone to hold 4.5:1+ contrast —
   text-accent-foreground/85 is the muted ceiling on the accent card. */
const TONES = [
  {
    card: "border border-line bg-card",
    name: "text-foreground",
    sub: "text-muted",
    initials: "text-accent",
    divider: "border-line",
  },
  {
    card: "bg-accent-soft",
    name: "text-foreground",
    sub: "text-foreground/70",
    initials: "text-accent",
    divider: "border-accent/15",
  },
  {
    card: "bg-accent",
    name: "text-accent-foreground",
    sub: "text-accent-foreground/85",
    initials: "text-accent-foreground",
    divider: "border-accent-foreground/20",
  },
  {
    card: "bg-surface-dark",
    name: "text-on-dark",
    sub: "text-on-dark-muted",
    initials: "text-on-dark",
    divider: "border-on-dark-muted/20",
  },
] as const;

export function Team() {
  return (
    <Panel tone="card">
      <Reveal>
        <SectionHead
          title="One team, every channel."
          lead="The people who plan, design and build your project, from strategy through launch."
        />
      </Reveal>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {TEAM.map((member, i) => {
          const tone = TONES[i % TONES.length];
          return (
            <Reveal key={member.name} delay={120 + i * 90} className="h-full">
              <div
                className={`flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] ${tone.card}`}
              >
                {/* Portrait placeholder: large monogram until real headshots
                    exist. max-h caps the portrait so four cards never push
                    the row taller than a short viewport (e.g. 768px). */}
                <div className="flex aspect-[4/3] max-h-[180px] items-center justify-center sm:max-h-[220px] lg:aspect-[4/5] lg:max-h-[260px]">
                  <span
                    className={`text-[clamp(3rem,6vw,6.5rem)] font-medium tracking-tight ${tone.initials}`}
                  >
                    {initials(member.name)}
                  </span>
                </div>
                <div
                  className={`flex flex-1 flex-col justify-center border-t p-6 lg:p-7 ${tone.divider}`}
                >
                  <h3 className={`text-xl sm:text-2xl ${tone.name}`}>{member.name}</h3>
                  <p className={`mt-1 text-sm ${tone.sub}`}>{member.role}</p>
                  <p className={`mt-1 text-[0.8125rem] ${tone.sub}`}>{member.focus}</p>
                  {i === TEAM.length - 1 ? (
                    <p className={`mt-3 text-sm italic leading-snug ${tone.name}`}>
                      {member.currentFocus}
                    </p>
                  ) : (
                    <p className={`mt-3 text-[0.8125rem] ${tone.sub}`}>
                      <span className={tone.name}>Current focus:</span> {member.currentFocus}
                    </p>
                  )}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Panel>
  );
}
