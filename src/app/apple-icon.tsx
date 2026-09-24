import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/* Same TCA stroke geometry as icon.svg, drawn as inline SVG so the home-screen
   icon matches the favicon exactly. Full-bleed square: iOS applies its own
   corner mask, so no border radius here. */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#14181a",
        }}
      >
        <svg width="150" height="150" viewBox="0 0 32 32">
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
      </div>
    ),
    size
  );
}
