import type { UploadSignature } from "@repo/types";
import { IMAGE_CONTENT_TYPE, MAX_IMAGE_BYTES } from "@repo/types";
import axios from "axios";
import { adminRequest, adminRequestVoid } from "./client";

const MAX_EDGE_PX = 1600;
const QUALITY_STEPS = [0.85, 0.75, 0.6];

export const MAX_SOURCE_BYTES = 25 * 1024 * 1024;

export async function resizeToWebp(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });
  const scale = Math.min(
    1,
    MAX_EDGE_PX / Math.max(bitmap.width, bitmap.height),
  );
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not process this image");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  for (const quality of QUALITY_STEPS) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, IMAGE_CONTENT_TYPE, quality),
    );
    if (
      blob &&
      blob.type === IMAGE_CONTENT_TYPE &&
      blob.size <= MAX_IMAGE_BYTES
    ) {
      return blob;
    }
  }
  throw new Error("This photo is too large even after resizing");
}

export function signUpload(size: number): Promise<UploadSignature> {
  return adminRequest<UploadSignature>({
    method: "post",
    url: "/admin/uploads/sign",
    data: { contentType: IMAGE_CONTENT_TYPE, size },
  });
}

export async function putToStorage(
  signature: UploadSignature,
  blob: Blob,
  onProgress: (fraction: number) => void,
): Promise<void> {
  await axios.put(signature.uploadUrl, blob, {
    headers: { "Content-Type": IMAGE_CONTENT_TYPE },
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
