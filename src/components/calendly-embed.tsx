"use client";

/**
 * Inline Calendly scheduler without widget.js (see src/lib/calendly.ts).
 * Mirrors what widget.js did for an inline embed as of 2026-09: the iframe
 * URL carries embed_domain/embed_type, prefill goes in by postMessage
 * (`calendly.prefill`) after load, and the page posts
 * `calendly.event_scheduled` back to us. Height is fixed like widget.js's
 * default (its auto-resize is opt-in, and the `calendly.page_height` values
 * Calendly sent in testing were 26px and 2px). Prefill is not a documented
 * contract: if Calendly drops it, the visitor types their name and email and
 * booking still works. Only mount this after the visitor asks to book, so
 * nobody who doesn't loads anything from Calendly.
 */
import { useEffect, useRef, useState } from "react";
import { CALENDLY_ORIGIN, calendlyEmbedUrl, type BookingSource } from "@/lib/calendly";

type Tone = "dark" | "light";

type CalendlyMessage = { event?: unknown };

function prefillPayload(name: string, email: string) {
  const trimmed = name.trim();
  const [firstName, ...rest] = trimmed.split(/\s+/);
  const payload: Record<string, string> = {};
  if (trimmed) payload.name = trimmed;
  if (firstName) payload.firstName = firstName;
  if (rest.length) payload.lastName = rest.join(" ");
  if (email.trim()) payload.email = email.trim();
  return payload;
}

export function CalendlyEmbed({
  bookingUrl,
  source,
  name,
  email,
  tone,
  onScheduled,
}: {
  bookingUrl: string;
  source: BookingSource;
  name: string;
  email: string;
  tone: Tone;
  onScheduled: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const scheduledRef = useRef(false);
  const onScheduledRef = useRef(onScheduled);
  const [src] = useState(() => calendlyEmbedUrl(bookingUrl, source));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    onScheduledRef.current = onScheduled;
  }, [onScheduled]);

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.origin !== CALENDLY_ORIGIN) return;
      if (e.source !== iframeRef.current?.contentWindow) return;
      const data = e.data as CalendlyMessage | null;
      if (!data || typeof data.event !== "string") return;

      if (data.event === "calendly.event_scheduled" && !scheduledRef.current) {
        scheduledRef.current = true;
        onScheduledRef.current();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Same timing as widget.js: right after load, next tick, and 250ms later,
  // in case the page's listener attaches a moment after the load event.
  function handleLoad() {
    setLoaded(true);
    const payload = prefillPayload(name, email);
    if (Object.keys(payload).length === 0) return;
    const send = () =>
      iframeRef.current?.contentWindow?.postMessage(
        { event: "calendly.prefill", payload },
        CALENDLY_ORIGIN
      );
    send();
    setTimeout(send, 0);
    setTimeout(send, 250);
  }

  const frame =
    tone === "dark" ? "border-on-dark-muted/25 bg-on-dark/[0.04]" : "border-line bg-card";
  const muted = tone === "dark" ? "text-on-dark-muted" : "text-muted";
  const link = tone === "dark" ? "text-on-dark" : "text-foreground";

  return (
    <div>
      <div
        className={`relative h-[700px] overflow-hidden rounded-[var(--radius-card)] border ${frame}`}
        aria-busy={!loaded}
      >
        {!loaded && (
          <p className={`absolute inset-x-0 top-10 text-center text-sm ${muted}`}>
            Loading the scheduler…
          </p>
        )}
        <iframe
          ref={iframeRef}
          src={src}
          title="Book a call: Calendly scheduler"
          onLoad={handleLoad}
          className="relative block h-full w-full border-0"
        />
      </div>
      <p className={`mt-3 text-xs ${muted}`}>
        Scheduling by Calendly, which receives the name and email you book with.{" "}
        <a
          href="https://calendly.com/legal/privacy-notice"
          target="_blank"
          rel="noopener noreferrer"
          className={`link-line ${link}`}
        >
          Calendly privacy notice
        </a>
      </p>
    </div>
  );
}
