/**
 * Writes wordpress/mu-plugins/tca-seed.json from the code fixtures, so the
 * local WordPress (see docs/HEADLESS_WP.md) starts with the same content the
 * site ships with. Run: npm run wp:seed
 */
import { writeFileSync } from "node:fs";
import { CASE_STUDIES, TESTIMONIALS } from "../src/lib/fixtures.ts";
import { FAQS } from "../src/lib/faqs.ts";

const seed = {
  case_study: CASE_STUDIES,
  faq: FAQS,
  testimonial: TESTIMONIALS,
};

const out = new URL("../wordpress/mu-plugins/tca-seed.json", import.meta.url);
writeFileSync(out, JSON.stringify(seed, null, 2) + "\n");
console.log(
  `Seed written: ${seed.case_study.length} case studies, ${seed.faq.length} FAQs, ${seed.testimonial.length} testimonials`
);
