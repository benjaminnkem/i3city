import { Container } from "@/components/store/section";
import { Skeleton } from "@/components/ui/skeleton";

export function PageSkeleton() {
  return (
    <Container className="py-8">
      <Skeleton className="mb-3 h-10 w-64" />
      <Skeleton className="mb-8 h-5 w-80 max-w-full" />
      <Skeleton className="h-64 w-full rounded-lg md:h-96" />
    </Container>
  );
}

export function ShopSkeleton() {
  return (
    <Container className="py-8" aria-busy="true">
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-11 w-28 rounded-pill" />
        <Skeleton className="h-11 w-40 rounded-pill" />
        <Skeleton className="h-11 w-36 rounded-pill" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <Skeleton className="aspect-square rounded-md" />
            <Skeleton className="h-4 w-20" />
            <div className="flex items-baseline justify-between gap-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-11 w-full rounded-pill" />
          </div>
        ))}
      </div>
    </Container>
  );
}

export function ProductSkeleton() {
  return (
    <Container className="pt-6 pb-24 md:pb-8" aria-busy="true">
      <Skeleton className="mb-4 h-5 w-48" />
      <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-3">
          <Skeleton className="aspect-square rounded-md" />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="aspect-square rounded-sm" />
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-10 w-4/5" />
          </div>
          <div className="flex items-baseline gap-3">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-6 w-24" />
          </div>
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-12 w-full max-w-md rounded-pill" />
          <div className="flex gap-3">
            <Skeleton className="h-11 w-44 rounded-pill" />
            <Skeleton className="h-11 w-28 rounded-pill" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <div className="border-border flex flex-col gap-2 border-t pt-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full max-w-prose" />
            <Skeleton className="h-4 w-full max-w-prose" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </Container>
  );
}
