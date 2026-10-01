import { Container } from "@/components/store/section";
import { Skeleton } from "@/components/ui/skeleton";

export default function StoreLoading() {
  return (
    <Container className="py-8">
      <Skeleton className="mb-6 h-10 w-64" />
      <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="aspect-square rounded-md" />
        ))}
      </div>
    </Container>
  );
}
