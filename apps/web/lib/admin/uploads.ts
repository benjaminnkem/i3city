import type { UploadedImage } from "@repo/types";
import { adminRequest, adminRequestVoid } from "./client";

const UPLOAD_TIMEOUT_MS = 120_000;

export function uploadImage(
  file: File,
  onProgress: (fraction: number) => void,
): Promise<UploadedImage> {
  const data = new FormData();
  data.append("file", file);
  return adminRequest<UploadedImage>({
    method: "post",
    url: "/admin/uploads",
    data,
    timeout: UPLOAD_TIMEOUT_MS,
    headers: { "Content-Type": undefined },
    onUploadProgress: (event) => {
      if (event.total) {
        onProgress(event.loaded / event.total);
      }
    },
  });
}

export function deleteUploadedImage(key: string): Promise<void> {
  return adminRequestVoid({
    method: "delete",
    url: "/admin/uploads",
    data: { key },
  });
}
