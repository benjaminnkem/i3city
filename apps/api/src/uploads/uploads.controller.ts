import { randomUUID } from "node:crypto";
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import type { UploadSignature } from "@repo/types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { StorageService } from "../storage/storage.service.js";
import { DeleteUploadDto } from "./dto/delete-upload.dto.js";
import { SignUploadDto } from "./dto/sign-upload.dto.js";

@Controller("admin/uploads")
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly storage: StorageService) {}

  @Post("sign")
  @HttpCode(HttpStatus.OK)
  sign(@Body() dto: SignUploadDto): Promise<UploadSignature> {
    return this.storage.signUpload(
      `products/${randomUUID()}.webp`,
      dto.contentType,
      dto.size,
    );
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Body() dto: DeleteUploadDto): Promise<void> {
    return this.storage.deleteObjects([dto.key]);
  }
}
