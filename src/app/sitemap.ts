import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* Indexable static routes only (/login is a noindexed UI stub). No
   changefreq/priority: Google ignores both. No lastmod: Google only uses it
   when it is verifiably accurate, and static pages have no real per-page
   update timestamp to report. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/about", "/faq", "/contact", "/start"];

  return routes.map((route) => ({ url: `${SITE_URL}${route}` }));
}
