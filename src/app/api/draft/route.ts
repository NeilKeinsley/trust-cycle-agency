import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { secretMatches } from "@/lib/webhook-auth";

/**
 * WordPress's Preview button opens /api/draft?secret=...&slug=/work/<slug>.
 * A valid secret turns on Draft Mode for this browser, so pages read drafts
 * straight from WordPress instead of the published cache. GET because the CMS
 * opens it as a link; leaving is a POST (./exit).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "";

  // Same-site paths only, so the link can't be used as an open redirect.
  const safePath = /^\/(?!\/)[a-z0-9\-/]*$/i.test(slug);
  if (!secretMatches(searchParams.get("secret"), process.env.WP_SHARED_SECRET) || !safePath) {
    return new Response("Invalid preview link", { status: 401 });
  }

  (await draftMode()).enable();
  redirect(slug);
}
