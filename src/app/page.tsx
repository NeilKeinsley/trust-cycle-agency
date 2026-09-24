import { Hero } from "@/components/home/hero";
import { Process } from "@/components/home/process";
import { ServicesStory } from "@/components/home/services-story";
import { Work } from "@/components/home/work";
import { Engagements } from "@/components/home/engagements";
import { Team } from "@/components/home/team";
import { Testimonials } from "@/components/home/testimonials";
import { FaqTeaser } from "@/components/home/faq-teaser";
import { ClosingCta } from "@/components/home/closing-cta";
import { LockStack } from "@/components/lock-stack";

export default function Home() {
  return (
    <>
      {/* Full-bleed hero, its own client rail built in. Not part of the
          lock stack: it's plain document flow, and the first stacked card
          below slides up over it for free (sticky cards paint above
          non-positioned content regardless of z-index). */}
      <Hero />

      {/* Every panel from here through the closing CTA is a locked "card"
          in the stack: see LockStack and the "Lock stack" comment block in
          globals.css for the mechanism. */}
      <LockStack>
        <Process />
        <ServicesStory />
        <Work />
        <Engagements />
        <Team />
        <Testimonials />
        <FaqTeaser />
        <ClosingCta locked />
      </LockStack>
    </>
  );
}
