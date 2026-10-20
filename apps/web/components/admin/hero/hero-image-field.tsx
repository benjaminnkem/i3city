"use client";

import { MAX_SOURCE_IMAGE_BYTES } from "@repo/types";
import { ImagePlusIcon } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toApiError } from "@/lib/api";
import { deleteUploadedImage, uploadImage } from "@/lib/admin/uploads";
import { cn } from "@/lib/utils";

export interface HeroImage {
  key: string;
  url: string;
}

export function HeroImageField({
  image,
  invalid,
  onChange,
}: Readonly<{
  image: HeroImage | null;
  invalid?: boolean;
  onChange: (image: HeroImage | null) => void;
}>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const uploaded = useRef(new Set<string>());
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function discard(current: HeroImage | null) {
    if (current && uploaded.current.has(current.key)) {
      uploaded.current.delete(current.key);
      void deleteUploadedImage(current.key).catch(() => undefined);
    }
  }

  async function upload(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported");
      return;
    }
    if (file.size > MAX_SOURCE_IMAGE_BYTES) {
      setError("Choose an image under 25 MB");
      return;
    }
    setProgress(0);
    try {
      const result = await uploadImage(file, setProgress);
      uploaded.current.add(result.key);
      discard(image);
      onChange({ key: result.key, url: result.publicUrl });
    } catch (caught) {
      setError(toApiError(caught).message);
    } finally {
      setProgress(null);
    }
  }

  function remove() {
    discard(image);
    onChange(null);
  }

  return (
    <div className="flex flex-col gap-3">
      {image ? (
        <div className="bg-tone-1 relative aspect-[12/5] overflow-hidden rounded-md">
          <Image
            src={image.url}
            alt="Banner"
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : (
        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void upload(event.dataTransfer.files[0]);
          }}
          className={cn(
            "border-border flex aspect-[12/5] flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed px-4 text-center transition-colors",
            dragging && "border-primary bg-accent",
            invalid && "border-destructive",
          )}
        >
          <ImagePlusIcon className="text-muted-foreground size-8" />
          <p className="text-muted-foreground text-small max-w-prose">
            Use a wide image, at least 1600 pixels across. Keep the important
            part away from the bottom left, where the headline sits.
          </p>
        </div>
      )}
      {progress !== null ? (
        <div className="flex flex-col gap-1">
          <Progress value={progress * 100} />
          <p className="text-muted-foreground text-small">
            {progress === 0 ? "Preparing" : "Uploading"}
          </p>
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="text-destructive text-small">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={progress !== null}
          onClick={() => inputRef.current?.click()}
        >
          {image ? "Replace image" : "Upload image"}
        </Button>
        {image ? (
          <Button type="button" variant="ghost" onClick={remove}>
            Remove
          </Button>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        aria-label="Choose a banner image"
        onChange={(event) => void upload(event.target.files?.[0])}
      />
    </div>
  );
}
