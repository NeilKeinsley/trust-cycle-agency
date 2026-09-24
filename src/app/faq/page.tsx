import type { Metadata } from "next";
import { Section, Eyebrow } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { Faq } from "@/components/faq";
import { FAQS } from "@/lib/faqs";
import { ClosingCta } from "@/components/home/closing-cta";

export const metadata: Metadata = {
  title: "FAQs",
  description:
    "Answers to common questions about pricing, timelines, contracts, ownership and how to get started with Trust Cycle Agency.",
};

export default function FaqPage() {
  return (
    <>
      <Section className="pt-16 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:gap-20">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2.5rem)]">
            <Reveal immediate>
              <Eyebrow>FAQs</Eyebrow>
            </Reveal>
            <Reveal immediate delay={60}>
              <h1 className="mt-3 max-w-md text-[length:var(--fs-h2)] leading-[1.02]">
                Questions we hear a lot.
              </h1>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-6 max-w-sm text-lg text-muted">
                If something isn&apos;t covered here, reach out and
                we&apos;ll answer it directly.
              </p>
            </Reveal>
          </div>

          <Faq items={FAQS} />
        </div>
      </Section>

      <ClosingCta />
    </>
  );
}
