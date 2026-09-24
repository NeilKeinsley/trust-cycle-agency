/**
 * Site-wide identity constants. SITE_URL is a placeholder until the real
 * domain exists — it feeds metadataBase, canonical URLs, sitemap, and JSON-LD
 * so everything flips together at launch by editing this one file.
 */
export const SITE_NAME = "Trust Cycle Agency";
export const SITE_SHORT = "TCA";
export const SITE_URL = "https://trustcycle.agency";
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
