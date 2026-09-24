import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/* Static routes for v1. Inert until the site is hosted on the real domain
   (see src/lib/site.ts) and robots.ts's PREVIEW flag is flipped off. */
export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ["", "/about", "/faq", "/contact", "/login", "/start"];

  return routes.map((route) => ({
    url: `${SITE_URL}${route}`,
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1 : 0.6,
  }));
}
