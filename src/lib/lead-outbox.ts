import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Durable fallback for leads that could not be forwarded to n8n.
 *
 * When the webhook is down, misconfigured or slow, the lead is written to
 * LEAD_OUTBOX_DIR as one JSON file per submission id (so a retried submit
 * overwrites instead of duplicating). The outbox is drained after the next
 * successful forward, by a background retry (startOutboxRetry) and on demand
 * via POST /api/lead/replay. n8n appends a sheet row for a new lead (only a
 * brief that continues a quiz updates its row), so a lead must never be sent
 * twice: a drain claims each file by renaming it first (see runDrain).
 *
 * LEAD_OUTBOX_DIR must point at persistent storage (a Railway volume). Without
 * it, failed leads are only logged, which is what the site did before.
 */

export type LeadPayload = { id: string } & Record<string, unknown>;

const FORWARD_TIMEOUT_MS = 5000;
const ID_PATTERN = /^[0-9a-f-]{36}$/i;
/** Caps disk use if n8n is down while the form is being flooded; overflow is only logged. */
const MAX_QUEUED = 500;

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
    const queued = (await readdir(dir)).filter((f) => f.endsWith(".json"));
    if (queued.length >= MAX_QUEUED && !queued.includes(`${payload.id}.json`)) {
      console.error(`[lead-outbox] outbox full (${MAX_QUEUED}), not queuing`, payload.id);
      return false;
    }
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

/**
 * Forget a queued copy of a lead that has since been delivered. Same id means
 * the same submission, or a brief that supersedes its quiz, so replaying the
 * older copy would only overwrite newer data.
 */
export async function dropQueued(id: string): Promise<void> {
  const dir = outboxDir();
  if (!dir || !ID_PATTERN.test(id)) return;
  const file = path.join(dir, `${id}.json`);
  await unlink(file).catch(() => {});
  await unlink(`${file}${CLAIM_SUFFIX}`).catch(() => {});
}

/** A file being sent is renamed to `<id>.json.sending`; rename is atomic, so only one drain gets it. */
const CLAIM_SUFFIX = ".sending";
/** A claim older than this is left over from a crash mid-send and goes back in the queue. */
const STALE_CLAIM_MS = 10 * 60_000;

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
    const names = await readdir(dir);
    await releaseStaleClaims(dir, names);
    files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  } catch {
    return { found: 0, sent: 0, remaining: 0 };
  }

  // The lead route and the background retry can each hold their own copy of
  // this module (instrumentation is bundled separately), so `draining` alone
  // doesn't stop two drains at once. Claiming by rename does: the second
  // rename fails and that drain skips the file.
  let sent = 0;
  for (const name of files) {
    const file = path.join(dir, name);
    const claimed = `${file}${CLAIM_SUFFIX}`;
    try {
      await rename(file, claimed);
    } catch {
      continue; // already taken by another drain, or dropped since the listing
    }
    try {
      const { payload } = JSON.parse(await readFile(claimed, "utf8")) as { payload: LeadPayload };
      const result = await forwardLead(payload);
      if (!result.ok) {
        await rename(claimed, file).catch(() => {});
        break; // n8n still unreachable: stop and keep the rest queued.
      }
      await unlink(claimed);
      sent += 1;
    } catch (err) {
      await rename(claimed, file).catch(() => {});
      console.error("[lead-outbox] could not replay", name, err);
    }
  }

  const remaining = files.length - sent;
  if (files.length > 0) {
    console.info("[lead-outbox] drain", { found: files.length, sent, remaining });
  }
  return { found: files.length, sent, remaining };
}

/** Put claims left by a crash mid-send back in the queue. */
async function releaseStaleClaims(dir: string, names: string[]): Promise<void> {
  for (const name of names.filter((n) => n.endsWith(`.json${CLAIM_SUFFIX}`))) {
    const claimed = path.join(dir, name);
    try {
      const { mtimeMs } = await stat(claimed);
      if (Date.now() - mtimeMs > STALE_CLAIM_MS) await rename(claimed, claimed.slice(0, -CLAIM_SUFFIX.length));
    } catch {
      // Gone already (sent or dropped): nothing to release.
    }
  }
}

/** LEAD_OUTBOX_RETRY_MS only exists to shorten the wait in local tests. */
const RETRY_BASE_MS = Number(process.env.LEAD_OUTBOX_RETRY_MS) || 2 * 60_000;
const RETRY_MAX_MS = 30 * 60_000;
let retryStarted = false;

/**
 * Background retry so queued leads reach n8n on their own once it is back
 * (for example after n8n was switched off to save cost), instead of waiting
 * for the next lead. An empty outbox costs one directory read per tick. While
 * n8n stays unreachable the wait doubles up to RETRY_MAX_MS, so a stopped n8n
 * gets at most one request every 30 minutes. Started once from
 * src/instrumentation.ts.
 */
export function startOutboxRetry(): void {
  if (retryStarted || !outboxDir()) return;
  retryStarted = true;
  let delay = RETRY_BASE_MS;
  const tick = async () => {
    try {
      const { remaining } = await drainOutbox();
      delay = remaining > 0 ? Math.min(delay * 2, RETRY_MAX_MS) : RETRY_BASE_MS;
    } catch (err) {
      console.error("[lead-outbox] retry failed", err);
    }
    setTimeout(tick, delay).unref();
  };
  setTimeout(tick, delay).unref();
}
