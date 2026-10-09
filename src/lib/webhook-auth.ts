import { createHmac, timingSafeEqual } from "node:crypto";
import { RateLimiter, clientKey } from "./rate-limit";

/** Constant-time comparison of a caller-supplied secret with the expected one. */
export function secretMatches(given: string | null, expected: string | undefined): boolean {
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Preview links carry a signed, short-lived token instead of the shared
 * secret itself, because a link ends up in browser history and request logs:
 *
 *   <expires>.<hex HMAC-SHA256 of "preview:<path>:<expires>" keyed with the secret>
 *
 * `expires` is Unix seconds. The token opens one path until it expires and
 * cannot be turned back into the secret. WordPress makes it in
 * wordpress/mu-plugins/tca-headless.php (tca_preview_token).
 */
const PREVIEW_MAX_AGE_SECONDS = 24 * 60 * 60;

export function previewTokenValid(
  token: string | null,
  path: string,
  secret: string | undefined,
  now = Date.now()
): boolean {
  if (!token || !secret) return false;
  const [expires, signature, ...rest] = token.split(".");
  if (rest.length > 0 || !/^\d{10}$/.test(expires ?? "") || !/^[0-9a-f]{64}$/.test(signature ?? "")) {
    return false;
  }
  const secondsLeft = Number(expires) - Math.floor(now / 1000);
  // A far-future expiry is refused too: WordPress only issues short ones.
  if (secondsLeft <= 0 || secondsLeft > PREVIEW_MAX_AGE_SECONDS) return false;
  const expected = createHmac("sha256", secret).update(`preview:${path}:${expires}`).digest("hex");
  return secretMatches(signature, expected);
}

/* The secrets are long and random, so guessing is not practical. This cap
   keeps a guessing attempt from becoming free load on the server all the same. */
const attempts = new RateLimiter(30, 60_000, "auth");

/** A 429 response when this client is hammering the secret-protected routes, else null. */
export async function tooManyAttempts(request: Request): Promise<Response | null> {
  const { allowed, retryAfterSeconds } = await attempts.check(clientKey(request));
  if (allowed) return null;
  return Response.json(
    { ok: false },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}
