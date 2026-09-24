/**
 * Site-wide identity constants. SITE_URL feeds metadataBase, canonical URLs,
 * the sitemap, robots and JSON-LD, so everything moves together.
 *
 * Resolution order:
 * 1. NEXT_PUBLIC_SITE_URL: set this when a custom domain is attached.
 * 2. RAILWAY_PUBLIC_DOMAIN: injected automatically by Railway at build time.
 * 3. localhost for local development.
 */
export const SITE_NAME = "Trust Cycle Agency";
export const SITE_SHORT = "TCA";

function resolveSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  const railway = process.env.RAILWAY_PUBLIC_DOMAIN;
  if (railway) return `https://${railway}`;
  return "http://localhost:3000";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_TAGLINE =
  "Brand, web and growth for teams that want a partner, not a vendor.";
export const SITE_DESCRIPTION =
  "Trust Cycle Agency is a full-service digital agency: brand, web and growth work for teams that want a partner, not a vendor.";

export const CONTACT_EMAIL = "hello@trustcycle.agency";

export const NAV = [
  { label: "Services", href: "/#services" },
  { label: "Work", href: "/#work" },
  { label: "About", href: "/about" },
  { label: "FAQs", href: "/faq" },
] as const;

export const LOGIN = { label: "Log in", href: "/login" } as const;
export const CTA = { label: "Start a project", href: "/start" } as const;
export const CONTACT = { label: "Contact", href: "/contact" } as const;
