import { randomUUID } from "node:crypto";
import {
  BadRequestException,
  Controller,
  Delete,
  Body,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IMAGE_CONTENT_TYPE, MAX_SOURCE_IMAGE_BYTES } from "@repo/types";
import type { UploadedImage } from "@repo/types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { StorageService } from "../storage/storage.service.js";
import { DeleteUploadDto } from "./dto/delete-upload.dto.js";
import { ImageProcessorService } from "./image-processor.service.js";

interface UploadedFileBuffer {
  buffer: Buffer;
}

@Controller("admin/uploads")
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(
    private readonly storage: StorageService,
    private readonly processor: ImageProcessorService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: MAX_SOURCE_IMAGE_BYTES } }),
  )
  async upload(
    @UploadedFile() file: UploadedFileBuffer | undefined,
  ): Promise<UploadedImage> {
    if (!file) {
      throw new BadRequestException("Attach a photo in the file field");
    }
    const body = await this.processor.toWebp(file.buffer);
    const key = `products/${randomUUID()}.webp`;
    await this.storage.putObject(key, body, IMAGE_CONTENT_TYPE);
    return { key, publicUrl: this.storage.publicUrl(key) };
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Body() dto: DeleteUploadDto): Promise<void> {
    return this.storage.deleteObjects([dto.key]);
  }
}
