import { timingSafeEqual } from "node:crypto";

/** Constant-time comparison of a caller-supplied secret with the expected one. */
export function secretMatches(given: string | null, expected: string | undefined): boolean {
  if (!expected || !given) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
