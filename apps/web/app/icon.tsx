import { ImageResponse } from "next/og";
import { markShapes } from "@/components/brand/logo-mark";
import { MARK_HEX } from "@/components/brand/mark-hex";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <svg width="64" height="64" viewBox="0 0 100 100">
      {markShapes(MARK_HEX)}
    </svg>,
    size,
  );
}
