import { createHmac } from "node:crypto";
import { cookies } from "next/headers";
import { secretMatches } from "./webhook-auth";

/**
 * Server side of /manage, the site's own content editor (docs/HEADLESS_WP.md).
 *
 * Editors sign in with their WordPress username and password. WordPress checks
 * them (tca/v1/session); this app then keeps a signed, http-only cookie and
 * makes every later change through WordPress on that user's behalf, so
 * WordPress still decides what the account may do. Nothing is stored here.
 */

export type ManagedFaq = { id: number; q: string; a: string; status: string };
export type FaqBoard = { limits: { q: number; a: number }; items: ManagedFaq[] };
export type Session = { uid: number; name: string };

const COOKIE = "tca_manage";
const SESSION_HOURS = 8;

function secret(): string {
  return process.env.WP_SHARED_SECRET ?? "";
}

export function manageConfigured(): boolean {
  return Boolean(process.env.WP_API_URL && secret());
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export async function startSession(session: Session): Promise<void> {
  const payload = Buffer.from(
    JSON.stringify({ ...session, exp: Date.now() + SESSION_HOURS * 3_600_000 })
  ).toString("base64url");
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/manage",
    maxAge: SESSION_HOURS * 3600,
  });
}

export async function endSession(): Promise<void> {
  (await cookies()).set(COOKIE, "", { path: "/manage", maxAge: 0 });
}

export async function readSession(): Promise<Session | null> {
  const [payload, signature] = ((await cookies()).get(COOKIE)?.value ?? "").split(".");
  if (!payload || !signature || !secret() || !secretMatches(signature, sign(payload))) return null;
  try {
    const { uid, name, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof uid === "number" && typeof name === "string" && exp > Date.now()
      ? { uid, name }
      : null;
  } catch {
    return null;
  }
}

type WpResult = { status: number; data: unknown };

/** One call to the editing API in wordpress/mu-plugins/tca-editing.php. Status 0 = unreachable. */
export async function wordpress(
  path: string,
  init: { method?: "GET" | "POST" | "DELETE"; body?: unknown; uid?: number } = {}
): Promise<WpResult> {
  try {
    const response = await fetch(`${process.env.WP_API_URL?.replace(/\/+$/, "")}/tca/v1${path}`, {
      method: init.method ?? "GET",
      cache: "no-store",
      headers: {
        "content-type": "application/json",
        "x-webhook-secret": secret(),
        ...(init.uid ? { "x-tca-user": String(init.uid) } : {}),
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      signal: AbortSignal.timeout(8000),
    });
    return { status: response.status, data: await response.json().catch(() => null) };
  } catch {
    return { status: 0, data: null };
  }
}
