import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getBlogPosts, getCaseStudies } from "@/lib/cms";

/* Indexable static routes only (/login is a noindexed UI stub). No
   changefreq/priority: Google ignores both. No lastmod: Google only uses it
   when it is verifiably accurate, and static pages have no real per-page
   update timestamp to report. Blog posts are the exception: each carries the
   time it was last edited. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [studies, posts] = await Promise.all([getCaseStudies(), getBlogPosts()]);
  const routes = [
    "",
    "/about",
    "/work",
    ...studies.map((c) => `/work/${c.slug}`),
    "/blog",
    "/faq",
    "/contact",
    "/start",
  ];

  return [
    ...routes.map((route) => ({ url: `${SITE_URL}${route}` })),
    ...posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.modified,
    })),
  ];
}
