/**
 * Writes wordpress/mu-plugins/tca-seed.json from the code fixtures, so the
 * local WordPress (see docs/HEADLESS_WP.md) starts with the same content the
 * site ships with. Run: npm run wp:seed
 */
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { CASE_STUDIES, TEAM, TESTIMONIALS } from "../src/lib/fixtures.ts";
import { FAQS } from "../src/lib/faqs.ts";
import { BLOG_POSTS } from "../src/lib/blog-posts.ts";

const seed = {
  case_study: CASE_STUDIES,
  faq: FAQS,
  testimonial: TESTIMONIALS,
  team_member: TEAM,
  blog_post: BLOG_POSTS,
};

const out = new URL("../wordpress/mu-plugins/tca-seed.json", import.meta.url);
writeFileSync(out, JSON.stringify(seed, null, 2) + "\n");

/* The demo posts' pictures live in public/blog for the site's built-in
   content. WordPress gets its own copies to put in the media library. */
const pictures = new Set(
  BLOG_POSTS.flatMap((post) => [
    post.cover?.src,
    ...post.blocks.map((block) => (block.type === "image" ? block.image.src : undefined)),
  ]).filter(Boolean)
);
const media = new URL("../wordpress/mu-plugins/seed-media/", import.meta.url);
mkdirSync(media, { recursive: true });
for (const src of pictures) {
  copyFileSync(new URL(`../public${src}`, import.meta.url), new URL(src.split("/").pop(), media));
}

console.log(
  `Seed written: ${seed.case_study.length} case studies, ${seed.faq.length} FAQs, ${seed.testimonial.length} testimonials, ${seed.team_member.length} team members, ${seed.blog_post.length} blog posts (${pictures.size} pictures)`
);
