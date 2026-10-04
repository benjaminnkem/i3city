import { ImageResponse } from "next/og";
import { markShapes } from "@/components/brand/logo-mark";
import { MARK_HEX } from "@/components/brand/mark-hex";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <svg width="180" height="180" viewBox="0 0 100 100">
      {markShapes({ ...MARK_HEX, plate: MARK_HEX.tint })}
    </svg>,
    size,
  );
}
