import { BadRequestException } from "@nestjs/common";
import { MAX_IMAGE_BYTES, MAX_IMAGE_EDGE_PX } from "@repo/types";
import sharp from "sharp";
import { ImageProcessorService } from "./image-processor.service.js";

const service = new ImageProcessorService();

function solid(width: number, height: number) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 200, g: 60, b: 150 },
    },
  });
}

describe("ImageProcessorService", () => {
  it("downsizes large photos to a webp within the edge limit", async () => {
    const source = await solid(4000, 3000).jpeg().toBuffer();
    const output = await service.toWebp(source);
    const meta = await sharp(output).metadata();
    expect(meta.format).toBe("webp");
    expect(Math.max(meta.width ?? 0, meta.height ?? 0)).toBe(MAX_IMAGE_EDGE_PX);
    expect(output.length).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
  });

  it("does not enlarge small images", async () => {
    const source = await solid(300, 200).png().toBuffer();
    const meta = await sharp(await service.toWebp(source)).metadata();
    expect(meta.width).toBe(300);
    expect(meta.height).toBe(200);
  });

  it("applies exif orientation", async () => {
    const source = await solid(400, 200)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const meta = await sharp(await service.toWebp(source)).metadata();
    expect(meta.width).toBe(200);
    expect(meta.height).toBe(400);
  });

  it("strips metadata", async () => {
    const source = await solid(400, 200)
      .jpeg()
      .withMetadata({ orientation: 6 })
      .toBuffer();
    const meta = await sharp(await service.toWebp(source)).metadata();
    expect(meta.exif).toBeUndefined();
  });

  it("rejects files that are not images", async () => {
    await expect(service.toWebp(Buffer.from("hello"))).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("rejects unsupported image formats", async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>',
    );
    await expect(service.toWebp(svg)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
