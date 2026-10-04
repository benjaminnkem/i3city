import { ImageResponse } from "next/og";
import { markShapes } from "@/components/brand/logo-mark";
import { MARK_HEX } from "@/components/brand/mark-hex";
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
        alignItems: "center",
        gap: 64,
        padding: 80,
        background: "#F7E4FA",
        color: "#200F2B",
      }}
    >
      <svg width="300" height="300" viewBox="0 0 100 100">
        {markShapes({ ...MARK_HEX, plate: "#FFFFFF" })}
      </svg>
      <div style={{ display: "flex", flexDirection: "column", width: 680 }}>
        <div style={{ fontSize: 112, fontWeight: 800 }}>{SITE_NAME}</div>
        <div style={{ fontSize: 42, fontWeight: 700, marginTop: 16 }}>
          {SITE_TAGLINE}
        </div>
        <div style={{ fontSize: 28, marginTop: 20, color: "#6A5577" }}>
          Delivery to every state. Order on WhatsApp or pay by card.
        </div>
      </div>
    </div>,
    size,
  );
}
