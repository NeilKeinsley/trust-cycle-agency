import { CONTACT, SITE_URL } from "@/lib/site";

/**
 * /.well-known/security.txt (RFC 9116): where to report a vulnerability.
 * Contact is the contact form, the one channel on this site that reaches a
 * person. Expires is required and must stay in the future, so the file is
 * regenerated daily with a date six months out.
 */
export const revalidate = 86400;

export function GET() {
  const expires = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString();
  const body = [
    `Contact: ${SITE_URL}${CONTACT.href}`,
    `Expires: ${expires}`,
    "Preferred-Languages: en",
    `Canonical: ${SITE_URL}/.well-known/security.txt`,
    "",
  ].join("\n");
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
