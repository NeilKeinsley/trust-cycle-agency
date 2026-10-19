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

const LEAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * `leadId` is the submission id of the quiz or brief this booking follows: a
 * random UUID, not contact data, so it may sit in the URL. Calendly stores it
 * on the booking as `tracking.utm_content`, and the n8n poller uses it to find
 * the right HubSpot deal (only if that deal belongs to the booking's email;
 * see docs/HUBSPOT_PLAN.md, build 3).
 */
export function calendlyEmbedUrl(bookingUrl: string, source: BookingSource, leadId?: string | null): string {
  const url = new URL(bookingUrl);
  url.searchParams.set("embed_domain", window.location.host);
  url.searchParams.set("embed_type", "Inline");
  url.searchParams.set("utm_source", "website");
  url.searchParams.set("utm_medium", source);
  if (leadId && LEAD_ID.test(leadId)) url.searchParams.set("utm_content", leadId.toLowerCase());
  return url.toString();
}
