import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import Link from "next/link";
import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { ButtonLink } from "@/components/button";
import { CONTACT_EMAIL } from "@/lib/site";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = pageMetadata({
  title: "Contact",
  description:
    "Get in touch with Trust Cycle Agency, or start a guided project brief.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <Section className="flex min-h-[90svh] flex-col justify-center pt-16 lg:pt-20">
      <Reveal immediate>
        <h1 className="max-w-2xl text-[length:var(--fs-h2)] leading-[1.02]">
          Let&apos;s talk about your project.
        </h1>
      </Reveal>

      <div className="mt-12 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <Reveal delay={120}>
          <ContactForm />
        </Reveal>

        <Reveal delay={180}>
          <div className="flex flex-col gap-6">
            <div className="rounded-[var(--radius-card)] border border-line bg-card p-7">
              <h2 className="text-xl">Prefer a guided brief?</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Answer a few questions about your project and budget, and
                we&apos;ll follow up with next steps instead of a generic
                reply.
              </p>
              <ButtonLink href="/start" variant="accent" size="md" className="mt-5">
                Start a project
              </ButtonLink>
            </div>

            <div className="rounded-[var(--radius-card)] border border-line bg-card p-7 text-sm text-muted">
              <p>
                Email us directly at{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="link-line text-foreground">
                  {CONTACT_EMAIL}
                </a>
              </p>
              <p className="mt-3">We reply within 1 business day.</p>
              <p className="mt-3">
                Existing client?{" "}
                <Link href="/login" className="link-line text-foreground">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
