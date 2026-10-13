import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module.js";
import { ImageProcessorService } from "./image-processor.service.js";
import { UploadsController } from "./uploads.controller.js";

@Module({
  imports: [AuthModule],
  controllers: [UploadsController],
  providers: [ImageProcessorService],
})
export class UploadsModule {}
