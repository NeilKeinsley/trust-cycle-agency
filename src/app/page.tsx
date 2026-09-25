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
import { pageMetadata } from "@/lib/seo";
import { SITE_DESCRIPTION, SITE_NAME, SITE_SHORT, SITE_URL } from "@/lib/site";

export const metadata = pageMetadata({ description: SITE_DESCRIPTION, path: "/" });

/* WebSite node: Google reads the site name shown in results from this, and
   only from the home page. Linked to the layout's Organization by @id. */
const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: SITE_SHORT,
  url: SITE_URL,
  publisher: { "@id": `${SITE_URL}/#organization` },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
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
