"use client";

import {
  HERO_LIMITS,
  type AdminHeroSlide,
  type HeroSlideStatus,
} from "@repo/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  GalleryHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { PageHeader } from "@/components/admin/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { notifyError } from "@/lib/admin/errors";
import {
  HERO_STATUS_LABEL,
  heroKeys,
  listHeroSlides,
  reorderHeroSlides,
} from "@/lib/admin/hero";
import { toApiError } from "@/lib/api";
import { DeleteHeroDialog, type HeroDeleteTarget } from "./delete-hero-dialog";

const STATUS_VARIANT: Record<
  HeroSlideStatus,
  "default" | "secondary" | "outline"
> = {
  LIVE: "default",
  SCHEDULED: "secondary",
  ENDED: "outline",
  OFF: "outline",
};

function dateLabel(key: string): string {
  return format(parseISO(key), "d MMM yyyy");
}

function scheduleLabel(slide: AdminHeroSlide): string {
  if (slide.startDate && slide.endDate) {
    return `${dateLabel(slide.startDate)} to ${dateLabel(slide.endDate)}`;
  }
  if (slide.startDate) return `From ${dateLabel(slide.startDate)}`;
  if (slide.endDate) return `Until ${dateLabel(slide.endDate)}`;
  return "No end date";
}

function SlideThumb({ slide }: Readonly<{ slide: AdminHeroSlide }>) {
  const url = slide.imageUrl ?? slide.products[0]?.imageUrl ?? null;
  return (
    <div className="bg-tone-1 relative aspect-video w-28 shrink-0 overflow-hidden rounded-sm">
      {url ? (
        <Image src={url} alt="" fill unoptimized className="object-cover" />
      ) : (
        <GalleryHorizontalIcon className="text-muted-foreground absolute inset-0 m-auto size-6" />
      )}
    </div>
  );
}

function SlideList({ slides }: Readonly<{ slides: AdminHeroSlide[] }>) {
  const queryClient = useQueryClient();
  const [deleting, setDeleting] = useState<HeroDeleteTarget | null>(null);
  const reorder = useMutation({
    mutationFn: reorderHeroSlides,
    onSuccess: (saved) => queryClient.setQueryData(heroKeys.all, saved),
    onError: notifyError,
  });

  function move(index: number, offset: number) {
    const ids = slides.map((slide) => slide.id);
    const [id] = ids.splice(index, 1);
    if (!id) return;
    ids.splice(index + offset, 0, id);
    reorder.mutate(ids);
  }

  return (
    <>
      <Card>
        <CardContent>
          <ol className="divide-border divide-y">
            {slides.map((slide, index) => (
              <li
                key={slide.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <SlideThumb slide={slide} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <Link
                      href={`/admin/hero/${slide.id}`}
                      className="truncate font-bold hover:underline"
                    >
                      {slide.headline}
                    </Link>
                    <div className="text-muted-foreground text-small flex flex-wrap items-center gap-2">
                      <Badge variant={STATUS_VARIANT[slide.status]}>
                        {HERO_STATUS_LABEL[slide.status]}
                      </Badge>
                      <span>
                        {slide.kind === "IMAGE" ? "Banner image" : "Products"}
                      </span>
                      <span aria-hidden>·</span>
                      <span>{scheduleLabel(slide)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 self-end sm:self-auto">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${slide.headline} up`}
                    disabled={index === 0 || reorder.isPending}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUpIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Move ${slide.headline} down`}
                    disabled={index === slides.length - 1 || reorder.isPending}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDownIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${slide.headline}`}
                    nativeButton={false}
                    render={<Link href={`/admin/hero/${slide.id}`} />}
                  >
                    <PencilIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${slide.headline}`}
                    onClick={() =>
                      setDeleting({ id: slide.id, headline: slide.headline })
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
      <DeleteHeroDialog
        target={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
      />
    </>
  );
}

export function HeroListView() {
  const slides = useQuery({
    queryKey: heroKeys.all,
    queryFn: listHeroSlides,
  });
  const count = slides.data?.length ?? 0;
  const live = slides.data?.filter((slide) => slide.status === "LIVE") ?? [];
  const full = count >= HERO_LIMITS.slides;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <PageHeader
        title="Hero"
        description="The slides at the top of your home page. Live slides take turns every few seconds, in this order."
        actions={
          <Button
            nativeButton={false}
            disabled={full}
            render={<Link href="/admin/hero/new" />}
          >
            <PlusIcon data-icon="inline-start" />
            New slide
          </Button>
        }
      />
      {slides.isError ? (
        <Alert>
          <AlertTitle>Could not load slides</AlertTitle>
          <AlertDescription className="flex flex-col items-start gap-3">
            {toApiError(slides.error).message}
            <Button
              size="sm"
              variant="outline"
              onClick={() => slides.refetch()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : !slides.data ? (
        <Skeleton className="h-64 rounded-md" />
      ) : slides.data.length === 0 ? (
        <Empty className="border-border border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <GalleryHorizontalIcon />
            </EmptyMedia>
            <EmptyTitle>No slides yet</EmptyTitle>
            <EmptyDescription>
              The home page shows the standard hero with your featured products
              until you add one.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button
              nativeButton={false}
              render={<Link href="/admin/hero/new" />}
            >
              <PlusIcon data-icon="inline-start" />
              Add the first slide
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <>
          {live.length === 0 ? (
            <Alert>
              <AlertTitle>No slide is live right now</AlertTitle>
              <AlertDescription>
                The home page shows the standard hero until a slide is on and
                inside its dates.
              </AlertDescription>
            </Alert>
          ) : null}
          <SlideList slides={slides.data} />
          {full ? (
            <p className="text-muted-foreground text-small">
              You have {HERO_LIMITS.slides} slides, the most allowed. Delete one
              to add another.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
