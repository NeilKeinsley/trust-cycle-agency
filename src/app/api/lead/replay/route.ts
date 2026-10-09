import { drainOutbox } from "@/lib/lead-outbox";
import { secretMatches, tooManyAttempts } from "@/lib/webhook-auth";

/**
 * Replays leads queued in the outbox while n8n was unreachable.
 * Protected by the same shared secret the site sends to n8n:
 *
 *   curl -X POST https://<site>/api/lead/replay -H "x-webhook-secret: <secret>"
 *
 * The outbox also drains on its own after the next successful lead, so this
 * is for replaying right away (for example, after fixing n8n).
 */
export async function POST(request: Request) {
  const limited = await tooManyAttempts(request);
  if (limited) return limited;
  if (!secretMatches(request.headers.get("x-webhook-secret"), process.env.N8N_WEBHOOK_SECRET)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const result = await drainOutbox();
  return Response.json({ ok: true, ...result });
}
