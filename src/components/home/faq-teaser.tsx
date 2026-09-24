import { Panel } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/button";
import { Faq } from "@/components/faq";
import { FAQS } from "@/lib/faqs";

/* Locked "base" panel: pins under the header (md+, >=700px tall) while
   ClosingCta slides up over it — see page.tsx and globals.css
   (.tc-lock-base) for the mechanism. */
export function FaqTeaser() {
  return (
    <Panel id="faq" tone="card" lock="base">
      <div className="grid items-stretch gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="flex flex-col justify-center">
          <Reveal>
            <h2 className="text-[length:var(--fs-h2)] leading-[1.02]">
              Common questions.
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted">
              A few of the things people ask before starting a project.
              Everything else lives on the full FAQ page.
            </p>
          </Reveal>
          <Reveal delay={140}>
            <ButtonLink href="/faq" variant="ghost" size="md" className="mt-6">
              All FAQs
            </ButtonLink>
          </Reveal>
        </div>

        <Reveal delay={120} className="flex flex-col justify-center">
          <Faq items={FAQS.slice(0, 6)} />
        </Reveal>
      </div>
    </Panel>
  );
}
