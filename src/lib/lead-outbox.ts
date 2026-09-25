import { mkdir, readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Durable fallback for leads that could not be forwarded to n8n.
 *
 * When the webhook is down, misconfigured or slow, the lead is written to
 * LEAD_OUTBOX_DIR as one JSON file per submission id (so a retried submit
 * overwrites instead of duplicating). The outbox is drained after the next
 * successful forward and on demand via POST /api/lead/replay. n8n upserts on
 * `id`, so replaying a lead that did get through is harmless.
 *
 * LEAD_OUTBOX_DIR must point at persistent storage (a Railway volume). Without
 * it, failed leads are only logged, which is what the site did before.
 */

export type LeadPayload = { id: string } & Record<string, unknown>;

const FORWARD_TIMEOUT_MS = 5000;
const ID_PATTERN = /^[0-9a-f-]{36}$/i;

function outboxDir(): string | null {
  return process.env.LEAD_OUTBOX_DIR || null;
}

export async function forwardLead(payload: LeadPayload): Promise<{ ok: boolean; status?: number }> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) return { ok: false };
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
      signal: AbortSignal.timeout(FORWARD_TIMEOUT_MS),
    });
    return { ok: res.ok, status: res.status };
  } catch {
    return { ok: false };
  }
}

/** Store a lead for later replay. Returns false when no outbox is configured or the write fails. */
export async function queueLead(payload: LeadPayload, reason: string): Promise<boolean> {
  const dir = outboxDir();
  if (!dir || !ID_PATTERN.test(payload.id)) return false;
  try {
    await mkdir(dir, { recursive: true });
    const file = path.join(dir, `${payload.id}.json`);
    const tmp = `${file}.tmp`;
    const record = { payload, reason, queuedAt: new Date().toISOString() };
    // Write then rename so a crash mid-write never leaves a half-written lead.
    await writeFile(tmp, JSON.stringify(record), "utf8");
    await rename(tmp, file);
    return true;
  } catch (err) {
    console.error("[lead-outbox] could not queue lead", payload.id, err);
    return false;
  }
}

let draining: Promise<DrainResult> | null = null;

export type DrainResult = { found: number; sent: number; remaining: number };

/** Re-send every queued lead once. Concurrent calls share one run. */
export function drainOutbox(): Promise<DrainResult> {
  if (!draining) {
    draining = runDrain().finally(() => {
      draining = null;
    });
  }
  return draining;
}

async function runDrain(): Promise<DrainResult> {
  const dir = outboxDir();
  if (!dir) return { found: 0, sent: 0, remaining: 0 };

  let files: string[];
  try {
    files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  } catch {
    return { found: 0, sent: 0, remaining: 0 };
  }

  let sent = 0;
  for (const name of files) {
    const file = path.join(dir, name);
    try {
      const { payload } = JSON.parse(await readFile(file, "utf8")) as { payload: LeadPayload };
      const result = await forwardLead(payload);
      if (!result.ok) break; // n8n still unreachable: stop and keep the rest queued.
      await unlink(file);
      sent += 1;
    } catch (err) {
      console.error("[lead-outbox] could not replay", name, err);
    }
  }

  const remaining = files.length - sent;
  if (files.length > 0) {
    console.info("[lead-outbox] drain", { found: files.length, sent, remaining });
  }
  return { found: files.length, sent, remaining };
}
