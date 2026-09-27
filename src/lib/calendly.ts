/**
 * Calendly booking after the lead quiz and the /start brief.
 *
 * Set NEXT_PUBLIC_CALENDLY_URL to the event's booking link, e.g.
 * https://calendly.com/<user>/30min. It is inlined at build time, so on
 * Railway a change needs a redeploy (changing a variable triggers one).
 * Unset or not a calendly.com link = the booking option doesn't render.
 *
 * The embed is a plain iframe, not Calendly's widget.js, so no third-party
 * script runs on this origin and the CSP only needs `frame-src` (see
 * next.config.ts). calendly-embed.tsx reproduces the two things widget.js
 * does for an inline embed: the embed query params below, and prefill by
 * postMessage so contact details never go in a URL.
 */
export const CALENDLY_ORIGIN = "https://calendly.com";

function resolveCalendlyUrl(): string | null {
  const raw = process.env.NEXT_PUBLIC_CALENDLY_URL?.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.origin !== CALENDLY_ORIGIN || url.pathname.length <= 1) return null;
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export const CALENDLY_URL = resolveCalendlyUrl();

/** Where the booking started; lands in Calendly's UTM tracking for the invitee. */
export type BookingSource = "quiz" | "brief";

export function calendlyEmbedUrl(bookingUrl: string, source: BookingSource): string {
  const url = new URL(bookingUrl);
  url.searchParams.set("embed_domain", window.location.host);
  url.searchParams.set("embed_type", "Inline");
  url.searchParams.set("utm_source", "website");
  url.searchParams.set("utm_medium", source);
  return url.toString();
}
