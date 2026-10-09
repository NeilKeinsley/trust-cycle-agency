import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { previewTokenValid, tooManyAttempts } from "@/lib/webhook-auth";

/**
 * WordPress's Preview button opens /api/draft?token=...&slug=/work/<slug>.
 * A valid token turns on Draft Mode for this browser, so pages read drafts
 * straight from WordPress instead of the published cache. The token is signed
 * for that one path and expires within the hour (src/lib/webhook-auth.ts), so
 * the shared secret itself never appears in a link. GET because the CMS opens
 * it as a link; leaving is a POST (./exit).
 */
export async function GET(request: Request) {
  const limited = await tooManyAttempts(request);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "";

  // Same-site paths only, so the link can't be used as an open redirect.
  const safePath = /^\/(?!\/)[a-z0-9\-/]*$/i.test(slug);
  if (!safePath || !previewTokenValid(searchParams.get("token"), slug, process.env.WP_SHARED_SECRET)) {
    return new Response("Invalid or expired preview link", { status: 401 });
  }

  (await draftMode()).enable();
  redirect(slug);
}
