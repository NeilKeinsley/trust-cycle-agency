import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site";

export const alt = `${SITE_NAME}: marketing that earns trust, then keeps it.`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* Shared social card for every route (Next.js applies a root opengraph-image
   to all segments below it). Colors are literal because ImageResponse can't
   read CSS custom properties; they mirror --surface-dark, --on-dark,
   --on-dark-muted and --accent-soft, like apple-icon.tsx does. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "#14181a",
          color: "#f4f2ec",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="64" height="64" viewBox="0 0 32 32">
            <g fill="none" stroke="#f4f2ec" strokeWidth="2.5" strokeLinecap="square">
              <path d="M3.4 10.6h7.2M7 10.6V22" />
              <path d="M20.8 22l3.8-11.4 3.8 11.4M22.3 18.2h4.6" />
            </g>
            <path
              d="M18.9 12.3a4.8 4.8 0 1 0 0 7.8"
              fill="none"
              stroke="#4f9d92"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
          <div style={{ fontSize: 34, letterSpacing: -0.5 }}>{SITE_NAME}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 84, lineHeight: 1.02, letterSpacing: -2.5, maxWidth: 980 }}>
            Marketing that earns trust, then keeps it.
          </div>
          <div style={{ fontSize: 30, color: "#a9b0ad" }}>Brand, web and growth under one team.</div>
        </div>
      </div>
    ),
    size
  );
}
