import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/*
 * PREVIEW gate: while true, every crawler is blocked, so an accidental early
 * deploy can never index a half-finished portfolio piece. Launched (false) on
 * 2026-09-26 on the Railway domain; SITE_URL follows a custom domain once
 * NEXT_PUBLIC_SITE_URL is set.
 */
const PREVIEW = false;

export default function robots(): MetadataRoute.Robots {
  // SITE_STAGING=1 marks a test copy of the site (e.g. the headless-CMS
  // staging service), which must never compete with the real one in search.
  if (PREVIEW || process.env.SITE_STAGING === "1") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    // /manage is the signed-in content editor: nothing there for a crawler.
    rules: { userAgent: "*", allow: "/", disallow: "/manage" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
