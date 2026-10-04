import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

export const alt = `${SITE_NAME}, ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 96,
        background: "#F7E4FA",
        color: "#200F2B",
      }}
    >
      <div style={{ display: "flex", fontSize: 120, fontWeight: 800 }}>
        i3<span style={{ color: "#A21CAF" }}>city</span>
      </div>
      <div style={{ fontSize: 56, fontWeight: 700, marginTop: 24 }}>
        {SITE_TAGLINE}
      </div>
      <div style={{ fontSize: 34, marginTop: 24, color: "#6A5577" }}>
        Delivery to every state. Order on WhatsApp or pay by card.
      </div>
    </div>,
    size,
  );
}
