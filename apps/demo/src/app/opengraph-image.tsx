import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "svg-scroll-draw — Scroll-driven SVG path animation";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#f5f0e8",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* decorative circle */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 600,
            height: 600,
            borderRadius: "50%",
            border: "1.5px solid #d4cfc5",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 40,
            right: 40,
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#ff6b9d",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: "1.5px solid #d4cfc5",
            opacity: 0.5,
          }}
        />

        {/* badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            border: "1px solid #ccc",
            borderRadius: 999,
            padding: "6px 16px",
            fontSize: 14,
            color: "#888",
            marginBottom: 40,
            background: "rgba(245,240,232,0.8)",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          Open source · MIT · Zero dependencies
        </div>

        {/* headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: 80,
            fontWeight: 900,
            lineHeight: 0.9,
            letterSpacing: "-0.04em",
            color: "#111",
            marginBottom: 32,
          }}
        >
          <span>ANIMATE SVG</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span>PATHS AS YOU</span>
            <span
              style={{
                background: "#ff6b9d",
                borderRadius: 12,
                padding: "0 12px",
                display: "flex",
                alignItems: "center",
                transform: "rotate(-1.2deg)",
              }}
            >
              SCROLL.
            </span>
          </div>
        </div>

        {/* sub */}
        <div style={{ fontSize: 24, color: "#666", marginBottom: 48, maxWidth: 600 }}>
          The scroll animation platform. ~9 KB gzipped.
          Works in React, Next.js, Vue 3, and vanilla JS.
        </div>

        {/* stats row */}
        <div style={{ display: "flex", gap: 24 }}>
          {["~9 KB gzipped", "Zero deps", "423 tests", "React · Vue · Solid · More"].map(
            (label) => (
              <div
                key={label}
                style={{
                  border: "1px solid #ccc",
                  borderRadius: 8,
                  padding: "8px 16px",
                  fontSize: 16,
                  color: "#444",
                  fontFamily: "monospace",
                }}
              >
                {label}
              </div>
            )
          )}
        </div>

        {/* domain */}
        <div
          style={{
            position: "absolute",
            bottom: 48,
            right: 80,
            fontSize: 18,
            color: "#888",
            fontFamily: "monospace",
          }}
        >
          svg-scroll-draw.vercel.app
        </div>
      </div>
    ),
    { ...size }
  );
}
