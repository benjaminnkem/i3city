import { IMAGE_CONTENT_TYPE, MAX_IMAGE_BYTES } from "@repo/types";
import { IsIn, IsInt, Max, Min } from "class-validator";

export class SignUploadDto {
  @IsIn([IMAGE_CONTENT_TYPE])
  contentType!: string;

  @IsInt()
  @Min(1)
  @Max(MAX_IMAGE_BYTES)
  size!: number;
}
