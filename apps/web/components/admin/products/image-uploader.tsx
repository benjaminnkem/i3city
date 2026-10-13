"use client";

import { MAX_PRODUCT_IMAGES, MAX_SOURCE_IMAGE_BYTES } from "@repo/types";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ImagePlusIcon,
  StarIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toApiError } from "@/lib/api";
import { deleteUploadedImage, uploadImage } from "@/lib/admin/uploads";
import { cn } from "@/lib/utils";

export interface ImageEntry {
  key: string;
  url: string;
}

interface PendingUpload {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

export function ImageUploader({
  images,
  onChange,
}: Readonly<{
  images: ImageEntry[];
  onChange: (update: (current: ImageEntry[]) => ImageEntry[]) => void;
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadedKeys = useRef(new Set<string>());
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [dragging, setDragging] = useState(false);

  const used = images.length + pending.filter((item) => !item.error).length;
  const remaining = MAX_PRODUCT_IMAGES - used;

  function patchPending(id: string, patch: Partial<PendingUpload>) {
    setPending((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  async function uploadFile(file: File, id: string) {
    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Only image files are supported");
      }
      if (file.size > MAX_SOURCE_IMAGE_BYTES) {
        throw new Error("Choose a photo under 25 MB");
      }
      const uploaded = await uploadImage(file, (fraction) =>
        patchPending(id, { progress: fraction }),
      );
      uploadedKeys.current.add(uploaded.key);
      onChange((current) => [
        ...current,
        { key: uploaded.key, url: uploaded.publicUrl },
      ]);
      setPending((current) => current.filter((item) => item.id !== id));
    } catch (error) {
      patchPending(id, {
        error:
          error instanceof Error ? error.message : toApiError(error).message,
        progress: 0,
      });
    }
  }

  function addFiles(list: FileList | null) {
    const files = Array.from(list ?? []);
    if (files.length === 0) return;
    if (files.length > remaining) {
      toast.error(
        `You can add ${Math.max(remaining, 0)} more ${remaining === 1 ? "photo" : "photos"}`,
      );
    }
    for (const file of files.slice(0, Math.max(remaining, 0))) {
      const id = crypto.randomUUID();
      setPending((current) => [
        ...current,
        { id, name: file.name, progress: 0 },
      ]);
      void uploadFile(file, id);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  function move(index: number, direction: -1 | 1) {
    onChange((current) => {
      const next = [...current];
      const target = index + direction;
      const item = next[index];
      const other = next[target];
      if (!item || !other) return current;
      next[index] = other;
      next[target] = item;
      return next;
    });
  }

  function makePrimary(index: number) {
    onChange((current) => {
      const item = current[index];
      if (!item) return current;
      return [item, ...current.filter((_, position) => position !== index)];
    });
  }

  function remove(entry: ImageEntry) {
    onChange((current) => current.filter((item) => item.key !== entry.key));
    if (uploadedKeys.current.has(entry.key)) {
      uploadedKeys.current.delete(entry.key);
      void deleteUploadedImage(entry.key).catch(() => undefined);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          addFiles(event.dataTransfer.files);
        }}
        className={cn(
          "border-border flex flex-col items-center gap-3 rounded-md border-2 border-dashed px-4 py-8 text-center transition-colors",
          dragging && "border-primary bg-accent",
        )}
      >
        <ImagePlusIcon className="text-muted-foreground size-8" />
        <p className="text-muted-foreground max-w-prose text-sm">
          Add up to {MAX_PRODUCT_IMAGES} photos. They are resized and optimised
          for you. The first photo is the main one.
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={remaining <= 0}
          onClick={() => inputRef.current?.click()}
        >
          Add photos
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          aria-label="Choose product photos"
          onChange={(event) => addFiles(event.target.files)}
        />
      </div>

      {images.length > 0 || pending.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((image, index) => (
            <li
              key={image.key}
              className="bg-tone-1 group relative aspect-square overflow-hidden rounded-md"
            >
              <Image
                src={image.url}
                alt={`Product photo ${index + 1}`}
                width={240}
                height={240}
                unoptimized
                className="size-full object-cover"
              />
              {index === 0 ? (
                <Badge className="absolute top-2 left-2">Main photo</Badge>
              ) : null}
              <div className="bg-background/90 absolute inset-x-2 bottom-2 flex items-center justify-between rounded-pill px-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move photo ${index + 1} earlier`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ChevronLeftIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Make photo ${index + 1} the main photo`}
                  disabled={index === 0}
                  onClick={() => makePrimary(index)}
                >
                  <StarIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Move photo ${index + 1} later`}
                  disabled={index === images.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ChevronRightIcon />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => remove(image)}
                >
                  <XIcon />
                </Button>
              </div>
            </li>
          ))}
          {pending.map((item) => (
            <li
              key={item.id}
              className="border-border flex aspect-square flex-col justify-between gap-2 rounded-md border p-3"
            >
              <p className="truncate text-sm font-bold">{item.name}</p>
              {item.error ? (
                <div className="flex flex-col gap-2">
                  <p role="alert" className="text-destructive text-sm">
                    {item.error}
                  </p>
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() =>
                      setPending((current) =>
                        current.filter((entry) => entry.id !== item.id),
                      )
                    }
                  >
                    Dismiss
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Progress value={item.progress * 100} />
                  <p className="text-muted-foreground text-sm">
                    {item.progress === 0 ? "Preparing" : "Uploading"}
                  </p>
                </div>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
