import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { Faq } from "@/components/faq";
import { FAQS } from "@/lib/faqs";
import { ClosingCta } from "@/components/home/closing-cta";

export const metadata: Metadata = pageMetadata({
  title: "FAQs",
  description:
    "Answers to common questions about pricing, timelines, contracts, ownership and how to get started with Trust Cycle Agency.",
  path: "/faq",
});

export default function FaqPage() {
  return (
    <>
      <Section className="pt-16 lg:pt-20">
        <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:items-start lg:gap-20">
          <div className="lg:sticky lg:top-[calc(var(--header-h)+2.5rem)]">
            <Reveal immediate>
              <h1 className="max-w-md text-[length:var(--fs-h2)] leading-[1.02]">
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

          <h2 className="sr-only">All questions</h2>
          <Faq items={FAQS} />
        </div>
      </Section>

      <ClosingCta />
    </>
  );
}
