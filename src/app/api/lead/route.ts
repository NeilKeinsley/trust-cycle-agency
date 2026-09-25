import { after } from "next/server";
import { leadSchema } from "@/lib/intake";
import { drainOutbox, dropQueued, forwardLead, queueLead } from "@/lib/lead-outbox";
import { RateLimiter, clientKey } from "@/lib/rate-limit";

/**
 * Lead intake endpoint for both the LeadQuiz modal (source: "quiz") and the
 * /start brief (source: "brief"). Leads are forwarded to n8n (see
 * docs/N8N_SETUP.md). If n8n can't take one, it goes to the durable outbox
 * (src/lib/lead-outbox.ts) and is replayed later, so the visitor always gets
 * a success response and no lead is dropped.
 */

/** Bare domains ("example.com") get https:// so the sheet always holds a working link. */
function normaliseWebsite(value: string | undefined): string | undefined {
  const v = value?.trim();
  if (!v) return v;
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

const rateLimiter = new RateLimiter(5, 60_000, "lead");

export async function POST(request: Request) {
  const key = clientKey(request);
  const { allowed, retryAfterSeconds } = await rateLimiter.check(key);
  if (!allowed) {
    return Response.json(
      { ok: false, error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { ok: false, error: "Invalid JSON body." },
      { status: 400 }
    );
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { ok: false, error: "Invalid submission.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { company_website: honeypot, submissionId, elapsedMs, ...fields } = parsed.data;
  const restored = fields.source === "brief" ? fields.restored : undefined;
  if ("restored" in fields) delete (fields as { restored?: boolean }).restored;

  // Bot filled the hidden field. Report success so it doesn't learn anything, drop silently.
  if (honeypot) {
    return Response.json({ ok: true });
  }

  // Time trap: paired with the honeypot, catches bots that submit near-instantly.
  // A restored /start draft can legitimately submit fast, so it's exempt.
  const skipTimeTrap = fields.source === "brief" && restored === true;
  if (!skipTimeTrap && typeof elapsedMs === "number" && elapsedMs < 1500) {
    console.info("[lead] dropped: too fast", { source: parsed.data.source, elapsedMs });
    return Response.json({ ok: true });
  }

  /**
   * Contract forwarded to n8n:
   * { id, receivedAt, source, services, budget, timeline, name, email,
   *   company?, phone?, website?, goals?, consent?, continuesQuiz?,
   *   userAgent, referrer, elapsedMs }
   * The honeypot field is never forwarded.
   */
  const payload = {
    id: submissionId ?? crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    ...fields,
    ...(fields.source === "brief" ? { website: normaliseWebsite(fields.website) } : {}),
    email: fields.email.trim().toLowerCase(),
    userAgent: request.headers.get("user-agent") ?? "",
    referrer: request.headers.get("referer") ?? "",
    elapsedMs,
  };

  if (!process.env.N8N_WEBHOOK_URL) {
    console.info("[lead] no N8N_WEBHOOK_URL configured, logging payload:", payload);
    return Response.json({ ok: true, forwarded: false });
  }

  const result = await forwardLead(payload);
  if (result.ok) {
    // n8n is reachable: drop any stale queued copy of this lead, then send
    // anything else that queued up while it wasn't.
    after(async () => {
      await dropQueued(payload.id);
      await drainOutbox();
    });
    return Response.json({ ok: true, forwarded: true });
  }

  const reason = result.status ? `webhook responded ${result.status}` : "webhook unreachable";
  const queued = await queueLead(payload, reason);
  if (!queued) {
    // No outbox configured: the Railway log is the only copy.
    console.error(`[lead] ${reason}, not queued, logging payload:`, payload);
  } else {
    console.warn(`[lead] ${reason}, queued for replay`, { id: payload.id });
  }
  return Response.json({ ok: true, forwarded: false, queued });
}
