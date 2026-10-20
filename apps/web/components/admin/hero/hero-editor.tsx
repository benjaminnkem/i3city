"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getHeroSlide, heroKeys } from "@/lib/admin/hero";
import { toApiError } from "@/lib/api";
import { HeroForm } from "./hero-form";

export function HeroEditor({ slideId }: Readonly<{ slideId?: string }>) {
  const slide = useQuery({
    queryKey: heroKeys.detail(slideId ?? ""),
    queryFn: () => getHeroSlide(slideId ?? ""),
    enabled: slideId !== undefined,
  });

  if (slideId === undefined) {
    return <HeroForm slide={null} />;
  }
  if (slide.isError) {
    const error = toApiError(slide.error);
    return (
      <Alert>
        <AlertTitle>
          {error.status === 404
            ? "Slide not found"
            : "Could not load the slide"}
        </AlertTitle>
        <AlertDescription className="flex flex-col items-start gap-3">
          {error.status === 404 ? "It may have been deleted." : error.message}
          <Button
            size="sm"
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/hero" />}
          >
            Back to slides
          </Button>
        </AlertDescription>
      </Alert>
    );
  }
  if (!slide.data) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-md" />
      </div>
    );
  }
  return <HeroForm key={slide.data.id} slide={slide.data} />;
}
