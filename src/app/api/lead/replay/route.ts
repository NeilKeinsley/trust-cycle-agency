import { timingSafeEqual } from "node:crypto";
import { drainOutbox } from "@/lib/lead-outbox";

/**
 * Replays leads queued in the outbox while n8n was unreachable.
 * Protected by the same shared secret the site sends to n8n:
 *
 *   curl -X POST https://<site>/api/lead/replay -H "x-webhook-secret: <secret>"
 *
 * The outbox also drains on its own after the next successful lead, so this
 * is for replaying right away (for example, after fixing n8n).
 */

function authorised(request: Request): boolean {
  const expected = process.env.N8N_WEBHOOK_SECRET;
  const given = request.headers.get("x-webhook-secret");
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  const result = await drainOutbox();
  return Response.json({ ok: true, ...result });
}
