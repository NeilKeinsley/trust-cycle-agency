import type { NextConfig } from "next";

/* Security baseline.
   CSP without nonces: a nonce would force every page to render per request
   (node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md),
   and this site is fully static, self-hosts everything and renders no
   user-submitted content. So inline scripts (Next's hydration payload, the
   theme script in layout.tsx) stay allowed, while everything else is pinned
   to this origin: no foreign scripts, no data sent to other hosts, no plugins,
   no <base> hijack, forms post only here, no framing. The one exception is
   frame-src: the Calendly scheduler (src/lib/calendly.ts) is an iframe of
   calendly.com, embedded without widget.js so script-src stays 'self'.
   Dev adds eval and the HMR websocket. */
const isDev = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "frame-src 'self' https://calendly.com",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

/* Pictures uploaded in WordPress (blog posts, team photos; see src/lib/cms.ts)
   are fetched and resized by the image optimiser, then served from this
   origin at /_next/image. That is why img-src above stays 'self': the
   visitor's browser never talks to WordPress. The optimiser may read one
   folder only, the connected WordPress's uploads. Read at build time, like
   the rest of this file. */
const wordpress = process.env.WP_API_URL ? new URL(process.env.WP_API_URL) : null;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: wordpress
      ? [new URL(`${wordpress.origin}/wp-content/uploads/**`)]
      : [],
    // Only for the local WordPress (npm run wp), which lives on 127.0.0.1.
    dangerouslyAllowLocalIP: wordpress ? /^(localhost|127\.0\.0\.1)$/.test(wordpress.hostname) : false,
    // An upload never changes under the same address: WordPress gives a
    // replaced picture a new file name.
    minimumCacheTTL: 2678400,
    maximumResponseBody: 8_000_000,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
