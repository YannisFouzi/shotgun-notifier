import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ShotNotif — Real-time Telegram notifications for Shotgun.live";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#09090b",
          color: "#fafafa",
          fontFamily: "sans-serif",
          padding: "60px",
          gap: "24px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "72px",
            fontWeight: 700,
            letterSpacing: "-2px",
          }}
        >
          <span style={{ fontSize: "64px" }}>🔔</span>
          <span>ShotNotif</span>
        </div>
        <div
          style={{
            fontSize: "28px",
            color: "#a1a1aa",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.4,
          }}
        >
          Real-time Telegram notifications for every Shotgun.live ticket sale
        </div>
        <div
          style={{
            display: "flex",
            marginTop: "16px",
            gap: "32px",
            fontSize: "20px",
            color: "#71717a",
          }}
        >
          <span>Instant alerts</span>
          <span>·</span>
          <span>Custom messages</span>
          <span>·</span>
          <span>Set up in seconds</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
