import { leadSchema } from "@/lib/intake";
import { RateLimiter, clientKey } from "@/lib/rate-limit";

/**
 * Lead intake endpoint for both the LeadQuiz modal (source: "quiz") and the
 * /start brief (source: "brief"). n8n is phase 2 — see .env.example. Until
 * N8N_WEBHOOK_URL is configured (or if the call fails), the payload is just
 * logged so the demo keeps working without a live backend.
 */

const rateLimiter = new RateLimiter(5, 60_000);

export async function POST(request: Request) {
  const key = clientKey(request);
  const { allowed, retryAfterSeconds } = rateLimiter.check(key);
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
   *   company?, phone?, website?, goals?, consent?, userAgent, referrer,
   *   elapsedMs }
   * The honeypot field is never forwarded.
   */
  const payload = {
    id: submissionId ?? crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    ...fields,
    email: fields.email.trim().toLowerCase(),
    userAgent: request.headers.get("user-agent") ?? "",
    referrer: request.headers.get("referer") ?? "",
    elapsedMs,
  };

  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.info("[lead] no N8N_WEBHOOK_URL configured, logging payload:", payload);
    return Response.json({ ok: true, forwarded: false });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": payload.id,
        ...(process.env.N8N_WEBHOOK_SECRET
          ? { "x-webhook-secret": process.env.N8N_WEBHOOK_SECRET }
          : {}),
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      console.info("[lead] webhook responded with an error, logging payload:", payload);
      return Response.json({ ok: true, forwarded: false });
    }

    return Response.json({ ok: true, forwarded: true });
  } catch (err) {
    console.info("[lead] webhook call failed, logging payload:", payload, err);
    return Response.json({ ok: true, forwarded: false });
  }
}
