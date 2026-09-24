import type { Metadata } from "next";
import { Section } from "@/components/section";
import { PageHero } from "@/components/page-hero";
import { QuizTrigger } from "@/components/lead-quiz";
import { ButtonLink } from "@/components/button";
import { Reveal } from "@/components/reveal";
import { Team } from "@/components/home/team";
import { ClosingCta } from "@/components/home/closing-cta";

export const metadata: Metadata = {
  title: "About",
  description:
    "Trust Cycle Agency is a full-service digital agency built to be a long-term partner, not a rotating vendor.",
};

const VALUES = [
  {
    title: "Plain language",
    body: "No jargon dressed up as strategy. If we can't explain why we're doing something, we don't do it.",
  },
  {
    title: "Earned, not assumed",
    body: "Trust is built one honest update at a time, which is why we would rather under-promise than overreach.",
  },
  {
    title: "One team",
    body: "Brand, web and growth people who sit in the same room, so your project never gets lost between vendors.",
  },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About"
        title="A full-service agency, built like a partner."
        lead="Trust Cycle Agency brings brand, web and growth work under one roof so clients get a consistent story across every channel, instead of stitching it together across separate vendors."
      >
        <QuizTrigger variant="on-dark">Start a project</QuizTrigger>
        <ButtonLink
          href="/#work"
          variant="ghost"
          className="border-on-dark-muted/30 text-on-dark hover:border-on-dark-muted/60"
        >
          See our work
        </ButtonLink>
      </PageHero>

      <Section>
        <div className="grid gap-6 sm:grid-cols-3">
          {VALUES.map((v, i) => (
            <Reveal key={v.title} delay={i * 100} className="h-full">
              <div className="h-full min-h-[200px] rounded-[var(--radius-card)] border border-line bg-card p-7">
                <h2 className="text-xl">{v.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-muted">
                  {v.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      <Team />
      <ClosingCta />
    </>
  );
}
