/**
 * Sliding-window rate limiter, in-memory. Correct for the current deployment
 * shape (one long-lived Node process); if the service ever scales to
 * multiple instances, swap the Map for Redis behind this same interface.
 */
export class RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  check(key: string): { allowed: boolean; retryAfterSeconds: number } {
    const now = Date.now();
    const cutoff = now - this.windowMs;

    const timestamps = (this.hits.get(key) ?? []).filter((t) => t > cutoff);
    if (timestamps.length >= this.limit) {
      this.hits.set(key, timestamps);
      const retryAfterSeconds = Math.ceil(
        (timestamps[0] + this.windowMs - now) / 1000
      );
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

/** First hop of x-forwarded-for (reverse proxies set it), else a shared bucket. */
export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || "unknown";
}
