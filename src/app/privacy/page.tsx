import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { pageMetadata } from "@/lib/seo";
import { Section } from "@/components/section";
import { Reveal } from "@/components/reveal";
import { SITE_NAME } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "Privacy",
  description: `What ${SITE_NAME} collects when you send a brief or book a call, where it goes, and how to have it removed.`,
  path: "/privacy",
});

/* Keep this page true to what the code does: the intake (src/app/api/lead),
   the n8n workflows (n8n/), the Calendly embed and browser storage. Update it
   in the same commit as any change to where lead data goes. */
const SECTIONS: { title: string; body: ReactNode }[] = [
  {
    title: "Who we are",
    body: (
      <p>
        {SITE_NAME} is a portfolio project built and run by Neil, a web and
        automation developer. The agency itself is not a registered business,
        but the forms on this site work, and anything you send through them
        reaches Neil.
      </p>
    ),
  },
  {
    title: "What we collect",
    body: (
      <>
        <p>
          Only what you type into the project quiz or the{" "}
          <Link href="/start" className="link-line text-foreground">
            project brief
          </Link>
          : your name, email address, an optional phone number, company and
          website if you add them, your answers about the project, and your
          contact consent.
        </p>
        <p>
          If you book a call, Calendly receives the name and email you book
          with, and the booking time.
        </p>
      </>
    ),
  },
  {
    title: "Where it goes",
    body: (
      <>
        <p>
          A submission is checked by this site&apos;s server, then passed to a
          private automation service (n8n), which:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>adds it to a private Google Sheet, the main record of leads;</li>
          <li>creates a contact and a deal in a HubSpot CRM account;</li>
          <li>sends a short notice to private Slack and Discord channels;</li>
          <li>prepares a reply as a draft in Neil&apos;s Gmail, which Neil reads and sends himself.</li>
        </ul>
        <p>
          Bookings are read from Calendly and added to the same HubSpot record.
          Nothing is sold, shared for advertising, or sent to anyone else.
        </p>
      </>
    ),
  },
  {
    title: "Cookies and browser storage",
    body: (
      <p>
        This site has no analytics, tracking pixels or advertising cookies. It
        stores two things in your own browser: your light or dark theme
        choice, and, for the length of your visit, the quiz answers you carry
        over into the full brief. The Calendly scheduler sets its own cookies
        only after you choose to open it.
      </p>
    ),
  },
  {
    title: "How long we keep it",
    body: (
      <p>
        Lead details are kept while they are useful for following up on your
        project, and removed on request.
      </p>
    ),
  },
  {
    title: "Your choices",
    body: (
      <p>
        Every email we send has an unsubscribe option, and you can reply STOP
        to any text. To see, correct or delete what we hold about you, reply to
        any email you received from us and say so. It will be removed from
        every place listed above.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <Section className="pt-16 lg:pt-20">
      <Reveal immediate>
        <h1 className="max-w-2xl text-[length:var(--fs-h2)] leading-[1.02]">
          Privacy
        </h1>
        <p className="mt-4 text-sm text-muted">Last updated 19 October 2026</p>
      </Reveal>

      <div className="mt-12 grid max-w-2xl gap-10">
        {SECTIONS.map((s) => (
          <Reveal key={s.title}>
            <section>
              <h2 className="text-xl">{s.title}</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted">
                {s.body}
              </div>
            </section>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
