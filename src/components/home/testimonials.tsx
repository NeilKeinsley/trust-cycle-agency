import { Panel, SectionHead } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { TESTIMONIALS, initials } from "@/lib/fixtures";

export function Testimonials() {
  const [feature, ...rest] = TESTIMONIALS;

  return (
    <Panel tone="light">
      <Reveal>
        <SectionHead
          eyebrow="Client voices"
          title="What it is like to work with us."
          lead="A few words from the clients we have worked with recently."
        />
      </Reveal>

      <div className="grid gap-6 lg:grid-cols-3 lg:grid-rows-2">
        {feature && (
          <Reveal delay={140} className="lg:col-span-2 lg:row-span-2">
            <figure className="flex h-full min-h-[22rem] flex-col justify-between rounded-[var(--radius-card)] border border-line bg-card p-8 lg:p-14">
              <span aria-hidden="true" className="font-mono text-5xl leading-none text-accent/30 lg:text-6xl">
                &ldquo;
              </span>
              <blockquote className="mt-4 flex-1 text-2xl leading-relaxed text-foreground/90 sm:text-3xl lg:text-4xl">
                {feature.quote}
              </blockquote>
              <figcaption className="mt-10 flex items-center gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-lg text-accent">
                  {initials(feature.name)}
                </span>
                <span className="text-sm">
                  <span className="block text-lg text-foreground">{feature.name}</span>
                  <span className="block text-muted">
                    {feature.role}, {feature.company}
                  </span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        )}

        {rest.map((t, i) => (
          <Reveal key={t.name} delay={220 + i * 100}>
            <figure className="flex h-full min-h-[10rem] flex-col rounded-[var(--radius-card)] border border-line bg-card p-7 lg:p-8">
              <blockquote className="flex-1 text-base leading-relaxed text-foreground/85">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm text-accent">
                  {initials(t.name)}
                </span>
                <span className="text-sm">
                  <span className="block text-foreground">{t.name}</span>
                  <span className="block text-muted">
                    {t.role}, {t.company}
                  </span>
                </span>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </Panel>
  );
}
