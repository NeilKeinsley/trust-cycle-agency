import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { getCaseStudies } from "@/lib/cms";

/* Indexable static routes only (/login is a noindexed UI stub). No
   changefreq/priority: Google ignores both. No lastmod: Google only uses it
   when it is verifiably accurate, and static pages have no real per-page
   update timestamp to report. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const studies = await getCaseStudies();
  const routes = [
    "",
    "/about",
    "/work",
    ...studies.map((c) => `/work/${c.slug}`),
    "/faq",
    "/contact",
    "/start",
  ];

  return routes.map((route) => ({ url: `${SITE_URL}${route}` }));
}
