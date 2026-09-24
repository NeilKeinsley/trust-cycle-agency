import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/*
 * PREVIEW gate: while true, every crawler is blocked, so an accidental early
 * deploy can never index a half-finished portfolio piece. Flip to false only
 * with explicit go-ahead at launch.
 */
const PREVIEW = true;

export default function robots(): MetadataRoute.Robots {
  if (PREVIEW) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
