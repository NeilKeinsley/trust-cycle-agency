import { revalidateTag } from "next/cache";
import { CMS_TAG } from "@/lib/cms";
import { secretMatches } from "@/lib/webhook-auth";

/**
 * Called by WordPress whenever content is saved, trashed or deleted
 * (wordpress/mu-plugins/tca-headless.php), so an edit shows on the site
 * without a redeploy:
 *
 *   curl -X POST https://<site>/api/revalidate -H "x-webhook-secret: <secret>"
 *
 * { expire: 0 } because the call comes from a webhook, where updateTag is not
 * available: the next visit re-reads WordPress instead of serving the old page.
 */
export async function POST(request: Request) {
  if (!secretMatches(request.headers.get("x-webhook-secret"), process.env.WP_SHARED_SECRET)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  revalidateTag(CMS_TAG, { expire: 0 });
  return Response.json({ ok: true, revalidated: CMS_TAG });
}
