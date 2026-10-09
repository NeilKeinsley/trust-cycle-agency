/**
 * Sliding-window rate limiter.
 *
 * Default store: in-memory, correct for one long-lived Node process (the
 * current Railway shape). Counts reset on each deploy and aren't shared
 * between replicas.
 *
 * Shared store: set RATE_LIMIT_REDIS_REST_URL and RATE_LIMIT_REDIS_REST_TOKEN
 * (any Redis that speaks the Upstash REST protocol) and every instance shares
 * one window per key. If Redis errors or times out, the limiter falls back to
 * the in-memory store for that request instead of blocking real visitors.
 */

type Result = { allowed: boolean; retryAfterSeconds: number };

export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly name = "rl"
  ) {}

  async check(key: string): Promise<Result> {
    const url = process.env.RATE_LIMIT_REDIS_REST_URL;
    const token = process.env.RATE_LIMIT_REDIS_REST_TOKEN;
    if (url && token) {
      try {
        return await this.checkRedis(url.replace(/\/+$/, ""), token, key);
      } catch (err) {
        console.warn("[rate-limit] shared store unavailable, using in-memory", err);
      }
    }
    return this.checkMemory(key);
  }

  /**
   * Sorted set per key: members are request timestamps. One MULTI/EXEC drops
   * expired entries, records this request, counts the window and refreshes the
   * TTL atomically, so concurrent requests across instances can't both slip in.
   */
  private async checkRedis(url: string, token: string, key: string): Promise<Result> {
    const now = Date.now();
    const redisKey = `${this.name}:${key}`;
    const member = `${now}-${Math.random().toString(36).slice(2, 10)}`;
    const res = await fetch(`${url}/multi-exec`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["ZREMRANGEBYSCORE", redisKey, "0", String(now - this.windowMs)],
        ["ZADD", redisKey, String(now), member],
        ["ZCARD", redisKey],
        ["ZRANGE", redisKey, "0", "0", "WITHSCORES"],
        ["PEXPIRE", redisKey, String(this.windowMs)],
      ]),
      signal: AbortSignal.timeout(1500),
    });
    if (!res.ok) throw new Error(`redis ${res.status}`);
    const replies = (await res.json()) as { result?: unknown; error?: string }[];
    const failed = replies.find((r) => r.error);
    if (failed) throw new Error(failed.error);

    const count = Number(replies[2].result);
    if (count <= this.limit) return { allowed: true, retryAfterSeconds: 0 };

    // Over the limit: don't let a rejected request extend the window.
    await fetch(`${url}/zrem/${encodeURIComponent(redisKey)}/${encodeURIComponent(member)}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(1500),
    }).catch(() => {});
    const oldest = Number((replies[3].result as string[])[1] ?? now);
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000)) };
  }

  private checkMemory(key: string): Result {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    const timestamps = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    if (timestamps.length >= this.limit) {
      this.hits.set(key, timestamps);
      const retryAfterSeconds = Math.ceil((timestamps[0] + this.windowMs - now) / 1000);
      return { allowed: false, retryAfterSeconds };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);
    this.pruneIfLarge(cutoff);
    return { allowed: true, retryAfterSeconds: 0 };
  }

  /** Keeps the map bounded — dead keys are dropped once it grows past 10k. */
  private pruneIfLarge(cutoff: number): void {
    if (this.hits.size <= 10_000) return;
    for (const [key, timestamps] of this.hits) {
      const live = timestamps.filter((t) => t > cutoff);
      if (live.length === 0) this.hits.delete(key);
      else this.hits.set(key, live);
    }
  }
}

/**
 * The client address, read from x-forwarded-for.
 *
 * Default: the first entry. Railway's edge replaces any client-supplied value
 * with the real client IP (verified 2026-09-26 and 2026-10-09: forged headers
 * shared one bucket), so it can't be used to dodge the limit there.
 *
 * On a host whose proxy APPENDS to the header instead, the first entry is
 * whatever the client typed. Set TRUSTED_PROXY_HOPS to the number of proxies
 * in front of the app (1 for one appending proxy, 2 with a CDN before it) and
 * the address is counted from the right, where a client cannot write.
 *
 * With no proxy at all (a local `next start`) the header is the client's own,
 * so the limit can be dodged there. That is not a production shape, and
 * `sec-probe` reports it when pointed at localhost.
 */
export function clientKey(request: Request): string {
  const hops = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((hop) => hop.trim())
    .filter(Boolean);
  const trusted = Number(process.env.TRUSTED_PROXY_HOPS) || 0;
  const hop = trusted > 0 ? hops[Math.max(0, hops.length - trusted)] : hops[0];
  return hop ?? "unknown";
}
