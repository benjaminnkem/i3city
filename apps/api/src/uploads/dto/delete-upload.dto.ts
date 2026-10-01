import { IMAGE_KEY_PATTERN } from "@repo/types";
import { Matches } from "class-validator";

export class DeleteUploadDto {
  @Matches(IMAGE_KEY_PATTERN)
  key!: string;
}
