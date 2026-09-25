import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { CASE_STUDIES } from "@/lib/fixtures";

/* Indexable static routes only (/login is a noindexed UI stub). No
   changefreq/priority: Google ignores both. No lastmod: Google only uses it
   when it is verifiably accurate, and static pages have no real per-page
   update timestamp to report. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    "",
    "/about",
    "/work",
    ...CASE_STUDIES.map((c) => `/work/${c.slug}`),
    "/faq",
    "/contact",
    "/start",
  ];

  return routes.map((route) => ({ url: `${SITE_URL}${route}` }));
}
