import {
  BadRequestException,
  Injectable,
  UnprocessableEntityException,
} from "@nestjs/common";
import { MAX_IMAGE_BYTES, MAX_IMAGE_EDGE_PX } from "@repo/types";
import sharp from "sharp";

const QUALITY_STEPS = [82, 72, 60, 48];
const MAX_INPUT_PIXELS = 100_000_000;
const SOURCE_FORMATS = new Set(["jpeg", "png", "webp", "avif", "gif", "tiff"]);

sharp.cache(false);
sharp.concurrency(1);

@Injectable()
export class ImageProcessorService {
  async toWebp(source: Buffer): Promise<Buffer> {
    await this.assertSupported(source);
    for (const quality of QUALITY_STEPS) {
      const output = await this.encode(source, quality);
      if (output.length <= MAX_IMAGE_BYTES) {
        return output;
      }
    }
    throw new UnprocessableEntityException(
      "This photo is too large even after optimising",
    );
  }

  private async assertSupported(source: Buffer): Promise<void> {
    try {
      const { format } = await sharp(source, {
        limitInputPixels: MAX_INPUT_PIXELS,
      }).metadata();
      if (!format || !SOURCE_FORMATS.has(format)) {
        throw new BadRequestException("Unsupported image format");
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException("The file is not a readable image");
    }
  }

  private async encode(source: Buffer, quality: number): Promise<Buffer> {
    try {
      return await sharp(source, { limitInputPixels: MAX_INPUT_PIXELS })
        .rotate()
        .resize({
          width: MAX_IMAGE_EDGE_PX,
          height: MAX_IMAGE_EDGE_PX,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality })
        .toBuffer();
    } catch {
      throw new UnprocessableEntityException(
        "This photo could not be processed",
      );
    }
  }
}
