/**
 * Serialises structured data for a <script type="application/ld+json"> tag.
 *
 * JSON.stringify leaves "<" as it is, so a "</script>" inside any string (a
 * title typed in WordPress, say) would close the tag and run whatever follows
 * as script. Writing "<" as its JSON escape keeps the value identical for
 * JSON parsers and inert for the HTML parser
 * (node_modules/next/dist/docs/01-app/02-guides/json-ld.md).
 *
 * The replacement must be the six characters backslash-u-0-0-3-c. With a
 * single backslash in this source it is just "<" again and the function does
 * nothing: security/README.md has the test that proves it works.
 */
const ESCAPED_LESS_THAN = "\\u003c";

export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, ESCAPED_LESS_THAN);
}
