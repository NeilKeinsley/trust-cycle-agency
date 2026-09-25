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
  if (PREVIEW) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
